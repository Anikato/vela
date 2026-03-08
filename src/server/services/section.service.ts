import { and, asc, eq, inArray, isNull } from 'drizzle-orm';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import {
  pageTranslations,
  pages,
  sectionTranslations,
  sections,
} from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';
import {
  getPublishedProductsForShowcase,
  type PublicProductCardItem,
} from '@/server/services/product-public.service';
import {
  getCategoriesForShowcase,
  type PublicCategoryCardItem,
} from '@/server/services/category-public.service';

export type Section = typeof sections.$inferSelect;
export type SectionTranslation = typeof sectionTranslations.$inferSelect;

export interface SectionWithTranslations extends Section {
  translations: SectionTranslation[];
}

export interface SectionListItem extends SectionWithTranslations {
  displayTitle: string;
}

export interface RenderSectionItem {
  id: string;
  iconName: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  config: Record<string, unknown>;
  translation: {
    title: string | null;
    description: string | null;
    content: string | null;
  };
}

export interface RenderSection {
  id: string;
  type: string;
  config: Record<string, unknown>;
  isActive: boolean;
  anchorId: string | null;
  cssClass: string | null;
  translation: {
    title: string | null;
    subtitle: string | null;
    content: string | null;
    buttonText: string | null;
    buttonLink: string | null;
    secondaryButtonText: string | null;
    secondaryButtonLink: string | null;
  };
  items: RenderSectionItem[];
  data?: {
    products?: PublicProductCardItem[];
    categories?: PublicCategoryCardItem[];
  };
}

