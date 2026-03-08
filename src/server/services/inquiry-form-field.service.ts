import { asc, eq, and, sql } from 'drizzle-orm';

import { getTranslation } from '@/lib/i18n';
import { NotFoundError } from '@/lib/errors';
import { db } from '@/server/db';
import { inquiryFormFields, inquiryFormFieldTranslations } from '@/server/db/schema';

// ─── Types ───

export const FIELD_TYPES = ['text', 'number', 'select', 'multiselect', 'file'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FormFieldItem {
  id: string;
  fieldType: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  options: string[] | null;
  translations: Array<{
    locale: string;
    label: string | null;
    placeholder: string | null;
    helpText: string | null;
  }>;
}

export interface CreateFormFieldInput {
  fieldType: FieldType;
  isRequired?: boolean;
  isActive?: boolean;
  options?: string[];
  translations: Array<{
    locale: string;
    label: string;
    placeholder?: string;
    helpText?: string;
  }>;
}

export interface UpdateFormFieldInput {
  fieldType?: FieldType;
  isRequired?: boolean;
  isActive?: boolean;
  options?: string[] | null;
  translations?: Array<{
    locale: string;
    label: string;
    placeholder?: string;
    helpText?: string;
  }>;
}

/** 前台用：获取活跃的自定义字段（已翻译） */
export interface PublicFormField {
  id: string;
  fieldType: string;
  isRequired: boolean;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  options: string[] | null;
}

// ─── Service ───

/** 后台：获取所有字段 */
export async function getFormFields(): Promise<FormFieldItem[]> {
  const rows = await db.query.inquiryFormFields.findMany({
    with: { translations: true },
    orderBy: [asc(inquiryFormFields.sortOrder)],
  });

  return rows.map((r) => ({
    id: r.id,
    fieldType: r.fieldType,
    isRequired: r.isRequired,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
    options: r.options,
    translations: r.translations.map((t) => ({
      locale: t.locale,
      label: t.label,
      placeholder: t.placeholder,
      helpText: t.helpText,
    })),
  }));
}

/** 后台：创建字段 */
export async function createFormField(input: CreateFormFieldInput): Promise<string> {
  const [maxRow] = await db
    .select({ max: sql<number>`coalesce(max(${inquiryFormFields.sortOrder}), -1)` })
    .from(inquiryFormFields);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(inquiryFormFields)
      .values({
        fieldType: input.fieldType,
        isRequired: input.isRequired ?? false,
        isActive: input.isActive ?? true,
        options: input.options ?? null,
        sortOrder: (maxRow?.max ?? -1) + 1,
      })
      .returning({ id: inquiryFormFields.id });

    if (input.translations.length > 0) {
      await tx.insert(inquiryFormFieldTranslations).values(
        input.translations.map((t) => ({
          fieldId: created.id,
          locale: t.locale,
          label: t.label || null,
          placeholder: t.placeholder || null,
          helpText: t.helpText || null,
        })),
      );
    }

    return created.id;
  });
}

/** 后台：更新字段 */
export async function updateFormField(id: string, input: UpdateFormFieldInput): Promise<void> {
  const existing = await db.query.inquiryFormFields.findFirst({
    where: eq(inquiryFormFields.id, id),
  });
  if (!existing) throw new NotFoundError('FormField', id);

  await db.transaction(async (tx) => {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (input.fieldType !== undefined) updates.fieldType = input.fieldType;
    if (input.isRequired !== undefined) updates.isRequired = input.isRequired;
    if (input.isActive !== undefined) updates.isActive = input.isActive;
    if (input.options !== undefined) updates.options = input.options;

    await tx.update(inquiryFormFields).set(updates).where(eq(inquiryFormFields.id, id));

    if (input.translations) {
      await tx
        .delete(inquiryFormFieldTranslations)
        .where(eq(inquiryFormFieldTranslations.fieldId, id));

      if (input.translations.length > 0) {
        await tx.insert(inquiryFormFieldTranslations).values(
          input.translations.map((t) => ({
            fieldId: id,
            locale: t.locale,
            label: t.label || null,
            placeholder: t.placeholder || null,
            helpText: t.helpText || null,
          })),
        );
      }
    }
  });
}

/** 后台：删除字段 */
export async function deleteFormField(id: string): Promise<void> {
  const existing = await db.query.inquiryFormFields.findFirst({
    where: eq(inquiryFormFields.id, id),
  });
  if (!existing) throw new NotFoundError('FormField', id);

  await db.delete(inquiryFormFields).where(eq(inquiryFormFields.id, id));
}

/** 后台：排序 */
export async function reorderFormFields(orderedIds: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i++) {
      await tx
        .update(inquiryFormFields)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(inquiryFormFields.id, orderedIds[i]));
    }
  });
}

/** 前台：获取活跃字段（带翻译回退） */
export async function getPublicFormFields(
  locale: string,
  defaultLocale: string,
): Promise<PublicFormField[]> {
  const rows = await db.query.inquiryFormFields.findMany({
    where: eq(inquiryFormFields.isActive, true),
    with: { translations: true },
    orderBy: [asc(inquiryFormFields.sortOrder)],
  });

  return rows
    .map((r) => {
      const t = getTranslation(r.translations, locale, defaultLocale);
      if (!t?.label) return null;
      return {
        id: r.id,
        fieldType: r.fieldType,
        isRequired: r.isRequired,
        label: t.label,
        placeholder: t.placeholder ?? null,
        helpText: t.helpText ?? null,
        options: r.options,
      };
    })
    .filter((f): f is PublicFormField => f !== null);
}
