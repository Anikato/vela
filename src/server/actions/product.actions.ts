'use server';

import { z } from 'zod';

import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
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

const videoLinkSchema = z.preprocess(
  (val) => {
    if (!Array.isArray(val)) return val;
    return val.filter((v) => typeof v === 'string' && v.trim().length > 0);
  },
  z.array(z.string().url('视频链接格式无效')).optional(),
);

const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU 不能为空').max(100),
  slug: z
    .string()
    .min(1, 'Slug 不能为空')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug 只能包含小写字母、数字和连字符'),
  primaryCategoryId: z.string().uuid('请选择主分类'),
  status: productStatusSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  featuredImageId: z.string().uuid().nullable().optional(),
  videoLinks: videoLinkSchema,
  moq: z.number().int().min(0).nullable().optional(),
  leadTimeDays: z.number().int().min(0).nullable().optional(),
  tradeTerms: z.string().max(50).nullable().optional(),
  paymentTerms: z.string().max(255).nullable().optional(),
  packagingDetails: z.string().nullable().optional(),
  customizationSupport: z.boolean().optional(),
  translations: z.array(translationSchema).min(1, '至少需要一个语言翻译'),
  additionalCategoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  galleryImageIds: z.array(z.string().uuid()).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

const updateProductSchema = z.object({
  sku: z.string().min(1, 'SKU 不能为空').max(100).optional(),
  slug: z
    .string()
    .min(1, 'Slug 不能为空')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug 只能包含小写字母、数字和连字符')
    .optional(),
  primaryCategoryId: z.string().uuid().optional(),
  status: productStatusSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  featuredImageId: z.string().uuid().nullable().optional(),
  videoLinks: videoLinkSchema,
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

function formatZodErrors(error: z.ZodError): string {
  const messages: string[] = [];
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    messages.push(path ? `${path}: ${issue.message}` : issue.message);
  }
  return messages.length > 0 ? messages.join('；') : '输入数据校验失败';
}

function handleError(error: unknown): ActionResult<never> {
  if (error instanceof NotFoundError) return { success: false, error: error.message };
  if (error instanceof DuplicateError) return { success: false, error: error.message };
  if (error instanceof ValidationError) return { success: false, error: error.message };

  createLogger('product.actions').error({ err: error }, 'Product action error');

  const msg = error instanceof Error ? error.message : '';
  if (msg.includes('foreign key') || msg.includes('violates')) {
    return { success: false, error: '操作失败：数据被其他记录引用，请检查关联内容' };
  }
  if (msg.includes('unique') || msg.includes('duplicate')) {
    return { success: false, error: '操作失败：SKU 或 Slug 已存在' };
  }

  return { success: false, error: msg ? `操作失败：${msg}` : '操作失败，请重试或联系管理员' };
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
