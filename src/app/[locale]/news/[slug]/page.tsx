import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/website/seo/json-ld';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { NewsDetailPage } from '@/components/website/news/news-detail-page';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';
import { getPublishedNewsBySlug } from '@/server/services/news.service';

const UI_KEYS = ['nav.home', 'nav.news'];

interface LocaleNewsDetailProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: LocaleNewsDetailProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const [article, siteInfo] = await Promise.all([
    getPublishedNewsBySlug(slug, locale, defaultLanguage.code),
    getCachedPublicSiteInfo(locale, defaultLanguage.code),
  ]);
  if (!article) return { title: 'Not Found' };

  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === defaultLanguage.code,
  }));

  return buildSeoMetadata({
    title: `${article.title} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: article.seoDescription ?? article.summary,
    canonicalPath: `/${locale}/news/${slug}`,
    locale,
    defaultLocale: defaultLanguage.code,
    activeLocales,
    pagePath: `/news/${slug}`,
    ogImage: article.coverImage?.url ?? siteInfo.ogImageUrl,
    ogType: 'article',
    publishedTime: article.publishedAt?.toISOString(),
  });
}

export default async function LocaleNewsDetailPage({ params }: LocaleNewsDetailProps) {
  const { locale, slug } = await params;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getCachedActiveLanguages(),
    getCachedDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const [article, uiMap] = await Promise.all([
    getPublishedNewsBySlug(slug, locale, defaultLanguage.code),
    getCachedUiTranslationMap(locale, defaultLanguage.code, UI_KEYS),
  ]);

  if (!article) notFound();

  const homeLabel = uiMap['nav.home'] ?? 'Home';
  const newsLabel = uiMap['nav.news'] ?? 'News';

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <BreadcrumbJsonLd
        items={[
          { name: homeLabel, href: `/${locale}` },
          { name: newsLabel, href: `/${locale}/news` },
          { name: article.title },
        ]}
      />
      <ArticleJsonLd
        title={article.title}
        description={article.summary}
        url={`/${locale}/news/${slug}`}
        image={article.coverImage?.url}
        publishedTime={article.publishedAt?.toISOString()}
      />
      <NewsDetailPage
        locale={locale}
        defaultLocale={defaultLanguage.code}
        article={article}
        uiLabels={{ home: homeLabel, news: newsLabel }}
      />
    </WebsiteShell>
  );
}
