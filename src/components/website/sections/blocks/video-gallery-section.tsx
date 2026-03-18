'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

function parseVideoUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.has('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}?autoplay=1`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}?autoplay=1`;
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').pop();
      return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    if (u.hostname.includes('bilibili.com')) {
      const bv = u.pathname.match(/BV\w+/)?.[0];
      if (bv) return `https://player.bilibili.com/player.html?bvid=${bv}&autoplay=1`;
    }
    return url;
  } catch {
    return url;
  }
}

function getVideoThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') && u.searchParams.has('v')) {
      return `https://img.youtube.com/vi/${u.searchParams.get('v')}/hqdefault.jpg`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://img.youtube.com/vi${u.pathname}/hqdefault.jpg`;
    }
  } catch {}
  return null;
}

export function VideoGallerySection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items.filter((i) => i.linkUrl);
  const layout = (section.config.layout as string) ?? 'video_left';
  const [activeIdx, setActiveIdx] = useState(0);

  if (!items.length && !tr.title) return null;

  const activeItem = items[activeIdx] ?? items[0];
  const embedUrl = activeItem ? parseVideoUrl(activeItem.linkUrl!) : '';

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

      <div className={cn(
        'flex flex-col gap-6 lg:flex-row',
        layout === 'video_right' && 'lg:flex-row-reverse',
      )}>
        {/* Video player */}
        <div className="flex-1">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={activeItem?.translation.title ?? 'Video'}
            />
          </div>
          {activeItem?.translation.description && (
            <p className="mt-3 text-sm text-muted-foreground">{activeItem.translation.description}</p>
          )}
        </div>

        {/* Playlist */}
        {items.length > 1 && (
          <div className="w-full shrink-0 lg:w-80">
            <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-2">
              {items.map((item, idx) => (
                <PlaylistItem
                  key={item.id}
                  item={item}
                  index={idx}
                  isActive={idx === activeIdx}
                  onClick={() => setActiveIdx(idx)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlaylistItem({
  item,
  index,
  isActive,
  onClick,
}: {
  item: WebsiteSectionItem;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const thumbnail = item.imageUrl || getVideoThumbnail(item.linkUrl!) || null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg p-2 text-left transition',
        isActive
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'hover:bg-muted/60',
      )}
    >
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <Play className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Play className="h-5 w-5 fill-white text-white" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn(
          'truncate text-sm font-medium',
          isActive && 'text-primary',
        )}>
          {item.translation.title ?? `Video ${index + 1}`}
        </p>
        {item.translation.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.translation.description}
          </p>
        )}
      </div>
    </button>
  );
}
