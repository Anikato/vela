'use server';

import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import {
  batchDeleteProducts,
  batchUpdateProductStatus,
  cloneProduct,
  createProduct,
  deleteProduct,
  getProductList,
  PRODUCT_STATUSES,
  type ProductListItem,
  type ProductWithRelations,
  updateProduct,
} from '@/server/services/product.service';

const translationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().max(500).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().optional(),
});

const productStatusSchema = z.enum(PRODUCT_STATUSES);

const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
  primaryCategoryId: z.string().uuid(),
  status: productStatusSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  featuredImageId: z.string().uuid().nullable().optional(),
  videoLinks: z.array(z.string().url()).optional(),
  moq: z.number().int().min(0).nullable().optional(),
  leadTimeDays: z.number().int().min(0).nullable().optional(),
  tradeTerms: z.string().max(50).nullable().optional(),
  paymentTerms: z.string().max(255).nullable().optional(),
  packagingDetails: z.string().nullable().optional(),
  customizationSupport: z.boolean().optional(),
  translations: z.array(translationSchema).min(1),
  additionalCategoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  galleryImageIds: z.array(z.string().uuid()).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

const updateProductSchema = z.object({
  sku: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
    .optional(),
  primaryCategoryId: z.string().uuid().optional(),
  status: productStatusSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  featuredImageId: z.string().uuid().nullable().optional(),
  videoLinks: z.array(z.string().url()).optional(),
  moq: z.number().int().min(0).nullable().optional(),
  leadTimeDays: z.number().int().min(0).nullable().optional(),
  tradeTerms: z.string().max(50).nullable().optional(),
  paymentTerms: z.string().max(255).nullable().optional(),
  packagingDetails: z.string().nullable().optional(),
  customizationSupport: z.boolean().optional(),
  translations: z.array(translationSchema).optional(),
  additionalCategoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  galleryImageIds: z.array(z.string().uuid()).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
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
  console.error('Product action error:', error);
  return { success: false, error: 'An unexpected error occurred' };
}

async function ensureAuthed(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

export async function getProductListAction(
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<ProductListItem[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  try {
    const data = await getProductList(locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createProductAction(
  input: z.input<typeof createProductSchema>,
): Promise<ActionResult<ProductWithRelations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createProduct(parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateProductAction(
  id: string,
  input: z.input<typeof updateProductSchema>,
): Promise<ActionResult<ProductWithRelations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid product id' };
  }

  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updateProduct(parsedId.data, parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid product id' };
  }

  try {
    await deleteProduct(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function batchUpdateProductStatusAction(
  ids: string[],
  status: string,
): Promise<ActionResult<{ count: number }>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedIds = z.array(z.string().uuid()).safeParse(ids);
  if (!parsedIds.success) return { success: false, error: 'Invalid product ids' };

  const parsedStatus = productStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { success: false, error: 'Invalid status' };

  try {
    const count = await batchUpdateProductStatus(parsedIds.data, parsedStatus.data);
    return { success: true, data: { count } };
  } catch (error) {
    return handleError(error);
  }
}

export async function batchDeleteProductsAction(
  ids: string[],
): Promise<ActionResult<{ count: number }>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedIds = z.array(z.string().uuid()).safeParse(ids);
  if (!parsedIds.success) return { success: false, error: 'Invalid product ids' };

  try {
    const count = await batchDeleteProducts(parsedIds.data);
    return { success: true, data: { count } };
  } catch (error) {
    return handleError(error);
  }
}

export async function cloneProductAction(
  sourceId: string,
  newSku: string,
  newSlug: string,
): Promise<ActionResult<ProductWithRelations>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(sourceId);
  if (!parsedId.success) return { success: false, error: 'Invalid product id' };

  if (!newSku.trim() || !newSlug.trim()) {
    return { success: false, error: 'SKU 和 Slug 不能为空' };
  }

  try {
    const data = await cloneProduct(parsedId.data, newSku.trim(), newSlug.trim().toLowerCase());
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}
