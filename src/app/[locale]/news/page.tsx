import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { NewsListPage } from '@/components/website/news/news-list-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getPublishedNewsList } from '@/server/services/news.service';
import { getPublicSiteInfo } from '@/server/services/settings-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

interface LocaleNewsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: LocaleNewsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getDefaultLanguage(),
    getActiveLanguages(),
  ]);
  const [siteInfo, uiMap] = await Promise.all([
    getPublicSiteInfo(locale, defaultLanguage.code),
    getUiTranslationMap(locale, defaultLanguage.code, ['nav.news']),
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
    getActiveLanguages(),
    getDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const [data, uiMap] = await Promise.all([
    getPublishedNewsList(locale, defaultLanguage.code, {
      page: Number.isFinite(pageNum) ? pageNum : 1,
    }),
    getUiTranslationMap(locale, defaultLanguage.code, UI_KEYS),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
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
