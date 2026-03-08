import { eq } from 'drizzle-orm';

import { ValidationError } from '@/lib/errors';
import { db } from '@/server/db';
import {
  categories,
  products,
  productTranslations,
  productCategories,
  productTags,
  tags,
} from '@/server/db/schema';

export interface ImportRow {
  sku: string;
  slug: string;
  status: string;
  primaryCategorySlug: string;
  additionalCategorySlugs: string[];
  tagSlugs: string[];
  moq: number | null;
  leadTimeDays: number | null;
  tradeTerms: string | null;
  paymentTerms: string | null;
  packagingDetails: string | null;
  customizationSupport: boolean;
  translations: Array<{
    locale: string;
    name: string;
    shortDescription: string;
    seoTitle: string;
    seoDescription: string;
  }>;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  errors: Array<{ row: number; field: string; message: string }>;
  rows: ImportRow[];
}

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * 解析 CSV 文本为 ImportRow 数组（预览阶段，不写库）。
 */
export function parseProductCsv(csvText: string): ImportPreviewResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { totalRows: 0, validRows: 0, errors: [{ row: 0, field: '', message: 'CSV is empty or has no data rows' }], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const errors: ImportPreviewResult['errors'] = [];
  const rows: ImportRow[] = [];

  const requiredHeaders = ['sku', 'slug', 'primary_category_slug'];
  for (const h of requiredHeaders) {
    if (!headers.includes(h)) {
      errors.push({ row: 0, field: h, message: `Missing required header: ${h}` });
    }
  }
  if (errors.length > 0) {
    return { totalRows: lines.length - 1, validRows: 0, errors, rows: [] };
  }

  const localeFieldRegex = /^(name|shortDescription|seoTitle|seoDescription)_(.+)$/;
  const localeMap = new Map<string, Set<string>>();
  for (const h of headers) {
    const match = h.match(localeFieldRegex);
    if (match) {
      const field = match[1];
      const locale = match[2];
      if (!localeMap.has(locale)) localeMap.set(locale, new Set());
      localeMap.get(locale)!.add(field);
    }
  }
  const locales = [...localeMap.keys()].sort();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const get = (header: string) => values[headers.indexOf(header)]?.trim() ?? '';

    const sku = get('sku');
    const slug = get('slug');
    const primaryCategorySlug = get('primary_category_slug');

    if (!sku) { errors.push({ row: i + 1, field: 'sku', message: 'SKU is required' }); continue; }
    if (!slug) { errors.push({ row: i + 1, field: 'slug', message: 'Slug is required' }); continue; }
    if (!primaryCategorySlug) { errors.push({ row: i + 1, field: 'primary_category_slug', message: 'Primary category is required' }); continue; }

    const status = get('status') || 'draft';
    if (!['draft', 'published', 'archived'].includes(status)) {
      errors.push({ row: i + 1, field: 'status', message: `Invalid status: ${status}` });
      continue;
    }

    const additionalCategorySlugs = get('additional_category_slugs')
      .split(';').map((s) => s.trim()).filter(Boolean);
    const tagSlugs = get('tag_slugs')
      .split(';').map((s) => s.trim()).filter(Boolean);

    const moqStr = get('moq');
    const moq = moqStr ? parseInt(moqStr, 10) : null;
    if (moqStr && (isNaN(moq!) || moq! < 0)) {
      errors.push({ row: i + 1, field: 'moq', message: 'MOQ must be a positive number' });
      continue;
    }

    const leadStr = get('lead_time_days');
    const leadTimeDays = leadStr ? parseInt(leadStr, 10) : null;

    const translations = locales.map((locale) => ({
      locale,
      name: get(`name_${locale}`),
      shortDescription: get(`shortDescription_${locale}`),
      seoTitle: get(`seoTitle_${locale}`),
      seoDescription: get(`seoDescription_${locale}`),
    }));

    const hasName = translations.some((t) => t.name);
    if (!hasName) {
      errors.push({ row: i + 1, field: 'name', message: 'At least one translation name is required' });
      continue;
    }

    rows.push({
      sku: sku.toUpperCase(),
      slug: slug.toLowerCase(),
      status,
      primaryCategorySlug,
      additionalCategorySlugs,
      tagSlugs,
      moq,
      leadTimeDays,
      tradeTerms: get('trade_terms') || null,
      paymentTerms: get('payment_terms') || null,
      packagingDetails: get('packaging_details') || null,
      customizationSupport: get('customization_support').toLowerCase() === 'yes',
      translations,
    });
  }

  return { totalRows: lines.length - 1, validRows: rows.length, errors, rows };
}

