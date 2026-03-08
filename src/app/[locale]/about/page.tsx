import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTranslation } from '@/lib/i18n';
import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { SectionRenderer } from '@/components/website/sections/section-renderer';
import { BreadcrumbJsonLd } from '@/components/website/seo/json-ld';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';
import { getPublishedPageBySlug } from '@/server/services/page.service';
import { getPageSectionsForRender } from '@/server/services/section.service';

const ABOUT_SLUG = 'about';

interface LocaleAboutPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleAboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPublishedPageBySlug(ABOUT_SLUG);
  if (!page) return {};

  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const siteInfo = await getCachedPublicSiteInfo(locale, defaultLanguage.code);
  const t = getTranslation(page.translations, locale, defaultLanguage.code);

  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === defaultLanguage.code,
  }));

  return buildSeoMetadata({
    title: `${t?.seoTitle || t?.title || 'About'} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: t?.seoDescription || siteInfo.siteDescription,
    canonicalPath: `/${locale}/about`,
    locale,
    defaultLocale: defaultLanguage.code,
    activeLocales,
    pagePath: '/about',
    ogImage: siteInfo.ogImageUrl,
  });
}

export default async function LocaleAboutPage({ params }: LocaleAboutPageProps) {
  const { locale } = await params;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getCachedActiveLanguages(),
    getCachedDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const page = await getPublishedPageBySlug(ABOUT_SLUG);
  if (!page) notFound();

  const [sections, uiMap] = await Promise.all([
    getPageSectionsForRender(page.id, locale, defaultLanguage.code),
    getCachedUiTranslationMap(locale, defaultLanguage.code, ['nav.home', 'nav.about']),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <BreadcrumbJsonLd
        items={[
          { name: uiMap['nav.home'] ?? 'Home', href: `/${locale}` },
          { name: getTranslation(page.translations, locale, defaultLanguage.code)?.title ?? uiMap['nav.about'] ?? 'About' },
        ]}
      />
      <main>
        <SectionRenderer sections={sections} />
      </main>
    </WebsiteShell>
  );
}
