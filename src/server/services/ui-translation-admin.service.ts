import { eq, and, like, sql, asc, inArray } from 'drizzle-orm';

import { db } from '@/server/db';
import { uiTranslations, languages } from '@/server/db/schema';

export interface UiTranslationRow {
  key: string;
  category: string;
  translations: Record<string, string>;
}

export interface UiTranslationListResult {
  items: UiTranslationRow[];
  total: number;
}

export interface CategoryStat {
  category: string;
  keyCount: number;
  translatedCount: number;
  totalSlots: number;
}

export async function getUiTranslationList(options: {
  category?: string;
  search?: string;
  missingOnly?: boolean;
  locale?: string;
  page?: number;
  pageSize?: number;
}): Promise<UiTranslationListResult> {
  const { category, search, missingOnly, locale, page = 1, pageSize = 50 } = options;

  const activeLocales = await db
    .select({ code: languages.code })
    .from(languages)
    .where(eq(languages.isActive, true));
  const localeCodes = activeLocales.map((l) => l.code);

  let keyQuery = db
    .selectDistinct({ key: uiTranslations.key, category: uiTranslations.category })
    .from(uiTranslations)
    .$dynamic();

  const conditions = [];
  if (category) conditions.push(eq(uiTranslations.category, category));
  if (search) conditions.push(like(uiTranslations.key, `%${search}%`));
  if (conditions.length > 0) {
    keyQuery = keyQuery.where(and(...conditions));
  }

  const allKeys = await keyQuery.orderBy(asc(uiTranslations.category), asc(uiTranslations.key));

  let filteredKeys = allKeys;

  if (missingOnly || locale) {
    const allRows = await db
      .select({
        key: uiTranslations.key,
        locale: uiTranslations.locale,
        value: uiTranslations.value,
      })
      .from(uiTranslations)
      .where(
        inArray(
          uiTranslations.key,
          allKeys.map((k) => k.key),
        ),
      );

    const byKey = new Map<string, Set<string>>();
    for (const row of allRows) {
      if (row.value && row.value.trim()) {
        const set = byKey.get(row.key) ?? new Set();
        set.add(row.locale);
        byKey.set(row.key, set);
      }
    }

    if (missingOnly) {
      const checkLocales = locale ? [locale] : localeCodes;
      filteredKeys = filteredKeys.filter((k) => {
        const filled = byKey.get(k.key) ?? new Set();
        return checkLocales.some((lc) => !filled.has(lc));
      });
    }
  }

  const total = filteredKeys.length;
  const offset = (page - 1) * pageSize;
  const paginatedKeys = filteredKeys.slice(offset, offset + pageSize);

  if (paginatedKeys.length === 0) {
    return { items: [], total };
  }

  const rows = await db
    .select({
      key: uiTranslations.key,
      category: uiTranslations.category,
      locale: uiTranslations.locale,
      value: uiTranslations.value,
    })
    .from(uiTranslations)
    .where(
      inArray(
        uiTranslations.key,
        paginatedKeys.map((k) => k.key),
      ),
    );

  const grouped = new Map<string, UiTranslationRow>();
  for (const pk of paginatedKeys) {
    grouped.set(pk.key, { key: pk.key, category: pk.category, translations: {} });
  }
  for (const row of rows) {
    const entry = grouped.get(row.key);
    if (entry && row.value !== null) {
      entry.translations[row.locale] = row.value;
    }
  }

  return { items: Array.from(grouped.values()), total };
}