export interface SectionTranslationInput {
  locale: string;
  title?: string;
  subtitle?: string;
  content?: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export interface CreateSectionInput {
  pageId: string;
  type: string;
  placement?: 'main' | 'top' | 'bottom';
  config?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
  anchorId?: string | null;
  cssClass?: string | null;
  translations: SectionTranslationInput[];
}

export type UpdateSectionInput = Partial<
  Omit<CreateSectionInput, 'pageId' | 'translations'>
> & {
  translations?: SectionTranslationInput[];
};

async function ensurePageExists(pageId: string): Promise<void> {
  const [page] = await db.select({ id: pages.id }).from(pages).where(eq(pages.id, pageId));
  if (!page) {
    throw new NotFoundError('Page', pageId);
  }
}

function ensureValidType(type: string): void {
  const normalized = type.trim();
  if (!normalized) {
    throw new ValidationError('Section type is required');
  }
}

async function upsertSectionTranslations(
  sectionId: string,
  translationsInput: SectionTranslationInput[],
): Promise<void> {
  for (const translation of translationsInput) {
    const locale = translation.locale.trim();
    if (!locale) continue;

    const values = {
      title: translation.title?.trim() || null,
      subtitle: translation.subtitle?.trim() || null,
      content: translation.content?.trim() || null,
      buttonText: translation.buttonText?.trim() || null,
      buttonLink: translation.buttonLink?.trim() || null,
      secondaryButtonText: translation.secondaryButtonText?.trim() || null,
      secondaryButtonLink: translation.secondaryButtonLink?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(sectionTranslations)
      .where(
        and(
          eq(sectionTranslations.sectionId, sectionId),
          eq(sectionTranslations.locale, locale),
        ),
      );

    if (existing) {
      await db
        .update(sectionTranslations)
        .set(values)
        .where(eq(sectionTranslations.id, existing.id));
      continue;
    }

    await db.insert(sectionTranslations).values({
      sectionId,
      locale,
      ...values,
    });
  }
}

export async function getPageSections(
  pageId: string,
  locale: string,
  defaultLocale: string,
): Promise<SectionListItem[]> {
  await ensurePageExists(pageId);

  const rows = await db.query.sections.findMany({
    where: and(eq(sections.pageId, pageId), eq(sections.placement, 'main')),
    with: {
      translations: true,
    },
    orderBy: [asc(sections.sortOrder), asc(sections.createdAt)],
  });

  return rows.map((item) => {
    const display = getTranslation(item.translations, locale, defaultLocale);
    return {
      ...item,
      displayTitle: display?.title ?? `(${item.type})`,
    };
  });
}

export async function getSectionById(id: string): Promise<SectionWithTranslations> {
  const section = await db.query.sections.findFirst({
    where: eq(sections.id, id),
    with: { translations: true },
  });

  if (!section) {
    throw new NotFoundError('Section', id);
  }

  return section;
}

export async function createSection(input: CreateSectionInput): Promise<SectionWithTranslations> {
  await ensurePageExists(input.pageId);
  ensureValidType(input.type);

  let nextSortOrder = input.sortOrder;
  if (nextSortOrder === undefined) {
    const existing = await db
      .select({ id: sections.id })
      .from(sections)
      .where(and(eq(sections.pageId, input.pageId), eq(sections.placement, 'main')));
    nextSortOrder = existing.length;
  }

  const [created] = await db
    .insert(sections)
    .values({
      pageId: input.pageId,
      placement: input.placement ?? 'main',
      type: input.type.trim(),
      config: input.config ?? {},
      sortOrder: nextSortOrder,
      isActive: input.isActive ?? true,
      anchorId: input.anchorId?.trim() || null,
      cssClass: input.cssClass?.trim() || null,
    })
    .returning();

  await upsertSectionTranslations(created.id, input.translations);
  return getSectionById(created.id);
}

export async function updateSection(id: string, input: UpdateSectionInput): Promise<SectionWithTranslations> {
  const existing = await getSectionById(id);

  if (input.type !== undefined) {
    ensureValidType(input.type);
  }

  await db
    .update(sections)
    .set({
      type: input.type?.trim() || existing.type,
      config: input.config ?? existing.config,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      isActive: input.isActive ?? existing.isActive,
      anchorId: input.anchorId === undefined ? existing.anchorId : input.anchorId?.trim() || null,
      cssClass: input.cssClass === undefined ? existing.cssClass : input.cssClass?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(sections.id, id));

  if (input.translations) {
    await upsertSectionTranslations(id, input.translations);
  }

  return getSectionById(id);
}

export async function deleteSection(id: string): Promise<void> {
  const existing = await getSectionById(id);

  await db.delete(sections).where(eq(sections.id, id));

  const pageCondition = existing.pageId ? eq(sections.pageId, existing.pageId) : isNull(sections.pageId);

  const siblings = await db
    .select({ id: sections.id })
    .from(sections)
    .where(
      and(pageCondition, eq(sections.placement, existing.placement)),
    )
    .orderBy(asc(sections.sortOrder), asc(sections.createdAt));

  for (let index = 0; index < siblings.length; index++) {
    await db
      .update(sections)
      .set({ sortOrder: index, updatedAt: new Date() })
      .where(eq(sections.id, siblings[index].id));
  }
}

export async function reorderPageSections(pageId: string, orderedSectionIds: string[]): Promise<void> {
  await ensurePageExists(pageId);

  if (orderedSectionIds.length === 0) return;

  const existing = await db
    .select({ id: sections.id, pageId: sections.pageId })
    .from(sections)
    .where(inArray(sections.id, orderedSectionIds));

  if (existing.length !== orderedSectionIds.length) {
    throw new ValidationError('Some sections do not exist');
  }

  if (existing.some((item) => item.pageId !== pageId)) {
    throw new ValidationError('All sections must belong to the same page');
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedSectionIds.length; index++) {
      await tx
        .update(sections)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(sections.id, orderedSectionIds[index]));
    }
  });
}

export async function getPublishedHomepagePageId(): Promise<string | null> {
  const [homepage] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(and(eq(pages.isHomepage, true), eq(pages.status, 'published')));

  if (homepage) return homepage.id;

  const [fallback] = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.status, 'published'))
    .orderBy(asc(pages.createdAt));

  return fallback?.id ?? null;
}

export async function getPublishedHomepageMeta(
  locale: string,
  defaultLocale: string,
): Promise<{ title: string | null; description: string | null }> {
  const pageId = await getPublishedHomepagePageId();
  if (!pageId) return { title: null, description: null };

  const trs = await db
    .select()
    .from(pageTranslations)
    .where(eq(pageTranslations.pageId, pageId));

  const translated = getTranslation(trs, locale, defaultLocale);
  return {
    title: typeof translated?.seoTitle === 'string' ? translated.seoTitle : null,
    description:
      typeof translated?.seoDescription === 'string' ? translated.seoDescription : null,
  };
}

