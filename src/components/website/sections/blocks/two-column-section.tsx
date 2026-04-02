'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SectionComponentProps } from '../types';
import { focalStyle } from '../types';

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

// 将 CSS 变量颜色键名映射为 text-* Tailwind 类
function textColorStyle(key: string, custom: string): { className: string; style?: React.CSSProperties } {
  switch (key) {
    case 'foreground':          return { className: 'text-foreground' };
    case 'primary':             return { className: 'text-primary' };
    case 'primary-foreground':  return { className: 'text-primary-foreground' };
    case 'secondary':           return { className: 'text-secondary' };
    case 'secondary-foreground':return { className: 'text-secondary-foreground' };
    case 'accent':              return { className: 'text-accent' };
    case 'accent-foreground':   return { className: 'text-accent-foreground' };
    case 'muted-foreground':    return { className: 'text-muted-foreground' };
    case 'destructive':         return { className: 'text-destructive' };
    case 'white':               return { className: 'text-white' };
    case 'custom':              return { className: '', style: { color: custom || undefined } };
    default:                    return { className: '' };
  }
}

// 将颜色键名映射为 bg-* Tailwind 类（用于装饰条）
function bgColorStyle(key: string, custom: string): { className: string; style?: React.CSSProperties } {
  switch (key) {
    case 'foreground':          return { className: 'bg-foreground' };
    case 'primary':             return { className: 'bg-primary' };
    case 'primary-foreground':  return { className: 'bg-primary-foreground' };
    case 'secondary':           return { className: 'bg-secondary' };
    case 'secondary-foreground':return { className: 'bg-secondary-foreground' };
    case 'accent':              return { className: 'bg-accent' };
    case 'accent-foreground':   return { className: 'bg-accent-foreground' };
    case 'muted-foreground':    return { className: 'bg-muted-foreground' };
    case 'destructive':         return { className: 'bg-destructive' };
    case 'white':               return { className: 'bg-white' };
    case 'custom':              return { className: '', style: { backgroundColor: custom || undefined } };
    default:                    return { className: 'bg-primary' };
  }
}

// 装饰条宽度映射
function dividerWidthStyle(widthKey: string, customPx: number): { width?: string } {
  switch (widthKey) {
    case 'xs':   return { width: '32px' };
    case 'sm':   return { width: '40px' };
    case 'lg':   return { width: '80px' };
    case 'full': return { width: '100%' };
    case 'custom': return { width: `${customPx}px` };
    default:     return { width: '56px' }; // md / default
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

  if (total === 0) {
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
            style={focalStyle(item.imageFocal)}
          />
        ) : null,
      )}

      {/* Dot indicators */}
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

  // 读新键名（text_*），兼容旧键名回退
  const titleSizeKey = str(cfg.text_title_size, str(cfg.title_size, 'default'));
  const subtitleSizeKey = str(cfg.text_subtitle_size, str(cfg.subtitle_size, 'default'));
  const lineHeightKey = str(cfg.text_line_height, str(cfg.line_height, 'normal'));
  const titleColorKey = str(cfg.text_title_color, str(cfg.title_color, 'default'));
  const titleColorCustom = str(cfg.text_title_color_custom, str(cfg.title_color_custom));
  const subtitleColorKey = str(cfg.text_subtitle_color, str(cfg.subtitle_color, 'muted-foreground'));
  const subtitleColorCustom = str(cfg.text_subtitle_color_custom, str(cfg.subtitle_color_custom));

  // 装饰条 - 默认开启，跟随标题出现
  const showDivider = cfg.text_divider === true;
  const dividerWidthKey = str(cfg.text_divider_width, 'md');
  const dividerWidthCustomPx = num(cfg.text_divider_width_custom, 56);
  const dividerColorKey = str(cfg.text_divider_color, 'title');

  // 字号：preset class 或 custom px（inline style）
  const titleSizeClass = titleSizeKey !== 'custom' && titleSizeKey !== 'default'
    ? (TITLE_SIZE[titleSizeKey] ?? '')
    : titleSizeKey === 'default' ? 'text-2xl sm:text-3xl lg:text-4xl' : '';
  const titleSizeStyle: React.CSSProperties = titleSizeKey === 'custom'
    ? { fontSize: `${num(cfg.text_title_size_custom, 32)}px` }
    : {};

  const subtitleSizeClass = subtitleSizeKey !== 'custom' && subtitleSizeKey !== 'default'
    ? (SUBTITLE_SIZE[subtitleSizeKey] ?? '')
    : subtitleSizeKey === 'default' ? 'text-lg' : '';
  const subtitleSizeStyle: React.CSSProperties = subtitleSizeKey === 'custom'
    ? { fontSize: `${num(cfg.text_subtitle_size_custom, 18)}px` }
    : {};

  const lineHeightClass = LINE_HEIGHT[lineHeightKey] ?? LINE_HEIGHT.normal;
  const titleColor = textColorStyle(titleColorKey, titleColorCustom);
  const subtitleColor = textColorStyle(subtitleColorKey, subtitleColorCustom);

  // 装饰条颜色：'title' 跟随标题，否则单独设置
  const dividerBg = dividerColorKey === 'title'
    ? bgColorStyle(titleColorKey === 'default' ? 'primary' : titleColorKey, titleColorCustom)
    : bgColorStyle(dividerColorKey, str(cfg.text_divider_color_custom));
  const dividerWidth = dividerWidthStyle(dividerWidthKey, dividerWidthCustomPx);

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
            style={{ ...titleColor.style, ...titleSizeStyle }}
          >
            {tr.title}
          </h2>
        )}

        {/* 装饰条：跟随标题出现 */}
        {tr.title && showDivider && (
          <div
            className={cn('mt-4 h-1 rounded-full', dividerBg.className)}
            style={{ ...dividerBg.style, ...dividerWidth }}
          />
        )}

        {tr.subtitle && (
          <p
            className={cn('mt-3', subtitleSizeClass, subtitleColor.className)}
            style={{ ...subtitleColor.style, ...subtitleSizeStyle }}
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