export async function getCategories(): Promise<CategoryStat[]> {
  const activeLocales = await db
    .select({ code: languages.code })
    .from(languages)
    .where(eq(languages.isActive, true));
  const localeCount = activeLocales.length;

  const catKeys = await db
    .select({
      category: uiTranslations.category,
      key: uiTranslations.key,
    })
    .from(uiTranslations)
    .then((rows) => {
      const map = new Map<string, Set<string>>();
      for (const r of rows) {
        const set = map.get(r.category) ?? new Set();
        set.add(r.key);
        map.set(r.category, set);
      }
      return map;
    });

  const filledCounts = await db
    .select({
      category: uiTranslations.category,
      cnt: sql<number>`count(*)`.as('cnt'),
    })
    .from(uiTranslations)
    .where(sql`${uiTranslations.value} IS NOT NULL AND TRIM(${uiTranslations.value}) != ''`)
    .groupBy(uiTranslations.category);

  const filledMap = new Map(filledCounts.map((r) => [r.category, Number(r.cnt)]));

  const result: CategoryStat[] = [];
  for (const [category, keys] of catKeys) {
    const keyCount = keys.size;
    const totalSlots = keyCount * localeCount;
    const translatedCount = filledMap.get(category) ?? 0;
    result.push({ category, keyCount, translatedCount, totalSlots });
  }
  result.sort((a, b) => a.category.localeCompare(b.category));
  return result;
}

export async function upsertTranslation(
  key: string,
  category: string,
  locale: string,
  value: string,
): Promise<void> {
  const existing = await db
    .select({ id: uiTranslations.id })
    .from(uiTranslations)
    .where(and(eq(uiTranslations.key, key), eq(uiTranslations.locale, locale)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(uiTranslations)
      .set({ value, category })
      .where(eq(uiTranslations.id, existing[0].id));
  } else {
    await db.insert(uiTranslations).values({ key, category, locale, value });
  }
}

export async function batchUpsertTranslations(
  key: string,
  category: string,
  translations: Record<string, string>,
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const [locale, value] of Object.entries(translations)) {
      const existing = await tx
        .select({ id: uiTranslations.id })
        .from(uiTranslations)
        .where(and(eq(uiTranslations.key, key), eq(uiTranslations.locale, locale)))
        .limit(1);

      if (existing.length > 0) {
        await tx
          .update(uiTranslations)
          .set({ value, category })
          .where(eq(uiTranslations.id, existing[0].id));
      } else {
        await tx.insert(uiTranslations).values({ key, category, locale, value });
      }
    }
  });
}

export async function createTranslationKey(
  key: string,
  category: string,
  translations: Record<string, string>,
): Promise<void> {
  const existing = await db
    .select({ id: uiTranslations.id })
    .from(uiTranslations)
    .where(eq(uiTranslations.key, key))
    .limit(1);

  if (existing.length > 0) {
    throw new Error(`翻译键 "${key}" 已存在`);
  }

  await db.transaction(async (tx) => {
    for (const [locale, value] of Object.entries(translations)) {
      if (value.trim()) {
        await tx.insert(uiTranslations).values({ key, category, locale, value });
      }
    }
  });
}

export async function deleteTranslationKey(key: string): Promise<void> {
  await db.delete(uiTranslations).where(eq(uiTranslations.key, key));
}

export async function renameTranslationKey(oldKey: string, newKey: string): Promise<void> {
  const newCategory = newKey.includes('.') ? newKey.split('.')[0] : 'common';

  const existingNew = await db
    .select({ id: uiTranslations.id })
    .from(uiTranslations)
    .where(eq(uiTranslations.key, newKey))
    .limit(1);

  if (existingNew.length > 0) {
    throw new Error(`翻译键 "${newKey}" 已存在`);
  }

  await db
    .update(uiTranslations)
    .set({ key: newKey, category: newCategory })
    .where(eq(uiTranslations.key, oldKey));
}

/** 获取指定语言的所有翻译文本（用于批量自动翻译） */
export async function getAllSourceTexts(
  locale: string,
): Promise<Array<{ key: string; category: string; value: string }>> {
  const rows = await db
    .select({
      key: uiTranslations.key,
      category: uiTranslations.category,
      value: uiTranslations.value,
    })
    .from(uiTranslations)
    .where(and(eq(uiTranslations.locale, locale), sql`${uiTranslations.value} IS NOT NULL AND ${uiTranslations.value} != ''`))
    .orderBy(asc(uiTranslations.key));

  return rows.filter((r) => r.value !== null).map((r) => ({
    key: r.key,
    category: r.category,
    value: r.value!,
  }));
}
