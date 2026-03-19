export const metadata = { title: '分类管理' };

import { CategoryManagement } from '@/components/admin/categories/category-management';
import { getCategoryList } from '@/server/services/category.service';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';

export default async function CategoriesPage() {
  const [allLanguages, defaultLanguage, mediaResult] = await Promise.all([
    getAllLanguages(),
    getDefaultLanguage(),
    listMedia({ page: 1, pageSize: 200 }),
  ]);
  const categories = await getCategoryList(defaultLanguage.code, defaultLanguage.code);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">分类管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理产品分类层级、排序和多语言内容
          </p>
        </div>
      </div>
      <CategoryManagement
        initialCategories={categories}
        locales={allLanguages}
        mediaItems={mediaResult.items}
      />
    </div>
  );
}
