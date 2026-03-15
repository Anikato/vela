export const metadata = { title: '导航菜单' };

import { NavigationManagement } from '@/components/admin/navigation/navigation-management';
import { getCategoryList } from '@/server/services/category.service';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getNavigationList } from '@/server/services/navigation.service';
import { getPageList } from '@/server/services/page.service';

export default async function NavigationPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();

  const [navigationItems, categories, pages] = await Promise.all([
    getNavigationList(defaultLanguage.code, defaultLanguage.code),
    getCategoryList(defaultLanguage.code, defaultLanguage.code),
    getPageList(defaultLanguage.code, defaultLanguage.code),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">导航管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理站点菜单结构与多语言名称（支持内部、外部、分类、页面四种链接）
          </p>
        </div>
      </div>
      <NavigationManagement
        initialItems={navigationItems}
        locales={allLanguages}
        categories={categories.map((item) => ({
          id: item.id,
          label: item.displayName,
          slug: item.slug,
        }))}
        pages={pages.map((item) => ({
          id: item.id,
          label: item.displayTitle,
          slug: item.slug,
        }))}
      />
    </div>
  );
}
