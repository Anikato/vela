import { ProductManagement } from '@/components/admin/products/product-management';
import { getCategoryList } from '@/server/services/category.service';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';
import { getProductList } from '@/server/services/product.service';

export default async function ProductsPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const [products, categories, media] = await Promise.all([
    getProductList(locale, locale),
    getCategoryList(locale, locale),
    listMedia({ page: 1, pageSize: 200 }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">产品管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理产品生命周期状态、分类标签和多语言内容
          </p>
        </div>
      </div>
      <ProductManagement
        initialProducts={products}
        locales={allLanguages}
        categories={categories}
        mediaItems={media.items}
      />
    </div>
  );
}
