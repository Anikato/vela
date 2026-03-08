import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import type { SectionComponentProps } from '../types';

export function ProductShowcaseSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const products = section.data?.products ?? [];
  const detailButtonText = tr.buttonText;

  if (!products.length && !tr.title && !tr.subtitle) {
    return null;
  }

  return (
    <div className="space-y-6">
      {(tr.title || tr.subtitle) && (
        <div className="text-center">
          {tr.title ? <h2 className="text-2xl font-semibold sm:text-3xl">{tr.title}</h2> : null}
          {tr.subtitle ? <p className="mt-2 text-muted-foreground">{tr.subtitle}</p> : null}
        </div>
      )}

      {products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-border/60 bg-card"
            >
              <div className="relative aspect-[4/3] bg-muted/40">
                {product.featuredImage ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : null}
              </div>
              <div className="space-y-3 p-4">
                <p className="text-xs text-muted-foreground">{product.sku}</p>
                <h3 className="line-clamp-2 text-lg font-medium">{product.name}</h3>
                {product.shortDescription ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {product.shortDescription}
                  </p>
                ) : null}
                {detailButtonText ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/products/${product.primaryCategorySlug}/${product.slug}`}>
                      {detailButtonText}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
