import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/website/seo/json-ld';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductDetailPage } from '@/components/website/product/product-detail-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import {
  getPublishedProductDetailBySlug,
  getRelatedPublishedProducts,
} from '@/server/services/product-public.service';
import { getPublicSiteInfo } from '@/server/services/settings-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

interface LocaleProductDetailRoutePageProps {
  params: Promise<{ locale: string; categorySlug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: LocaleProductDetailRoutePageProps): Promise<Metadata> {
  const { locale, categorySlug, productSlug } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getDefaultLanguage(),
    getActiveLanguages(),
  ]);
  const [product, siteInfo] = await Promise.all([
    getPublishedProductDetailBySlug(productSlug, locale, defaultLanguage.code),
    getPublicSiteInfo(locale, defaultLanguage.code),
  ]);
  if (!product) return { title: 'Not Found' };

  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === defaultLanguage.code,
  }));

  return buildSeoMetadata({
    title: `${product.name} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: product.shortDescription ?? product.seoDescription,
    canonicalPath: `/${locale}/products/${categorySlug}/${productSlug}`,
    locale,
    defaultLocale: defaultLanguage.code,
    activeLocales,
    pagePath: `/products/${categorySlug}/${productSlug}`,
    ogImage: product.featuredImage?.url ?? siteInfo.ogImageUrl,
    ogType: 'product',
  });
}

export default async function LocaleProductDetailRoutePage({
  params,
}: LocaleProductDetailRoutePageProps) {
  const { locale, categorySlug, productSlug } = await params;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ]);
  const localeSet = new Set(activeLanguages.map((item) => item.code));
  if (!localeSet.has(locale)) {
    notFound();
  }

  const product = await getPublishedProductDetailBySlug(
    productSlug,
    locale,
    defaultLanguage.code,
  );
  if (!product) {
    notFound();
  }

  const normalizedCategorySlug = categorySlug.trim().toLowerCase();
  const isPrimary = normalizedCategorySlug === product.primaryCategory.slug;
  const matchedAdditional = product.additionalCategories.find(
    (item) => item.slug === normalizedCategorySlug,
  );
  if (!isPrimary && !matchedAdditional) {
    notFound();
  }

  const currentCategoryName = isPrimary
    ? product.primaryCategory.name
    : (matchedAdditional?.name ?? product.primaryCategory.name);
  const [relatedProducts, uiMap] = await Promise.all([
    getRelatedPublishedProducts(locale, defaultLanguage.code, {
      productId: product.id,
      primaryCategoryId: product.primaryCategory.id,
      limit: 6,
    }),
    getUiTranslationMap(locale, defaultLanguage.code, ['nav.home', 'nav.products']),
  ]);

  const homeLabel = uiMap['nav.home'] ?? 'Home';
  const productsLabel = uiMap['nav.products'] ?? 'Products';
  const localePath = (p: string) => `/${locale}${p}`;

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <BreadcrumbJsonLd
        items={[
          { name: homeLabel, href: localePath('/') === `/${locale}/` ? `/${locale}` : localePath('/') },
          { name: productsLabel, href: localePath('/products') },
          { name: currentCategoryName, href: localePath(`/products/${categorySlug}`) },
          { name: product.name },
        ]}
      />
      <ProductJsonLd
        name={product.name}
        description={product.shortDescription}
        sku={product.sku}
        image={product.featuredImage?.url}
        url={localePath(`/products/${categorySlug}/${productSlug}`)}
      />
      <ProductDetailPage
        locale={locale}
        defaultLocale={defaultLanguage.code}
        product={product}
        currentCategoryName={currentCategoryName}
        relatedProducts={relatedProducts}
        uiLabels={{ home: homeLabel, products: productsLabel }}
      />
    </WebsiteShell>
  );
}
