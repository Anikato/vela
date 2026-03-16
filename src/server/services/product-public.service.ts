import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import {
  categories,
  categoryTranslations,
  media,
  productAttributeGroupTranslations,
  productAttributeGroups,
  productAttributeTranslations,
  productAttributes,
  productCategories,
  productAttachments,
  productImages,
  productTags,
  productTranslations,
  products,
  tags,
  tagTranslations,
} from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';

export interface PublicProductAttributeItem {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
}

export interface PublicProductAttributeGroup {
  id: string;
  name: string;
  sortOrder: number;
  attributes: PublicProductAttributeItem[];
}

export interface PublicProductMediaItem {
  id: string;
  url: string;
  alt: string | null;
}

export interface PublicProductDetail {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  moq: number | null;
  leadTimeDays: number | null;
  tradeTerms: string | null;
  paymentTerms: string | null;
  packagingDetails: string | null;
  customizationSupport: boolean;
  attributeDisplayPosition: string;
  primaryCategory: {
    id: string;
    slug: string;
    name: string;
  };
  additionalCategories: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
  tags: Array<{
    id: string;
    slug: string;
    name: string;
  }>;
  featuredImage: PublicProductMediaItem | null;
  galleryImages: PublicProductMediaItem[];
  attachments: Array<{
    id: string;
    url: string;
    name: string;
    mimeType: string;
  }>;
  videoLinks: string[];
  attributeGroups: PublicProductAttributeGroup[];
}

export interface PublicProductCardItem {
  id: string;
  slug: string;
  primaryCategorySlug: string;
  primaryCategoryName: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  featuredImage: PublicProductMediaItem | null;
}

export interface ProductShowcaseQueryOptions {
  limit?: number;
  categorySlug?: string;
  tagSlug?: string;
}

export interface RelatedProductQueryOptions {
  productId: string;
  primaryCategoryId: string;
  limit?: number;
}

export interface PublicCategorySummary {
  id: string;
  slug: string;
  name: string;
}

export type ProductSortOption = 'newest' | 'popular' | 'name_asc' | 'name_desc';

export interface PublicProductListResult {
  items: PublicProductCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  category: PublicCategorySummary | null;
}

export interface PublicCategoryTreeNode {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  children: PublicCategoryTreeNode[];
}

export interface PublicTagItem {
  id: string;
  slug: string;
  name: string;
  productCount: number;
}

export interface PublicProductSearchResult {
  items: PublicProductCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
}

