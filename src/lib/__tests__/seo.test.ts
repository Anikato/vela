import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getBaseUrl,
  buildAbsoluteUrl,
  buildHreflangLinks,
  buildSeoMetadata,
  type AlternateLocale,
} from '../seo';

// NEXT_PUBLIC_SITE_URL is read at module-load time from process.env.
// The module uses `?? 'http://localhost:3100'` as fallback.

describe('getBaseUrl', () => {
  it('returns localhost fallback when env is unset', () => {
    expect(getBaseUrl()).toMatch(/^https?:\/\//);
  });

  it('strips trailing slash', () => {
    const url = getBaseUrl();
    expect(url.endsWith('/')).toBe(false);
  });
});

describe('buildAbsoluteUrl', () => {
  it('builds absolute URL from path', () => {
    const url = buildAbsoluteUrl('/products/pumps');
    expect(url).toBe(`${getBaseUrl()}/products/pumps`);
  });

  it('adds leading slash if missing', () => {
    const url = buildAbsoluteUrl('about');
    expect(url).toBe(`${getBaseUrl()}/about`);
  });

  it('handles root path', () => {
    const url = buildAbsoluteUrl('/');
    expect(url).toBe(`${getBaseUrl()}/`);
  });
});

describe('buildHreflangLinks', () => {
  const locales: AlternateLocale[] = [
    { code: 'en-US', isDefault: true },
    { code: 'zh-CN', isDefault: false },
    { code: 'es-ES', isDefault: false },
  ];
  const defaultLocale = 'en-US';

  it('generates links for all locales', () => {
    const links = buildHreflangLinks('/products', locales, defaultLocale);
    expect(links['en-US']).toBe(`${getBaseUrl()}/products`);
    expect(links['zh-CN']).toBe(`${getBaseUrl()}/zh-CN/products`);
    expect(links['es-ES']).toBe(`${getBaseUrl()}/es-ES/products`);
  });

  it('includes x-default pointing to default locale URL', () => {
    const links = buildHreflangLinks('/products', locales, defaultLocale);
    expect(links['x-default']).toBe(`${getBaseUrl()}/products`);
  });

  it('handles root path', () => {
    const links = buildHreflangLinks('/', locales, defaultLocale);
    expect(links['en-US']).toBe(`${getBaseUrl()}/`);
    expect(links['zh-CN']).toBe(`${getBaseUrl()}/zh-CN/`);
    expect(links['x-default']).toBe(`${getBaseUrl()}/`);
  });
});

describe('buildSeoMetadata', () => {
  const baseOptions = {
    title: 'Water Pump X100 | Vela',
    siteName: 'Vela',
    description: 'Industrial water pump',
    canonicalPath: '/products/pumps/pump-x100',
    locale: 'en-US',
    defaultLocale: 'en-US',
    activeLocales: [
      { code: 'en-US', isDefault: true },
      { code: 'zh-CN', isDefault: false },
    ] as AlternateLocale[],
    pagePath: '/products/pumps/pump-x100',
  };

  it('sets title and description', () => {
    const meta = buildSeoMetadata(baseOptions);
    expect(meta.title).toBe('Water Pump X100 | Vela');
    expect(meta.description).toBe('Industrial water pump');
  });

  it('sets canonical URL', () => {
    const meta = buildSeoMetadata(baseOptions);
    expect(meta.alternates?.canonical).toBe(
      `${getBaseUrl()}/products/pumps/pump-x100`,
    );
  });

  it('sets hreflang alternates', () => {
    const meta = buildSeoMetadata(baseOptions);
    const langs = meta.alternates?.languages as Record<string, string>;
    expect(langs['en-US']).toContain('/products/pumps/pump-x100');
    expect(langs['zh-CN']).toContain('/zh-CN/products/pumps/pump-x100');
    expect(langs['x-default']).toContain('/products/pumps/pump-x100');
  });

  it('sets Open Graph metadata', () => {
    const meta = buildSeoMetadata(baseOptions);
    expect(meta.openGraph?.title).toBe('Water Pump X100 | Vela');
    expect(meta.openGraph?.siteName).toBe('Vela');
    expect(meta.openGraph?.locale).toBe('en-US');
  });

  it('sets Twitter Card metadata', () => {
    const meta = buildSeoMetadata(baseOptions);
    expect((meta.twitter as Record<string, unknown>)?.card).toBe('summary_large_image');
    expect(meta.twitter?.title).toBe('Water Pump X100 | Vela');
  });

  it('includes OG image when provided', () => {
    const meta = buildSeoMetadata({
      ...baseOptions,
      ogImage: '/uploads/pump.webp',
    });
    const images = meta.openGraph?.images as Array<{ url: string }>;
    expect(images?.[0]?.url).toBe(`${getBaseUrl()}/uploads/pump.webp`);
  });

  it('omits OG image when null', () => {
    const meta = buildSeoMetadata({ ...baseOptions, ogImage: null });
    expect(meta.openGraph?.images).toBeUndefined();
  });

  it('sets noindex robots when specified', () => {
    const meta = buildSeoMetadata({ ...baseOptions, noindex: true });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it('does not set robots when noindex is false', () => {
    const meta = buildSeoMetadata({ ...baseOptions, noindex: false });
    expect(meta.robots).toBeUndefined();
  });

  it('handles null description gracefully', () => {
    const meta = buildSeoMetadata({ ...baseOptions, description: null });
    expect(meta.description).toBeUndefined();
  });

  it('sets article OG type when specified', () => {
    const meta = buildSeoMetadata({ ...baseOptions, ogType: 'article' });
    expect((meta.openGraph as Record<string, unknown>)?.type).toBe('article');
  });

  it('includes publishedTime for articles', () => {
    const meta = buildSeoMetadata({
      ...baseOptions,
      ogType: 'article',
      publishedTime: '2026-03-01T00:00:00Z',
    });
    expect((meta.openGraph as Record<string, unknown>)?.publishedTime).toBe(
      '2026-03-01T00:00:00Z',
    );
  });
});
