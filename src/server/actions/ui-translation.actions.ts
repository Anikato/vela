'use server';

import { revalidateTag } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import {
  getUiTranslationList,
  getCategories,
  batchUpsertTranslations,
  createTranslationKey,
  deleteTranslationKey,
  renameTranslationKey,
  type UiTranslationListResult,
  type CategoryStat,
} from '@/server/services/ui-translation-admin.service';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error('未授权');
}

const listSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  missingOnly: z.boolean().optional(),
  locale: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(200).optional(),
});

export async function getUiTranslationListAction(
  input: z.infer<typeof listSchema>,
): Promise<ActionResult<UiTranslationListResult>> {
  try {
    await requireAuth();
    const parsed = listSchema.parse(input);
    const data = await getUiTranslationList(parsed);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '获取翻译列表失败' };
  }
}

export async function getCategoriesAction(): Promise<ActionResult<CategoryStat[]>> {
  try {
    await requireAuth();
    const data = await getCategories();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '获取分类统计失败' };
  }
}

const upsertSchema = z.object({
  key: z.string().min(1).max(255),
  category: z.string().min(1).max(50),
  translations: z.record(z.string(), z.string()),
});

export async function upsertTranslationAction(
  input: z.infer<typeof upsertSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { key, category, translations } = upsertSchema.parse(input);
    await batchUpsertTranslations(key, category, translations);
    revalidateTag('ui-translations', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '保存翻译失败' };
  }
}

const createSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/, '键名格式：category.keyName'),
  translations: z.record(z.string(), z.string()),
});

export async function createTranslationKeyAction(
  input: z.infer<typeof createSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { key, translations } = createSchema.parse(input);
    const category = key.includes('.') ? key.split('.')[0] : 'common';
    await createTranslationKey(key, category, translations);
    revalidateTag('ui-translations', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '创建翻译键失败' };
  }
}

const deleteSchema = z.object({
  key: z.string().min(1),
});

export async function deleteTranslationKeyAction(
  input: z.infer<typeof deleteSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { key } = deleteSchema.parse(input);
    await deleteTranslationKey(key);
    revalidateTag('ui-translations', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '删除翻译键失败' };
  }
}

const renameSchema = z.object({
  oldKey: z.string().min(1),
  newKey: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/, '键名格式：category.keyName'),
});

export async function renameTranslationKeyAction(
  input: z.infer<typeof renameSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { oldKey, newKey } = renameSchema.parse(input);
    await renameTranslationKey(oldKey, newKey);
    revalidateTag('ui-translations', 'max');
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '重命名翻译键失败' };
  }
}

/** 批量自动翻译 UI 翻译键到目标语言 */
export async function batchTranslateUiKeys(
  sourceLocale: string,
  targetLocales: string[],
): Promise<ActionResult<{ translated: number }>> {
  try {
    await requireAuth();
    const { getAllSourceTexts, batchUpsertTranslations } = await import(
      '@/server/services/ui-translation-admin.service'
    );
    const { translateTexts } = await import('@/server/services/translation.service');

    const sourceData = await getAllSourceTexts(sourceLocale);
    if (sourceData.length === 0) {
      return { success: false, error: '源语言没有翻译数据' };
    }

    const texts = sourceData.map((d) => d.value);
    const result = await translateTexts({ texts, from: sourceLocale, to: targetLocales });

    let translated = 0;
    for (const locale of targetLocales) {
      const translatedTexts = result.translations[locale] ?? [];
      for (let i = 0; i < sourceData.length; i++) {
        if (translatedTexts[i]) {
          await batchUpsertTranslations(
            sourceData[i].key,
            sourceData[i].category,
            { [locale]: translatedTexts[i] },
          );
          translated++;
        }
      }
    }

    return { success: true, data: { translated } };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '批量翻译失败' };
  }
}
