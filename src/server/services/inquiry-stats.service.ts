import { and, count, desc, eq, gte, sql } from 'drizzle-orm';

import { db } from '@/server/db';
import { inquiries, inquiryProducts, products, productTranslations, languages } from '@/server/db/schema';

export interface DailyInquiryCount {
  date: string;
  count: number;
}

export interface CountryDistribution {
  country: string;
  count: number;
}

export interface DeviceDistribution {
  device: string;
  count: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  inquiryCount: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface InquiryStatsDetail {
  dailyTrend: DailyInquiryCount[];
  countryDistribution: CountryDistribution[];
  deviceDistribution: DeviceDistribution[];
  statusDistribution: StatusDistribution[];
  topProducts: TopProduct[];
  totals: {
    last7Days: number;
    last30Days: number;
    allTime: number;
  };
}

export async function getInquiryStatsDetail(): Promise<InquiryStatsDetail> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const defaultLang = await db.query.languages.findFirst({
    where: eq(languages.isDefault, true),
  });
  const defaultLocale = defaultLang?.code ?? 'en-US';

  const [
    dailyRows,
    countryRows,
    deviceRows,
    statusRows,
    topProductRows,
    totalRows,
    last7Rows,
    last30Rows,
  ] = await Promise.all([
    db
      .select({
        date: sql<string>`to_char(${inquiries.createdAt}::date, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(inquiries)
      .where(gte(inquiries.createdAt, thirtyDaysAgo))
      .groupBy(sql`${inquiries.createdAt}::date`)
      .orderBy(sql`${inquiries.createdAt}::date`),

    db
      .select({
        country: sql<string>`coalesce(${inquiries.country}, '未知')`,
        count: count(),
      })
      .from(inquiries)
      .groupBy(sql`coalesce(${inquiries.country}, '未知')`)
      .orderBy(desc(count()))
      .limit(10),

    db
      .select({
        device: sql<string>`coalesce(${inquiries.deviceType}, '未知')`,
        count: count(),
      })
      .from(inquiries)
      .groupBy(sql`coalesce(${inquiries.deviceType}, '未知')`)
      .orderBy(desc(count())),

    db
      .select({ status: inquiries.status, count: count() })
      .from(inquiries)
      .groupBy(inquiries.status),

    db
      .select({
        productId: inquiryProducts.productId,
        count: count(),
      })
      .from(inquiryProducts)
      .where(sql`${inquiryProducts.productId} is not null`)
      .groupBy(inquiryProducts.productId)
      .orderBy(desc(count()))
      .limit(10),

    db.select({ count: count() }).from(inquiries),
    db.select({ count: count() }).from(inquiries).where(gte(inquiries.createdAt, sevenDaysAgo)),
    db.select({ count: count() }).from(inquiries).where(gte(inquiries.createdAt, thirtyDaysAgo)),
  ]);

  const productIds = topProductRows
    .map((r) => r.productId)
    .filter((id): id is string => id !== null);

  let productMap = new Map<string, { name: string; sku: string }>();
  if (productIds.length > 0) {
    const productRows = await db
      .select({
        id: products.id,
        sku: products.sku,
        name: productTranslations.name,
      })
      .from(products)
      .leftJoin(
        productTranslations,
        and(
          eq(productTranslations.productId, products.id),
          eq(productTranslations.locale, defaultLocale),
        ),
      )
      .where(sql`${products.id} in ${productIds}`);

    productMap = new Map(
      productRows.map((r) => [r.id, { name: r.name ?? r.sku, sku: r.sku }]),
    );
  }

  const dailyTrend: DailyInquiryCount[] = dailyRows.map((r) => ({
    date: r.date,
    count: r.count,
  }));

  return {
    dailyTrend,
    countryDistribution: countryRows.map((r) => ({ country: r.country, count: r.count })),
    deviceDistribution: deviceRows.map((r) => ({ device: r.device, count: r.count })),
    statusDistribution: statusRows.map((r) => ({ status: r.status, count: r.count })),
    topProducts: topProductRows.map((r) => {
      const info = productMap.get(r.productId!) ?? { name: '已删除', sku: '-' };
      return {
        productId: r.productId!,
        name: info.name,
        sku: info.sku,
        inquiryCount: r.count,
      };
    }),
    totals: {
      last7Days: last7Rows[0].count,
      last30Days: last30Rows[0].count,
      allTime: totalRows[0].count,
    },
  };
}
