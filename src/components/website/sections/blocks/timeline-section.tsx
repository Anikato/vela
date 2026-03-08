import Image from 'next/image';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

export function TimelineSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-12 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className="relative mx-auto max-w-4xl">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 hidden h-full w-0.5 bg-border md:left-1/2 md:block md:-translate-x-px" />
        <div className="absolute left-4 top-0 h-full w-0.5 bg-border md:hidden" />

        <div className="space-y-8 md:space-y-12">
          {items.map((item, idx) => (
            <TimelineItem key={item.id} item={item} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ item, index }: { item: WebsiteSectionItem; index: number }) {
  const isEven = index % 2 === 0;
  const year = item.translation.content;

  return (
    <div className="relative pl-12 md:pl-0">
      {/* Dot indicator - mobile */}
      <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background md:hidden" />

      {/* Desktop layout: alternating left/right */}
      <div className="md:flex md:items-start md:gap-8">
        {/* Left content */}
        <div className={cn('hidden md:block md:w-1/2', isEven ? 'md:text-right' : 'md:order-2')}>
          {isEven ? (
            <TimelineContent item={item} align="right" />
          ) : (
            <YearBadge year={year} align="left" />
          )}
        </div>

        {/* Center dot - desktop */}
        <div className="relative z-10 hidden md:flex md:shrink-0">
          <div className="h-4 w-4 rounded-full border-[3px] border-primary bg-background" />
        </div>

        {/* Right content */}
        <div className={cn('hidden md:block md:w-1/2', isEven ? '' : 'md:order-1 md:text-right')}>
          {isEven ? (
            <YearBadge year={year} align="left" />
          ) : (
            <TimelineContent item={item} align="left" />
          )}
        </div>

        {/* Mobile: always left-aligned */}
        <div className="md:hidden">
          {year && (
            <span className="mb-1 inline-block rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
              {year}
            </span>
          )}
          <TimelineContent item={item} align="left" />
        </div>
      </div>
    </div>
  );
}

function YearBadge({ year, align }: { year: string | null; align: 'left' | 'right' }) {
  if (!year) return <div />;
  return (
    <div className={cn('mt-0.5', align === 'right' ? 'text-right' : '')}>
      <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
        {year}
      </span>
    </div>
  );
}

function TimelineContent({ item, align }: { item: WebsiteSectionItem; align: 'left' | 'right' }) {
  return (
    <div className={cn(align === 'right' ? 'text-right' : '')}>
      {item.translation.title && (
        <h3 className="text-base font-semibold sm:text-lg">{item.translation.title}</h3>
      )}
      {item.translation.description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {item.translation.description}
        </p>
      )}
      {item.imageUrl && (
        <div className="mt-3">
          <Image
            src={item.imageUrl}
            alt={item.translation.title ?? ''}
            width={300}
            height={200}
            className={cn(
              'rounded-lg object-cover',
              align === 'right' ? 'ml-auto' : '',
            )}
          />
        </div>
      )}
    </div>
  );
}
