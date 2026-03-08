import type { MetadataRoute } from 'next';
import { eq, and } from 'drizzle-orm';

import { buildLocalizedPath } from '@/lib/i18n';
import { getBaseUrl } from '@/lib/seo';
import { db } from '@/server/db';
import { categories, news, pages, products } from '@/server/db/schema';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
} from '@/lib/data-cache';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const defaultLocale = defaultLanguage.code;
  const locales = activeLanguages.map((l) => l.code);

  function makeAlternates(pagePath: string): MetadataRoute.Sitemap[number]['alternates'] {
    const languages: Record<string, string> = {};
    for (const loc of locales) {
      const localizedPath = buildLocalizedPath(pagePath, loc, defaultLocale);
      languages[loc] = `${baseUrl}${localizedPath}`;
    }
    languages['x-default'] = `${baseUrl}${buildLocalizedPath(pagePath, defaultLocale, defaultLocale)}`;
    return { languages };
  }

  function makeEntry(
    pagePath: string,
    opts?: { lastmod?: Date; changefreq?: string; priority?: number },
  ): MetadataRoute.Sitemap[number] {
    const canonicalPath = buildLocalizedPath(pagePath, defaultLocale, defaultLocale);
    return {
      url: `${baseUrl}${canonicalPath}`,
      lastModified: opts?.lastmod ?? new Date(),
      changeFrequency: (opts?.changefreq ?? 'weekly') as 'weekly',
      priority: opts?.priority ?? 0.5,
      alternates: makeAlternates(pagePath),
    };
  }

  const entries: MetadataRoute.Sitemap = [];

  entries.push(makeEntry('/', { priority: 1.0, changefreq: 'daily' }));
  entries.push(makeEntry('/products', { priority: 0.9, changefreq: 'daily' }));
  entries.push(makeEntry('/news', { priority: 0.7, changefreq: 'daily' }));
  entries.push(makeEntry('/contact', { priority: 0.6, changefreq: 'monthly' }));

  const publishedPages = await db
    .select({ slug: pages.slug, updatedAt: pages.updatedAt, isHomepage: pages.isHomepage })
    .from(pages)
    .where(eq(pages.status, 'published'));

  for (const pg of publishedPages) {
    if (pg.isHomepage) continue;
    const pagePath = pg.slug === 'about' ? '/about' : `/page/${pg.slug}`;
    entries.push(
      makeEntry(pagePath, {
        lastmod: pg.updatedAt,
        priority: 0.6,
        changefreq: 'monthly',
      }),
    );
  }

  const [activeCategories, publishedProducts, publishedNews] = await Promise.all([
    db
      .select({ slug: categories.slug, updatedAt: categories.updatedAt })
      .from(categories)
      .where(eq(categories.isActive, true)),
    db
      .select({
        slug: products.slug,
        primaryCategoryId: products.primaryCategoryId,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.status, 'published')),
    db
      .select({ slug: news.slug, updatedAt: news.updatedAt })
      .from(news)
      .where(and(eq(news.status, 'published'))),
  ]);

  const categoryMap = new Map<string, string>();
  for (const cat of activeCategories) {
    categoryMap.set(cat.slug, cat.slug);
  }

  const categoryIdToSlug = new Map<string, string>();
  const allCats = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  for (const cat of allCats) {
    categoryIdToSlug.set(cat.id, cat.slug);
  }

  for (const cat of activeCategories) {
    entries.push(
      makeEntry(`/products/${cat.slug}`, {
        lastmod: cat.updatedAt,
        priority: 0.8,
        changefreq: 'weekly',
      }),
    );
  }

  for (const prod of publishedProducts) {
    const catSlug = categoryIdToSlug.get(prod.primaryCategoryId);
    if (!catSlug) continue;
    entries.push(
      makeEntry(`/products/${catSlug}/${prod.slug}`, {
        lastmod: prod.updatedAt,
        priority: 0.7,
        changefreq: 'weekly',
      }),
    );
  }

  for (const article of publishedNews) {
    entries.push(
      makeEntry(`/news/${article.slug}`, {
        lastmod: article.updatedAt,
        priority: 0.6,
        changefreq: 'weekly',
      }),
    );
  }

  return entries;
}
