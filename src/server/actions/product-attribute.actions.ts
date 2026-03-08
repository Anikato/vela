'use server';

import { z } from 'zod';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import type { ProductAttributeEditorData, ProductOption } from '@/server/services/product-attribute.service';
import {
  createAttribute,
  createAttributeGroup,
  deleteAttribute,
  deleteAttributeGroup,
  getProductAttributeEditorData,
  getProductOptions,
  moveAttributeToGroup,
  reorderAttributeGroups,
  reorderAttributes,
  updateAttribute,
  updateAttributeGroup,
} from '@/server/services/product-attribute.service';

const groupTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().max(255).optional(),
});

const attributeTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().max(255).optional(),
  value: z.string().max(500).optional(),
});

const createGroupSchema = z.object({
  productId: z.string().uuid(),
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(groupTranslationSchema).min(1),
});

const updateGroupSchema = z.object({
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(groupTranslationSchema).optional(),
});

const createAttributeSchema = z.object({
  groupId: z.string().uuid(),
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(attributeTranslationSchema).min(1),
});

const updateAttributeSchema = z.object({
  groupId: z.string().uuid().optional(),
  sortOrder: z.number().int().min(0).optional(),
  translations: z.array(attributeTranslationSchema).optional(),
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
  console.error('Product attribute action error:', error);
  return { success: false, error: 'An unexpected error occurred' };
}

async function ensureAuthed(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

export async function getProductOptionsAction(
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<ProductOption[]>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  try {
    const data = await getProductOptions(locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getProductAttributeEditorDataAction(
  productId: string,
  locale: string,
  defaultLocale: string,
): Promise<ActionResult<ProductAttributeEditorData>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(productId);
  if (!parsedId.success) return { success: false, error: 'Invalid product id' };

  try {
    const data = await getProductAttributeEditorData(parsedId.data, locale, defaultLocale);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createAttributeGroupAction(
  input: z.input<typeof createGroupSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    await createAttributeGroup(parsed.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAttributeGroupAction(
  groupId: string,
  input: z.input<typeof updateGroupSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(groupId);
  if (!parsedId.success) return { success: false, error: 'Invalid group id' };

  const parsed = updateGroupSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    await updateAttributeGroup(parsedId.data, parsed.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteAttributeGroupAction(groupId: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(groupId);
  if (!parsedId.success) return { success: false, error: 'Invalid group id' };

  try {
    await deleteAttributeGroup(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function createAttributeAction(
  input: z.input<typeof createAttributeSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsed = createAttributeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    await createAttribute(parsed.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAttributeAction(
  attributeId: string,
  input: z.input<typeof updateAttributeSchema>,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(attributeId);
  if (!parsedId.success) return { success: false, error: 'Invalid attribute id' };

  const parsed = updateAttributeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: formatZodErrors(parsed.error) };

  try {
    await updateAttribute(parsedId.data, parsed.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteAttributeAction(attributeId: string): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedId = z.string().uuid().safeParse(attributeId);
  if (!parsedId.success) return { success: false, error: 'Invalid attribute id' };

  try {
    await deleteAttribute(parsedId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderAttributeGroupsAction(
  productId: string,
  orderedGroupIds: string[],
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedProductId = z.string().uuid().safeParse(productId);
  const parsedOrder = z.array(z.string().uuid()).safeParse(orderedGroupIds);
  if (!parsedProductId.success || !parsedOrder.success) {
    return { success: false, error: 'Invalid reorder payload' };
  }

  try {
    await reorderAttributeGroups(parsedProductId.data, parsedOrder.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderAttributesAction(
  groupId: string,
  orderedAttributeIds: string[],
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedGroupId = z.string().uuid().safeParse(groupId);
  const parsedOrder = z.array(z.string().uuid()).safeParse(orderedAttributeIds);
  if (!parsedGroupId.success || !parsedOrder.success) {
    return { success: false, error: 'Invalid reorder payload' };
  }

  try {
    await reorderAttributes(parsedGroupId.data, parsedOrder.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function moveAttributeToGroupAction(
  attributeId: string,
  targetGroupId: string,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuthed();
  if (unauthed) return unauthed;

  const parsedAttributeId = z.string().uuid().safeParse(attributeId);
  const parsedTargetGroupId = z.string().uuid().safeParse(targetGroupId);
  if (!parsedAttributeId.success || !parsedTargetGroupId.success) {
    return { success: false, error: 'Invalid move payload' };
  }

  try {
    await moveAttributeToGroup(parsedAttributeId.data, parsedTargetGroupId.data);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
