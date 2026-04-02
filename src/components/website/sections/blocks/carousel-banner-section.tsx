'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { SectionComponentProps } from '../types';
import { focalStyle } from '../types';

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const total = items.length;
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent((idx + total) % total);
      setTimeout(() => setIsTransitioning(false), 600);
    },
    [total, isTransitioning],
  );

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current !== null) clearInterval(autoPlayRef.current);
    if (total <= 1) return;
    autoPlayRef.current = setInterval(() => goTo(current + 1), autoPlayMs);
  }, [total, autoPlayMs, current, goTo]);

  useEffect(() => {
    resetAutoPlay();
    return () => { if (autoPlayRef.current !== null) clearInterval(autoPlayRef.current); };
  }, [resetAutoPlay]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (Math.abs(touchDeltaX.current) > 50) {
      goTo(touchDeltaX.current > 0 ? current - 1 : current + 1);
    }
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[21/9] min-h-[280px] w-full sm:min-h-[400px] lg:min-h-[480px]">
        {items.map((slide, idx) => (
          <div
            key={slide.id}
            className={cn(
              'absolute inset-0 transition-all duration-[600ms] ease-in-out',
              idx === current
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105 pointer-events-none',
            )}
          >
            {slide.imageUrl && (
              <Image
                src={slide.imageUrl}
                alt={slide.translation.title ?? ''}
                fill
                className="object-cover"
                sizes="100vw"
                priority={idx === 0}
                style={focalStyle(slide.imageFocal)}
              />
            )}
            {/* Overlay - 由每张幻灯片的 config.overlayStyle 控制 */}
            {(() => {
              const overlayStyle = (slide.config.overlayStyle as string) ?? 'gradient';
              const overlayOpacity = Number(slide.config.overlayOpacity ?? 50) / 100;
              if (overlayStyle === 'none') return null;
              if (overlayStyle === 'full') {
                return (
                  <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                  />
                );
              }
              return (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              );
            })()}

            {(slide.translation.title || slide.translation.description) && (
              <div className={cn(
                'absolute p-6 sm:p-10 lg:p-14',
                (() => {
                  const pos = (slide.config.textPosition as string) ?? 'bottom-left';
                  if (pos === 'bottom-center') return 'inset-x-0 bottom-0 flex flex-col items-center text-center';
                  if (pos === 'center') return 'inset-0 flex flex-col items-center justify-center text-center';
                  if (pos === 'top-left') return 'inset-x-0 top-0';
                  return 'inset-x-0 bottom-0'; // bottom-left default
                })(),
              )}>
                <div className="max-w-2xl">
                  {slide.translation.title && (
                    <h2 className={cn(
                      'text-2xl font-bold text-white sm:text-4xl lg:text-5xl',
                      'transition-all duration-700 delay-200',
                      idx === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                    )}>
                      {slide.translation.title}
                    </h2>
                  )}
                  {slide.translation.description && (
                    <p className={cn(
                      'mt-3 max-w-xl text-sm text-white/80 sm:text-base lg:text-lg',
                      'transition-all duration-700 delay-300',
                      idx === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                    )}>
                      {slide.translation.description}
                    </p>
                  )}
                  {slide.linkUrl && (
                    <div className={cn(
                      'mt-5 transition-all duration-700 delay-[400ms]',
                      idx === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
                    )}>
                      <Button asChild size="lg" className="rounded-full px-8">
                        <Link href={slide.linkUrl}>
                          {slide.translation.content || 'Learn More'} →
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm opacity-0 transition-all hover:bg-white/20 group-hover:opacity-100"
            aria-label="Previous"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm opacity-0 transition-all hover:bg-white/20 group-hover:opacity-100"
            aria-label="Next"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {total > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                idx === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60',
              )}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
