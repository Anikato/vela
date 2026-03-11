import { notFound } from 'next/navigation';

import { NewsForm } from '@/components/admin/news/news-form';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';
import { getNewsById } from '@/server/services/news.service';
import { getTagList } from '@/server/services/tag.service';

interface EditNewsPageProps {
  params: Promise<{ id: string }>;
}

async function loadNews(id: string) {
  try {
    return await getNewsById(id);
  } catch {
    notFound();
  }
}

export default async function EditNewsPage({ params }: EditNewsPageProps) {
  const { id } = await params;
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const newsItem = await loadNews(id);

  const [tags, media] = await Promise.all([
    getTagList(locale, locale),
    listMedia({ page: 1, pageSize: 500 }),
  ]);

  return (
    <NewsForm
      news={newsItem}
      locales={allLanguages}
      tags={tags}
      mediaItems={media.items.map((m) => ({ ...m, url: `/uploads/${m.filename}` }))}
    />
  );
}
