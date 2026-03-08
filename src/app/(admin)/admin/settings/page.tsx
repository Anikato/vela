import { getSiteSettings } from '@/server/services/settings-admin.service';
import { getActiveLanguages } from '@/server/services/language.service';
import { listMedia } from '@/server/services/media.service';
import { getStorageAdapter } from '@/server/storage';
import { SiteSettingsManagement } from '@/components/admin/settings/site-settings-management';

export default async function SettingsPage() {
  const [settings, activeLanguages, mediaResult] = await Promise.all([
    getSiteSettings(),
    getActiveLanguages(),
    listMedia({ page: 1, pageSize: 200 }),
  ]);

  const storage = getStorageAdapter();
  const mediaItems = mediaResult.items.map((m) => ({
    id: m.id,
    filename: m.filename,
    originalName: m.originalName,
    url: storage.getPublicUrl(m.filename),
    mimeType: m.mimeType,
  }));

  const langs = activeLanguages.map((l) => ({
    code: l.code,
    name: l.nativeName ?? l.chineseName ?? l.englishName,
  }));

  return (
    <SiteSettingsManagement
      initialSettings={settings}
      languages={langs}
      mediaItems={mediaItems}
    />
  );
}
