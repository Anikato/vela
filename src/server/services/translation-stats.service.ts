import { count, eq, sql } from 'drizzle-orm';

import { db } from '@/server/db';
import {
  productTranslations,
  products,
  categoryTranslations,
  categories,
  pageTranslations,
  pages,
  newsTranslations,
  news,
  uiTranslations,
  languages,
} from '@/server/db/schema';

export interface EntityTranslationStats {
  entity: string;
  label: string;
  totalItems: number;
  activeLanguages: number;
  totalSlots: number;
  translatedSlots: number;
  completionPercent: number;
  byLanguage: Array<{
    locale: string;
    translated: number;
    total: number;
    percent: number;
  }>;
}

export interface TranslationOverview {
  activeLanguages: number;
  entities: EntityTranslationStats[];
  overallPercent: number;
}

export async function getTranslationOverview(): Promise<TranslationOverview> {
  const activeLangs = await db.query.languages.findMany({
    where: eq(languages.isActive, true),
  });
  const langCodes = activeLangs.map((l) => l.code);
  const langCount = langCodes.length;

  const entities: EntityTranslationStats[] = await Promise.all([
    getEntityStats('products', '产品', products, productTranslations, 'productId', langCodes),
    getEntityStats('categories', '分类', categories, categoryTranslations, 'categoryId', langCodes),
    getEntityStats('pages', '页面', pages, pageTranslations, 'pageId', langCodes),
    getEntityStats('news', '新闻', news, newsTranslations, 'newsId', langCodes),
    getUiTranslationStats(langCodes),
  ]);

  const totalSlots = entities.reduce((s, e) => s + e.totalSlots, 0);
  const translatedSlots = entities.reduce((s, e) => s + e.translatedSlots, 0);
  const overallPercent = totalSlots > 0 ? Math.round((translatedSlots / totalSlots) * 100) : 100;

  return { activeLanguages: langCount, entities, overallPercent };
}

async function getEntityStats(
  entity: string,
  label: string,
  mainTable: any,
  translationTable: any,
  foreignKey: string,
  langCodes: string[],
): Promise<EntityTranslationStats> {
  const [{ total }] = await db.select({ total: count() }).from(mainTable);
  const totalSlots = total * langCodes.length;

  const byLanguage: EntityTranslationStats['byLanguage'] = [];
  let translatedSlots = 0;

  for (const locale of langCodes) {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(translationTable)
      .where(eq(translationTable.locale, locale));

    byLanguage.push({
      locale,
      translated: cnt,
      total,
      percent: total > 0 ? Math.round((cnt / total) * 100) : 100,
    });
    translatedSlots += cnt;
  }

  return {
    entity,
    label,
    totalItems: total,
    activeLanguages: langCodes.length,
    totalSlots,
    translatedSlots,
    completionPercent: totalSlots > 0 ? Math.round((translatedSlots / totalSlots) * 100) : 100,
    byLanguage,
  };
}

async function getUiTranslationStats(langCodes: string[]): Promise<EntityTranslationStats> {
  const distinctKeys = await db
    .selectDistinct({ key: uiTranslations.key })
    .from(uiTranslations);
  const totalKeys = distinctKeys.length;
  const totalSlots = totalKeys * langCodes.length;

  const byLanguage: EntityTranslationStats['byLanguage'] = [];
  let translatedSlots = 0;

  for (const locale of langCodes) {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(uiTranslations)
      .where(sql`${uiTranslations.locale} = ${locale} AND ${uiTranslations.value} IS NOT NULL AND ${uiTranslations.value} != ''`);

    byLanguage.push({
      locale,
      translated: cnt,
      total: totalKeys,
      percent: totalKeys > 0 ? Math.round((cnt / totalKeys) * 100) : 100,
    });
    translatedSlots += cnt;
  }

  return {
    entity: 'ui_translations',
    label: 'UI 翻译',
    totalItems: totalKeys,
    activeLanguages: langCodes.length,
    totalSlots,
    translatedSlots,
    completionPercent: totalSlots > 0 ? Math.round((translatedSlots / totalSlots) * 100) : 100,
    byLanguage,
  };
}
