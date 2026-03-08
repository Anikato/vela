'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { auth } from '@/server/auth';
import {
  createNavigationItem,
  deleteNavigationItem,
  getNavigationList,
  reorderNavigationTree,
  updateNavigationItem,
  type NavigationListItem,
  type NavigationWithTranslations,
} from '@/server/services/navigation.service';
import type { ActionResult } from '@/types';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  label: z.string().max(200).optional(),
});

const createNavigationSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(['internal', 'external', 'category', 'page']),
  url: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  pageId: z.string().uuid().nullable().optional(),
  showChildren: z.boolean().optional(),
  icon: z.string().max(100).nullable().optional(),
  openNewTab: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  translations: z.array(translationSchema).min(1),
});

const updateNavigationSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(['internal', 'external', 'category', 'page']).optional(),
  url: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  pageId: z.string().uuid().nullable().optional(),
  showChildren: z.boolean().optional(),
  icon: z.string().max(100).nullable().optional(),
  openNewTab: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  translations: z.array(translationSchema).optional(),
});

const reorderNavigationSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      parentId: z.string().uuid().nullable(),
      sortOrder: z.number().int().min(0),
    }),
  ),
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
  console.error('Navigation action error:', error);
  return { success: false, error: 'An unexpected error occurred' };
}

async function ensureAuthed(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

export async function getNavigationListAction(
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<NavigationListItem[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  try {
    const data = await getNavigationList(locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createNavigationItemAction(
  input: z.input<typeof createNavigationSchema>,
): Promise<ActionResult<NavigationWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createNavigationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createNavigationItem(parsed.data);
    revalidateTag('navigation', 'max');
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateNavigationItemAction(
  id: string,
  input: z.input<typeof updateNavigationSchema>,
): Promise<ActionResult<NavigationWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid navigation item id' };
  }

  const parsed = updateNavigationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updateNavigationItem(parsedId.data, parsed.data);
    revalidateTag('navigation', 'max');
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteNavigationItemAction(id: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid navigation item id' };
  }

  try {
    await deleteNavigationItem(parsedId.data);
    revalidateTag('navigation', 'max');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderNavigationTreeAction(
  input: z.input<typeof reorderNavigationSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = reorderNavigationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await reorderNavigationTree(parsed.data.items);
    revalidateTag('navigation', 'max');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
