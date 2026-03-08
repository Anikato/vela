import { and, asc, desc, eq, ne } from 'drizzle-orm';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { pageTranslations, pages } from '@/server/db/schema';

export type Page = typeof pages.$inferSelect;
export type PageTranslation = typeof pageTranslations.$inferSelect;

export interface PageWithTranslations extends Page {
  translations: PageTranslation[];
}

export interface PageListItem extends PageWithTranslations {
  displayTitle: string;
}

export interface PageTranslationInput {
  locale: string;
  title?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreatePageInput {
  slug: string;
  status?: 'draft' | 'published';
  isHomepage?: boolean;
  template?: string | null;
  translations: PageTranslationInput[];
}

export type UpdatePageInput = Partial<Omit<CreatePageInput, 'translations'>> & {
  translations?: PageTranslationInput[];
};

function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

function ensureTranslationHasTitle(translations: PageTranslationInput[]): void {
  const hasTitle = translations.some((item) => Boolean(item.title?.trim()));
  if (!hasTitle) {
    throw new ValidationError('At least one translation title is required');
  }
}

async function upsertPageTranslations(
  pageId: string,
  translationsInput: PageTranslationInput[],
): Promise<void> {
  for (const translation of translationsInput) {
    const locale = translation.locale.trim();
    if (!locale) continue;

    const values = {
      title: translation.title?.trim() || null,
      seoTitle: translation.seoTitle?.trim() || null,
      seoDescription: translation.seoDescription?.trim() || null,
    };

    const [existing] = await db
      .select()
      .from(pageTranslations)
      .where(
        and(eq(pageTranslations.pageId, pageId), eq(pageTranslations.locale, locale)),
      );

    if (existing) {
      await db
        .update(pageTranslations)
        .set(values)
        .where(eq(pageTranslations.id, existing.id));
      continue;
    }

    await db.insert(pageTranslations).values({
      pageId,
      locale,
      ...values,
    });
  }
}

async function clearHomepageFlag(excludePageId?: string): Promise<void> {
  const conditions = [eq(pages.isHomepage, true)];
  if (excludePageId) {
    conditions.push(ne(pages.id, excludePageId));
  }

  await db
    .update(pages)
    .set({ isHomepage: false, updatedAt: new Date() })
    .where(and(...conditions));
}

export async function getAllPagesWithTranslations(): Promise<PageWithTranslations[]> {
  return db.query.pages.findMany({
    with: {
      translations: true,
    },
    orderBy: [desc(pages.isHomepage), desc(pages.createdAt), asc(pages.slug)],
  });
}

export async function getPageById(id: string): Promise<PageWithTranslations> {
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, id),
    with: { translations: true },
  });

  if (!page) {
    throw new NotFoundError('Page', id);
  }

  return page;
}

export async function getPageList(locale: string, defaultLocale: string): Promise<PageListItem[]> {
  const rows = await getAllPagesWithTranslations();
  return rows.map((item) => {
    const display = getTranslation(item.translations, locale, defaultLocale);
    return {
      ...item,
      displayTitle: display?.title ?? `(${item.slug})`,
    };
  });
}

/** 前台：按 slug 获取已发布页面（含翻译） */
export async function getPublishedPageBySlug(slug: string): Promise<PageWithTranslations | null> {
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, 'published')),
    with: { translations: true },
  });
  return page ?? null;
}

export async function createPage(input: CreatePageInput): Promise<PageWithTranslations> {
  const slug = normalizeSlug(input.slug);
  if (!slug) {
    throw new ValidationError('Slug is required');
  }

  ensureTranslationHasTitle(input.translations);

  const [existing] = await db.select().from(pages).where(eq(pages.slug, slug));
  if (existing) {
    throw new DuplicateError('Page', 'slug', slug);
  }

  if (input.isHomepage) {
    await clearHomepageFlag();
  }

  const [created] = await db
    .insert(pages)
    .values({
      slug,
      status: input.status ?? 'draft',
      isHomepage: input.isHomepage ?? false,
      template: input.template?.trim() || null,
    })
    .returning();

  await upsertPageTranslations(created.id, input.translations);
  return getPageById(created.id);
}

export async function updatePage(id: string, input: UpdatePageInput): Promise<PageWithTranslations> {
  const existing = await getPageById(id);

  if (input.slug !== undefined) {
    const slug = normalizeSlug(input.slug);
    if (!slug) {
      throw new ValidationError('Slug is required');
    }
    const [duplicate] = await db.select().from(pages).where(eq(pages.slug, slug));
    if (duplicate && duplicate.id !== id) {
      throw new DuplicateError('Page', 'slug', slug);
    }
    input.slug = slug;
  }

  if (input.isHomepage === true && !existing.isHomepage) {
    await clearHomepageFlag(id);
  }

  await db
    .update(pages)
    .set({
      slug: input.slug ?? existing.slug,
      status: input.status ?? existing.status,
      isHomepage: input.isHomepage ?? existing.isHomepage,
      template:
        input.template === undefined ? existing.template : input.template?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, id));

  if (input.translations) {
    ensureTranslationHasTitle(input.translations);
    await upsertPageTranslations(id, input.translations);
  }

  return getPageById(id);
}

export async function deletePage(id: string): Promise<void> {
  const existing = await getPageById(id);
  if (existing.isHomepage) {
    throw new ValidationError('Homepage cannot be deleted. Please set another page as homepage first.');
  }

  await db.delete(pages).where(eq(pages.id, id));
}
