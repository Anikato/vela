import { notFound } from 'next/navigation';

import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ProductListPage } from '@/components/website/product/product-list-page';
import { getDefaultLanguage } from '@/server/services/language.service';
import { getPublishedProductList } from '@/server/services/product-public.service';

interface CategoryProductsPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function CategoryProductsPage({
  params,
  searchParams,
}: CategoryProductsPageProps) {
  const { categorySlug } = await params;
  const { page } = await searchParams;
  const pageNum = page ? Number(page) : 1;

  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;
  const data = await getPublishedProductList(locale, defaultLanguage.code, {
    categorySlug,
    page: Number.isFinite(pageNum) ? pageNum : 1,
  });

  if (!data.category) {
    notFound();
  }

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <ProductListPage
        locale={locale}
        defaultLocale={defaultLanguage.code}
        data={data}
        basePath={`/products/${categorySlug}`}
      />
    </WebsiteShell>
  );
}
