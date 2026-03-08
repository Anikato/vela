import { getSiteSettings } from '@/server/services/settings-admin.service';
import { ScriptsSettingsManagement } from '@/components/admin/settings/scripts-settings-management';

export default async function ScriptsSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <ScriptsSettingsManagement
      initialSettings={{
        gaId: settings.gaId,
        gtmId: settings.gtmId,
        fbPixelId: settings.fbPixelId,
        headScripts: settings.headScripts,
        bodyScripts: settings.bodyScripts,
      }}
    />
  );
}
