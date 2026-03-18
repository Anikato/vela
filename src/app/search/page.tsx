import type { Metadata } from 'next';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

import { WebsiteShell } from '@/components/website/layout/website-shell';
import { SearchPage } from '@/components/website/product/search-page';
import {
  getCachedDefaultLanguage,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';
import { searchPublishedProducts } from '@/server/services/product-public.service';

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: false },
};

const UI_KEYS = [
  'search.placeholder',
  'search.button',
  'search.noResults',
  'search.resultCount',
];

interface SearchPageRouteProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function SearchPageRoute({ searchParams }: SearchPageRouteProps) {
  const { q, page } = await searchParams;
  const pageNum = page ? Number(page) : 1;

  const defaultLanguage = await getCachedDefaultLanguage();
  const locale = defaultLanguage.code;

  const [data, uiMap] = await Promise.all([
    searchPublishedProducts(locale, locale, {
      query: q ?? '',
      page: Number.isFinite(pageNum) ? pageNum : 1,
    }),
    getCachedUiTranslationMap(locale, locale, UI_KEYS),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={locale}>
      <Suspense>
        <SearchPage
          locale={locale}
          defaultLocale={locale}
          data={data}
          basePath="/search"
          uiLabels={{
            placeholder: uiMap['search.placeholder'] ?? 'Search products...',
            searchButton: uiMap['search.button'] ?? 'Search',
            noResults: uiMap['search.noResults'] ?? 'No products found',
            resultCount: uiMap['search.resultCount'] ?? '{count} results for "{query}"',
          }}
        />
      </Suspense>
    </WebsiteShell>
  );
}
