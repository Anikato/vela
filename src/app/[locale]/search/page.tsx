import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

import { WebsiteShell } from '@/components/website/layout/website-shell';
import { SearchPage } from '@/components/website/product/search-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { searchPublishedProducts } from '@/server/services/product-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

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

interface LocaleSearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function LocaleSearchPage({ params, searchParams }: LocaleSearchPageProps) {
  const [{ locale }, { q, page }] = await Promise.all([params, searchParams]);
  const pageNum = page ? Number(page) : 1;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const [data, uiMap] = await Promise.all([
    searchPublishedProducts(locale, defaultLanguage.code, {
      query: q ?? '',
      page: Number.isFinite(pageNum) ? pageNum : 1,
    }),
    getUiTranslationMap(locale, defaultLanguage.code, UI_KEYS),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <Suspense>
        <SearchPage
          locale={locale}
          defaultLocale={defaultLanguage.code}
          data={data}
          basePath={`/${locale}/search`}
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
