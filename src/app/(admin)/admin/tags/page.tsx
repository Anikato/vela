import { TagManagement } from '@/components/admin/tags/tag-management';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getTagList } from '@/server/services/tag.service';

export default async function TagsPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const tags = await getTagList(defaultLanguage.code, defaultLanguage.code);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">标签管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理产品标签及其多语言名称
          </p>
        </div>
      </div>
      <TagManagement initialTags={tags} locales={allLanguages} />
    </div>
  );
}