export async function getPublishedProductDetailBySlug(
  slug: string,
  locale: string,
  defaultLocale: string,
): Promise<PublicProductDetail | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, normalizedSlug), eq(products.status, 'published')),
    with: {
      translations: true,
      primaryCategory: {
        with: {
          translations: true,
        },
      },
    },
  });

  if (!product) return null;

  const translated = getTranslation(product.translations, locale, defaultLocale);
  const translatedPrimaryCategory = getTranslation(
    product.primaryCategory.translations,
    locale,
    defaultLocale,
  );

  const storage = getStorageAdapter();

  const [featuredMedia] = product.featuredImageId
    ? await db.select().from(media).where(eq(media.id, product.featuredImageId))
    : [];

  const galleryRows = await db
    .select({
      mediaId: productImages.mediaId,
      sortOrder: productImages.sortOrder,
      filename: media.filename,
      alt: media.alt,
    })
    .from(productImages)
    .innerJoin(media, eq(productImages.mediaId, media.id))
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  const attachmentRows = await db
    .select({
      mediaId: productAttachments.mediaId,
      sortOrder: productAttachments.sortOrder,
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
    })
    .from(productAttachments)
    .innerJoin(media, eq(productAttachments.mediaId, media.id))
    .where(eq(productAttachments.productId, product.id))
    .orderBy(asc(productAttachments.sortOrder));

  const additionalCategoryRows = await db
    .select({
      id: categories.id,
      slug: categories.slug,
      locale: categoryTranslations.locale,
      name: categoryTranslations.name,
    })
    .from(productCategories)
    .innerJoin(categories, eq(productCategories.categoryId, categories.id))
    .leftJoin(
      categoryTranslations,
      eq(categoryTranslations.categoryId, categories.id),
    )
    .where(eq(productCategories.productId, product.id));

  const additionalCategoryMap = new Map<
    string,
    { id: string; slug: string; translations: Array<{ locale: string; name: string | null }> }
  >();
  for (const row of additionalCategoryRows) {
    const bucket = additionalCategoryMap.get(row.id) ?? {
      id: row.id,
      slug: row.slug,
      translations: [],
    };
    if (row.locale) {
      bucket.translations.push({ locale: row.locale, name: row.name });
    }
    additionalCategoryMap.set(row.id, bucket);
  }

  const tagRows = await db
    .select({
      id: tags.id,
      slug: tags.slug,
      locale: tagTranslations.locale,
      name: tagTranslations.name,
    })
    .from(productTags)
    .innerJoin(tags, eq(productTags.tagId, tags.id))
    .leftJoin(tagTranslations, eq(tagTranslations.tagId, tags.id))
    .where(eq(productTags.productId, product.id));

  const tagMap = new Map<
    string,
    { id: string; slug: string; translations: Array<{ locale: string; name: string | null }> }
  >();
  for (const row of tagRows) {
    const bucket = tagMap.get(row.id) ?? {
      id: row.id,
      slug: row.slug,
      translations: [],
    };
    if (row.locale) {
      bucket.translations.push({ locale: row.locale, name: row.name });
    }
    tagMap.set(row.id, bucket);
  }

  const groups = await db
    .select()
    .from(productAttributeGroups)
    .where(eq(productAttributeGroups.productId, product.id))
    .orderBy(asc(productAttributeGroups.sortOrder));

  const groupIds = groups.map((group) => group.id);
  const groupTranslationsByGroupId = new Map<
    string,
    typeof productAttributeGroupTranslations.$inferSelect[]
  >();
  if (groupIds.length > 0) {
    const rows = await db
      .select()
      .from(productAttributeGroupTranslations)
      .where(inArray(productAttributeGroupTranslations.groupId, groupIds));
    for (const row of rows) {
      const bucket = groupTranslationsByGroupId.get(row.groupId) ?? [];
      bucket.push(row);
      groupTranslationsByGroupId.set(row.groupId, bucket);
    }
  }

  const attributes = groupIds.length
    ? await db
        .select()
        .from(productAttributes)
        .where(inArray(productAttributes.groupId, groupIds))
        .orderBy(asc(productAttributes.sortOrder))
    : [];

  const attributeIds = attributes.map((item) => item.id);
  const attributeTranslationsById = new Map<
    string,
    typeof productAttributeTranslations.$inferSelect[]
  >();
  if (attributeIds.length > 0) {
    const rows = await db
      .select()
      .from(productAttributeTranslations)
      .where(inArray(productAttributeTranslations.attributeId, attributeIds));
    for (const row of rows) {
      const bucket = attributeTranslationsById.get(row.attributeId) ?? [];
      bucket.push(row);
      attributeTranslationsById.set(row.attributeId, bucket);
    }
  }

  const attributeGroups: PublicProductAttributeGroup[] = groups.map((group) => {
    const groupTranslations = groupTranslationsByGroupId.get(group.id) ?? [];
    const groupName =
      getTranslation(groupTranslations, locale, defaultLocale)?.name ?? '(Unnamed Group)';
    const items = attributes
      .filter((attribute) => attribute.groupId === group.id)
      .map((attribute) => {
        const translations = attributeTranslationsById.get(attribute.id) ?? [];
        const translatedAttribute = getTranslation(translations, locale, defaultLocale);
        return {
          id: attribute.id,
          name: translatedAttribute?.name ?? '(Unnamed)',
          value: translatedAttribute?.value ?? '-',
          sortOrder: attribute.sortOrder,
        };
      });

    return {
      id: group.id,
      name: groupName,
      sortOrder: group.sortOrder,
      attributes: items,
    };
  });

  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: translated?.name ?? product.sku,
    shortDescription:
      typeof translated?.shortDescription === 'string' ? translated.shortDescription : null,
    description: typeof translated?.description === 'string' ? translated.description : null,
    seoTitle: typeof translated?.seoTitle === 'string' ? translated.seoTitle : null,
    seoDescription:
      typeof translated?.seoDescription === 'string' ? translated.seoDescription : null,
    status: product.status,
    moq: product.moq,
    leadTimeDays: product.leadTimeDays,
    tradeTerms: product.tradeTerms,
    paymentTerms: product.paymentTerms,
    packagingDetails: product.packagingDetails,
    customizationSupport: product.customizationSupport,
    attributeDisplayPosition: product.attributeDisplayPosition,
    primaryCategory: {
      id: product.primaryCategory.id,
      slug: product.primaryCategory.slug,
      name: translatedPrimaryCategory?.name ?? product.primaryCategory.slug,
    },
    additionalCategories: Array.from(additionalCategoryMap.values()).map((item) => {
      const translatedCategory = getTranslation(item.translations, locale, defaultLocale);
      return {
        id: item.id,
        slug: item.slug,
        name: translatedCategory?.name ?? item.slug,
      };
    }),
    tags: Array.from(tagMap.values()).map((item) => {
      const translatedTag = getTranslation(item.translations, locale, defaultLocale);
      return {
        id: item.id,
        slug: item.slug,
        name: translatedTag?.name ?? item.slug,
      };
    }),
    featuredImage: featuredMedia
      ? {
          id: featuredMedia.id,
          url: storage.getPublicUrl(featuredMedia.filename),
          alt: featuredMedia.alt,
        }
      : null,
    galleryImages: galleryRows.map((row) => ({
      id: row.mediaId,
      url: storage.getPublicUrl(row.filename),
      alt: row.alt,
    })),
    attachments: attachmentRows.map((row) => ({
      id: row.mediaId,
      url: storage.getPublicUrl(row.filename),
      name: row.originalName,
      mimeType: row.mimeType,
    })),
    videoLinks: product.videoLinks ?? [],
    attributeGroups,
  };
}

