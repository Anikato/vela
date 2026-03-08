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

interface ProductDetailRoutePageProps {
  params: Promise<{ categorySlug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: ProductDetailRoutePageProps): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getDefaultLanguage(),
    getActiveLanguages(),
  ]);
  const locale = defaultLanguage.code;
  const [product, siteInfo] = await Promise.all([
    getPublishedProductDetailBySlug(productSlug, locale, locale),
    getPublicSiteInfo(locale, locale),
  ]);
  if (!product) return { title: 'Not Found' };

  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === locale,
  }));
  const ogImg = product.featuredImage?.url ?? siteInfo.ogImageUrl;

  return buildSeoMetadata({
    title: `${product.name} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: product.shortDescription ?? product.seoDescription,
    canonicalPath: `/products/${categorySlug}/${productSlug}`,
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: `/products/${categorySlug}/${productSlug}`,
    ogImage: ogImg,
    ogType: 'product',
  });
}

export default async function ProductDetailRoutePage({ params }: ProductDetailRoutePageProps) {
  const { categorySlug, productSlug } = await params;
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

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

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <BreadcrumbJsonLd
        items={[
          { name: homeLabel, href: '/' },
          { name: productsLabel, href: '/products' },
          { name: currentCategoryName, href: `/products/${categorySlug}` },
          { name: product.name },
        ]}
      />
      <ProductJsonLd
        name={product.name}
        description={product.shortDescription}
        sku={product.sku}
        image={product.featuredImage?.url}
        url={`/products/${categorySlug}/${productSlug}`}
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