/**
 * 执行导入（创建或更新产品）。
 * mode: 'skip' = 已存在的跳过, 'update' = 已存在的覆盖。
 */
export async function importProducts(
  rows: ImportRow[],
  mode: 'skip' | 'update' = 'skip',
): Promise<ImportResult> {
  const allCategories = await db.query.categories.findMany();
  const categorySlugMap = new Map(allCategories.map((c) => [c.slug, c.id]));

  const allTags = await db.query.tags.findMany();
  const tagSlugMap = new Map(allTags.map((t) => [t.slug, t.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: ImportResult['errors'] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      const primaryCategoryId = categorySlugMap.get(row.primaryCategorySlug);
      if (!primaryCategoryId) {
        errors.push({ row: rowNum, message: `Category not found: ${row.primaryCategorySlug}` });
        continue;
      }

      const [existingBySku] = await db.select().from(products).where(eq(products.sku, row.sku));
      const [existingBySlug] = await db.select().from(products).where(eq(products.slug, row.slug));

      if (existingBySku || existingBySlug) {
        if (mode === 'skip') {
          skipped++;
          continue;
        }

        const existing = existingBySku ?? existingBySlug;
        await db.update(products).set({
          sku: row.sku,
          slug: row.slug,
          status: row.status,
          primaryCategoryId,
          moq: row.moq,
          leadTimeDays: row.leadTimeDays,
          tradeTerms: row.tradeTerms,
          paymentTerms: row.paymentTerms,
          packagingDetails: row.packagingDetails,
          customizationSupport: row.customizationSupport,
          updatedAt: new Date(),
        }).where(eq(products.id, existing.id));

        await upsertTranslations(existing.id, row.translations);
        await syncCategories(existing.id, primaryCategoryId, row.additionalCategorySlugs, categorySlugMap);
        await syncTags(existing.id, row.tagSlugs, tagSlugMap);

        updated++;
      } else {
        const [newProduct] = await db.insert(products).values({
          sku: row.sku,
          slug: row.slug,
          status: row.status,
          primaryCategoryId,
          moq: row.moq,
          leadTimeDays: row.leadTimeDays,
          tradeTerms: row.tradeTerms,
          paymentTerms: row.paymentTerms,
          packagingDetails: row.packagingDetails,
          customizationSupport: row.customizationSupport,
        }).returning();

        await upsertTranslations(newProduct.id, row.translations);
        await syncCategories(newProduct.id, primaryCategoryId, row.additionalCategorySlugs, categorySlugMap);
        await syncTags(newProduct.id, row.tagSlugs, tagSlugMap);

        created++;
      }
    } catch (error) {
      errors.push({ row: rowNum, message: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { created, updated, skipped, errors };
}

async function upsertTranslations(
  productId: string,
  translations: ImportRow['translations'],
): Promise<void> {
  for (const t of translations) {
    if (!t.name && !t.shortDescription && !t.seoTitle && !t.seoDescription) continue;

    const existing = await db.query.productTranslations.findFirst({
      where: (pt, { and, eq }) => and(eq(pt.productId, productId), eq(pt.locale, t.locale)),
    });

    const values = {
      name: t.name || null,
      shortDescription: t.shortDescription || null,
      seoTitle: t.seoTitle || null,
      seoDescription: t.seoDescription || null,
    };

    if (existing) {
      await db.update(productTranslations).set(values).where(eq(productTranslations.id, existing.id));
    } else {
      await db.insert(productTranslations).values({ productId, locale: t.locale, ...values });
    }
  }
}

async function syncCategories(
  productId: string,
  primaryCategoryId: string,
  additionalSlugs: string[],
  slugMap: Map<string, string>,
): Promise<void> {
  await db.delete(productCategories).where(eq(productCategories.productId, productId));
  const categoryIds = additionalSlugs
    .map((s) => slugMap.get(s))
    .filter((id): id is string => !!id && id !== primaryCategoryId);

  if (categoryIds.length > 0) {
    await db.insert(productCategories).values(
      categoryIds.map((categoryId) => ({ productId, categoryId })),
    );
  }
}

async function syncTags(
  productId: string,
  tagSlugs: string[],
  slugMap: Map<string, string>,
): Promise<void> {
  await db.delete(productTags).where(eq(productTags.productId, productId));
  const tagIds = tagSlugs.map((s) => slugMap.get(s)).filter((id): id is string => !!id);

  if (tagIds.length > 0) {
    await db.insert(productTags).values(
      tagIds.map((tagId) => ({ productId, tagId })),
    );
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}
