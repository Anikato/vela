import { and, asc, desc, eq, inArray, max } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import {
  normalizeNullableText,
  normalizeSku,
  normalizeSlug,
  normalizeIds,
  ensureValidStatus,
  ensureTranslationHasField,
} from '@/lib/validators';
import { db } from '@/server/db';
import {
  categories,
  media,
  productAttachments,
  productAttributeGroupTranslations,
  productAttributeGroups,
  productAttributeTranslations,
  productAttributes,
  productCategories,
  productImages,
  productTags,
  productTranslations,
  products,
  tags,
} from '@/server/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = typeof db | PgTransaction<any, any, any>;

export const PRODUCT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export type Product = typeof products.$inferSelect;
export type ProductTranslation = typeof productTranslations.$inferSelect;

export interface ProductWithRelations extends Product {
  translations: ProductTranslation[];
  additionalCategoryIds: string[];
  tagIds: string[];
  galleryImageIds: string[];
  attachmentIds: string[];
}

export interface ProductListItem extends ProductWithRelations {
  displayName: string;
  primaryCategoryName: string;
}

export interface ProductTranslationInput {
  locale: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreateProductInput {
  sku: string;
  slug: string;
  primaryCategoryId: string;
  status?: ProductStatus;
  sortOrder?: number;
  featuredImageId?: string | null;
  videoLinks?: string[];
  moq?: number | null;
  leadTimeDays?: number | null;
  tradeTerms?: string | null;
  paymentTerms?: string | null;
  packagingDetails?: string | null;
  customizationSupport?: boolean;
  attributeDisplayPosition?: string;
  showAttachmentSection?: boolean;
  translations: ProductTranslationInput[];
  additionalCategoryIds?: string[];
  tagIds?: string[];
  galleryImageIds?: string[];
  attachmentIds?: string[];
}

export type UpdateProductInput = Partial<
  Omit<CreateProductInput, 'translations'>
> & {
  translations?: ProductTranslationInput[];
};

function ensureProductStatus(status?: string): void {
  ensureValidStatus(status, PRODUCT_STATUSES, 'product');
}

function ensureTranslationHasName(translations: ProductTranslationInput[]): void {
  ensureTranslationHasField(
    translations as unknown as Array<Record<string, unknown>>,
    'name',
    'At least one translation name is required',
  );
}

async function ensureCategoryExists(categoryId: string): Promise<void> {
  const [existing] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, categoryId));
  if (!existing) {
    throw new ValidationError(`Category not found: ${categoryId}`);
  }
}

async function ensureTagsExist(tagIds: string[]): Promise<void> {
  if (tagIds.length === 0) return;
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.id, tagIds));
  const found = new Set(rows.map((item) => item.id));
  const missing = tagIds.find((id) => !found.has(id));
  if (missing) {
    throw new ValidationError(`Tag not found: ${missing}`);
  }
}

async function ensureMediaExist(mediaIds: string[]): Promise<void> {
  if (mediaIds.length === 0) return;
  const rows = await db
    .select({ id: media.id })
    .from(media)
    .where(inArray(media.id, mediaIds));
  const found = new Set(rows.map((item) => item.id));
  const missing = mediaIds.find((id) => !found.has(id));
  if (missing) {
    throw new ValidationError(`Media not found: ${missing}`);
  }
}

async function upsertProductTranslations(
  productId: string,
  translationsInput: ProductTranslationInput[],
  client: DbClient = db,
): Promise<void> {
  for (const translation of translationsInput) {
    const locale = translation.locale.trim();
    if (!locale) continue;

    const values = {
      name: translation.name?.trim() || null,
      shortDescription: translation.shortDescription?.trim() || null,
      description: translation.description?.trim() || null,
      seoTitle: translation.seoTitle?.trim() || null,
      seoDescription: translation.seoDescription?.trim() || null,
    };

    const [existing] = await client
      .select()
      .from(productTranslations)
      .where(
        and(
          eq(productTranslations.productId, productId),
          eq(productTranslations.locale, locale),
        ),
      );

    if (existing) {
      await client
        .update(productTranslations)
        .set(values)
        .where(eq(productTranslations.id, existing.id));
      continue;
    }

    await client.insert(productTranslations).values({
      productId,
      locale,
      ...values,
    });
  }
}

