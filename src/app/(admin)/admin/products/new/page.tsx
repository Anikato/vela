import { ProductForm } from '@/components/admin/products/product-form';
import { getCategoryList } from '@/server/services/category.service';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';
import { getTagList } from '@/server/services/tag.service';

export default async function NewProductPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const [categories, tags, media] = await Promise.all([
    getCategoryList(locale, locale),
    getTagList(locale, locale),
    listMedia({ page: 1, pageSize: 500 }),
  ]);

  return (
    <ProductForm
      locales={allLanguages}
      categories={categories}
      tags={tags}
      mediaItems={media.items}
    />
  );
}
