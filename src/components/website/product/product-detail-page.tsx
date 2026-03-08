import Image from 'next/image';

import { buildLocalizedPath } from '@/lib/i18n';
import type {
  PublicProductCardItem,
  PublicProductDetail,
} from '@/server/services/product-public.service';
import { Breadcrumb } from '@/components/website/layout/breadcrumb';
import { ProductCard } from './product-card';

interface ProductDetailPageProps {
  locale: string;
  defaultLocale: string;
  product: PublicProductDetail;
  currentCategoryName: string;
  relatedProducts: PublicProductCardItem[];
}

export function ProductDetailPage({
  locale,
  defaultLocale,
  product,
  currentCategoryName,
  relatedProducts,
}: ProductDetailPageProps) {
  const homeHref = buildLocalizedPath('/', locale, defaultLocale);
  const productsHref = buildLocalizedPath('/products', locale, defaultLocale);
  const categoryHref = buildLocalizedPath(
    `/products/${product.primaryCategory.slug}`,
    locale,
    defaultLocale,
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: '⌂', href: homeHref },
          { label: '●', href: productsHref },
          { label: currentCategoryName, href: categoryHref },
          { label: product.name },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/60 bg-muted/20">
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.alt || product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : null}
            </div>
            {product.galleryImages.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {product.galleryImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square overflow-hidden rounded-md border border-border/50 bg-muted/20"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || product.name}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{product.sku}</p>
            <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
            {product.shortDescription ? (
              <p className="text-muted-foreground">{product.shortDescription}</p>
            ) : null}
            {product.description ? (
              <div
                className="prose prose-sm mt-4 max-w-none text-foreground sm:prose"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : null}
          </div>
        </div>

        {product.attributeGroups.length ? (
          <div className="mt-10 space-y-6">
            {product.attributeGroups.map((group) => (
              <section key={group.id} className="space-y-3">
                <h2 className="text-xl font-semibold">{group.name}</h2>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <tbody>
                      {group.attributes.map((attr) => (
                        <tr key={attr.id} className="border-t border-border/50 first:border-t-0">
                          <td className="w-1/3 bg-muted/20 px-4 py-3">{attr.name}</td>
                          <td className="px-4 py-3">{attr.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {relatedProducts.length ? (
          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">{currentCategoryName}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  href={buildLocalizedPath(
                    `/products/${item.primaryCategorySlug}/${item.slug}`,
                    locale,
                    defaultLocale,
                  )}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
