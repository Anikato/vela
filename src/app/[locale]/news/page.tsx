import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { SectionRenderer } from '@/components/website/sections/section-renderer';
import { NewsListPage } from '@/components/website/news/news-list-page';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';
import { getPublishedNewsList } from '@/server/services/news.service';
import { getSystemRouteSectionsForRender } from '@/server/services/section.service';

interface LocaleNewsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: LocaleNewsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const [siteInfo, uiMap] = await Promise.all([
    getCachedPublicSiteInfo(locale, defaultLanguage.code),
    getCachedUiTranslationMap(locale, defaultLanguage.code, ['nav.news']),
  ]);
  const pageTitle = uiMap['nav.news'] ?? 'News';
  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === defaultLanguage.code,
  }));

  return buildSeoMetadata({
    title: `${pageTitle} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: siteInfo.siteDescription,
    canonicalPath: `/${locale}/news`,
    locale,
    defaultLocale: defaultLanguage.code,
    activeLocales,
    pagePath: '/news',
    ogImage: siteInfo.ogImageUrl,
  });
}

const UI_KEYS = ['nav.home', 'nav.news', 'news.noNews', 'news.readMore'];

export default async function LocaleNewsPage({ params, searchParams }: LocaleNewsPageProps) {
  const [{ locale }, { page }] = await Promise.all([params, searchParams]);
  const pageNum = page ? Number(page) : 1;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getCachedActiveLanguages(),
    getCachedDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const [data, uiMap, systemSections] = await Promise.all([
    getPublishedNewsList(locale, defaultLanguage.code, {
      page: Number.isFinite(pageNum) ? pageNum : 1,
    }),
    getCachedUiTranslationMap(locale, defaultLanguage.code, UI_KEYS),
    getSystemRouteSectionsForRender('news', locale, defaultLanguage.code),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      {systemSections.length > 0 && (
        <SectionRenderer sections={systemSections} />
      )}
      <NewsListPage
        locale={locale}
        defaultLocale={defaultLanguage.code}
        data={data}
        basePath={`/${locale}/news`}
        uiLabels={{
          home: uiMap['nav.home'] ?? 'Home',
          news: uiMap['nav.news'] ?? 'News',
          noNews: uiMap['news.noNews'] ?? 'No news articles yet',
          readMore: uiMap['news.readMore'] ?? 'Read more',
        }}
      />
    </WebsiteShell>
  );
}
