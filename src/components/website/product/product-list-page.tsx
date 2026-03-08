import Link from 'next/link';

import { buildLocalizedPath } from '@/lib/i18n';
import type { PublicProductListResult } from '@/server/services/product-public.service';
import { Breadcrumb } from '@/components/website/layout/breadcrumb';
import { ProductCard } from './product-card';

interface ProductListPageProps {
  locale: string;
  defaultLocale: string;
  data: PublicProductListResult;
  basePath: string;
  uiLabels: {
    home: string;
    products: string;
  };
}

function buildPageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

export function ProductListPage({ locale, defaultLocale, data, basePath, uiLabels }: ProductListPageProps) {
  const homeHref = buildLocalizedPath('/', locale, defaultLocale);
  const productsHref = buildLocalizedPath('/products', locale, defaultLocale);

  const crumbs = data.category
    ? [
        { label: uiLabels.home, href: homeHref },
        { label: uiLabels.products, href: productsHref },
        { label: data.category.name },
      ]
    : [
        { label: uiLabels.home, href: homeHref },
        { label: uiLabels.products },
      ];

  return (
    <div>
      <Breadcrumb items={crumbs} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {data.items.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => {
              const href = buildLocalizedPath(
                `/products/${item.primaryCategorySlug}/${item.slug}`,
                locale,
                defaultLocale,
              );
              return <ProductCard key={item.id} item={item} href={href} />;
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
            —
          </div>
        )}

        {data.totalPages > 1 ? (
          <div className="mt-6 flex items-center justify-center gap-2">
            {data.page > 1 ? (
              <Link
                href={buildPageHref(basePath, data.page - 1)}
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
              >
                ‹
              </Link>
            ) : null}
            <span className="text-sm text-muted-foreground">
              {data.page} / {data.totalPages}
            </span>
            {data.page < data.totalPages ? (
              <Link
                href={buildPageHref(basePath, data.page + 1)}
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent"
              >
                ›
              </Link>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}
