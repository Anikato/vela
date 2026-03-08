import { notFound } from 'next/navigation';

import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductDetailPage } from '@/components/website/product/product-detail-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import {
  getPublishedProductDetailBySlug,
  getRelatedPublishedProducts,
} from '@/server/services/product-public.service';

interface LocaleProductDetailRoutePageProps {
  params: Promise<{ locale: string; categorySlug: string; productSlug: string }>;
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
  const relatedProducts = await getRelatedPublishedProducts(locale, defaultLanguage.code, {
    productId: product.id,
    primaryCategoryId: product.primaryCategory.id,
    limit: 6,
  });

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <ProductDetailPage
        locale={locale}
        defaultLocale={defaultLanguage.code}
        product={product}
        currentCategoryName={currentCategoryName}
        relatedProducts={relatedProducts}
      />
    </WebsiteShell>
  );
}
