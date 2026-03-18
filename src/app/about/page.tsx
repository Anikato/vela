import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageBySlug(ABOUT_SLUG);
  if (!page) return {};

  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const locale = defaultLanguage.code;
  const siteInfo = await getCachedPublicSiteInfo(locale, locale);
  const t = getTranslation(page.translations, locale, locale);

  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === locale,
  }));

  return buildSeoMetadata({
    title: `${t?.seoTitle || t?.title || 'About'} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: t?.seoDescription || siteInfo.siteDescription,
    canonicalPath: '/about',
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: '/about',
    ogImage: siteInfo.ogImageUrl,
  });
}

export default async function AboutPage() {
  const page = await getPublishedPageBySlug(ABOUT_SLUG);
  if (!page) notFound();

  const defaultLanguage = await getCachedDefaultLanguage();
  const locale = defaultLanguage.code;

  const [sections, uiMap] = await Promise.all([
    getPageSectionsForRender(page.id, locale, locale),
    getCachedUiTranslationMap(locale, locale, ['nav.home', 'nav.about']),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={locale}>
      <BreadcrumbJsonLd
        items={[
          { name: uiMap['nav.home'] ?? 'Home', href: '/' },
          { name: getTranslation(page.translations, locale, locale)?.title ?? uiMap['nav.about'] ?? 'About' },
        ]}
      />
      <main>
        <SectionRenderer sections={sections} />
      </main>
    </WebsiteShell>
  );
}