async function replaceAdditionalCategories(
  productId: string,
  primaryCategoryId: string,
  additionalCategoryIds: string[],
  client: DbClient = db,
): Promise<void> {
  const cleanIds = normalizeIds(additionalCategoryIds).filter((id) => id !== primaryCategoryId);
  for (const categoryId of cleanIds) {
    await ensureCategoryExists(categoryId);
  }

  await client.delete(productCategories).where(eq(productCategories.productId, productId));
  if (cleanIds.length === 0) return;

  await client.insert(productCategories).values(
    cleanIds.map((categoryId) => ({
      productId,
      categoryId,
    })),
  );
}

async function replaceProductTags(productId: string, tagIds: string[], client: DbClient = db): Promise<void> {
  const cleanIds = normalizeIds(tagIds);
  await ensureTagsExist(cleanIds);

  await client.delete(productTags).where(eq(productTags.productId, productId));
  if (cleanIds.length === 0) return;

  await client.insert(productTags).values(
    cleanIds.map((tagId) => ({
      productId,
      tagId,
    })),
  );
}

async function replaceProductImages(productId: string, mediaIds: string[], client: DbClient = db): Promise<void> {
  const cleanIds = normalizeIds(mediaIds);
  await ensureMediaExist(cleanIds);
  await client.delete(productImages).where(eq(productImages.productId, productId));
  if (cleanIds.length === 0) return;

  await client.insert(productImages).values(
    cleanIds.map((mediaId, index) => ({
      productId,
      mediaId,
      sortOrder: index,
    })),
  );
}

async function replaceProductAttachments(productId: string, mediaIds: string[], client: DbClient = db): Promise<void> {
  const cleanIds = normalizeIds(mediaIds);
  await ensureMediaExist(cleanIds);
  await client.delete(productAttachments).where(eq(productAttachments.productId, productId));
  if (cleanIds.length === 0) return;

  await client.insert(productAttachments).values(
    cleanIds.map((mediaId, index) => ({
      productId,
      mediaId,
      sortOrder: index,
    })),
  );
}

async function getProductAssociations(
  productIds: string[],
): Promise<{
  categoryMap: Map<string, string[]>;
  tagMap: Map<string, string[]>;
  galleryMap: Map<string, string[]>;
  attachmentMap: Map<string, string[]>;
}> {
  const categoryMap = new Map<string, string[]>();
  const tagMap = new Map<string, string[]>();
  const galleryMap = new Map<string, string[]>();
  const attachmentMap = new Map<string, string[]>();

  if (productIds.length === 0) {
    return { categoryMap, tagMap, galleryMap, attachmentMap };
  }

  const categoryRows = await db
    .select({
      productId: productCategories.productId,
      categoryId: productCategories.categoryId,
    })
    .from(productCategories)
    .where(inArray(productCategories.productId, productIds));

  for (const row of categoryRows) {
    const bucket = categoryMap.get(row.productId) ?? [];
    bucket.push(row.categoryId);
    categoryMap.set(row.productId, bucket);
  }

  const tagRows = await db
    .select({
      productId: productTags.productId,
      tagId: productTags.tagId,
    })
    .from(productTags)
    .where(inArray(productTags.productId, productIds));

  for (const row of tagRows) {
    const bucket = tagMap.get(row.productId) ?? [];
    bucket.push(row.tagId);
    tagMap.set(row.productId, bucket);
  }

  const galleryRows = await db
    .select({
      productId: productImages.productId,
      mediaId: productImages.mediaId,
      sortOrder: productImages.sortOrder,
    })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sortOrder));

  for (const row of galleryRows) {
    const bucket = galleryMap.get(row.productId) ?? [];
    bucket.push(row.mediaId);
    galleryMap.set(row.productId, bucket);
  }

  const attachmentRows = await db
    .select({
      productId: productAttachments.productId,
      mediaId: productAttachments.mediaId,
      sortOrder: productAttachments.sortOrder,
    })
    .from(productAttachments)
    .where(inArray(productAttachments.productId, productIds))
    .orderBy(asc(productAttachments.sortOrder));

  for (const row of attachmentRows) {
    const bucket = attachmentMap.get(row.productId) ?? [];
    bucket.push(row.mediaId);
    attachmentMap.set(row.productId, bucket);
  }

  return { categoryMap, tagMap, galleryMap, attachmentMap };
}

