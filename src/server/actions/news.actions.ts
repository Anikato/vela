'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import type { ActionResult } from '@/types';
import { ensureAuth } from '@/server/actions/lib/auth';
import {
  cloneNews,
  createNews,
  deleteNews,
  getNewsById,
  getNewsListPaginated,
  NEWS_STATUSES,
  updateNews,
  type AdminNewsListParams,
  type AdminNewsListResult,
  type NewsDetail,
} from '@/server/services/news.service';

// ─── Schemas ───

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  title: z.string().max(500).optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().optional(),
});

const newsStatusSchema = z.enum(NEWS_STATUSES);

const createNewsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  status: newsStatusSchema.optional(),
  coverImageId: z.string().uuid().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  translations: z.array(translationSchema).min(1),
  tagIds: z.array(z.string().uuid()).optional(),
});

const updateNewsSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  status: newsStatusSchema.optional(),
  coverImageId: z.string().uuid().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  translations: z.array(translationSchema).min(1).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

// ─── Actions ───

/** 后台：新闻列表（分页） */
export async function getNewsListAction(
  params: Omit<AdminNewsListParams, 'locale' | 'defaultLocale'> & { locale: string; defaultLocale: string },
): Promise<ActionResult<AdminNewsListResult>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const result = await getNewsListPaginated(params);
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Failed to load news' };
  }
}

/** 后台：新闻详情（含所有翻译） */
export async function getNewsByIdAction(
  id: string,
): Promise<ActionResult<NewsDetail>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { success: false, error: 'Invalid news id' };

  try {
    const detail = await getNewsById(parsedId.data);
    return { success: true, data: detail };
  } catch (error) {
    if (error instanceof NotFoundError) return { success: false, error: 'News not found' };
    return { success: false, error: 'Failed to load news detail' };
  }
}

/** 后台：创建新闻 */
export async function createNewsAction(
  input: z.infer<typeof createNewsSchema>,
): Promise<ActionResult<{ id: string }>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsed = createNewsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const result = await createNews(parsed.data);
    revalidateTag('news', 'max');
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof DuplicateError) return { success: false, error: error.message };
    if (error instanceof ValidationError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to create news' };
  }
}

/** 后台：更新新闻 */
export async function updateNewsAction(
  id: string,
  input: z.infer<typeof updateNewsSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { success: false, error: 'Invalid news id' };

  const parsed = updateNewsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await updateNews(parsedId.data, parsed.data);
    revalidateTag('news', 'max');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof NotFoundError) return { success: false, error: 'News not found' };
    if (error instanceof DuplicateError) return { success: false, error: error.message };
    if (error instanceof ValidationError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to update news' };
  }
}

/** 后台：删除新闻 */
export async function deleteNewsAction(id: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { success: false, error: 'Invalid news id' };

  try {
    await deleteNews(parsedId.data);
    revalidateTag('news', 'max');
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof NotFoundError) return { success: false, error: 'News not found' };
    return { success: false, error: 'Failed to delete news' };
  }
}

/** 后台：克隆新闻 */
export async function cloneNewsAction(
  sourceId: string,
  newSlug: string,
): Promise<ActionResult<{ id: string }>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(sourceId);
  if (!parsedId.success) return { success: false, error: 'Invalid news id' };

  if (!newSlug.trim()) return { success: false, error: 'Slug 不能为空' };

  try {
    const data = await cloneNews(parsedId.data, newSlug.trim().toLowerCase());
    revalidateTag('news', 'max');
    return { success: true, data };
  } catch (error) {
    if (error instanceof NotFoundError) return { success: false, error: 'News not found' };
    if (error instanceof DuplicateError) return { success: false, error: error.message };
    return { success: false, error: 'Failed to clone news' };
  }
}
