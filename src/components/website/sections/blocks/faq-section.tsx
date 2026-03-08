'use client';

import { useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

export function FaqSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  return (
    <div className="mx-auto max-w-3xl">
      {(tr.title || tr.subtitle) && (
        <div className="mb-10 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border">
        {items.map((item) => (
          <FaqItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function FaqItem({ item }: { item: WebsiteSectionItem }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  if (!item.translation.title) return null;

  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium transition hover:bg-muted/40 sm:text-base"
        aria-expanded={open}
      >
        <span>{item.translation.title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && item.translation.description && (
        <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
          {item.translation.description}
        </div>
      )}
    </div>
  );
}
