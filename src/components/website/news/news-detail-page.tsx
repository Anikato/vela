import Image from 'next/image';

import { buildLocalizedPath } from '@/lib/i18n';
import type { PublicNewsDetail } from '@/server/services/news.service';
import { Breadcrumb } from '@/components/website/layout/breadcrumb';

export interface NewsDetailPageUiLabels {
  home: string;
  news: string;
}

interface NewsDetailPageProps {
  locale: string;
  defaultLocale: string;
  article: PublicNewsDetail;
  uiLabels: NewsDetailPageUiLabels;
}

export function NewsDetailPage({
  locale,
  defaultLocale,
  article,
  uiLabels,
}: NewsDetailPageProps) {
  const homeHref = buildLocalizedPath('/', locale, defaultLocale);
  const newsHref = buildLocalizedPath('/news', locale, defaultLocale);

  const crumbs = [
    { label: uiLabels.home, href: homeHref },
    { label: uiLabels.news, href: newsHref },
    { label: article.title },
  ];

  return (
    <div>
      <Breadcrumb items={crumbs} />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <header className="mb-10">
          {article.publishedAt ? (
            <time className="text-sm font-medium text-muted-foreground">
              {new Date(article.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          ) : null}
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {article.title}
          </h1>
          {article.summary ? (
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground sm:text-xl">{article.summary}</p>
          ) : null}
        </header>

        {article.coverImage ? (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={article.coverImage.url}
              alt={article.coverImage.alt || article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              style={article.coverImage.focalX !== 50 || article.coverImage.focalY !== 50 ? { objectPosition: `${article.coverImage.focalX}% ${article.coverImage.focalY}%` } : undefined}
            />
          </div>
        ) : null}

        {article.content ? (
          <div
            className="prose prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : null}
      </article>
    </div>
  );
}