export async function getProductById(id: string): Promise<ProductWithRelations> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      translations: true,
    },
  });

  if (!product) {
    throw new NotFoundError('Product', id);
  }

  const { categoryMap, tagMap, galleryMap, attachmentMap } = await getProductAssociations([id]);

  return {
    ...product,
    additionalCategoryIds: categoryMap.get(id) ?? [],
    tagIds: tagMap.get(id) ?? [],
    galleryImageIds: galleryMap.get(id) ?? [],
    attachmentIds: attachmentMap.get(id) ?? [],
  };
}

export async function getProductList(
  locale: string,
  defaultLocale: string,
): Promise<ProductListItem[]> {
  const rows = await db.query.products.findMany({
    with: {
      translations: true,
      primaryCategory: {
        with: {
          translations: true,
        },
      },
    },
    orderBy: [desc(products.updatedAt), asc(products.sku)],
  });

  const productIds = rows.map((item) => item.id);
  const { categoryMap, tagMap, galleryMap, attachmentMap } = await getProductAssociations(productIds);

  return rows.map((item) => {
    const display = getTranslation(item.translations, locale, defaultLocale);
    const categoryDisplay = getTranslation(
      item.primaryCategory.translations,
      locale,
      defaultLocale,
    );

    return {
      ...item,
      displayName: display?.name ?? '(未命名)',
      primaryCategoryName: categoryDisplay?.name ?? item.primaryCategory.slug,
      additionalCategoryIds: categoryMap.get(item.id) ?? [],
      tagIds: tagMap.get(item.id) ?? [],
      galleryImageIds: galleryMap.get(item.id) ?? [],
      attachmentIds: attachmentMap.get(item.id) ?? [],
    };
  });
}

