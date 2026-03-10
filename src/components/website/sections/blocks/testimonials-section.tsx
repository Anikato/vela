import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

export function TestimonialsSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  const columns = Number(section.config.columns) || 3;
  const gridCols =
    columns === 1
      ? 'sm:grid-cols-1 max-w-2xl mx-auto'
      : columns === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-12 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className={cn('grid gap-6 lg:gap-8', gridCols)}>
        {items.map((item) => (
          <TestimonialCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function TestimonialCard({ item }: { item: WebsiteSectionItem }) {
  const rating = Number(item.config.rating) || 0;

  return (
    <div className="group flex flex-col rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 lg:p-8">
      {rating > 0 && (
        <div className="mb-4 flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className={cn('h-4.5 w-4.5', i < rating ? 'text-amber-400' : 'text-muted/30')}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      )}

      {item.translation.description && (
        <blockquote className="flex-1 text-sm leading-relaxed text-foreground/80 lg:text-base">
          &ldquo;{item.translation.description}&rdquo;
        </blockquote>
      )}

      <div className="mt-6 flex items-center gap-3.5 border-t border-border/30 pt-5">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.translation.title ?? ''}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-background"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {(item.translation.title ?? '?')[0]?.toUpperCase()}
          </div>
        )}
        <div>
          {item.translation.title && (
            <p className="text-sm font-semibold">{item.translation.title}</p>
          )}
          {item.translation.content && (
            <p className="text-xs text-muted-foreground">{item.translation.content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
