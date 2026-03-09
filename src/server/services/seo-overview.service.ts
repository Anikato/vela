import { eq, and, sql, count } from 'drizzle-orm';

import { db } from '@/server/db';
import {
  products,
  productTranslations,
  news,
  newsTranslations,
  pages,
  pageTranslations,
  categories,
  categoryTranslations,
  languages,
} from '@/server/db/schema';

export interface SeoEntityStats {
  entity: string;
  label: string;
  totalItems: number;
  withSeoTitle: number;
  withSeoDescription: number;
  completionPercent: number;
}

export interface SeoOverviewData {
  entities: SeoEntityStats[];
  overallPercent: number;
  totalFields: number;
  filledFields: number;
}

export async function getSeoOverview(defaultLocale: string): Promise<SeoOverviewData> {
  const [productStats, newsStats, pageStats, categoryStats] = await Promise.all([
    getSeoStatsForEntity('product', defaultLocale),
    getSeoStatsForEntity('news', defaultLocale),
    getSeoStatsForEntity('page', defaultLocale),
    getSeoStatsForEntity('category', defaultLocale),
  ]);

  const entities = [productStats, newsStats, pageStats, categoryStats];
  const totalFields = entities.reduce((s, e) => s + e.totalItems * 2, 0);
  const filledFields = entities.reduce((s, e) => s + e.withSeoTitle + e.withSeoDescription, 0);
  const overallPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return { entities, overallPercent, totalFields, filledFields };
}

async function getSeoStatsForEntity(
  entity: string,
  defaultLocale: string,
): Promise<SeoEntityStats> {
  const LABEL_MAP: Record<string, string> = {
    product: '产品',
    news: '新闻',
    page: '页面',
    category: '分类',
  };

  let totalItems = 0;
  let withSeoTitle = 0;
  let withSeoDescription = 0;

  if (entity === 'product') {
    const [total] = await db.select({ count: count() }).from(products);
    totalItems = total.count;

    const [titleCount] = await db
      .select({ count: count() })
      .from(productTranslations)
      .where(
        and(
          eq(productTranslations.locale, defaultLocale),
          sql`${productTranslations.seoTitle} is not null and ${productTranslations.seoTitle} != ''`,
        ),
      );
    withSeoTitle = titleCount.count;

    const [descCount] = await db
      .select({ count: count() })
      .from(productTranslations)
      .where(
        and(
          eq(productTranslations.locale, defaultLocale),
          sql`${productTranslations.seoDescription} is not null and ${productTranslations.seoDescription} != ''`,
        ),
      );
    withSeoDescription = descCount.count;
  } else if (entity === 'news') {
    const [total] = await db.select({ count: count() }).from(news);
    totalItems = total.count;

    const [titleCount] = await db
      .select({ count: count() })
      .from(newsTranslations)
      .where(
        and(
          eq(newsTranslations.locale, defaultLocale),
          sql`${newsTranslations.seoTitle} is not null and ${newsTranslations.seoTitle} != ''`,
        ),
      );
    withSeoTitle = titleCount.count;

    const [descCount] = await db
      .select({ count: count() })
      .from(newsTranslations)
      .where(
        and(
          eq(newsTranslations.locale, defaultLocale),
          sql`${newsTranslations.seoDescription} is not null and ${newsTranslations.seoDescription} != ''`,
        ),
      );
    withSeoDescription = descCount.count;
  } else if (entity === 'page') {
    const [total] = await db.select({ count: count() }).from(pages);
    totalItems = total.count;

    const [titleCount] = await db
      .select({ count: count() })
      .from(pageTranslations)
      .where(
        and(
          eq(pageTranslations.locale, defaultLocale),
          sql`${pageTranslations.seoTitle} is not null and ${pageTranslations.seoTitle} != ''`,
        ),
      );
    withSeoTitle = titleCount.count;

    const [descCount] = await db
      .select({ count: count() })
      .from(pageTranslations)
      .where(
        and(
          eq(pageTranslations.locale, defaultLocale),
          sql`${pageTranslations.seoDescription} is not null and ${pageTranslations.seoDescription} != ''`,
        ),
      );
    withSeoDescription = descCount.count;
  } else if (entity === 'category') {
    const [total] = await db.select({ count: count() }).from(categories);
    totalItems = total.count;

    const [titleCount] = await db
      .select({ count: count() })
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.locale, defaultLocale),
          sql`${categoryTranslations.seoTitle} is not null and ${categoryTranslations.seoTitle} != ''`,
        ),
      );
    withSeoTitle = titleCount.count;

    const [descCount] = await db
      .select({ count: count() })
      .from(categoryTranslations)
      .where(
        and(
          eq(categoryTranslations.locale, defaultLocale),
          sql`${categoryTranslations.seoDescription} is not null and ${categoryTranslations.seoDescription} != ''`,
        ),
      );
    withSeoDescription = descCount.count;
  }

  const completionPercent =
    totalItems > 0
      ? Math.round(((withSeoTitle + withSeoDescription) / (totalItems * 2)) * 100)
      : 100;

  return {
    entity,
    label: LABEL_MAP[entity] ?? entity,
    totalItems,
    withSeoTitle,
    withSeoDescription,
    completionPercent,
  };
}
