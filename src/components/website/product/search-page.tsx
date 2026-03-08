'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

import { buildLocalizedPath } from '@/lib/i18n';
import type { PublicProductSearchResult } from '@/types/website';
import { ProductCard } from './product-card';

interface SearchPageProps {
  locale: string;
  defaultLocale: string;
  data: PublicProductSearchResult;
  basePath: string;
  uiLabels: {
    placeholder: string;
    searchButton: string;
    noResults: string;
    resultCount: string;
  };
}

export function SearchPage({
  locale,
  defaultLocale,
  data,
  basePath,
  uiLabels,
}: SearchPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputValue, setInputValue] = useState(data.query);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = inputValue.trim();
      if (!q) return;
      const params = new URLSearchParams();
      params.set('q', q);
      router.push(`${basePath}?${params.toString()}`);
    },
    [inputValue, basePath, router],
  );

  function buildPageHref(page: number): string {
    const params = new URLSearchParams();
    if (data.query) params.set('q', data.query);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={uiLabels.placeholder}
              className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {uiLabels.searchButton}
          </button>
        </div>
      </form>

      {/* Results info */}
      {data.query ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {uiLabels.resultCount
            .replace('{count}', String(data.total))
            .replace('{query}', data.query)}
        </p>
      ) : null}

      {/* Results grid */}
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
      ) : data.query ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          {uiLabels.noResults}
        </div>
      ) : null}

      {/* Pagination */}
      {data.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          {data.page > 1 ? (
            <a
              href={buildPageHref(data.page - 1)}
              aria-label="Previous page"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              ‹
            </a>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {data.page} / {data.totalPages}
          </span>
          {data.page < data.totalPages ? (
            <a
              href={buildPageHref(data.page + 1)}
              aria-label="Next page"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              ›
            </a>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
