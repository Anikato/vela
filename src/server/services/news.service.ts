import { and, count, desc, eq, max } from 'drizzle-orm';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { media, news, newsTags, newsTranslations } from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';

// ─── Types ───

export const NEWS_STATUSES = ['draft', 'published'] as const;
export type NewsStatus = (typeof NEWS_STATUSES)[number];

export interface NewsTranslationInput {
  locale: string;
  title?: string;
  summary?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CreateNewsInput {
  slug: string;
  status?: NewsStatus;
  coverImageId?: string | null;
  publishedAt?: string | null;
  translations: NewsTranslationInput[];
  tagIds?: string[];
}

export interface UpdateNewsInput {
  slug?: string;
  status?: NewsStatus;
  coverImageId?: string | null;
  publishedAt?: string | null;
  translations?: NewsTranslationInput[];
  tagIds?: string[];
}

export interface NewsListItem {
  id: string;
  slug: string;
  status: string;
  coverImage: { id: string; url: string; alt: string | null } | null;
  publishedAt: Date | null;
  title: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminNewsListParams {
  locale: string;
  defaultLocale: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: NewsStatus | 'all';
}

export interface AdminNewsListResult {
  items: NewsListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NewsDetail {
  id: string;
  slug: string;
  status: string;
  coverImageId: string | null;
  publishedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  tagIds: string[];
  translations: Array<{
    id: string;
    locale: string;
    title: string | null;
    summary: string | null;
    content: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  }>;
}

// ─── Admin Service ───

/** 后台：新闻列表（分页 + 搜索 + 筛选） */
export async function getNewsListPaginated(
  params: AdminNewsListParams,
): Promise<AdminNewsListResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.max(1, Math.min(50, Math.floor(params.pageSize ?? 20)));
  const storage = getStorageAdapter();

