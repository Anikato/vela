import type { Metadata } from 'next';

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

export async function generateMetadata(): Promise<Metadata> {
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const locale = defaultLanguage.code;
  const [siteInfo, uiMap] = await Promise.all([
    getCachedPublicSiteInfo(locale, locale),
    getCachedUiTranslationMap(locale, locale, ['nav.news']),
  ]);
  const pageTitle = uiMap['nav.news'] ?? 'News';
  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === locale,
  }));

  return buildSeoMetadata({
    title: `${pageTitle} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: siteInfo.siteDescription,
    canonicalPath: '/news',
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: '/news',
    ogImage: siteInfo.ogImageUrl,
  });
}

const UI_KEYS = ['nav.home', 'nav.news', 'news.noNews', 'news.readMore'];

interface NewsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const { page } = await searchParams;
  const pageNum = page ? Number(page) : 1;

  const defaultLanguage = await getCachedDefaultLanguage();
  const locale = defaultLanguage.code;

  const [data, uiMap, systemSections] = await Promise.all([
    getPublishedNewsList(locale, locale, {
      page: Number.isFinite(pageNum) ? pageNum : 1,
    }),
    getCachedUiTranslationMap(locale, locale, UI_KEYS),
    getSystemRouteSectionsForRender('news', locale, locale),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={locale}>
      {systemSections.length > 0 && (
        <SectionRenderer sections={systemSections} />
      )}
      <NewsListPage
        locale={locale}
        defaultLocale={locale}
        data={data}
        basePath="/news"
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
