import type { Metadata } from 'next';

export const revalidate = 3600;

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { SectionRenderer } from '@/components/website/sections/section-renderer';
import { OrganizationJsonLd, WebSiteJsonLd } from '@/components/website/seo/json-ld';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedPublicSiteInfo,
} from '@/lib/data-cache';
import {
  getPageSectionsForRender,
  getPublishedHomepagePageId,
} from '@/server/services/section.service';

export async function generateMetadata(): Promise<Metadata> {
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const locale = defaultLanguage.code;
  const siteInfo = await getCachedPublicSiteInfo(locale, locale);

  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === locale,
  }));

  return buildSeoMetadata({
    title: siteInfo.siteName,
    siteName: siteInfo.siteName,
    description: siteInfo.siteDescription,
    keywords: siteInfo.seoKeywords,
    canonicalPath: '/',
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: '/',
    ogImage: siteInfo.ogImageUrl,
  });
}

export default async function Home() {
  const defaultLanguage = await getCachedDefaultLanguage();
  const locale = defaultLanguage.code;
  const pageId = await getPublishedHomepagePageId();

  if (!pageId) {
    return <main className="min-h-screen" />;
  }

  const [sections, siteInfo] = await Promise.all([
    getPageSectionsForRender(pageId, locale, defaultLanguage.code),
    getCachedPublicSiteInfo(locale, locale),
  ]);

  const socials = [
    siteInfo.socialFacebook,
    siteInfo.socialLinkedin,
    siteInfo.socialYoutube,
    siteInfo.socialInstagram,
  ].filter(Boolean) as string[];

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <OrganizationJsonLd
        name={siteInfo.companyName ?? siteInfo.siteName}
        logo={siteInfo.logoUrl}
        email={siteInfo.contactEmail}
        phone={siteInfo.contactPhone}
        address={siteInfo.address}
        socials={socials}
      />
      <WebSiteJsonLd name={siteInfo.siteName} searchPath="/search" />
      <main>
        <SectionRenderer sections={sections} />
      </main>
    </WebsiteShell>
  );
}
