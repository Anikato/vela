import Image from 'next/image';
import Link from 'next/link';

import type { SectionComponentProps } from '../types';
import { focalStyle } from '../types';

export function CategoryNavSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const categories = section.data?.categories ?? [];

  if (!categories.length && !tr.title && !tr.subtitle) return null;

  const columns = Number(section.config.columns) || 4;
  const aspectRatio = typeof section.config.image_aspect_ratio === 'string' ? section.config.image_aspect_ratio : '4/3';
  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : columns === 5
          ? 'sm:grid-cols-3 lg:grid-cols-5'
          : columns === 6
            ? 'sm:grid-cols-3 lg:grid-cols-6'
            : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-10 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <div className={`grid gap-4 ${gridCols}`}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products/${cat.slug}`}
              className="group overflow-hidden rounded-xl border border-border/60 bg-card transition hover:shadow-md"
            >
              <div className="relative bg-muted/30" style={{ aspectRatio }}>
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    style={focalStyle(cat.imageFocal)}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-12 w-12 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6A1.125 1.125 0 012.25 10.875v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4 text-center">
                <h3 className="text-sm font-semibold group-hover:text-primary sm:text-base">{cat.name}</h3>
                {cat.productCount > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cat.productCount} {cat.productCount === 1 ? 'product' : 'products'}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
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
