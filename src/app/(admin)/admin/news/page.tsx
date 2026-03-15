export const metadata = { title: '新闻管理' };

import { NewsList } from '@/components/admin/news/news-list';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getNewsListPaginated } from '@/server/services/news.service';

export default async function NewsPage() {
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const initialData = await getNewsListPaginated({
    locale,
    defaultLocale: locale,
    page: 1,
    pageSize: 20,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">新闻管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理新闻文章的内容、多语言翻译和发布状态
        </p>
      </div>
      <NewsList
        initialData={initialData}
        locale={locale}
        defaultLocale={locale}
      />
    </div>
  );
}
