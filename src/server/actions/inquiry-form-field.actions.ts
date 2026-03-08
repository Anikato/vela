'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { NotFoundError } from '@/lib/errors';
import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import {
  createFormField,
  deleteFormField,
  FIELD_TYPES,
  getFormFields,
  reorderFormFields,
  updateFormField,
  type FormFieldItem,
} from '@/server/services/inquiry-form-field.service';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error('未授权');
}

const translationSchema = z.object({
  locale: z.string().min(1).max(10),
  label: z.string().max(200),
  placeholder: z.string().max(200).optional(),
  helpText: z.string().max(500).optional(),
});

const createSchema = z.object({
  fieldType: z.enum(FIELD_TYPES),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  translations: z.array(translationSchema).min(1),
});

const updateSchema = z.object({
  fieldType: z.enum(FIELD_TYPES).optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
  options: z.array(z.string()).nullable().optional(),
  translations: z.array(translationSchema).optional(),
});

export async function getFormFieldsAction(): Promise<ActionResult<FormFieldItem[]>> {
  try {
    await requireAuth();
    const fields = await getFormFields();
    return { success: true, data: fields };
  } catch {
    return { success: false, error: '获取字段列表失败' };
  }
}

export async function createFormFieldAction(
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();
    const parsed = createSchema.parse(input);
    const id = await createFormField(parsed);
    revalidateTag('form-fields', 'max');
    return { success: true, data: { id } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '创建字段失败' };
  }
}

export async function updateFormFieldAction(
  id: string,
  input: z.infer<typeof updateSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const parsed = updateSchema.parse(input);
    await updateFormField(id, parsed);
    revalidateTag('form-fields', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof NotFoundError) return { success: false, error: '字段不存在' };
    return { success: false, error: e instanceof Error ? e.message : '更新字段失败' };
  }
}

export async function deleteFormFieldAction(id: string): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    await deleteFormField(id);
    revalidateTag('form-fields', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    if (e instanceof NotFoundError) return { success: false, error: '字段不存在' };
    return { success: false, error: e instanceof Error ? e.message : '删除字段失败' };
  }
}

export async function reorderFormFieldsAction(orderedIds: string[]): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const parsed = z.array(z.string().uuid()).parse(orderedIds);
    await reorderFormFields(parsed);
    revalidateTag('form-fields', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '排序失败' };
  }
}