export async function getPublishedProductsForShowcase(
  locale: string,
  defaultLocale: string,
  options: ProductShowcaseQueryOptions = {},
): Promise<PublicProductCardItem[]> {
  const safeLimit = Math.max(1, Math.min(24, options.limit ?? 6));
  const normalizedCategorySlug = options.categorySlug?.trim().toLowerCase();
  const normalizedTagSlug = options.tagSlug?.trim().toLowerCase();

  let filteredIds: Set<string> | null = null;

  if (normalizedCategorySlug) {
    const primaryRows = await db
      .select({ id: products.id })
      .from(products)
      .innerJoin(categories, eq(products.primaryCategoryId, categories.id))
      .where(eq(categories.slug, normalizedCategorySlug));

    const additionalRows = await db
      .select({ id: productCategories.productId })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(categories.slug, normalizedCategorySlug));

    const categoryIds = new Set<string>([
      ...primaryRows.map((item) => item.id),
      ...additionalRows.map((item) => item.id),
    ]);
    filteredIds = categoryIds;
  }

  if (normalizedTagSlug) {
    const tagRows = await db
      .select({ id: productTags.productId })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(eq(tags.slug, normalizedTagSlug));

    const tagIds = new Set<string>(tagRows.map((item) => item.id));
    if (filteredIds) {
      filteredIds = new Set([...filteredIds].filter((id) => tagIds.has(id)));
    } else {
      filteredIds = tagIds;
    }
  }

  if (filteredIds && filteredIds.size === 0) return [];

  const rows = await db.query.products.findMany({
    where: filteredIds
      ? and(eq(products.status, 'published'), inArray(products.id, [...filteredIds]))
      : eq(products.status, 'published'),
    with: {
      translations: true,
      primaryCategory: {
        with: {
          translations: true,
        },
      },
    },
    orderBy: [desc(products.sortOrder), desc(products.createdAt)],
    limit: safeLimit,
  });

  if (rows.length === 0) return [];

  const mediaIds = rows
    .map((item) => item.featuredImageId)
    .filter((id): id is string => Boolean(id));
  const mediaRows =
    mediaIds.length > 0
      ? await db.select().from(media).where(inArray(media.id, mediaIds))
      : [];
  const mediaMap = new Map(mediaRows.map((item) => [item.id, item]));
  const storage = getStorageAdapter();

  return rows.map((item) => {
    const translated = getTranslation(item.translations, locale, defaultLocale);
    const translatedCategory = getTranslation(
      item.primaryCategory.translations,
      locale,
      defaultLocale,
    );
    const featuredMedia = item.featuredImageId ? mediaMap.get(item.featuredImageId) : null;

    return {
      id: item.id,
      slug: item.slug,
      primaryCategorySlug: item.primaryCategory.slug,
      primaryCategoryName: translatedCategory?.name ?? item.primaryCategory.slug,
      sku: item.sku,
      name: translated?.name ?? item.sku,
      shortDescription:
        typeof translated?.shortDescription === 'string' ? translated.shortDescription : null,
      featuredImage: featuredMedia
        ? {
            id: featuredMedia.id,
            url: storage.getPublicUrl(featuredMedia.filename),
            alt: featuredMedia.alt,
          }
        : null,
    };
  });
}

