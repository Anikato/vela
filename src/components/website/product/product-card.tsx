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
    <div className="group overflow-hidden rounded-xl border border-border/60 bg-card transition hover:border-primary/40 hover:shadow-sm">
      <Link href={href}>
        <div className="relative aspect-[4/3] bg-muted/30">
          {item.featuredImage ? (
            <Image
              src={item.featuredImage.url}
              alt={item.featuredImage.alt || item.name}
              fill
              className="object-cover transition group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : null}
        </div>
        <div className="space-y-2 p-4 pb-2">
          <p className="text-xs text-muted-foreground">{item.sku}</p>
          <h3 className="line-clamp-2 text-base font-medium">{item.name}</h3>
          {item.shortDescription ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{item.shortDescription}</p>
          ) : null}
        </div>
      </Link>
      {addToBasketLabel ? (
        <div className="px-4 pb-3 pt-1">
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
