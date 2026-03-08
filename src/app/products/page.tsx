import type { Metadata } from 'next';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductListPage } from '@/components/website/product/product-list-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import {
  getPublicCategoryTree,
  getPublicTagList,
  getPublishedProductList,
  type ProductSortOption,
} from '@/server/services/product-public.service';
import { getPublicSiteInfo } from '@/server/services/settings-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

export async function generateMetadata(): Promise<Metadata> {
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getDefaultLanguage(),
    getActiveLanguages(),
  ]);
  const locale = defaultLanguage.code;
  const [siteInfo, uiMap] = await Promise.all([
    getPublicSiteInfo(locale, locale),
    getUiTranslationMap(locale, locale, ['nav.products']),
  ]);
  const pageTitle = uiMap['nav.products'] ?? 'Products';
  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === locale,
  }));

  return buildSeoMetadata({
    title: `${pageTitle} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: siteInfo.siteDescription,
    canonicalPath: '/products',
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: '/products',
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

interface ProductsPageProps {
  searchParams: Promise<{ page?: string; tag?: string; sort?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page, tag, sort } = await searchParams;
  const pageNum = page ? Number(page) : 1;
  const currentSort: ProductSortOption = VALID_SORTS.has(sort as ProductSortOption)
    ? (sort as ProductSortOption)
    : 'newest';

  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const [data, categoryTree, tagList, uiMap] = await Promise.all([
    getPublishedProductList(locale, locale, {
      page: Number.isFinite(pageNum) ? pageNum : 1,
      tagSlug: tag,
      sort: currentSort,
    }),
    getPublicCategoryTree(locale, locale),
    getPublicTagList(locale, locale),
    getUiTranslationMap(locale, locale, UI_KEYS),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={locale}>
      <ProductListPage
        locale={locale}
        defaultLocale={locale}
        data={data}
        categoryTree={categoryTree}
        tags={tagList}
        basePath="/products"
        productsBasePath="/products"
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