export async function getPublicCategoryBySlug(
  categorySlug: string,
  locale: string,
  defaultLocale: string,
): Promise<PublicCategorySummary | null> {
  const normalizedSlug = categorySlug.trim().toLowerCase();
  const category = await db.query.categories.findFirst({
    where: and(eq(categories.slug, normalizedSlug), eq(categories.isActive, true)),
    with: {
      translations: true,
    },
  });
  if (!category) return null;

  const translated = getTranslation(category.translations, locale, defaultLocale);
  return {
    id: category.id,
    slug: category.slug,
    name: translated?.name ?? category.slug,
  };
}

export async function getRelatedPublishedProducts(
  locale: string,
  defaultLocale: string,
  options: RelatedProductQueryOptions,
): Promise<PublicProductCardItem[]> {
  const safeLimit = Math.max(1, Math.min(12, options.limit ?? 6));

  const rows = await db.query.products.findMany({
    where: and(
      eq(products.status, 'published'),
      eq(products.primaryCategoryId, options.primaryCategoryId),
    ),
    with: {
      translations: true,
      primaryCategory: {
        with: {
          translations: true,
        },
      },
    },
    orderBy: [desc(products.sortOrder), desc(products.createdAt)],
  });

  const filteredRows = rows
    .filter((item) => item.id !== options.productId)
    .slice(0, safeLimit);
  if (filteredRows.length === 0) {
    return [];
  }

  const mediaIds = filteredRows
    .map((item) => item.featuredImageId)
    .filter((id): id is string => Boolean(id));
  const mediaRows =
    mediaIds.length > 0
      ? await db.select().from(media).where(inArray(media.id, mediaIds))
      : [];
  const mediaMap = new Map(mediaRows.map((item) => [item.id, item]));
  const storage = getStorageAdapter();

  return filteredRows.map((item) => {
    const translated = getTranslation(item.translations, locale, defaultLocale);
    const translatedCategory = getTranslation(
      item.primaryCategory.translations,
      locale,
      defaultLocale,
    );
    const featuredMedia = item.featuredImageId ? mediaMap.get(item.featuredImageId) : null;

    return {
      id: item.id,
      slug: item.slug,
      primaryCategorySlug: item.primaryCategory.slug,
      primaryCategoryName: translatedCategory?.name ?? item.primaryCategory.slug,
      sku: item.sku,
      name: translated?.name ?? item.sku,
      shortDescription:
        typeof translated?.shortDescription === 'string' ? translated.shortDescription : null,
      featuredImage: featuredMedia
        ? {
            id: featuredMedia.id,
            url: storage.getPublicUrl(featuredMedia.filename),
            alt: featuredMedia.alt,
          }
        : null,
    };
  });
}

