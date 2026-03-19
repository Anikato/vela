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
        <div className="mb-14 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className="relative mx-auto">
        <div className="absolute left-4 top-0 hidden h-full w-px bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 md:left-1/2 md:block md:-translate-x-px" />
        <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 md:hidden" />

        <div className="space-y-10 md:space-y-14">
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

  const contentBlock = <TimelineContent item={item} align={isEven ? 'right' : 'left'} />;
  const yearBlock = <YearBadge year={year} align={isEven ? 'left' : 'right'} />;

  return (
    <div className="relative pl-12 md:pl-0">
      <div className="absolute left-[11px] top-1.5 h-4 w-4 rounded-full border-[3px] border-primary bg-background shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] md:hidden" />

      <div className="md:flex md:items-start md:gap-8">
        <div className={cn('hidden md:block md:w-1/2', isEven ? 'text-right' : '')}>
          {isEven ? contentBlock : yearBlock}
        </div>

        <div className="relative z-10 hidden md:flex md:shrink-0">
          <div className="h-5 w-5 rounded-full border-[3px] border-primary bg-background shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]" />
        </div>

        <div className={cn('hidden md:block md:w-1/2', isEven ? '' : 'text-left')}>
          {isEven ? yearBlock : contentBlock}
        </div>

        <div className="md:hidden">
          {year && (
            <span className="mb-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
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
      <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
        {year}
      </span>
    </div>
  );
}

function TimelineContent({ item, align }: { item: WebsiteSectionItem; align: 'left' | 'right' }) {
  return (
    <div className={cn('group/tl relative', align === 'right' ? 'text-right' : '')}>
      {item.translation.title && (
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">{item.translation.title}</h3>
      )}
      {item.translation.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {item.translation.description}
        </p>
      )}
      {item.imageUrl && (
        <div
          className={cn(
            'pointer-events-none absolute z-20 mt-2 w-64 opacity-0 transition-all duration-300 ease-out',
            'translate-y-2 scale-95 group-hover/tl:pointer-events-auto group-hover/tl:translate-y-0 group-hover/tl:scale-100 group-hover/tl:opacity-100',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl">
            <Image
              src={item.imageUrl}
              alt={item.translation.title ?? ''}
              width={300}
              height={200}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
