'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

export function ImageGallerySection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items.filter((i) => i.imageUrl);

  if (!items.length && !tr.title) return null;

  const columns = Number(section.config.columns) || 3;
  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

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

      <GalleryGrid items={items} gridCols={gridCols} />
    </div>
  );
}

function GalleryGrid({ items, gridCols }: { items: WebsiteSectionItem[]; gridCols: string }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  return (
    <>
      <div className={cn('grid gap-3', gridCols)}>
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setLightboxIdx(idx)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-muted/30"
          >
            <Image
              src={item.imageUrl!}
              alt={item.translation.title ?? ''}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {item.translation.title && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-left opacity-0 transition group-hover:opacity-100">
                <p className="text-sm font-medium text-white">{item.translation.title}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          items={items}
          currentIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onChange={setLightboxIdx}
        />
      )}
    </>
  );
}

function Lightbox({
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

  const goPrev = useCallback(() => onChange((currentIndex - 1 + total) % total), [currentIndex, total, onChange]);
  const goNext = useCallback(() => onChange((currentIndex + 1) % total), [currentIndex, total, onChange]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
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
