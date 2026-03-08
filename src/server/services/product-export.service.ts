import { eq } from 'drizzle-orm';

import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import {
  categories,
  categoryTranslations,
  productTranslations,
  products,
  tags,
  tagTranslations,
  productTags,
  productCategories,
} from '@/server/db/schema';

interface ExportRow {
  sku: string;
  slug: string;
  status: string;
  primaryCategory: string;
  additionalCategories: string;
  tags: string;
  moq: string;
  leadTimeDays: string;
  tradeTerms: string;
  paymentTerms: string;
  packagingDetails: string;
  customizationSupport: string;
  [key: string]: string;
}

/**
 * 导出所有产品为 CSV 格式。
 * 多语言字段按 "name_{locale}" 格式展开为列。
 */
export async function exportProductsCsv(defaultLocale: string): Promise<string> {
  const allProducts = await db.query.products.findMany({
    with: {
      translations: true,
      primaryCategory: { with: { translations: true } },
      additionalCategories: true,
      productTags: true,
    },
    orderBy: (p, { asc }) => [asc(p.sku)],
  });

  const allCategories = await db.query.categories.findMany({
    with: { translations: true },
  });
  const categoryMap = new Map(allCategories.map((c) => [c.id, c]));

  const allTags = await db.query.tags.findMany({
    with: { translations: true },
  });
  const tagMap = new Map(allTags.map((t) => [t.id, t]));

  const locales = new Set<string>();
  for (const p of allProducts) {
    for (const t of p.translations) {
      locales.add(t.locale);
    }
  }
  const sortedLocales = [...locales].sort();

  const translationFields = ['name', 'shortDescription', 'seoTitle', 'seoDescription'] as const;

  const headers = [
    'sku',
    'slug',
    'status',
    'primary_category',
    'additional_categories',
    'tags',
    'moq',
    'lead_time_days',
    'trade_terms',
    'payment_terms',
    'packaging_details',
    'customization_support',
    ...sortedLocales.flatMap((loc) =>
      translationFields.map((f) => `${f}_${loc}`),
    ),
  ];

  const rows: string[][] = [headers];

  for (const product of allProducts) {
    const primaryCat = product.primaryCategory;
    const primaryCatName = primaryCat
      ? getTranslation(primaryCat.translations, defaultLocale, defaultLocale)?.name ?? primaryCat.slug
      : '';

    const additionalCatSlugs = product.additionalCategories
      .map((ac) => {
        const cat = categoryMap.get(ac.categoryId);
        return cat?.slug ?? '';
      })
      .filter(Boolean)
      .join('; ');

    const tagSlugs = product.productTags
      .map((pt) => {
        const tag = tagMap.get(pt.tagId);
        return tag?.slug ?? '';
      })
      .filter(Boolean)
      .join('; ');

    const row: string[] = [
      product.sku,
      product.slug,
      product.status,
      primaryCatName,
      additionalCatSlugs,
      tagSlugs,
      product.moq?.toString() ?? '',
      product.leadTimeDays?.toString() ?? '',
      product.tradeTerms ?? '',
      product.paymentTerms ?? '',
      product.packagingDetails ?? '',
      product.customizationSupport ? 'yes' : 'no',
    ];

    for (const loc of sortedLocales) {
      const t = product.translations.find((tr) => tr.locale === loc);
      row.push(
        t?.name ?? '',
        t?.shortDescription ?? '',
        t?.seoTitle ?? '',
        t?.seoDescription ?? '',
      );
    }

    rows.push(row);
  }

  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 生成产品 CSV 导入模板（含表头和示例行）。
 */
export async function generateProductCsvTemplate(defaultLocale: string): Promise<string> {
  const activeLanguages = await db.query.languages.findMany({
    where: eq(
      (await import('@/server/db/schema')).languages.isActive,
      true,
    ),
    orderBy: (l, { asc }) => [asc(l.code)],
  });

  const locales = activeLanguages.map((l) => l.code);
  const translationFields = ['name', 'shortDescription', 'seoTitle', 'seoDescription'] as const;

  const headers = [
    'sku',
    'slug',
    'status',
    'primary_category_slug',
    'additional_category_slugs',
    'tag_slugs',
    'moq',
    'lead_time_days',
    'trade_terms',
    'payment_terms',
    'packaging_details',
    'customization_support',
    ...locales.flatMap((loc) => translationFields.map((f) => `${f}_${loc}`)),
  ];

  const exampleRow = [
    'PROD-001',
    'example-product',
    'draft',
    'electronics',
    'accessories; gadgets',
    'new; hot',
    '100',
    '15',
    'FOB',
    'T/T 30%',
    'Standard carton',
    'yes',
    ...locales.flatMap(() => [
      'Example Product Name',
      'Short description here',
      'SEO Title',
      'SEO Description',
    ]),
  ];

  return [
    headers.map(escapeCsvField).join(','),
    exampleRow.map(escapeCsvField).join(','),
  ].join('\n');
}
