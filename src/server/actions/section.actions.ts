'use server';

import { z } from 'zod';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { auth } from '@/server/auth';
import {
  cloneSection,
  createSection,
  deleteSection,
  getCategorySections,
  getPageSections,
  reorderCategorySections,
  reorderPageSections,
  updateSection,
  type SectionListItem,
  type SectionWithTranslations,
} from '@/server/services/section.service';
import type { ActionResult } from '@/types';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  title: z.string().max(500).optional(),
  subtitle: z.string().max(500).optional(),
  content: z.string().max(20000).optional(),
  buttonText: z.string().max(200).optional(),
  buttonLink: z.string().max(500).optional(),
  secondaryButtonText: z.string().max(200).optional(),
  secondaryButtonLink: z.string().max(500).optional(),
});

const createSectionSchema = z.object({
  pageId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.string().min(1).max(50),
  placement: z.enum(['main', 'top', 'bottom']).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  anchorId: z.string().max(100).nullable().optional(),
  cssClass: z.string().max(255).nullable().optional(),
  translations: z.array(translationSchema).min(1),
});

const updateSectionSchema = z.object({
  type: z.string().min(1).max(50).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  anchorId: z.string().max(100).nullable().optional(),
  cssClass: z.string().max(255).nullable().optional(),
  translations: z.array(translationSchema).optional(),
});

const reorderSectionsSchema = z.object({
  pageId: z.string().uuid(),
  orderedSectionIds: z.array(z.string().uuid()),
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
  if (error instanceof ValidationError) return { success: false, error: error.message };
  createLogger('section.actions').error({ err: error }, 'Section action error');
  return { success: false, error: 'An unexpected error occurred' };
}

async function ensureAuthed(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

export async function getPageSectionsAction(
  pageId: string,
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<SectionListItem[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedPageId = z.string().uuid().safeParse(pageId);
  if (!parsedPageId.success) {
    return { success: false, error: 'Invalid page id' };
  }

  try {
    const data = await getPageSections(parsedPageId.data, locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createSectionAction(
  input: z.input<typeof createSectionSchema>,
): Promise<ActionResult<SectionWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createSectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createSection(parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateSectionAction(
  sectionId: string,
  input: z.input<typeof updateSectionSchema>,
): Promise<ActionResult<SectionWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(sectionId);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid section id' };
  }

  const parsed = updateSectionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updateSection(parsedId.data, parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteSectionAction(sectionId: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(sectionId);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid section id' };
  }

  try {
    await deleteSection(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderPageSectionsAction(
  input: z.input<typeof reorderSectionsSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = reorderSectionsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await reorderPageSections(parsed.data.pageId, parsed.data.orderedSectionIds);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function cloneSectionAction(
  sectionId: string,
): Promise<ActionResult<SectionWithTranslations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(sectionId);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid section id' };
  }

  try {
    const data = await cloneSection(parsedId.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

// ─── Category section actions ───

export async function getCategorySectionsAction(
  categoryId: string,
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<SectionListItem[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(categoryId);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid category id' };
  }

  try {
    const data = await getCategorySections(parsedId.data, locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

const reorderCategorySectionsSchema = z.object({
  categoryId: z.string().uuid(),
  orderedSectionIds: z.array(z.string().uuid()),
});

export async function reorderCategorySectionsAction(
  input: z.input<typeof reorderCategorySectionsSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = reorderCategorySectionsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await reorderCategorySections(parsed.data.categoryId, parsed.data.orderedSectionIds);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
