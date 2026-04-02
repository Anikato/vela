import 'server-only';

import { asc, count, eq } from 'drizzle-orm';

import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { categories, productCategories, products } from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';

export interface PublicCategoryCardItem {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  imageFocal: { focalX: number; focalY: number } | null;
  productCount: number;
}

export async function getCategoriesForShowcase(
  locale: string,
  defaultLocale: string,
  limit: number = 20,
): Promise<PublicCategoryCardItem[]> {
  const allCategories = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    with: { translations: true, image: true },
    orderBy: [asc(categories.sortOrder), asc(categories.createdAt)],
    limit,
  });

  const primaryCountRows = await db
    .select({ categoryId: products.primaryCategoryId, cnt: count() })
    .from(products)
    .where(eq(products.status, 'published'))
    .groupBy(products.primaryCategoryId);
  const primaryCountMap = new Map(primaryCountRows.map((r) => [r.categoryId, r.cnt]));

  const additionalCountRows = await db
    .select({ categoryId: productCategories.categoryId, cnt: count() })
    .from(productCategories)
    .innerJoin(products, eq(productCategories.productId, products.id))
    .where(eq(products.status, 'published'))
    .groupBy(productCategories.categoryId);
  const additionalCountMap = new Map(additionalCountRows.map((r) => [r.categoryId, r.cnt]));

  const storage = getStorageAdapter();

  return allCategories.map((cat) => {
    const translated = getTranslation(cat.translations, locale, defaultLocale);
    return {
      id: cat.id,
      slug: cat.slug,
      name: translated?.name ?? cat.slug,
      imageUrl: cat.image ? storage.getPublicUrl(cat.image.filename) : null,
      imageFocal: cat.image ? { focalX: cat.image.focalX, focalY: cat.image.focalY } : null,
      productCount: (primaryCountMap.get(cat.id) ?? 0) + (additionalCountMap.get(cat.id) ?? 0),
    };
  });
}
