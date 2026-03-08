import { FileText, Play } from 'lucide-react';

import { buildLocalizedPath } from '@/lib/i18n';
import type {
  PublicProductCardItem,
  PublicProductDetail,
} from '@/server/services/product-public.service';
import type { CustomFormField } from '@/components/website/inquiry/inquiry-form-dialog';
import { Breadcrumb } from '@/components/website/layout/breadcrumb';
import { ProductGallery } from './product-gallery';
import { ProductActions } from './product-actions';
import { ProductCard } from './product-card';

interface ProductDetailPageProps {
  locale: string;
  defaultLocale: string;
  product: PublicProductDetail;
  currentCategoryName: string;
  relatedProducts: PublicProductCardItem[];
  captchaSiteKey: string | null;
  customFormFields?: CustomFormField[];
  uiLabels: {
    home: string;
    products: string;
    addToBasket: string;
    sendInquiry: string;
    relatedProducts: string;
    specifications: string;
    videos: string;
    attachments: string;
    moq: string;
    leadTime: string;
    tradeTerms: string;
    paymentTerms: string;
    packaging: string;
    customization: string;
    customizationYes: string;
    customizationNo: string;
    days: string;
    formTitle: string;
    formName: string;
    formEmail: string;
    formPhone: string;
    formCompany: string;
    formCountry: string;
    formMessage: string;
    formSubmit: string;
    formCancel: string;
    formSuccess: string;
    formError: string;
  };
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match?.[1] ?? null;
}

export function ProductDetailPage({
  locale,
  defaultLocale,
  product,
  currentCategoryName,
  relatedProducts,
  captchaSiteKey,
  customFormFields,
  uiLabels,
}: ProductDetailPageProps) {
  const homeHref = buildLocalizedPath('/', locale, defaultLocale);
  const productsHref = buildLocalizedPath('/products', locale, defaultLocale);
  const categoryHref = buildLocalizedPath(
    `/products/${product.primaryCategory.slug}`,
    locale,
    defaultLocale,
  );

  const hasCommercialInfo =
    product.moq !== null ||
    product.leadTimeDays !== null ||
    product.tradeTerms ||
    product.paymentTerms ||
    product.packagingDetails;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: uiLabels.home, href: homeHref },
          { label: uiLabels.products, href: productsHref },
          { label: currentCategoryName, href: categoryHref },
          { label: product.name },
        ]}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top section: gallery + info */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Gallery */}
          <ProductGallery
            featuredImage={product.featuredImage}
            galleryImages={product.galleryImages}
            productName={product.name}
          />

          {/* Right: Product info */}
          <div className="space-y-5">
            <div>
              <p className="text-sm text-muted-foreground">{product.sku}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{product.name}</h1>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {product.shortDescription && (
              <p className="text-muted-foreground leading-relaxed">{product.shortDescription}</p>
            )}

            {/* Commercial info table */}
            {hasCommercialInfo && (
              <div className="overflow-hidden rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <tbody>
                    {product.moq !== null && (
                      <tr className="border-t border-border/50 first:border-t-0">
                        <td className="w-2/5 bg-muted/20 px-4 py-2.5 font-medium">{uiLabels.moq}</td>
                        <td className="px-4 py-2.5">{product.moq}</td>
                      </tr>
                    )}
                    {product.leadTimeDays !== null && (
                      <tr className="border-t border-border/50">
                        <td className="w-2/5 bg-muted/20 px-4 py-2.5 font-medium">{uiLabels.leadTime}</td>
                        <td className="px-4 py-2.5">{product.leadTimeDays} {uiLabels.days}</td>
                      </tr>
                    )}
                    {product.tradeTerms && (
                      <tr className="border-t border-border/50">
                        <td className="w-2/5 bg-muted/20 px-4 py-2.5 font-medium">{uiLabels.tradeTerms}</td>
                        <td className="px-4 py-2.5">{product.tradeTerms}</td>
                      </tr>
                    )}
                    {product.paymentTerms && (
                      <tr className="border-t border-border/50">
                        <td className="w-2/5 bg-muted/20 px-4 py-2.5 font-medium">{uiLabels.paymentTerms}</td>
                        <td className="px-4 py-2.5">{product.paymentTerms}</td>
                      </tr>
                    )}
                    {product.packagingDetails && (
                      <tr className="border-t border-border/50">
                        <td className="w-2/5 bg-muted/20 px-4 py-2.5 font-medium">{uiLabels.packaging}</td>
                        <td className="px-4 py-2.5">{product.packagingDetails}</td>
                      </tr>
                    )}
                    <tr className="border-t border-border/50">
                      <td className="w-2/5 bg-muted/20 px-4 py-2.5 font-medium">{uiLabels.customization}</td>
                      <td className="px-4 py-2.5">
                        {product.customizationSupport ? uiLabels.customizationYes : uiLabels.customizationNo}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Inquiry actions */}
            <ProductActions
              productId={product.id}
              name={product.name}
              sku={product.sku}
              imageUrl={product.featuredImage?.url}
              captchaSiteKey={captchaSiteKey}
              customFormFields={customFormFields}
              labels={{
                addToBasket: uiLabels.addToBasket,
                sendInquiry: uiLabels.sendInquiry,
                formTitle: uiLabels.formTitle,
                formName: uiLabels.formName,
                formEmail: uiLabels.formEmail,
                formPhone: uiLabels.formPhone,
                formCompany: uiLabels.formCompany,
                formCountry: uiLabels.formCountry,
                formMessage: uiLabels.formMessage,
                formSubmit: uiLabels.formSubmit,
                formCancel: uiLabels.formCancel,
                formSuccess: uiLabels.formSuccess,
                formError: uiLabels.formError,
              }}
            />
          </div>
        </div>

        {/* Rich text description */}
        {product.description && (
          <div
            className="prose prose-sm mt-10 max-w-none text-foreground sm:prose"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        )}

        {/* Specifications */}
        {product.attributeGroups.length > 0 && (
          <div className="mt-10 space-y-6">
            <h2 className="text-xl font-semibold">{uiLabels.specifications}</h2>
            {product.attributeGroups.map((group) => (
              <section key={group.id} className="space-y-3">
                <h3 className="text-lg font-medium">{group.name}</h3>
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
        )}

        {/* Videos */}
        {product.videoLinks.length > 0 && (
          <div className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">{uiLabels.videos}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {product.videoLinks.map((url, idx) => {
                const ytId = extractYouTubeId(url);
                if (ytId) {
                  return (
                    <div key={idx} className="relative aspect-video overflow-hidden rounded-lg border border-border/60">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${ytId}`}
                        title={`${product.name} video ${idx + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                        loading="lazy"
                      />
                    </div>
                  );
                }
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-border p-4 text-sm transition hover:bg-accent"
                  >
                    <Play className="h-5 w-5 text-primary" />
                    <span className="truncate">{url}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Attachments */}
        {product.attachments.length > 0 && (
          <div className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">{uiLabels.attachments}</h2>
            <div className="space-y-2">
              {product.attachments.map((file) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm transition hover:bg-accent"
                >
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <span className="truncate">{file.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-10 space-y-4">
            <h2 className="text-xl font-semibold">{uiLabels.relatedProducts}</h2>
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
        )}
      </main>
    </div>
  );
}
