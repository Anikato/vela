import { DataManagement } from '@/components/admin/settings/data-management';
import { getDefaultLanguage } from '@/server/services/language.service';

export default async function DataPage() {
  const defaultLang = await getDefaultLanguage();
  return <DataManagement defaultLocale={defaultLang.code} />;
}
