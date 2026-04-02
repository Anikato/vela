import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';
import { focalStyle } from '../types';

export function TeamSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  const columns = Number(section.config.columns) || 4;
  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 3
        ? 'sm:grid-cols-2 lg:grid-cols-3'
        : 'sm:grid-cols-2 lg:grid-cols-4';

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
          <TeamMemberCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function TeamMemberCard({ item }: { item: WebsiteSectionItem }) {
  return (
    <div className="group text-center">
      <div className="relative mx-auto mb-5 h-36 w-36 overflow-hidden rounded-full ring-4 ring-muted/30 transition-all duration-300 group-hover:ring-primary/20 sm:h-40 sm:w-40">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.translation.title ?? ''}
            width={160}
            height={160}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            style={focalStyle(item.imageFocal)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/30">
            <svg className="h-16 w-16 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}
      </div>
      {item.translation.title && (
        <h3 className="text-base font-semibold tracking-tight">{item.translation.title}</h3>
      )}
      {item.translation.content && (
        <p className="mt-1 text-sm font-medium text-primary">{item.translation.content}</p>
      )}
      {item.translation.description && (
        <p className="mx-auto mt-2 max-w-[200px] text-sm leading-relaxed text-muted-foreground">
          {item.translation.description}
        </p>
      )}
      {item.linkUrl && (
        <Link
          href={item.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          LinkedIn →
        </Link>
      )}
    </div>
  );
}
