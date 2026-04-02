'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  focalX?: number;
  focalY?: number;
}

interface ProductGalleryProps {
  featuredImage: GalleryImage | null;
  galleryImages: GalleryImage[];
  productName: string;
}

export function ProductGallery({ featuredImage, galleryImages, productName }: ProductGalleryProps) {
  const allImages = featuredImage
    ? [featuredImage, ...galleryImages.filter((img) => img.id !== featuredImage.id)]
    : galleryImages;

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const activeImage = allImages[activeIndex] ?? null;

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + allImages.length) % allImages.length);
    },
    [allImages.length],
  );

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-muted/20 flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-xl border border-border/60 bg-muted/20"
          onClick={() => setLightboxOpen(true)}
        >
          {activeImage && (
            <Image
              src={activeImage.url}
              alt={activeImage.alt || productName}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              style={activeImage.focalX != null && activeImage.focalY != null && (activeImage.focalX !== 50 || activeImage.focalY !== 50) ? { objectPosition: `${activeImage.focalX}% ${activeImage.focalY}%` } : undefined}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/10 group-hover:opacity-100">
            <ZoomIn className="h-8 w-8 text-white drop-shadow" />
          </div>

          {/* Prev / Next arrows on main image */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 opacity-0 shadow transition hover:bg-background group-hover:opacity-100"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 opacity-0 shadow transition hover:bg-background group-hover:opacity-100"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-20 sm:w-20',
                  idx === activeIndex
                    ? 'border-primary ring-1 ring-primary/30'
                    : 'border-border/50 hover:border-border',
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt || productName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && activeImage && (
        <Lightbox
          images={allImages}
          activeIndex={activeIndex}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
          onNavigate={goTo}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  activeIndex,
  productName,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  activeIndex: number;
  productName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const activeImage = images[activeIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex - 1); }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(activeIndex + 1); }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="relative max-h-[85vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {activeImage && (
          <Image
            src={activeImage.url}
            alt={activeImage.alt || productName}
            width={1200}
            height={900}
            className="max-h-[85vh] w-auto rounded object-contain"
            sizes="90vw"
          />
        )}
      </div>

      {/* Bottom counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white">
          {activeIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
