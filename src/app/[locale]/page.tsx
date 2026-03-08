import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { SectionRenderer } from '@/components/website/sections/section-renderer';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedPublicSiteInfo,
} from '@/lib/data-cache';
import {
  getPageSectionsForRender,
  getPublishedHomepagePageId,
} from '@/server/services/section.service';

interface LocaleHomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const siteInfo = await getCachedPublicSiteInfo(locale, defaultLanguage.code);
  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === defaultLanguage.code,
  }));

  return buildSeoMetadata({
    title: siteInfo.siteName,
    siteName: siteInfo.siteName,
    description: siteInfo.siteDescription,
    keywords: siteInfo.seoKeywords,
    canonicalPath: `/${locale}`,
    locale,
    defaultLocale: defaultLanguage.code,
    activeLocales,
    pagePath: '/',
    ogImage: siteInfo.ogImageUrl,
  });
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  const [activeLanguages, defaultLanguage] = await Promise.all([
    getCachedActiveLanguages(),
    getCachedDefaultLanguage(),
  ]);

  const localeSet = new Set(activeLanguages.map((item) => item.code));
  if (!localeSet.has(locale)) {
    notFound();
  }

  const pageId = await getPublishedHomepagePageId();
  if (!pageId) {
    return <main className="min-h-screen" />;
  }

  const sections = await getPageSectionsForRender(pageId, locale, defaultLanguage.code);
  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <main>
        <SectionRenderer sections={sections} />
      </main>
    </WebsiteShell>
  );
}
