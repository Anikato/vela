import { getCategories, getUiTranslationList } from '@/server/services/ui-translation-admin.service';
import { getActiveLanguages } from '@/server/services/language.service';
import { UiTranslationManagement } from '@/components/admin/translations/ui-translation-management';

export default async function UiTranslationPage() {
  const [categories, initialData, activeLanguages] = await Promise.all([
    getCategories(),
    getUiTranslationList({ page: 1, pageSize: 50 }),
    getActiveLanguages(),
  ]);

  const langs = activeLanguages.map((l) => ({ code: l.code, name: l.nativeName ?? l.chineseName ?? l.englishName }));

  return (
    <UiTranslationManagement
      initialCategories={categories}
      initialData={initialData}
      languages={langs}
    />
  );
}
