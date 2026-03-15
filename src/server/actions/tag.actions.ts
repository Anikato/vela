'use server';

import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import type { TagListItem, TagWithTranslations } from '@/server/services/tag.service';
import { createTag, deleteTag, getTagList, updateTag } from '@/server/services/tag.service';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().max(100).optional(),
});

const createTagSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  translations: z.array(translationSchema).min(1),
});

const updateTagSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
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
  createLogger('tag.actions').error({ err: error }, 'Tag action error');
  return { success: false, error: 'An unexpected error occurred' };
}

async function ensureAuthed(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

export async function getTagListAction(
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<TagListItem[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  try {
    const data = await getTagList(locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createTagAction(
  input: z.input<typeof createTagSchema>,
): Promise<ActionResult<TagWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createTag(parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTagAction(
  id: string,
  input: z.input<typeof updateTagSchema>,
): Promise<ActionResult<TagWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid tag id' };
  }

  const parsed = updateTagSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updateTag(parsedId.data, parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid tag id' };
  }

  try {
    await deleteTag(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
