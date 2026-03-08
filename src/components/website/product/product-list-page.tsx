import { Suspense } from 'react';
import Link from 'next/link';

import { buildLocalizedPath } from '@/lib/i18n';
import type {
  PublicCategoryTreeNode,
  PublicProductListResult,
  PublicTagItem,
  ProductSortOption,
} from '@/server/services/product-public.service';
import { Breadcrumb } from '@/components/website/layout/breadcrumb';
import { ProductCard } from './product-card';
import { CategoryTree } from './category-tree';
import { TagFilter, SortSelect } from './product-filters';

export interface ProductListPageUiLabels {
  home: string;
  products: string;
  allProducts: string;
  sortNewest: string;
  sortPopular: string;
  sortNameAsc: string;
  sortNameDesc: string;
  noProducts: string;
  totalCount: string;
  categories: string;
  addToInquiry: string;
}

interface ProductListPageProps {
  locale: string;
  defaultLocale: string;
  data: PublicProductListResult;
  categoryTree: PublicCategoryTreeNode[];
  tags: PublicTagItem[];
  basePath: string;
  productsBasePath: string;
  activeTagSlug?: string;
  currentSort: ProductSortOption;
  uiLabels: ProductListPageUiLabels;
}

function buildPageHref(basePath: string, page: number, searchParams: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function ProductListPage({
  locale,
  defaultLocale,
  data,
  categoryTree,
  tags,
  basePath,
  productsBasePath,
  activeTagSlug,
  currentSort,
  uiLabels,
}: ProductListPageProps) {
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

  const filterParams: Record<string, string | undefined> = {
    tag: activeTagSlug,
    sort: currentSort !== 'newest' ? currentSort : undefined,
  };

  return (
    <div>
      <Breadcrumb items={crumbs} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar: category tree */}
          <aside className="w-full shrink-0 lg:w-60">
            <div className="sticky top-20 space-y-4">
              <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {uiLabels.categories}
              </h2>
              <CategoryTree
                tree={categoryTree}
                basePath={productsBasePath}
                activeCategorySlug={data.category?.slug}
                allProductsLabel={uiLabels.allProducts}
                totalProductCount={data.total}
              />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0 flex-1">
            {/* Toolbar: tags + sort */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Suspense>
                <div className="flex-1 overflow-x-auto">
                  <TagFilter tags={tags} activeTagSlug={activeTagSlug} basePath={basePath} />
                </div>
              </Suspense>
              <div className="flex items-center gap-3">
                <span className="whitespace-nowrap text-sm text-muted-foreground">
                  {uiLabels.totalCount.replace('{count}', String(data.total))}
                </span>
                <Suspense>
                  <SortSelect
                    currentSort={currentSort}
                    basePath={basePath}
                    labels={{
                      newest: uiLabels.sortNewest,
                      popular: uiLabels.sortPopular,
                      nameAsc: uiLabels.sortNameAsc,
                      nameDesc: uiLabels.sortNameDesc,
                    }}
                  />
                </Suspense>
              </div>
            </div>

            {/* Product grid */}
            {data.items.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((item) => {
                  const href = buildLocalizedPath(
                    `/products/${item.primaryCategorySlug}/${item.slug}`,
                    locale,
                    defaultLocale,
                  );
                  return <ProductCard key={item.id} item={item} href={href} addToBasketLabel={uiLabels.addToInquiry} />;
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                {uiLabels.noProducts}
              </div>
            )}

            {/* Pagination */}
            {data.totalPages > 1 ? (
              <div className="mt-6 flex items-center justify-center gap-2">
                {data.page > 1 ? (
                  <Link
                    href={buildPageHref(basePath, data.page - 1, filterParams)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    ‹
                  </Link>
                ) : null}
                <span className="text-sm text-muted-foreground">
                  {data.page} / {data.totalPages}
                </span>
                {data.page < data.totalPages ? (
                  <Link
                    href={buildPageHref(basePath, data.page + 1, filterParams)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    ›
                  </Link>
                ) : null}
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
