import Image from 'next/image';
import Link from 'next/link';

import { buildLocalizedPath } from '@/lib/i18n';
import type { PublicNewsListResult } from '@/server/services/news.service';
import { Breadcrumb } from '@/components/website/layout/breadcrumb';

export interface NewsListPageUiLabels {
  home: string;
  news: string;
  noNews: string;
  readMore: string;
}

interface NewsListPageProps {
  locale: string;
  defaultLocale: string;
  data: PublicNewsListResult;
  basePath: string;
  uiLabels: NewsListPageUiLabels;
}

export function NewsListPage({
  locale,
  defaultLocale,
  data,
  basePath,
  uiLabels,
}: NewsListPageProps) {
  const homeHref = buildLocalizedPath('/', locale, defaultLocale);

  const crumbs = [
    { label: uiLabels.home, href: homeHref },
    { label: uiLabels.news },
  ];

  return (
    <div>
      <Breadcrumb items={crumbs} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {data.items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => {
              const href = buildLocalizedPath(`/news/${item.slug}`, locale, defaultLocale);
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="group overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="relative aspect-[16/9] bg-muted/30">
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage.url}
                        alt={item.coverImage.alt || item.title}
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    {item.publishedAt ? (
                      <time className="text-xs text-muted-foreground">
                        {new Date(item.publishedAt).toLocaleDateString(locale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    ) : null}
                    <h2 className="mt-1.5 line-clamp-2 text-lg font-semibold leading-snug">
                      {item.title}
                    </h2>
                    {item.summary ? (
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {item.summary}
                      </p>
                    ) : null}
                    <span className="mt-3 inline-block text-sm font-medium text-primary">
                      {uiLabels.readMore} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
            {uiLabels.noNews}
          </div>
        )}

        {/* Pagination */}
        {data.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-2">
            {data.page > 1 ? (
              <Link
                href={data.page === 2 ? basePath : `${basePath}?page=${data.page - 1}`}
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
                href={`${basePath}?page=${data.page + 1}`}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
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
