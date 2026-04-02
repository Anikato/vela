import Image from 'next/image';
import Link from 'next/link';

import type { ProductBadge, PublicProductCardItem } from '@/server/services/product-public.service';
import type { CardHoverEffect, CardImageRatio } from '@/types/theme';
import { AddToBasketButton } from '@/components/website/inquiry/add-to-basket-button';

const ASPECT_MAP: Record<CardImageRatio, string> = {
  '1:1': 'aspect-square',
  '4:3': 'aspect-[4/3]',
  '3:2': 'aspect-[3/2]',
  '16:9': 'aspect-video',
};

const HOVER_CLASS_MAP: Record<CardHoverEffect, string> = {
  none: '',
  lift: 'vt-card-hover-lift',
  scale: 'vt-card-hover-scale',
  'border-glow': 'vt-card-hover-border-glow',
  shadow: 'vt-card-hover-shadow',
};

const BADGE_COLOR_CLASS: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  black: 'bg-gray-900',
};

function ProductBadgeRender({ badge }: { badge: ProductBadge }) {
  const colorClass = BADGE_COLOR_CLASS[badge.color] ?? 'bg-red-500';
  const isLeft = badge.position !== 'top-right';

  if (badge.style === 'ribbon') {
    return (
      <div className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-0 z-10`}>
        <div className={`${colorClass} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${
          isLeft ? 'rounded-br-lg' : 'rounded-bl-lg'
        }`}>
          {badge.name}
        </div>
      </div>
    );
  }

  if (badge.style === 'badge') {
    return (
      <div className={`absolute ${isLeft ? 'left-2' : 'right-2'} top-2 z-10`}>
        <div className={`${colorClass} rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}>
          {badge.name}
        </div>
      </div>
    );
  }

  if (badge.style === 'corner') {
    return (
      <div className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-0 z-10 overflow-hidden`} style={{ width: 64, height: 64 }}>
        <div className={`${colorClass} absolute ${isLeft ? '-left-[14px]' : '-right-[14px]'} top-[10px] w-[96px] text-center ${isLeft ? '-rotate-45' : 'rotate-45'} py-[2px] text-[9px] font-bold uppercase tracking-wider text-white shadow-sm`}>
          {badge.name}
        </div>
      </div>
    );
  }

  return null;
}

interface ProductCardProps {
  item: PublicProductCardItem;
  href: string;
  addToBasketLabel?: string;
  imageRatio?: CardImageRatio;
  hoverEffect?: CardHoverEffect;
  showSku?: boolean;
  showDescription?: boolean;
}

export function ProductCard({
  item,
  href,
  addToBasketLabel,
  imageRatio = '4:3',
  hoverEffect = 'lift',
  showSku = true,
  showDescription = true,
}: ProductCardProps) {
  const aspectClass = ASPECT_MAP[imageRatio] ?? ASPECT_MAP['4:3'];
  const hoverClass = HOVER_CLASS_MAP[hoverEffect] ?? '';

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-border/40 bg-card ${hoverClass}`}>
      <Link href={href} className="block">
        <div className={`relative ${aspectClass} overflow-hidden bg-muted/20`}>
          {item.badges?.map((badge, i) => (
            <ProductBadgeRender key={i} badge={badge} />
          ))}
          {item.featuredImage ? (
            <Image
              src={item.featuredImage.url}
              alt={item.featuredImage.alt || item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={item.featuredImage.focalX !== 50 || item.featuredImage.focalY !== 50 ? { objectPosition: `${item.featuredImage.focalX}% ${item.featuredImage.focalY}%` } : undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg className="h-12 w-12 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="space-y-2 p-4 pb-2">
          {showSku && (
            <p className="font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase">{item.sku}</p>
          )}
          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
            {item.name}
          </h3>
          {showDescription && item.shortDescription ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.shortDescription}</p>
          ) : null}
        </div>
      </Link>
      {addToBasketLabel ? (
        <div className="px-4 pb-4 pt-1">
          <AddToBasketButton
            productId={item.id}
            name={item.name}
            sku={item.sku}
            imageUrl={item.featuredImage?.url}
            label={addToBasketLabel}
          />
        </div>
      ) : null}
    </div>
  );
}
