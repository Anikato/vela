import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

import { getTranslation } from '@/lib/i18n';
import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { SectionRenderer } from '@/components/website/sections/section-renderer';
import { BreadcrumbJsonLd } from '@/components/website/seo/json-ld';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedPublicSiteInfo,
} from '@/lib/data-cache';
import { getPublishedPageBySlug } from '@/server/services/page.service';
import { getPageSectionsForRender } from '@/server/services/section.service';

interface LocaleCustomPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: LocaleCustomPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getPublishedPageBySlug(slug);
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
    title: `${t?.seoTitle || t?.title || slug} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: t?.seoDescription || siteInfo.siteDescription,
    canonicalPath: `/${locale}/${slug}`,
    locale,
    defaultLocale: defaultLanguage.code,
    activeLocales,
    pagePath: `/${slug}`,
    ogImage: siteInfo.ogImageUrl,
  });
}

export default async function LocaleCustomPage({ params }: LocaleCustomPageProps) {
  const { locale, slug } = await params;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getCachedActiveLanguages(),
    getCachedDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  const sections = await getPageSectionsForRender(page.id, locale, defaultLanguage.code);

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: `/${locale}` },
          { name: getTranslation(page.translations, locale, defaultLanguage.code)?.title ?? slug },
        ]}
      />
      <main>
        <SectionRenderer sections={sections} />
      </main>
    </WebsiteShell>
  );
}