export async function getPageSectionsForRender(
  pageId: string,
  locale: string,
  defaultLocale: string,
): Promise<RenderSection[]> {
  const rows = await db.query.sections.findMany({
    where: and(
      eq(sections.pageId, pageId),
      eq(sections.placement, 'main'),
      eq(sections.isActive, true),
    ),
    with: {
      translations: true,
      items: {
        with: {
          translations: true,
          image: true,
        },
      },
    },
    orderBy: [asc(sections.sortOrder), asc(sections.createdAt)],
  });

  const storage = getStorageAdapter();
  const productShowcaseQueryKeyBySectionId = new Map<string, string>();
  const productShowcaseSectionIds: string[] = [];
  const showcaseQueryByKey = new Map<
    string,
    { limit: number; categorySlug?: string; tagSlug?: string }
  >();

  for (const row of rows) {
    if (row.type !== 'product_showcase') continue;
    const rowConfig = row.config ?? {};
    const limitRaw = rowConfig.limit;
    const limit =
      typeof limitRaw === 'number' && Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(24, Math.floor(limitRaw)))
        : 6;
    const categorySlugRaw = rowConfig.category_slug;
    const tagSlugRaw = rowConfig.tag_slug;
    const categorySlug =
      typeof categorySlugRaw === 'string' && categorySlugRaw.trim()
        ? categorySlugRaw.trim().toLowerCase()
        : undefined;
    const tagSlug =
      typeof tagSlugRaw === 'string' && tagSlugRaw.trim()
        ? tagSlugRaw.trim().toLowerCase()
        : undefined;

    const key = `${limit}|${categorySlug ?? ''}|${tagSlug ?? ''}`;
    productShowcaseSectionIds.push(row.id);
    productShowcaseQueryKeyBySectionId.set(row.id, key);
    if (!showcaseQueryByKey.has(key)) {
      showcaseQueryByKey.set(key, { limit, categorySlug, tagSlug });
    }
  }

  const showcaseDataByKey = new Map<string, PublicProductCardItem[]>();
  for (const sectionId of productShowcaseSectionIds) {
    const queryKey = productShowcaseQueryKeyBySectionId.get(sectionId);
    if (!queryKey || showcaseDataByKey.has(queryKey)) {
      continue;
    }
    const query = showcaseQueryByKey.get(queryKey);
    if (!query) continue;
    const products = await getPublishedProductsForShowcase(locale, defaultLocale, query);
    showcaseDataByKey.set(queryKey, products);
  }

  const hasCategoryNav = rows.some((r) => r.type === 'category_nav');
  let categoryNavData: PublicCategoryCardItem[] | undefined;
  if (hasCategoryNav) {
    const limitRaw = rows.find((r) => r.type === 'category_nav')?.config?.limit;
    const limit = typeof limitRaw === 'number' && Number.isFinite(limitRaw)
      ? Math.max(1, Math.min(50, Math.floor(limitRaw)))
      : 20;
    categoryNavData = await getCategoriesForShowcase(locale, defaultLocale, limit);
  }

  return rows.map((row) => {
    const translated = getTranslation(row.translations, locale, defaultLocale);
    const items = row.items
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const translatedItem = getTranslation(item.translations, locale, defaultLocale);
        return {
          id: item.id,
          iconName: item.iconName,
          imageUrl: item.image ? storage.getPublicUrl(item.image.filename) : null,
          linkUrl: item.linkUrl,
          config: item.config ?? {},
          translation: {
            title: typeof translatedItem?.title === 'string' ? translatedItem.title : null,
            description:
              typeof translatedItem?.description === 'string'
                ? translatedItem.description
                : null,
            content: typeof translatedItem?.content === 'string' ? translatedItem.content : null,
          },
        };
      });

    return {
      id: row.id,
      type: row.type,
      config: row.config ?? {},
      isActive: row.isActive,
      anchorId: row.anchorId,
      cssClass: row.cssClass,
      translation: {
        title: typeof translated?.title === 'string' ? translated.title : null,
        subtitle: typeof translated?.subtitle === 'string' ? translated.subtitle : null,
        content: typeof translated?.content === 'string' ? translated.content : null,
        buttonText: typeof translated?.buttonText === 'string' ? translated.buttonText : null,
        buttonLink: typeof translated?.buttonLink === 'string' ? translated.buttonLink : null,
        secondaryButtonText:
          typeof translated?.secondaryButtonText === 'string'
            ? translated.secondaryButtonText
            : null,
        secondaryButtonLink:
          typeof translated?.secondaryButtonLink === 'string'
            ? translated.secondaryButtonLink
            : null,
      },
      items,
      data:
        row.type === 'product_showcase'
          ? {
              products:
                showcaseDataByKey.get(productShowcaseQueryKeyBySectionId.get(row.id) ?? '') ??
                [],
            }
          : row.type === 'category_nav'
            ? { categories: categoryNavData ?? [] }
            : undefined,
    };
  });
}
