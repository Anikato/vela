import { inArray } from 'drizzle-orm';

import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { uiTranslations } from '@/server/db/schema';

export async function getUiTranslationMap(
  locale: string,
  defaultLocale: string,
  keys: string[],
): Promise<Record<string, string>> {
  const normalizedKeys = Array.from(
    new Set(keys.map((item) => item.trim()).filter(Boolean)),
  );
  if (normalizedKeys.length === 0) {
    return {};
  }

  const rows = await db
    .select({
      key: uiTranslations.key,
      locale: uiTranslations.locale,
      value: uiTranslations.value,
    })
    .from(uiTranslations)
    .where(inArray(uiTranslations.key, normalizedKeys));

  const byKey = new Map<string, Array<{ locale: string; value: string | null }>>();
  for (const row of rows) {
    const bucket = byKey.get(row.key) ?? [];
    bucket.push({ locale: row.locale, value: row.value });
    byKey.set(row.key, bucket);
  }

  const result: Record<string, string> = {};
  for (const key of normalizedKeys) {
    const candidates = byKey.get(key) ?? [];
    const translated = getTranslation(candidates, locale, defaultLocale);
    if (typeof translated?.value === 'string' && translated.value.trim()) {
      result[key] = translated.value;
    }
  }

  return result;
}
