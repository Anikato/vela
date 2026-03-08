import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductListPage } from '@/components/website/product/product-list-page';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';
import {
  getPublicCategoryTree,
  getPublicTagList,
  getPublishedProductList,
  type ProductSortOption,
} from '@/server/services/product-public.service';

interface LocaleCategoryProductsPageProps {
  params: Promise<{ locale: string; categorySlug: string }>;
  searchParams: Promise<{ page?: string; tag?: string; sort?: string }>;
}

export async function generateMetadata({ params }: LocaleCategoryProductsPageProps): Promise<Metadata> {
  const { locale, categorySlug } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const [data, siteInfo] = await Promise.all([
    getPublishedProductList(locale, defaultLanguage.code, { categorySlug }),
    getCachedPublicSiteInfo(locale, defaultLanguage.code),
  ]);
  const categoryName = data.category?.name ?? categorySlug;
  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === defaultLanguage.code,
  }));

  return buildSeoMetadata({
    title: `${categoryName} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: `${categoryName} - ${siteInfo.siteName}`,
    canonicalPath: `/${locale}/products/${categorySlug}`,
    locale,
    defaultLocale: defaultLanguage.code,
    activeLocales,
    pagePath: `/products/${categorySlug}`,
    ogImage: siteInfo.ogImageUrl,
  });
}

const UI_KEYS = [
  'nav.home',
  'nav.products',
  'product.allProducts',
  'product.sortNewest',
  'product.sortPopular',
  'product.sortNameAsc',
  'product.sortNameDesc',
  'product.noProducts',
  'product.totalCount',
  'product.categories',
  'product.addToInquiry',
];

const VALID_SORTS = new Set<ProductSortOption>(['newest', 'popular', 'name_asc', 'name_desc']);

export default async function LocaleCategoryProductsPage({
  params,
  searchParams,
}: LocaleCategoryProductsPageProps) {
  const [{ locale, categorySlug }, { page, tag, sort }] = await Promise.all([params, searchParams]);
  const pageNum = page ? Number(page) : 1;
  const currentSort: ProductSortOption = VALID_SORTS.has(sort as ProductSortOption)
    ? (sort as ProductSortOption)
    : 'newest';

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getCachedActiveLanguages(),
    getCachedDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const [data, categoryTree, tagList, uiMap] = await Promise.all([
    getPublishedProductList(locale, defaultLanguage.code, {
      categorySlug,
      page: Number.isFinite(pageNum) ? pageNum : 1,
      tagSlug: tag,
      sort: currentSort,
    }),
    getPublicCategoryTree(locale, defaultLanguage.code),
    getPublicTagList(locale, defaultLanguage.code),
    getCachedUiTranslationMap(locale, defaultLanguage.code, UI_KEYS),
  ]);

  if (!data.category) {
    notFound();
  }

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <ProductListPage
        locale={locale}
        defaultLocale={defaultLanguage.code}
        data={data}
        categoryTree={categoryTree}
        tags={tagList}
        basePath={`/${locale}/products/${categorySlug}`}
        productsBasePath={`/${locale}/products`}
        activeTagSlug={tag}
        currentSort={currentSort}
        uiLabels={{
          home: uiMap['nav.home'] ?? 'Home',
          products: uiMap['nav.products'] ?? 'Products',
          allProducts: uiMap['product.allProducts'] ?? 'All Products',
          sortNewest: uiMap['product.sortNewest'] ?? 'Newest',
          sortPopular: uiMap['product.sortPopular'] ?? 'Popular',
          sortNameAsc: uiMap['product.sortNameAsc'] ?? 'Name A→Z',
          sortNameDesc: uiMap['product.sortNameDesc'] ?? 'Name Z→A',
          noProducts: uiMap['product.noProducts'] ?? 'No products found',
          totalCount: uiMap['product.totalCount'] ?? '{count} products',
          categories: uiMap['product.categories'] ?? 'Categories',
          addToInquiry: uiMap['product.addToInquiry'] ?? 'Add to Inquiry',
        }}
      />
    </WebsiteShell>
  );
}
