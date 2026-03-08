'use server';

import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { auth } from '@/server/auth';
import {
  createPage,
  deletePage,
  getPageList,
  updatePage,
  type PageListItem,
  type PageWithTranslations,
} from '@/server/services/page.service';
import type { ActionResult } from '@/types';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  title: z.string().max(500).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
});

const createPageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  status: z.enum(['draft', 'published']).optional(),
  isHomepage: z.boolean().optional(),
  template: z.string().max(50).nullable().optional(),
  translations: z.array(translationSchema).min(1),
});

const updatePageSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  status: z.enum(['draft', 'published']).optional(),
  isHomepage: z.boolean().optional(),
  template: z.string().max(50).nullable().optional(),
  translations: z.array(translationSchema).optional(),
});

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

function handleError(error: unknown): ActionResult<never> {
  if (error instanceof NotFoundError) return { success: false, error: error.message };
  if (error instanceof DuplicateError) return { success: false, error: error.message };
  if (error instanceof ValidationError) return { success: false, error: error.message };
  console.error('Page action error:', error);
  return { success: false, error: 'An unexpected error occurred' };
}

async function ensureAuthed(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

export async function getPageListAction(
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<PageListItem[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  try {
    const data = await getPageList(locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createPageAction(
  input: z.input<typeof createPageSchema>,
): Promise<ActionResult<PageWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createPageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createPage(parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePageAction(
  id: string,
  input: z.input<typeof updatePageSchema>,
): Promise<ActionResult<PageWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid page id' };
  }

  const parsed = updatePageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updatePage(parsedId.data, parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePageAction(id: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid page id' };
  }

  try {
    await deletePage(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
