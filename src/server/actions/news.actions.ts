'use server';

import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import {
  createNews,
  deleteNews,
  getNewsList,
  NEWS_STATUSES,
  updateNews,
  type NewsListItem,
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
});

// ─── Actions ───

/** 后台：新闻列表 */
export async function getNewsListAction(
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<NewsListItem[]>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  try {
    const items = await getNewsList(locale, defaultLocale);
    return { success: true, data: items };
  } catch {
    return { success: false, error: 'Failed to load news' };
  }
}

/** 后台：创建新闻 */
export async function createNewsAction(
  input: z.infer<typeof createNewsSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const parsed = createNewsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const result = await createNews(parsed.data);
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
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { success: false, error: 'Invalid news id' };

  const parsed = updateNewsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    await updateNews(parsedId.data, parsed.data);
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
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) return { success: false, error: 'Invalid news id' };

  try {
    await deleteNews(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof NotFoundError) return { success: false, error: 'News not found' };
    return { success: false, error: 'Failed to delete news' };
  }
}
