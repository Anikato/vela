import { notFound } from 'next/navigation';

import { ProductForm } from '@/components/admin/products/product-form';
import { getCategoryList } from '@/server/services/category.service';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';
import { getProductById, getProductList } from '@/server/services/product.service';
import { getTagList } from '@/server/services/tag.service';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

async function loadProduct(id: string) {
  try {
    return await getProductById(id);
  } catch {
    notFound();
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const product = await loadProduct(id);

  const [categories, tags, media, productList] = await Promise.all([
    getCategoryList(locale, locale),
    getTagList(locale, locale),
    listMedia({ page: 1, pageSize: 500 }),
    getProductList(locale, locale),
  ]);

  const matched = productList.find((p) => p.id === id);
  const productWithDisplay = matched ?? {
    ...product,
    displayName: product.translations[0]?.name ?? '(Untitled)',
    primaryCategoryName: '',
  };

  return (
    <ProductForm
      product={productWithDisplay}
      locales={allLanguages}
      categories={categories}
      tags={tags}
      mediaItems={media.items}
    />
  );
}
