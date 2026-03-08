'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

export function PartnerLogosSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  const columns = Number(section.config.columns) || 5;
  const scrolling = section.config.scrolling === true;

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

      {scrolling ? (
        <ScrollingLogos items={items} />
      ) : (
        <LogoGrid items={items} columns={columns} />
      )}
    </div>
  );
}

function LogoGrid({ items, columns }: { items: WebsiteSectionItem[]; columns: number }) {
  const gridCols =
    columns <= 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : columns === 4
        ? 'grid-cols-2 sm:grid-cols-4'
        : columns === 6
          ? 'grid-cols-3 sm:grid-cols-6'
          : 'grid-cols-3 sm:grid-cols-5';

  return (
    <div className={cn('grid items-center gap-8', gridCols)}>
      {items.map((item) => (
        <LogoItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function ScrollingLogos({ items }: { items: WebsiteSectionItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length <= 1) return;

    let animId: number;
    let position = 0;
    const speed = 0.5;

    function tick() {
      if (!isPaused && el) {
        position += speed;
        if (position >= el.scrollWidth / 2) position = 0;
        el.scrollLeft = position;
      }
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [items.length, isPaused]);

  const doubled = [...items, ...items];

  return (
    <div
      ref={scrollRef}
      className="flex gap-10 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {doubled.map((item, idx) => (
        <div key={`${item.id}-${idx}`} className="flex shrink-0 items-center justify-center px-2">
          <LogoItem item={item} />
        </div>
      ))}
    </div>
  );
}

function LogoItem({ item }: { item: WebsiteSectionItem }) {
  const content = item.imageUrl ? (
    <Image
      src={item.imageUrl}
      alt={item.translation.title ?? ''}
      width={160}
      height={80}
      className="h-12 w-auto max-w-[160px] object-contain opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-16"
    />
  ) : item.translation.title ? (
    <span className="text-lg font-semibold text-muted-foreground transition hover:text-foreground">
      {item.translation.title}
    </span>
  ) : null;

  if (!content) return null;

  if (item.linkUrl) {
    return (
      <Link href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
        {content}
      </Link>
    );
  }

  return <div className="flex items-center justify-center">{content}</div>;
}
