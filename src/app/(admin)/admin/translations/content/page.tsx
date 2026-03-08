import { getActiveLanguages } from '@/server/services/language.service';
import { getTranslationOverview } from '@/server/services/translation-stats.service';
import { TranslationOverviewDashboard } from '@/components/admin/translations/translation-overview';

export default async function ContentTranslationPage() {
  const [overview, languages] = await Promise.all([
    getTranslationOverview(),
    getActiveLanguages(),
  ]);

  const langMap = Object.fromEntries(
    languages.map((l) => [l.code, l.nativeName ?? l.chineseName ?? l.englishName]),
  );

  return <TranslationOverviewDashboard overview={overview} langNames={langMap} />;
}
