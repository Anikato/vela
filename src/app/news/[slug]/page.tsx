import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/website/seo/json-ld';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { NewsDetailPage } from '@/components/website/news/news-detail-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getPublishedNewsBySlug } from '@/server/services/news.service';
import { getPublicSiteInfo } from '@/server/services/settings-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

const UI_KEYS = ['nav.home', 'nav.news'];

interface NewsDetailRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getDefaultLanguage(),
    getActiveLanguages(),
  ]);
  const locale = defaultLanguage.code;
  const [article, siteInfo] = await Promise.all([
    getPublishedNewsBySlug(slug, locale, locale),
    getPublicSiteInfo(locale, locale),
  ]);
  if (!article) return { title: 'Not Found' };

  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === locale,
  }));

  return buildSeoMetadata({
    title: `${article.title} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: article.seoDescription ?? article.summary,
    canonicalPath: `/news/${slug}`,
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: `/news/${slug}`,
    ogImage: article.coverImage?.url ?? siteInfo.ogImageUrl,
    ogType: 'article',
    publishedTime: article.publishedAt?.toISOString(),
  });
}

export default async function NewsDetailRoute({ params }: NewsDetailRouteProps) {
  const { slug } = await params;

  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const [article, uiMap] = await Promise.all([
    getPublishedNewsBySlug(slug, locale, locale),
    getUiTranslationMap(locale, locale, UI_KEYS),
  ]);

  if (!article) notFound();

  const homeLabel = uiMap['nav.home'] ?? 'Home';
  const newsLabel = uiMap['nav.news'] ?? 'News';

  return (
    <WebsiteShell locale={locale} defaultLocale={locale}>
      <BreadcrumbJsonLd
        items={[
          { name: homeLabel, href: '/' },
          { name: newsLabel, href: '/news' },
          { name: article.title },
        ]}
      />
      <ArticleJsonLd
        title={article.title}
        description={article.summary}
        url={`/news/${slug}`}
        image={article.coverImage?.url}
        publishedTime={article.publishedAt?.toISOString()}
      />
      <NewsDetailPage
        locale={locale}
        defaultLocale={locale}
        article={article}
        uiLabels={{ home: homeLabel, news: newsLabel }}
      />
    </WebsiteShell>
  );
}
