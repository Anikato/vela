import Image from 'next/image';
import Link from 'next/link';

import type { SectionComponentProps, WebsiteSectionItem } from '../types';

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
        <div className="mb-10 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className={`grid gap-6 ${gridCols}`}>
        {items.map((item) => (
          <TeamMemberCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function TeamMemberCard({ item }: { item: WebsiteSectionItem }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full bg-muted/40 sm:h-36 sm:w-36">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.translation.title ?? ''}
            width={144}
            height={144}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-16 w-16 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}
      </div>
      {item.translation.title && (
        <h3 className="text-base font-semibold">{item.translation.title}</h3>
      )}
      {item.translation.content && (
        <p className="mt-0.5 text-sm text-primary">{item.translation.content}</p>
      )}
      {item.translation.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {item.translation.description}
        </p>
      )}
      {item.linkUrl && (
        <Link
          href={item.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-muted-foreground hover:text-primary"
        >
          LinkedIn &rarr;
        </Link>
      )}
    </div>
  );
}
