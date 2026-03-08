import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';

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

export interface PublicProductListResult {
  items: PublicProductCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  category: PublicCategorySummary | null;
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

export async function getPublishedProductList(
  locale: string,
  defaultLocale: string,
  options: {
    categorySlug?: string;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<PublicProductListResult> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.max(1, Math.min(48, Math.floor(options.pageSize ?? 12)));

  const normalizedCategorySlug = options.categorySlug?.trim().toLowerCase();
  const category = normalizedCategorySlug
    ? await getPublicCategoryBySlug(normalizedCategorySlug, locale, defaultLocale)
    : null;

  if (normalizedCategorySlug && !category) {
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      category: null,
    };
  }

  let filteredIds: string[] | null = null;
  if (category) {
    const primaryRows = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(eq(products.status, 'published'), eq(products.primaryCategoryId, category.id)),
      );
    const additionalRows = await db
      .select({ id: productCategories.productId })
      .from(productCategories)
      .innerJoin(products, eq(productCategories.productId, products.id))
      .where(
        and(eq(productCategories.categoryId, category.id), eq(products.status, 'published')),
      );

    filteredIds = Array.from(
      new Set([
        ...primaryRows.map((item) => item.id),
        ...additionalRows.map((item) => item.id),
      ]),
    );
    if (filteredIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        category,
      };
    }
  }

  const whereCondition = filteredIds
    ? and(eq(products.status, 'published'), inArray(products.id, filteredIds))
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

  const rows = await db.query.products.findMany({
    where: whereCondition,
    with: {
      translations: true,
      primaryCategory: {
        with: {
          translations: true,
        },
      },
    },
    orderBy: [desc(products.sortOrder), desc(products.createdAt)],
    limit: pageSize,
    offset,
  });

  if (!rows.length) {
    return { items: [], total, page, pageSize, totalPages, category };
  }

  const mediaIds = rows
    .map((item) => item.featuredImageId)
    .filter((id): id is string => Boolean(id));
  const mediaRows =
    mediaIds.length > 0
      ? await db.select().from(media).where(inArray(media.id, mediaIds))
      : [];
  const mediaMap = new Map(mediaRows.map((item) => [item.id, item]));
  const storage = getStorageAdapter();

  const items: PublicProductCardItem[] = rows.map((item) => {
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

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    category,
  };
}
