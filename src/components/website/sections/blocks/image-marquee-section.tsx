'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

export function ImageMarqueeSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items.filter((i) => i.imageUrl);
  const speed = Number(section.config.scroll_speed) || 30;
  const pauseOnHover = section.config.pause_on_hover !== false;
  const direction = (section.config.direction as string) ?? 'left';
  const imageHeight = (section.config.image_height as string) || '200px';

  if (!items.length && !tr.title) return null;

  const doubled = [...items, ...items];

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

      {items.length > 0 && (
        <MarqueeTrack
          items={doubled}
          speed={speed}
          pauseOnHover={pauseOnHover}
          direction={direction}
          imageHeight={imageHeight}
          originalCount={items.length}
        />
      )}
    </div>
  );
}

function MarqueeTrack({
  items,
  speed,
  pauseOnHover,
  direction,
  imageHeight,
  originalCount,
}: {
  items: WebsiteSectionItem[];
  speed: number;
  pauseOnHover: boolean;
  direction: string;
  imageHeight: string;
  originalCount: number;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const duration = `${speed}s`;
  const animDir = direction === 'right' ? 'reverse' : 'normal';

  return (
    <>
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div
          className={cn('flex gap-4', pauseOnHover && 'hover:[animation-play-state:paused]')}
          style={{
            animation: `marquee-scroll ${duration} linear infinite`,
            animationDirection: animDir,
            width: 'max-content',
          }}
        >
          {items.map((item, idx) => (
            <button
              key={`${item.id}-${idx}`}
              onClick={() => setLightboxIdx(idx % originalCount)}
              className="group relative shrink-0 overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
              style={{ height: imageHeight }}
            >
              <Image
                src={item.imageUrl!}
                alt={item.translation.title ?? ''}
                width={300}
                height={200}
                className="h-full w-auto object-contain p-2 transition group-hover:scale-105"
                style={{ height: imageHeight }}
              />
              {item.translation.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 opacity-0 transition group-hover:opacity-100">
                  <p className="text-xs font-medium text-white">{item.translation.title}</p>
                  {item.translation.description && (
                    <p className="mt-0.5 text-[10px] text-white/70 line-clamp-2">{item.translation.description}</p>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {lightboxIdx !== null && (
        <MarqueeLightbox
          items={items.slice(0, originalCount)}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onChange={setLightboxIdx}
        />
      )}

      <style jsx global>{`
        @keyframes marquee-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </>
  );
}

function MarqueeLightbox({
  items,
  currentIndex,
  onClose,
  onChange,
}: {
  items: WebsiteSectionItem[];
  currentIndex: number;
  onClose: () => void;
  onChange: (idx: number) => void;
}) {
  const total = items.length;
  const current = items[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onChange((currentIndex - 1 + total) % total); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onChange((currentIndex + 1) % total); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="relative max-h-[80vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {current?.imageUrl && (
          <Image
            src={current.imageUrl}
            alt={current.translation.title ?? ''}
            width={1200}
            height={800}
            className="max-h-[80vh] w-auto rounded object-contain"
          />
        )}
        {current?.translation.title && (
          <p className="mt-3 text-center text-sm text-white/80">{current.translation.title}</p>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}
