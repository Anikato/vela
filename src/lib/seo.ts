import type { Metadata } from 'next';

import { buildLocalizedPath } from '@/lib/i18n';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100';

export function getBaseUrl(): string {
  return SITE_URL.replace(/\/$/, '');
}

export function buildAbsoluteUrl(path: string): string {
  return `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface AlternateLocale {
  code: string;
  isDefault: boolean;
}

export function buildHreflangLinks(
  pagePath: string,
  locales: AlternateLocale[],
  defaultLocale: string,
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const loc of locales) {
    const localizedPath = buildLocalizedPath(pagePath, loc.code, defaultLocale);
    languages[loc.code] = buildAbsoluteUrl(localizedPath);
  }

  const defaultPath = buildLocalizedPath(pagePath, defaultLocale, defaultLocale);
  languages['x-default'] = buildAbsoluteUrl(defaultPath);

  return languages;
}

export interface SeoMetadataOptions {
  title: string;
  siteName?: string;
  description?: string | null;
  keywords?: string | null;
  canonicalPath: string;
  locale: string;
  defaultLocale: string;
  activeLocales: AlternateLocale[];
  pagePath: string;
  ogImage?: string | null;
  ogType?: 'website' | 'article';
  publishedTime?: string | null;
  modifiedTime?: string | null;
  noindex?: boolean;
}

export function buildSeoMetadata(options: SeoMetadataOptions): Metadata {
  const {
    title,
    siteName,
    description,
    keywords,
    canonicalPath,
    locale,
    defaultLocale,
    activeLocales,
    pagePath,
    ogImage,
    ogType = 'website',
    publishedTime,
    modifiedTime,
    noindex,
  } = options;

  const canonical = buildAbsoluteUrl(canonicalPath);
  const alternateLanguages = buildHreflangLinks(pagePath, activeLocales, defaultLocale);

  const metadata: Metadata = {
    title,
    description: description ?? undefined,
    keywords: keywords ?? undefined,
    alternates: {
      canonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title,
      description: description ?? undefined,
      url: canonical,
      siteName: siteName ?? undefined,
      locale,
      type: ogType,
      ...(ogImage ? { images: [{ url: buildAbsoluteUrl(ogImage) }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      ...(ogImage ? { images: [buildAbsoluteUrl(ogImage)] } : {}),
    },
  };

  if (noindex) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}
