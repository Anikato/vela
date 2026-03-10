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
        <div className="mb-12 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className="space-y-3">
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
    <div className={cn(
      'rounded-xl border transition-all duration-200',
      open ? 'border-primary/20 bg-primary/[0.02] shadow-sm' : 'border-border/40 bg-card',
    )}>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold transition sm:text-base"
        aria-expanded={open}
      >
        <span>{item.translation.title}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300',
            open && 'rotate-180 text-primary',
          )}
        />
      </button>
      <div className={cn(
        'grid transition-all duration-300',
        open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}>
        <div className="overflow-hidden">
          {item.translation.description && (
            <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
              {item.translation.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
