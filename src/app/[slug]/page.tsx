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

interface CustomPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CustomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
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
    title: `${t?.seoTitle || t?.title || slug} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: t?.seoDescription || siteInfo.siteDescription,
    canonicalPath: `/${slug}`,
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: `/${slug}`,
    ogImage: siteInfo.ogImageUrl,
  });
}

export default async function CustomPageRoute({ params }: CustomPageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  const defaultLanguage = await getCachedDefaultLanguage();
  const locale = defaultLanguage.code;

  const sections = await getPageSectionsForRender(page.id, locale, locale);

  return (
    <WebsiteShell locale={locale} defaultLocale={locale}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: getTranslation(page.translations, locale, locale)?.title ?? slug },
        ]}
      />
      <main>
        <SectionRenderer sections={sections} />
      </main>
    </WebsiteShell>
  );
}
