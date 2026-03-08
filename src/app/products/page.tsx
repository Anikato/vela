import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductListPage } from '@/components/website/product/product-list-page';
import { getDefaultLanguage } from '@/server/services/language.service';
import { getPublishedProductList } from '@/server/services/product-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

interface ProductsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page } = await searchParams;
  const pageNum = page ? Number(page) : 1;

  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;
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
        basePath="/products"
        uiLabels={{
          home: uiMap['nav.home'] ?? 'Home',
          products: uiMap['nav.products'] ?? 'Products',
        }}
      />
    </WebsiteShell>
  );
}
