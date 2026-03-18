import { FileText, Play } from 'lucide-react';

import { buildLocalizedPath } from '@/lib/i18n';
import type {
  PublicCategoryTreeNode,
  PublicProductCardItem,
  PublicProductDetail,
} from '@/server/services/product-public.service';
import type { CustomFormField } from '@/components/website/inquiry/inquiry-form-dialog';
import { Breadcrumb } from '@/components/website/layout/breadcrumb';
import { ProductGallery } from './product-gallery';
import { ProductActions } from './product-actions';
import { ProductCard } from './product-card';
import { CategorySidebar } from './category-sidebar';

interface ProductDetailPageProps {
  locale: string;
  defaultLocale: string;
  product: PublicProductDetail;
  currentCategoryName: string;
  currentCategorySlug: string;
  relatedProducts: PublicProductCardItem[];
  categoryTree: PublicCategoryTreeNode[];
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
    parameterHeader: string;
    valueHeader: string;
    categories: string;
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
  currentCategorySlug,
  relatedProducts,
  categoryTree,
  captchaSiteKey,
  customFormFields,
  uiLabels,
}: ProductDetailPageProps) {
  const homeHref = buildLocalizedPath('/', locale, defaultLocale);
  const productsHref = buildLocalizedPath('/products', locale, defaultLocale);
  const categoryHref = buildLocalizedPath(
    `/products/${currentCategorySlug}`,
    locale,
    defaultLocale,
  );

  const hasCommercialInfo =
    product.moq !== null ||
    product.leadTimeDays !== null ||
    product.tradeTerms ||
    product.paymentTerms ||
    product.packagingDetails;

  const attributeSection =
    product.attributeGroups.length > 0 ? (
      <div className="space-y-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{uiLabels.specifications}</h2>
        {product.attributeGroups.map((group) => (
          <section key={group.id} className="space-y-3">
            <h3 className="text-lg font-medium">{group.name}</h3>
            <div className="overflow-hidden rounded-xl border border-border/50">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-foreground text-background">
                    <th className="border-b border-foreground/20 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">{uiLabels.parameterHeader}</th>
                    <th className="border-b border-foreground/20 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider">{uiLabels.valueHeader}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.attributes.map((attr, idx) => (
                    <tr key={attr.id} className={idx % 2 === 0 ? 'bg-muted/15' : ''}>
                      <td className="w-[35%] border-b border-r border-border/40 px-4 py-2.5 font-medium">{attr.name}</td>
                      <td className="border-b border-border/40 px-4 py-2.5">{attr.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    ) : null;

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

      <div className="vt-container py-8 lg:py-10">
        <div className="flex gap-8 xl:gap-10">
          {/* Left sidebar — category navigation (desktop only) */}
          {categoryTree.length > 0 && (
            <aside className="hidden w-64 shrink-0 lg:block xl:w-72">
              <div className="sticky top-24">
                <CategorySidebar
                  tree={categoryTree}
                  locale={locale}
                  defaultLocale={defaultLocale}
                  currentCategorySlug={currentCategorySlug}
                  currentProductSlug={product.slug}
                  title={uiLabels.categories}
                />
              </div>
            </aside>
          )}

          {/* Main content area */}
          <main className="min-w-0 flex-1">
            {/* Product hero: gallery + info side by side */}
            <div className="grid gap-8 md:grid-cols-2 md:gap-10 xl:gap-12">
              <ProductGallery
                featuredImage={product.featuredImage}
                galleryImages={product.galleryImages}
                productName={product.name}
              />

              <div className="space-y-5">
                <div>
                  <p className="font-mono text-xs tracking-wider text-muted-foreground/70 uppercase">{product.sku}</p>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
                </div>

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

                {hasCommercialInfo && (
                  <div className="overflow-hidden rounded-xl border border-border/40">
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

            {/* Below-the-fold content sections */}
            <div className="mt-12 space-y-12 lg:mt-16">
              {product.attributeDisplayPosition === 'before_description' && attributeSection && (
                <div className="border-t border-border/30 pt-10">{attributeSection}</div>
              )}

              {product.description && (
                <div
                  className="prose prose-sm max-w-none border-t border-border/30 pt-10 text-foreground sm:prose"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {product.attributeDisplayPosition !== 'before_description' &&
                product.attributeDisplayPosition !== 'hidden' &&
                attributeSection && (
                  <div className="border-t border-border/30 pt-10">{attributeSection}</div>
                )}

              {product.videoLinks.length > 0 && (
                <div className="space-y-4 border-t border-border/30 pt-10">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{uiLabels.videos}</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {product.videoLinks.map((url, idx) => {
                      const ytId = extractYouTubeId(url);
                      if (ytId) {
                        return (
                          <div key={idx} className="relative aspect-video overflow-hidden rounded-xl border border-border/40 shadow-sm">
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

              {product.showAttachmentSection && product.attachments.length > 0 && (
                <div className="space-y-4 border-t border-border/30 pt-10">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{uiLabels.attachments}</h2>
                  <div className="space-y-2">
                    {product.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border/40 p-4 text-sm transition-all duration-200 hover:border-primary/20 hover:bg-primary/[0.02] hover:shadow-sm"
                      >
                        <FileText className="h-5 w-5 shrink-0 text-primary" />
                        <span className="truncate">{file.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {relatedProducts.length > 0 && (
                <section className="space-y-6 border-t border-border/30 pt-10">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{uiLabels.relatedProducts}</h2>
                  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
