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
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-12 text-center">
          {tr.title ? <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{tr.title}</h2> : null}
          {tr.subtitle ? <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">{tr.subtitle}</p> : null}
        </div>
      )}

      {products.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
                {product.featuredImage ? (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.alt || product.name}
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
              </div>
              <div className="p-5">
                <p className="font-mono text-[11px] tracking-wider text-muted-foreground/70 uppercase">{product.sku}</p>
                <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                  {product.name}
                </h3>
                {product.shortDescription ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.shortDescription}</p>
                ) : null}
                {detailButtonText ? (
                  <div className="mt-4">
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link href={`/products/${product.primaryCategorySlug}/${product.slug}`}>
                        {detailButtonText} →
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