export async function createProduct(input: CreateProductInput): Promise<ProductWithRelations> {
  const sku = normalizeSku(input.sku);
  const slug = normalizeSlug(input.slug);
  ensureProductStatus(input.status);

  if (!sku) throw new ValidationError('SKU is required');
  if (!slug) throw new ValidationError('Slug is required');

  await ensureCategoryExists(input.primaryCategoryId);
  ensureTranslationHasName(input.translations);
  if (input.featuredImageId) {
    await ensureMediaExist([input.featuredImageId]);
  }

  const [existingBySku] = await db.select().from(products).where(eq(products.sku, sku));
  if (existingBySku) {
    throw new DuplicateError('Product', 'sku', sku);
  }

  const [existingBySlug] = await db.select().from(products).where(eq(products.slug, slug));
  if (existingBySlug) {
    throw new DuplicateError('Product', 'slug', slug);
  }

  const sortOrder =
    input.sortOrder ??
    ((await db.select({ val: max(products.sortOrder) }).from(products))[0].val ?? -1) + 1;

  const createdId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(products)
      .values({
        sku,
        slug,
        primaryCategoryId: input.primaryCategoryId,
        status: input.status ?? 'draft',
        sortOrder,
        featuredImageId: input.featuredImageId ?? null,
        videoLinks: input.videoLinks ?? [],
        moq: input.moq ?? null,
        leadTimeDays: input.leadTimeDays ?? null,
        tradeTerms: normalizeNullableText(input.tradeTerms) ?? null,
        paymentTerms: normalizeNullableText(input.paymentTerms) ?? null,
        packagingDetails: normalizeNullableText(input.packagingDetails) ?? null,
        customizationSupport: input.customizationSupport ?? false,
        attributeDisplayPosition: input.attributeDisplayPosition ?? 'after_description',
        showAttachmentSection: input.showAttachmentSection ?? true,
      })
      .returning();

    await upsertProductTranslations(created.id, input.translations, tx);
    await replaceAdditionalCategories(
      created.id,
      created.primaryCategoryId,
      input.additionalCategoryIds ?? [],
      tx,
    );
    await replaceProductTags(created.id, input.tagIds ?? [], tx);
    await replaceProductImages(created.id, input.galleryImageIds ?? [], tx);
    await replaceProductAttachments(created.id, input.attachmentIds ?? [], tx);

    return created.id;
  });

  return getProductById(createdId);
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ProductWithRelations> {
  const existing = await getProductById(id);
  ensureProductStatus(input.status);

  const sku = input.sku !== undefined ? normalizeSku(input.sku) : existing.sku;
  const slug = input.slug !== undefined ? normalizeSlug(input.slug) : existing.slug;

  if (!sku) throw new ValidationError('SKU is required');
  if (!slug) throw new ValidationError('Slug is required');

  if (input.primaryCategoryId) {
    await ensureCategoryExists(input.primaryCategoryId);
  }
  if (input.featuredImageId) {
    await ensureMediaExist([input.featuredImageId]);
  }
  if (input.translations) {
    ensureTranslationHasName(input.translations);
  }

  const [duplicateSku] = await db.select().from(products).where(eq(products.sku, sku));
  if (duplicateSku && duplicateSku.id !== id) {
    throw new DuplicateError('Product', 'sku', sku);
  }

  const [duplicateSlug] = await db.select().from(products).where(eq(products.slug, slug));
  if (duplicateSlug && duplicateSlug.id !== id) {
    throw new DuplicateError('Product', 'slug', slug);
  }

  const nextPrimaryCategoryId = input.primaryCategoryId ?? existing.primaryCategoryId;

  await db.transaction(async (tx) => {
    await tx
      .update(products)
      .set({
        sku,
        slug,
        primaryCategoryId: nextPrimaryCategoryId,
        status: input.status ?? existing.status,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        featuredImageId:
          input.featuredImageId === undefined ? existing.featuredImageId : input.featuredImageId,
        videoLinks: input.videoLinks ?? existing.videoLinks,
        moq: input.moq === undefined ? existing.moq : input.moq,
        leadTimeDays: input.leadTimeDays === undefined ? existing.leadTimeDays : input.leadTimeDays,
        tradeTerms:
          input.tradeTerms === undefined
            ? existing.tradeTerms
            : normalizeNullableText(input.tradeTerms) ?? null,
        paymentTerms:
          input.paymentTerms === undefined
            ? existing.paymentTerms
            : normalizeNullableText(input.paymentTerms) ?? null,
        packagingDetails:
          input.packagingDetails === undefined
            ? existing.packagingDetails
            : normalizeNullableText(input.packagingDetails) ?? null,
        customizationSupport:
          input.customizationSupport === undefined
            ? existing.customizationSupport
            : input.customizationSupport,
        attributeDisplayPosition:
          input.attributeDisplayPosition === undefined
            ? existing.attributeDisplayPosition
            : input.attributeDisplayPosition,
        showAttachmentSection:
          input.showAttachmentSection === undefined
            ? existing.showAttachmentSection
            : input.showAttachmentSection,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    if (input.translations) {
      await upsertProductTranslations(id, input.translations, tx);
    }
    if (input.additionalCategoryIds) {
      await replaceAdditionalCategories(id, nextPrimaryCategoryId, input.additionalCategoryIds, tx);
    }
    if (input.tagIds) {
      await replaceProductTags(id, input.tagIds, tx);
    }
    if (input.galleryImageIds) {
      await replaceProductImages(id, input.galleryImageIds, tx);
    }
    if (input.attachmentIds) {
      await replaceProductAttachments(id, input.attachmentIds, tx);
    }
  });

  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<void> {
  await getProductById(id);
  await db.delete(products).where(eq(products.id, id));
}

export async function batchUpdateProductStatus(
  ids: string[],
  status: ProductStatus,
): Promise<number> {
  if (ids.length === 0) return 0;
  await db
    .update(products)
    .set({ status, updatedAt: new Date() })
    .where(inArray(products.id, ids));
  return ids.length;
}

export async function batchDeleteProducts(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  await db.delete(products).where(inArray(products.id, ids));
  return ids.length;
}

export async function cloneProduct(
  sourceId: string,
  newSku: string,
  newSlug: string,
): Promise<ProductWithRelations> {
  const source = await getProductById(sourceId);

  const createdId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(products)
      .values({
        sku: newSku,
        slug: newSlug,
        primaryCategoryId: source.primaryCategoryId,
        status: 'draft',
        featuredImageId: source.featuredImageId,
        videoLinks: source.videoLinks,
        sortOrder: source.sortOrder,
        moq: source.moq,
        leadTimeDays: source.leadTimeDays,
        tradeTerms: source.tradeTerms,
        paymentTerms: source.paymentTerms,
        packagingDetails: source.packagingDetails,
        customizationSupport: source.customizationSupport,
        templateConfig: source.templateConfig,
      })
      .returning();

    if (source.translations.length > 0) {
      await tx.insert(productTranslations).values(
        source.translations.map((t) => ({
          productId: created.id,
          locale: t.locale,
          name: t.name ? `${t.name} (副本)` : null,
          shortDescription: t.shortDescription,
          description: t.description,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        })),
      );
    }

    if (source.additionalCategoryIds.length > 0) {
      await tx.insert(productCategories).values(
        source.additionalCategoryIds.map((cid) => ({
          productId: created.id,
          categoryId: cid,
        })),
      );
    }

    if (source.tagIds.length > 0) {
      await tx.insert(productTags).values(
        source.tagIds.map((tid) => ({
          productId: created.id,
          tagId: tid,
        })),
      );
    }

    if (source.galleryImageIds.length > 0) {
      await tx.insert(productImages).values(
        source.galleryImageIds.map((mid, i) => ({
          productId: created.id,
          mediaId: mid,
          sortOrder: i,
        })),
      );
    }

    if (source.attachmentIds.length > 0) {
      await tx.insert(productAttachments).values(
        source.attachmentIds.map((mid, i) => ({
          productId: created.id,
          mediaId: mid,
          sortOrder: i,
        })),
      );
    }

    const sourceGroups = await tx.query.productAttributeGroups.findMany({
      where: eq(productAttributeGroups.productId, sourceId),
      with: { translations: true, attributes: { with: { translations: true } } },
      orderBy: [asc(productAttributeGroups.sortOrder)],
    });

    for (const group of sourceGroups) {
      const [newGroup] = await tx
        .insert(productAttributeGroups)
        .values({ productId: created.id, sortOrder: group.sortOrder })
        .returning();

      if (group.translations.length > 0) {
        await tx.insert(productAttributeGroupTranslations).values(
          group.translations.map((t) => ({
            groupId: newGroup.id,
            locale: t.locale,
            name: t.name,
          })),
        );
      }

      for (const attr of group.attributes) {
        const [newAttr] = await tx
          .insert(productAttributes)
          .values({ groupId: newGroup.id, sortOrder: attr.sortOrder })
          .returning();

        if (attr.translations.length > 0) {
          await tx.insert(productAttributeTranslations).values(
            attr.translations.map((t) => ({
              attributeId: newAttr.id,
              locale: t.locale,
              name: t.name,
              value: t.value,
            })),
          );
        }
      }
    }

    return created.id;
  });

  return getProductById(createdId);
}