/**
 * 获取某个分类及其所有后代分类的 ID 集合。
 * 用于"子分类产品向上汇聚"：查看父分类时，自动包含所有子/孙分类的产品。
 */
async function getAllDescendantCategoryIds(categoryId: string): Promise<string[]> {
  const allActive = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    columns: { id: true, parentId: true },
  });

  const childMap = new Map<string, string[]>();
  for (const cat of allActive) {
    if (cat.parentId) {
      const arr = childMap.get(cat.parentId);
      if (arr) arr.push(cat.id);
      else childMap.set(cat.parentId, [cat.id]);
    }
  }

  const result: string[] = [categoryId];
  const queue = [categoryId];
  while (queue.length > 0) {
    const current = queue.pop()!;
    const children = childMap.get(current);
    if (children) {
      for (const childId of children) {
        result.push(childId);
        queue.push(childId);
      }
    }
  }

  return result;
}

export async function getPublishedProductList(
  locale: string,
  defaultLocale: string,
  options: {
    categorySlug?: string;
    tagSlug?: string;
    sort?: ProductSortOption;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PublicProductListResult> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.max(1, Math.min(48, Math.floor(options.pageSize ?? 12)));

  const normalizedCategorySlug = options.categorySlug?.trim().toLowerCase();
  const normalizedTagSlug = options.tagSlug?.trim().toLowerCase();
  const category = normalizedCategorySlug
    ? await getPublicCategoryBySlug(normalizedCategorySlug, locale, defaultLocale)
    : null;

  if (normalizedCategorySlug && !category) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, category: null };
  }

  let filteredIds: Set<string> | null = null;

  if (category) {
    const categoryIds = await getAllDescendantCategoryIds(category.id);

    const primaryRows = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.status, 'published'), inArray(products.primaryCategoryId, categoryIds)));
    const additionalRows = await db
      .select({ id: productCategories.productId })
      .from(productCategories)
      .innerJoin(products, eq(productCategories.productId, products.id))
      .where(and(inArray(productCategories.categoryId, categoryIds), eq(products.status, 'published')));

    filteredIds = new Set([
      ...primaryRows.map((item) => item.id),
      ...additionalRows.map((item) => item.id),
    ]);
  }

  if (normalizedTagSlug) {
    const tagRows = await db
      .select({ productId: productTags.productId })
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .innerJoin(products, eq(productTags.productId, products.id))
      .where(and(eq(tags.slug, normalizedTagSlug), eq(products.status, 'published')));

    const tagProductIds = new Set(tagRows.map((item) => item.productId));
    if (filteredIds) {
      filteredIds = new Set([...filteredIds].filter((id) => tagProductIds.has(id)));
    } else {
      filteredIds = tagProductIds;
    }
  }

  if (filteredIds && filteredIds.size === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, category };
  }

  const idArray = filteredIds ? [...filteredIds] : null;
  const whereCondition = idArray
    ? and(eq(products.status, 'published'), inArray(products.id, idArray))
    : eq(products.status, 'published');

  const [{ total: totalCount }] = await db
    .select({ total: count() })
    .from(products)
    .where(whereCondition);

  const total = totalCount;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, category };
  }

  const offset = (page - 1) * pageSize;

  const sortOption = options.sort ?? 'newest';
  const orderByClause = buildOrderBy(sortOption);

  const rows = await db.query.products.findMany({
    where: whereCondition,
    with: {
      translations: true,
      primaryCategory: { with: { translations: true } },
    },
    orderBy: orderByClause,
    limit: pageSize,
    offset,
  });

  if (!rows.length) {
    return { items: [], total, page, pageSize, totalPages, category };
  }

  const items = await mapProductRowsToCards(rows, locale, defaultLocale);

  return { items, total, page, pageSize, totalPages, category };
}