  const conditions = [];
  if (params.status && params.status !== 'all') {
    conditions.push(eq(news.status, params.status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(news).where(where);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const rows = await db.query.news.findMany({
    where,
    with: { coverImage: true, translations: true },
    orderBy: [desc(news.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  let items: NewsListItem[] = rows.map((row) => {
    const t = getTranslation(row.translations, params.locale, params.defaultLocale);
    return {
      id: row.id,
      slug: row.slug,
      status: row.status,
      coverImage: row.coverImage
        ? { id: row.coverImage.id, url: storage.getPublicUrl(row.coverImage.filename), alt: row.coverImage.alt }
        : null,
      publishedAt: row.publishedAt,
      title: t?.title ?? row.slug,
      summary: t?.summary ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.summary?.toLowerCase().includes(q) ?? false),
    );
  }

  return { items, total, page, pageSize, totalPages };
}

/** 后台：新闻列表（兼容旧调用，无分页） */
export async function getNewsList(
  locale: string,
  defaultLocale: string,
): Promise<NewsListItem[]> {
  const result = await getNewsListPaginated({ locale, defaultLocale, page: 1, pageSize: 9999 });
  return result.items;
}

/** 后台：新闻详情（含所有翻译 + 标签） */
export async function getNewsById(id: string): Promise<NewsDetail> {
  const row = await db.query.news.findFirst({
    where: eq(news.id, id),
    with: { translations: true, newsTags: true },
  });

  if (!row) throw new NotFoundError('News', id);

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    coverImageId: row.coverImageId,
    publishedAt: row.publishedAt,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tagIds: row.newsTags.map((nt) => nt.tagId),
    translations: row.translations.map((t) => ({
      id: t.id,
      locale: t.locale,
      title: t.title,
      summary: t.summary,
      content: t.content,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
    })),
  };
}

/** 后台：创建新闻 */
export async function createNews(input: CreateNewsInput): Promise<{ id: string }> {
  if (!input.slug?.trim()) throw new ValidationError('Slug is required');
  if (!input.translations?.length) throw new ValidationError('At least one translation is required');

  const existing = await db.query.news.findFirst({
    where: eq(news.slug, input.slug),
  });
  if (existing) throw new DuplicateError('News', 'slug', input.slug);

  const [{ maxOrder }] = await db
    .select({ maxOrder: max(news.sortOrder) })
    .from(news);

  return db.transaction(async (tx) => {
    const shouldPublish = input.status === 'published';

    const [created] = await tx
      .insert(news)
      .values({
        slug: input.slug.trim(),
        status: input.status ?? 'draft',
        coverImageId: input.coverImageId ?? null,
        publishedAt: shouldPublish
          ? (input.publishedAt ? new Date(input.publishedAt) : new Date())
          : (input.publishedAt ? new Date(input.publishedAt) : null),
        sortOrder: (maxOrder ?? 0) + 1,
      })
      .returning({ id: news.id });

    if (input.translations.length > 0) {
      await tx.insert(newsTranslations).values(
        input.translations.map((t) => ({
          newsId: created.id,
          locale: t.locale,
          title: t.title ?? null,
          summary: t.summary ?? null,
          content: t.content ?? null,
          seoTitle: t.seoTitle ?? null,
          seoDescription: t.seoDescription ?? null,
        })),
      );
    }

    if (input.tagIds && input.tagIds.length > 0) {
      await tx.insert(newsTags).values(
        input.tagIds.map((tagId) => ({ newsId: created.id, tagId })),
      );
    }

    return { id: created.id };
  });
}

/** 后台：更新新闻 */
export async function updateNews(id: string, input: UpdateNewsInput): Promise<void> {
  const existing = await db.query.news.findFirst({ where: eq(news.id, id) });
  if (!existing) throw new NotFoundError('News', id);

  if (input.slug && input.slug !== existing.slug) {
    const duplicate = await db.query.news.findFirst({
      where: and(eq(news.slug, input.slug)),
    });
    if (duplicate && duplicate.id !== id) {
      throw new DuplicateError('News', 'slug', input.slug);
    }
  }

  await db.transaction(async (tx) => {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.slug !== undefined) updateData.slug = input.slug.trim();
    if (input.status !== undefined) updateData.status = input.status;
    if (input.coverImageId !== undefined) updateData.coverImageId = input.coverImageId;
    if (input.publishedAt !== undefined) {
      updateData.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
    }
    if (input.status === 'published' && !existing.publishedAt && input.publishedAt === undefined) {
      updateData.publishedAt = new Date();
    }

    await tx.update(news).set(updateData).where(eq(news.id, id));

    if (input.translations) {
      await tx.delete(newsTranslations).where(eq(newsTranslations.newsId, id));
      if (input.translations.length > 0) {
        await tx.insert(newsTranslations).values(
          input.translations.map((t) => ({
            newsId: id,
            locale: t.locale,
            title: t.title ?? null,
            summary: t.summary ?? null,
            content: t.content ?? null,
            seoTitle: t.seoTitle ?? null,
            seoDescription: t.seoDescription ?? null,
          })),
        );
      }
    }

    if (input.tagIds !== undefined) {
      await tx.delete(newsTags).where(eq(newsTags.newsId, id));
      if (input.tagIds.length > 0) {
        await tx.insert(newsTags).values(
          input.tagIds.map((tagId) => ({ newsId: id, tagId })),
        );
      }
    }
  });
}

/** 后台：删除新闻 */
export async function deleteNews(id: string): Promise<void> {
  const existing = await db.query.news.findFirst({ where: eq(news.id, id) });
  if (!existing) throw new NotFoundError('News', id);
  await db.delete(news).where(eq(news.id, id));
}

export async function cloneNews(
  sourceId: string,
  newSlug: string,
): Promise<{ id: string }> {
  const source = await db.query.news.findFirst({
    where: eq(news.id, sourceId),
    with: { translations: true },
  });
  if (!source) throw new NotFoundError('News', sourceId);

  const existing = await db.query.news.findFirst({ where: eq(news.slug, newSlug) });
  if (existing) throw new DuplicateError('News', 'slug', newSlug);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(news)
      .values({
        slug: newSlug,
        coverImageId: source.coverImageId,
        status: 'draft',
        sortOrder: source.sortOrder,
      })
      .returning({ id: news.id });

    if (source.translations.length > 0) {
      await tx.insert(newsTranslations).values(
        source.translations.map((t) => ({
          newsId: created.id,
          locale: t.locale,
          title: t.title ? `${t.title} (副本)` : null,
          summary: t.summary,
          content: t.content,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
        })),
      );
    }

    return { id: created.id };
  });
}

// ─── Public Service (前台) ───

export interface PublicNewsListItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImage: { url: string; alt: string | null; focalX: number; focalY: number } | null;
  publishedAt: Date | null;
}

export interface PublicNewsListResult {
  items: PublicNewsListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicNewsDetail {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  coverImage: { url: string; alt: string | null; focalX: number; focalY: number } | null;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

/** 前台：已发布新闻列表（分页） */
export async function getPublishedNewsList(
  locale: string,
  defaultLocale: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<PublicNewsListResult> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.max(1, Math.min(50, Math.floor(options.pageSize ?? 12)));

  const storage = getStorageAdapter();

  const [{ total }] = await db
    .select({ total: count() })
    .from(news)
    .where(eq(news.status, 'published'));

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const offset = (page - 1) * pageSize;

  const rows = await db.query.news.findMany({
    where: eq(news.status, 'published'),
    with: {
      coverImage: true,
      translations: true,
    },
    orderBy: [desc(news.publishedAt), desc(news.createdAt)],
    limit: pageSize,
    offset,
  });

  const items: PublicNewsListItem[] = rows.map((row) => {
    const t = getTranslation(row.translations, locale, defaultLocale);
    return {
      id: row.id,
      slug: row.slug,
      title: t?.title ?? row.slug,
      summary: t?.summary ?? null,
      coverImage: row.coverImage
        ? {
            url: storage.getPublicUrl(row.coverImage.filename),
            alt: row.coverImage.alt,
            focalX: row.coverImage.focalX,
            focalY: row.coverImage.focalY,
          }
        : null,
      publishedAt: row.publishedAt,
    };
  });

  return { items, total, page, pageSize, totalPages };
}

/** 前台：最新新闻展示（用于区块系统 news_showcase） */
export interface PublicNewsShowcaseItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImage: { url: string; alt: string | null; focalX: number; focalY: number } | null;
  publishedAt: string | null;
}

export async function getPublishedNewsForShowcase(
  locale: string,
  defaultLocale: string,
  limit: number = 6,
): Promise<PublicNewsShowcaseItem[]> {
  const storage = getStorageAdapter();

  const rows = await db.query.news.findMany({
    where: eq(news.status, 'published'),
    with: {
      coverImage: true,
      translations: true,
    },
    orderBy: [desc(news.publishedAt), desc(news.createdAt)],
    limit: Math.max(1, Math.min(24, limit)),
  });

  return rows.map((row) => {
    const t = getTranslation(row.translations, locale, defaultLocale);
    return {
      id: row.id,
      slug: row.slug,
      title: t?.title ?? row.slug,
      summary: t?.summary ?? null,
      coverImage: row.coverImage
        ? {
            url: storage.getPublicUrl(row.coverImage.filename),
            alt: row.coverImage.alt,
            focalX: row.coverImage.focalX,
            focalY: row.coverImage.focalY,
          }
        : null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    };
  });
}

/** 前台：已发布新闻详情（按 slug） */
export async function getPublishedNewsBySlug(
  slug: string,
  locale: string,
  defaultLocale: string,
): Promise<PublicNewsDetail | null> {
  const storage = getStorageAdapter();

  const row = await db.query.news.findFirst({
    where: and(eq(news.slug, slug), eq(news.status, 'published')),
    with: {
      coverImage: true,
      translations: true,
    },
  });

  if (!row) return null;

  const t = getTranslation(row.translations, locale, defaultLocale);

  return {
    id: row.id,
    slug: row.slug,
    title: t?.title ?? row.slug,
    summary: t?.summary ?? null,
    content: t?.content ?? null,
    coverImage: row.coverImage
      ? {
          url: storage.getPublicUrl(row.coverImage.filename),
          alt: row.coverImage.alt,
          focalX: row.coverImage.focalX,
          focalY: row.coverImage.focalY,
        }
      : null,
    publishedAt: row.publishedAt,
    seoTitle: t?.seoTitle ?? null,
    seoDescription: t?.seoDescription ?? null,
  };
}
