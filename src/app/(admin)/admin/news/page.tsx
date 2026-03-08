import { NewsManagement } from '@/components/admin/news/news-management';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';
import { getNewsList } from '@/server/services/news.service';

export default async function NewsPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const [newsList, mediaList] = await Promise.all([
    getNewsList(locale, locale),
    listMedia({ page: 1, pageSize: 200 }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">新闻管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理新闻文章的内容、多语言翻译和发布状态
        </p>
      </div>
      <NewsManagement
        initialNews={newsList}
        locales={allLanguages}
        mediaItems={mediaList.items.map((m) => ({ ...m, url: `/uploads/${m.filename}` }))}
      />
    </div>
  );
}
