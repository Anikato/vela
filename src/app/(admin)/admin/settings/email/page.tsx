export const metadata = { title: '邮件配置' };

import { getSiteSettings } from '@/server/services/settings-admin.service';
import { EmailSettingsManagement } from '@/components/admin/settings/email-settings-management';

export default async function EmailSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <EmailSettingsManagement
      initialSettings={{
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpFromName: settings.smtpFromName,
        smtpFromEmail: settings.smtpFromEmail,
        notificationEmails: settings.notificationEmails,
      }}
    />
  );
}
