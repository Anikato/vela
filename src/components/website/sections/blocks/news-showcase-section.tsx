import Image from 'next/image';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

import type { SectionComponentProps, WebsiteSectionNewsCard } from '../types';

export function NewsShowcaseSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const articles = section.data?.news ?? [];

  if (!articles.length && !tr.title && !tr.subtitle) return null;

  const columns = Number(section.config.columns) || 3;
  const layout = section.config.layout === 'list' ? 'list' : 'grid';
  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-10 text-center">
          {tr.title && (
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {tr.title}
            </h2>
          )}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">
              {tr.subtitle}
            </p>
          )}
        </div>
      )}

      {articles.length > 0 && (
        layout === 'list' ? (
          <div className="space-y-6">
            {articles.map((article) => (
              <NewsListCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className={`grid gap-6 ${gridCols}`}>
            {articles.map((article) => (
              <NewsGridCard key={article.id} article={article} />
            ))}
          </div>
        )
      )}

      {tr.buttonText && tr.buttonLink && (
        <div className="mt-8 text-center">
          <Link
            href={tr.buttonLink}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {tr.buttonText} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

function formatDate(isoString: string | null): string {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function NewsGridCard({ article }: { article: WebsiteSectionNewsCard }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group overflow-hidden rounded-xl border border-border/60 bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-[16/9] bg-muted/30">
        {article.coverImage ? (
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt || article.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-muted-foreground/20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        {article.publishedAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <time dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </div>
        )}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
          {article.title}
        </h3>
        {article.summary && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {article.summary}
          </p>
        )}
      </div>
    </Link>
  );
}

function NewsListCard({ article }: { article: WebsiteSectionNewsCard }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex gap-5 rounded-xl border border-border/60 bg-card p-4 transition hover:shadow-md sm:gap-6"
    >
      {article.coverImage && (
        <div className="relative hidden aspect-[16/9] w-48 shrink-0 overflow-hidden rounded-lg bg-muted/30 sm:block">
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt || article.title}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="200px"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-center space-y-2">
        {article.publishedAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <time dateTime={article.publishedAt}>
              {formatDate(article.publishedAt)}
            </time>
          </div>
        )}
        <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary sm:text-lg">
          {article.title}
        </h3>
        {article.summary && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {article.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
