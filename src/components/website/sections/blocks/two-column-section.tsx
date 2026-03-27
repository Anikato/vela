'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SectionComponentProps } from '../types';

// ─── Config helpers ───

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const TITLE_SIZE: Record<string, string> = {
  sm: 'text-xl sm:text-2xl lg:text-3xl',
  md: 'text-2xl sm:text-3xl lg:text-4xl',
  lg: 'text-3xl sm:text-4xl lg:text-5xl',
  xl: 'text-4xl sm:text-5xl lg:text-6xl',
};

const SUBTITLE_SIZE: Record<string, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

const LINE_HEIGHT: Record<string, string> = {
  tight: 'leading-tight',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
};

function colorClass(key: string, customValue: string): { className: string; style?: React.CSSProperties } {
  switch (key) {
    case 'primary':   return { className: 'text-primary' };
    case 'secondary': return { className: 'text-secondary' };
    case 'muted':     return { className: 'text-muted-foreground' };
    case 'white':     return { className: 'text-white' };
    case 'custom':    return { className: '', style: { color: customValue || undefined } };
    default:          return { className: '' };
  }
}

// ─── Image panel (client component for carousel) ───

function ImagePanel({
  items,
  autoplayMs,
  altText,
}: {
  items: SectionComponentProps['section']['items'];
  autoplayMs: number;
  altText: string;
}) {
  const [current, setCurrent] = useState(0);
  const total = items.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (idx: number) => setCurrent((idx + total) % total),
    [total],
  );

  useEffect(() => {
    if (autoplayMs <= 0 || total <= 1) return;
    timerRef.current = setInterval(() => goTo(current + 1), autoplayMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplayMs, total, current, goTo]);

  const imageUrl = items[current]?.imageUrl ?? null;

  if (!imageUrl && total === 0) {
    return <div className="aspect-[4/3] rounded-2xl bg-muted/20" />;
  }

  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
      {items.map((item, idx) =>
        item.imageUrl ? (
          <Image
            key={item.id}
            src={item.imageUrl}
            alt={item.translation.title ?? altText}
            fill
            className={cn(
              'object-cover transition-all duration-700',
              idx === current ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none',
            )}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority={idx === 0}
          />
        ) : null,
      )}

      {/* Dot indicators (only when multiple images) */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                idx === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/70',
              )}
              aria-label={`图片 ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───

export function TwoColumnSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const cfg = section.config;
  const reversed = cfg.reversed === true;
  const autoplayMs = num(cfg.image_autoplay_ms, 4000);
  const showDivider = cfg.show_divider !== false;

  const titleSizeClass = TITLE_SIZE[str(cfg.title_size, 'md')] ?? TITLE_SIZE.md;
  const subtitleSizeClass = SUBTITLE_SIZE[str(cfg.subtitle_size, 'md')] ?? SUBTITLE_SIZE.md;
  const lineHeightClass = LINE_HEIGHT[str(cfg.line_height, 'normal')] ?? LINE_HEIGHT.normal;

  const titleColor = colorClass(str(cfg.title_color, 'default'), str(cfg.title_color_custom));
  const subtitleColor = colorClass(str(cfg.subtitle_color, 'muted'), str(cfg.subtitle_color_custom));

  const hasText = tr.title || tr.subtitle || tr.content || tr.buttonText;
  if (!hasText && section.items.length === 0) return null;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Image column */}
      <div className={cn(reversed ? 'lg:order-2' : '')}>
        <ImagePanel
          items={section.items}
          autoplayMs={autoplayMs}
          altText={tr.title ?? ''}
        />
      </div>

      {/* Text column */}
      <div className={cn(reversed ? 'lg:order-1' : '', lineHeightClass)}>
        {tr.title && (
          <h2
            className={cn('font-bold tracking-tight', titleSizeClass, titleColor.className)}
            style={titleColor.style}
          >
            {tr.title}
          </h2>
        )}

        {/* Decorative divider between title and subtitle */}
        {tr.title && tr.subtitle && showDivider && (
          <div className="mt-4 h-1 w-14 rounded-full bg-primary" />
        )}

        {tr.subtitle && (
          <p
            className={cn('mt-3', subtitleSizeClass, subtitleColor.className)}
            style={subtitleColor.style}
          >
            {tr.subtitle}
          </p>
        )}

        {tr.content && (
          <div
            className="prose prose-sm mt-5 max-w-none text-foreground/80"
            dangerouslySetInnerHTML={{ __html: tr.content }}
          />
        )}

        {tr.buttonText && tr.buttonLink && (
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href={tr.buttonLink}>{tr.buttonText}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
