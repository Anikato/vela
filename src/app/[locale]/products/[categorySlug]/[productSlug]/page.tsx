import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { BreadcrumbJsonLd, ProductJsonLd } from '@/components/website/seo/json-ld';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductDetailPage } from '@/components/website/product/product-detail-page';
import {
  getCachedActiveLanguages,
  getCachedDefaultLanguage,
  getCachedCaptchaSiteKey,
  getCachedPublicFormFields,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';
import {
  getPublishedProductDetailBySlug,
  getRelatedPublishedProducts,
} from '@/server/services/product-public.service';

const PRODUCT_DETAIL_UI_KEYS = [
  'nav.home',
  'nav.products',
  'product.addToInquiry',
  'product.sendInquiry',
  'product.relatedProducts',
  'product.specifications',
  'product.videos',
  'product.attachments',
  'product.moq',
  'product.leadTime',
  'product.tradeTerms',
  'product.paymentTerms',
  'product.packaging',
  'product.customization',
  'product.customizationYes',
  'product.customizationNo',
  'product.days',
  'inquiry.formTitle',
  'inquiry.name',
  'inquiry.email',
  'inquiry.phone',
  'inquiry.company',
  'inquiry.country',
  'inquiry.message',
  'inquiry.submit',
  'common.cancel',
  'inquiry.success',
  'inquiry.error',
];

interface LocaleProductDetailRoutePageProps {
  params: Promise<{ locale: string; categorySlug: string; productSlug: string }>;
}

export async function generateMetadata({ params }: LocaleProductDetailRoutePageProps): Promise<Metadata> {
  const { locale, categorySlug, productSlug } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const [product, siteInfo] = await Promise.all([
    getPublishedProductDetailBySlug(productSlug, locale, defaultLanguage.code),
    getCachedPublicSiteInfo(locale, defaultLanguage.code),
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
    getCachedActiveLanguages(),
    getCachedDefaultLanguage(),
  ]);
  const localeSet = new Set(activeLanguages.map((item) => item.code));
  if (!localeSet.has(locale)) notFound();

  const product = await getPublishedProductDetailBySlug(productSlug, locale, defaultLanguage.code);
  if (!product) notFound();

  const normalizedCategorySlug = categorySlug.trim().toLowerCase();
  const isPrimary = normalizedCategorySlug === product.primaryCategory.slug;
  const matchedAdditional = product.additionalCategories.find(
    (c) => c.slug === normalizedCategorySlug,
  );
  if (!isPrimary && !matchedAdditional) notFound();

  const currentCategoryName = isPrimary
    ? product.primaryCategory.name
    : (matchedAdditional?.name ?? product.primaryCategory.name);

  const [relatedProducts, uiMap, captchaSiteKey, customFormFields] = await Promise.all([
    getRelatedPublishedProducts(locale, defaultLanguage.code, {
      productId: product.id,
      primaryCategoryId: product.primaryCategory.id,
      limit: 6,
    }),
    getCachedUiTranslationMap(locale, defaultLanguage.code, PRODUCT_DETAIL_UI_KEYS),
    getCachedCaptchaSiteKey(),
    getCachedPublicFormFields(locale, defaultLanguage.code),
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
        captchaSiteKey={captchaSiteKey}
        customFormFields={customFormFields}
        uiLabels={{
          home: homeLabel,
          products: productsLabel,
          addToBasket: uiMap['product.addToInquiry'] ?? 'Add to Inquiry',
          sendInquiry: uiMap['product.sendInquiry'] ?? 'Send Inquiry',
          relatedProducts: uiMap['product.relatedProducts'] ?? 'Related Products',
          specifications: uiMap['product.specifications'] ?? 'Specifications',
          videos: uiMap['product.videos'] ?? 'Videos',
          attachments: uiMap['product.attachments'] ?? 'Downloads',
          moq: uiMap['product.moq'] ?? 'MOQ',
          leadTime: uiMap['product.leadTime'] ?? 'Lead Time',
          tradeTerms: uiMap['product.tradeTerms'] ?? 'Trade Terms',
          paymentTerms: uiMap['product.paymentTerms'] ?? 'Payment Terms',
          packaging: uiMap['product.packaging'] ?? 'Packaging',
          customization: uiMap['product.customization'] ?? 'Customization',
          customizationYes: uiMap['product.customizationYes'] ?? 'Supported',
          customizationNo: uiMap['product.customizationNo'] ?? 'Not Available',
          days: uiMap['product.days'] ?? 'days',
          formTitle: uiMap['inquiry.formTitle'] ?? 'Send Inquiry',
          formName: uiMap['inquiry.name'] ?? 'Name',
          formEmail: uiMap['inquiry.email'] ?? 'Email',
          formPhone: uiMap['inquiry.phone'] ?? 'Phone',
          formCompany: uiMap['inquiry.company'] ?? 'Company',
          formCountry: uiMap['inquiry.country'] ?? 'Country',
          formMessage: uiMap['inquiry.message'] ?? 'Message',
          formSubmit: uiMap['inquiry.submit'] ?? 'Submit',
          formCancel: uiMap['common.cancel'] ?? 'Cancel',
          formSuccess: uiMap['inquiry.success'] ?? 'Inquiry submitted successfully!',
          formError: uiMap['inquiry.error'] ?? 'Failed to submit inquiry',
        }}
      />
    </WebsiteShell>
  );
}
