import { NewsForm } from '@/components/admin/news/news-form';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';
import { getTagList } from '@/server/services/tag.service';

export default async function NewNewsPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const [tags, media] = await Promise.all([
    getTagList(locale, locale),
    listMedia({ page: 1, pageSize: 500 }),
  ]);

  return (
    <NewsForm
      locales={allLanguages}
      tags={tags}
      mediaItems={media.items.map((m) => ({ ...m, url: `/uploads/${m.filename}` }))}
    />
  );
}
