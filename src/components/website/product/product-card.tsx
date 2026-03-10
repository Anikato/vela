import Image from 'next/image';
import Link from 'next/link';

import type { PublicProductCardItem } from '@/server/services/product-public.service';
import { AddToBasketButton } from '@/components/website/inquiry/add-to-basket-button';

interface ProductCardProps {
  item: PublicProductCardItem;
  href: string;
  addToBasketLabel?: string;
}

export function ProductCard({ item, href, addToBasketLabel }: ProductCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
          {item.featuredImage ? (
            <Image
              src={item.featuredImage.url}
              alt={item.featuredImage.alt || item.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
          <p className="font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase">{item.sku}</p>
          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
            {item.name}
          </h3>
          {item.shortDescription ? (
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