function buildOrderBy(sort: ProductSortOption) {
  switch (sort) {
    case 'popular':
      return [desc(products.viewCount), desc(products.createdAt)];
    case 'name_asc':
      return [asc(products.slug)];
    case 'name_desc':
      return [desc(products.slug)];
    case 'newest':
    default:
      return [desc(products.sortOrder), desc(products.createdAt)];
  }
}

async function mapProductRowsToCards(
  rows: Array<{
    id: string;
    slug: string;
    sku: string;
    featuredImageId: string | null;
    translations: Array<{ locale: string; name: string | null; shortDescription: string | null; [key: string]: unknown }>;
    primaryCategory: {
      slug: string;
      translations: Array<{ locale: string; name: string | null; [key: string]: unknown }>;
    };
  }>,
  locale: string,
  defaultLocale: string,
): Promise<PublicProductCardItem[]> {
  const mediaIds = rows.map((item) => item.featuredImageId).filter((id): id is string => Boolean(id));
  const mediaRows = mediaIds.length > 0 ? await db.select().from(media).where(inArray(media.id, mediaIds)) : [];
  const mediaMap = new Map(mediaRows.map((item) => [item.id, item]));
  const storage = getStorageAdapter();

  return rows.map((item) => {
    const translated = getTranslation(item.translations, locale, defaultLocale);
    const translatedCategory = getTranslation(item.primaryCategory.translations, locale, defaultLocale);
    const featuredMedia = item.featuredImageId ? mediaMap.get(item.featuredImageId) : null;

    return {
      id: item.id,
      slug: item.slug,
      primaryCategorySlug: item.primaryCategory.slug,
      primaryCategoryName: translatedCategory?.name ?? item.primaryCategory.slug,
      sku: item.sku,
      name: translated?.name ?? item.sku,
      shortDescription: typeof translated?.shortDescription === 'string' ? translated.shortDescription : null,
      featuredImage: featuredMedia
        ? { id: featuredMedia.id, url: storage.getPublicUrl(featuredMedia.filename), alt: featuredMedia.alt }
        : null,
    };
  });
}

