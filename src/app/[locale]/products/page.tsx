import { notFound } from 'next/navigation';

import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductListPage } from '@/components/website/product/product-list-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getPublishedProductList } from '@/server/services/product-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

interface LocaleProductsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function LocaleProductsPage({
  params,
  searchParams,
}: LocaleProductsPageProps) {
  const [{ locale }, { page }] = await Promise.all([params, searchParams]);
  const pageNum = page ? Number(page) : 1;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ]);
  const localeSet = new Set(activeLanguages.map((item) => item.code));
  if (!localeSet.has(locale)) {
    notFound();
  }

  const [data, uiMap] = await Promise.all([
    getPublishedProductList(locale, defaultLanguage.code, {
      page: Number.isFinite(pageNum) ? pageNum : 1,
    }),
    getUiTranslationMap(locale, defaultLanguage.code, ['nav.home', 'nav.products']),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <ProductListPage
        locale={locale}
        defaultLocale={defaultLanguage.code}
        data={data}
        basePath={`/${locale}/products`}
        uiLabels={{
          home: uiMap['nav.home'] ?? 'Home',
          products: uiMap['nav.products'] ?? 'Products',
        }}
      />
    </WebsiteShell>
  );
}
