'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SectionComponentProps } from '../types';

export function CarouselBannerSection({ section }: SectionComponentProps) {
  const items = section.items;
  if (!items.length) return null;

  return <CarouselBannerClient items={items} autoPlayMs={Number(section.config.autoplay_ms) || 5000} />;
}

function CarouselBannerClient({
  items,
  autoPlayMs,
}: {
  items: SectionComponentProps['section']['items'];
  autoPlayMs: number;
}) {
  const [current, setCurrent] = useState(0);
  const total = items.length;

  const goTo = useCallback(
    (idx: number) => setCurrent((idx + total) % total),
    [total],
  );

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % total), autoPlayMs);
    return () => clearInterval(timer);
  }, [total, autoPlayMs]);

  const slide = items[current];

  return (
    <div className="group relative overflow-hidden rounded-xl">
      <div className="relative aspect-[21/9] min-h-[220px] w-full sm:aspect-[21/9]">
        {slide.imageUrl && (
          <Image
            src={slide.imageUrl}
            alt={slide.translation.title ?? ''}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {(slide.translation.title || slide.translation.description) && (
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
            {slide.translation.title && (
              <h2 className="text-2xl font-bold sm:text-3xl">{slide.translation.title}</h2>
            )}
            {slide.translation.description && (
              <p className="mt-2 max-w-xl text-sm text-white/80 sm:text-base">
                {slide.translation.description}
              </p>
            )}
            {slide.linkUrl && (
              <Link
                href={slide.linkUrl}
                className="mt-4 inline-block rounded-lg bg-white/90 px-5 py-2 text-sm font-medium text-foreground transition hover:bg-white"
              >
                {slide.translation.title ?? '→'}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/50"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/50"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={cn(
                'h-2 rounded-full transition-all',
                idx === current ? 'w-6 bg-white' : 'w-2 bg-white/50',
              )}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
