'use server';

import { z } from 'zod';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { auth } from '@/server/auth';
import {
  createSectionItem,
  deleteSectionItem,
  getSectionItems,
  reorderSectionItems,
  updateSectionItem,
  type SectionItemListItem,
  type SectionItemWithTranslations,
} from '@/server/services/section-item.service';
import type { ActionResult } from '@/types';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  title: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  content: z.string().max(20000).optional(),
});

const createItemSchema = z.object({
  sectionId: z.string().uuid(),
  iconName: z.string().max(100).nullable().optional(),
  imageId: z.string().uuid().nullable().optional(),
  linkUrl: z.string().max(500).nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(translationSchema).min(1),
});

const updateItemSchema = z.object({
  iconName: z.string().max(100).nullable().optional(),
  imageId: z.string().uuid().nullable().optional(),
  linkUrl: z.string().max(500).nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(translationSchema).optional(),
});

const reorderItemsSchema = z.object({
  sectionId: z.string().uuid(),
  orderedItemIds: z.array(z.string().uuid()),
});

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

async function ensureAuthed(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

function handleError(error: unknown): ActionResult<never> {
  if (error instanceof NotFoundError) {
    return { success: false, error: error.message };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }
  createLogger('section-item.actions').error({ err: error }, 'Section item action error');
  return { success: false, error: 'An unexpected error occurred' };
}

/** 后台：获取某区块的所有子项 */
export async function getSectionItemsAction(
  sectionId: string,
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<SectionItemListItem[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  try {
    const items = await getSectionItems(sectionId, locale, defaultLocale);
    return { success: true, data: items };
  } catch (error) {
    return handleError(error);
  }
}

/** 后台：创建区块子项 */
export async function createSectionItemAction(
  input: z.input<typeof createItemSchema>,
): Promise<ActionResult<SectionItemWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createSectionItem(parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 后台：更新区块子项 */
export async function updateSectionItemAction(
  itemId: string,
  input: z.input<typeof updateItemSchema>,
): Promise<ActionResult<SectionItemWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(itemId);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid item id' };
  }

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updateSectionItem(parsedId.data, parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 后台：删除区块子项 */
export async function deleteSectionItemAction(
  itemId: string,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(itemId);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid item id' };
  }

  try {
    await deleteSectionItem(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/** 后台：批量排序区块子项 */
export async function reorderSectionItemsAction(
  input: z.input<typeof reorderItemsSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = reorderItemsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await reorderSectionItems(parsed.data.sectionId, parsed.data.orderedItemIds);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
