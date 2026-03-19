'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { ensureAuth } from '@/server/actions/lib/auth';
import type {
  CategoryListItem,
  CategoryWithTranslations,
} from '@/server/services/category.service';
import {
  batchDeleteCategories,
  batchMoveCategories,
  batchToggleCategories,
  createCategory,
  deleteCategory,
  getCategoryList,
  reorderCategoryTree,
  updateCategory,
} from '@/server/services/category.service';
import type { ActionResult } from '@/types';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
});

const createCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  parentId: z.string().uuid().nullable().optional(),
  imageId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(translationSchema).min(1),
});

const updateCategorySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  parentId: z.string().uuid().nullable().optional(),
  imageId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(translationSchema).optional(),
});

const reorderCategorySchema = z.object({
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
  createLogger('category.actions').error({ err: error }, 'Category action error');
  return { success: false, error: 'An unexpected error occurred' };
}


export async function getCategoryListAction(
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<CategoryListItem[]>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const data = await getCategoryList(locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createCategoryAction(
  input: z.input<typeof createCategorySchema>,
): Promise<ActionResult<CategoryWithTranslations>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createCategory(parsed.data);
    revalidateTag('categories', 'max');
    revalidateTag('products', 'max');
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCategoryAction(
  id: string,
  input: z.input<typeof updateCategorySchema>,
): Promise<ActionResult<CategoryWithTranslations>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid category id' };
  }

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updateCategory(parsedId.data, parsed.data);
    revalidateTag('categories', 'max');
    revalidateTag('products', 'max');
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid category id' };
  }

  try {
    await deleteCategory(parsedId.data);
    revalidateTag('categories', 'max');
    revalidateTag('products', 'max');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderCategoryTreeAction(
  input: z.input<typeof reorderCategorySchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsed = reorderCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await reorderCategoryTree(parsed.data.items);
    revalidateTag('categories', 'max');
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

const batchIdsSchema = z.array(z.string().uuid()).min(1, '请至少选择一个分类');

export async function batchToggleCategoriesAction(
  ids: string[],
  isActive: boolean,
): Promise<ActionResult<{ count: number }>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsed = batchIdsSchema.safeParse(ids);
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    const count = await batchToggleCategories(parsed.data, isActive);
    revalidateTag('categories', 'max');
    revalidateTag('products', 'max');
    return { success: true, data: { count } };
  } catch (error) {
    return handleError(error);
  }
}

export async function batchDeleteCategoriesAction(
  ids: string[],
): Promise<ActionResult<{ deleted: number; skipped: string[] }>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsed = batchIdsSchema.safeParse(ids);
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    const result = await batchDeleteCategories(parsed.data);
    revalidateTag('categories', 'max');
    revalidateTag('products', 'max');
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function batchMoveCategoriesAction(
  ids: string[],
  targetParentId: string | null,
): Promise<ActionResult<{ count: number }>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsed = batchIdsSchema.safeParse(ids);
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  if (targetParentId) {
    const parsedTarget = z.string().uuid().safeParse(targetParentId);
    if (!parsedTarget.success) return { success: false, error: '无效的目标分类 ID' };
  }

  try {
    const count = await batchMoveCategories(parsed.data, targetParentId);
    revalidateTag('categories', 'max');
    revalidateTag('products', 'max');
    return { success: true, data: { count } };
  } catch (error) {
    return handleError(error);
  }
}
