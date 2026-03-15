export const metadata = { title: '自动翻译' };

import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { AutoTranslateManagement } from '@/components/admin/translations/auto-translate-management';

export default async function AutoTranslatePage() {
  const [languages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ]);

  const langs = languages.map((l) => ({
    code: l.code,
    name: l.nativeName ?? l.chineseName ?? l.englishName,
    isDefault: l.isDefault,
  }));

  return (
    <AutoTranslateManagement
      languages={langs}
      defaultLocale={defaultLanguage.code}
    />
  );
}
