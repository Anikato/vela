import { getThemeList, ensureDefaultTheme } from '@/server/services/theme.service';
import { ThemeManagement } from '@/components/admin/themes/theme-management';

export default async function ThemesPage() {
  await ensureDefaultTheme();
  const themeList = await getThemeList();

  return <ThemeManagement initialThemes={themeList} />;
}