/** 获取前台分类树（仅启用分类 + 每个分类的已发布产品数） */
export async function getPublicCategoryTree(
  locale: string,
  defaultLocale: string,
): Promise<PublicCategoryTreeNode[]> {
  const allCategories = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    with: { translations: true },
    orderBy: [asc(categories.sortOrder), asc(categories.createdAt)],
  });

  const primaryCountRows = await db
    .select({ categoryId: products.primaryCategoryId, cnt: count() })
    .from(products)
    .where(eq(products.status, 'published'))
    .groupBy(products.primaryCategoryId);
  const primaryCountMap = new Map(primaryCountRows.map((r) => [r.categoryId, r.cnt]));

  const additionalCountRows = await db
    .select({ categoryId: productCategories.categoryId, cnt: count() })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .where(eq(products.status, 'published'))
    .groupBy(productCategories.categoryId);
  const additionalCountMap = new Map(additionalCountRows.map((r) => [r.categoryId, r.cnt]));

  const directCountMap = new Map<string, number>();
  for (const cat of allCategories) {
    directCountMap.set(
      cat.id,
      (primaryCountMap.get(cat.id) ?? 0) + (additionalCountMap.get(cat.id) ?? 0),
    );
  }

  const childMap = new Map<string, string[]>();
  for (const cat of allCategories) {
    if (cat.parentId) {
      const arr = childMap.get(cat.parentId);
      if (arr) arr.push(cat.id);
      else childMap.set(cat.parentId, [cat.id]);
    }
  }

  function getAggregatedCount(catId: string): number {
    let total = directCountMap.get(catId) ?? 0;
    const children = childMap.get(catId);
    if (children) {
      for (const childId of children) {
        total += getAggregatedCount(childId);
      }
    }
    return total;
  }

  const nodeMap = new Map<string, PublicCategoryTreeNode>();
  for (const cat of allCategories) {
    const translated = getTranslation(cat.translations, locale, defaultLocale);
    nodeMap.set(cat.id, {
      id: cat.id,
      slug: cat.slug,
      name: translated?.name ?? cat.slug,
      productCount: getAggregatedCount(cat.id),
      children: [],
    });
  }

  const roots: PublicCategoryTreeNode[] = [];
  for (const cat of allCategories) {
    const node = nodeMap.get(cat.id)!;
    if (cat.parentId && nodeMap.has(cat.parentId)) {
      nodeMap.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** 获取前台标签列表（仅有已发布产品的标签） */
export async function getPublicTagList(
  locale: string,
  defaultLocale: string,
): Promise<PublicTagItem[]> {
  const tagCountRows = await db
    .select({ tagId: productTags.tagId, cnt: count() })
    .from(productTags)
    .innerJoin(products, eq(productTags.productId, products.id))
    .where(eq(products.status, 'published'))
    .groupBy(productTags.tagId);

  if (tagCountRows.length === 0) return [];

  const tagIds = tagCountRows.map((r) => r.tagId);
  const countMap = new Map(tagCountRows.map((r) => [r.tagId, r.cnt]));

  const tagRows = await db.query.tags.findMany({
    where: inArray(tags.id, tagIds),
    with: { translations: true },
    orderBy: [asc(tags.slug)],
  });

  return tagRows.map((tag) => {
    const translated = getTranslation(tag.translations, locale, defaultLocale);
    return {
      id: tag.id,
      slug: tag.slug,
      name: translated?.name ?? tag.slug,
      productCount: countMap.get(tag.id) ?? 0,
    };
  });
}

/** 搜索已发布产品（按产品名称所有语言 + SKU 匹配） */
export async function searchPublishedProducts(
  locale: string,
  defaultLocale: string,
  options: { query: string; page?: number; pageSize?: number },
): Promise<PublicProductSearchResult> {
  const q = options.query.trim();
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.max(1, Math.min(48, Math.floor(options.pageSize ?? 12)));

  if (!q) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, query: q };
  }

  const pattern = `%${q}%`;

  const nameMatchRows = await db
    .select({ productId: productTranslations.productId })
    .from(productTranslations)
    .innerJoin(products, eq(productTranslations.productId, products.id))
    .where(and(eq(products.status, 'published'), ilike(productTranslations.name, pattern)));

  const skuMatchRows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.status, 'published'), ilike(products.sku, pattern)));

  const matchedIds = Array.from(
    new Set([
      ...nameMatchRows.map((r) => r.productId),
      ...skuMatchRows.map((r) => r.id),
    ]),
  );

  const total = matchedIds.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0, query: q };
  }

  const offset = (page - 1) * pageSize;
  const pageIds = matchedIds.slice(offset, offset + pageSize);

  if (pageIds.length === 0) {
    return { items: [], total, page, pageSize, totalPages, query: q };
  }

  const rows = await db.query.products.findMany({
    where: inArray(products.id, pageIds),
    with: {
      translations: true,
      primaryCategory: { with: { translations: true } },
    },
    orderBy: [desc(products.sortOrder), desc(products.createdAt)],
  });

  const items = await mapProductRowsToCards(rows, locale, defaultLocale);

  return { items, total, page, pageSize, totalPages, query: q };
}

/** 原子递增产品浏览量（fire-and-forget，不阻塞页面渲染） */
export async function incrementProductViewCount(productId: string): Promise<void> {
  await db
    .update(products)
    .set({ viewCount: sql`${products.viewCount} + 1` })
    .where(eq(products.id, productId));
}
