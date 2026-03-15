export const metadata = { title: '询盘自动回复' };

import { getSiteSettings } from '@/server/services/settings-admin.service';
import { getActiveLanguages } from '@/server/services/language.service';
import { AutoReplyTemplateManagement } from '@/components/admin/inquiries/auto-reply-template-management';

export default async function AutoReplyPage() {
  const [settings, languages] = await Promise.all([
    getSiteSettings(),
    getActiveLanguages(),
  ]);

  const langs = languages.map((l) => ({ code: l.code, name: l.englishName }));

  const templates: Record<string, { subject: string; body: string }> = {};
  for (const t of settings.translations) {
    templates[t.locale] = {
      subject: t.inquiryAutoReplySubject ?? '',
      body: t.inquiryAutoReplyBody ?? '',
    };
  }

  return (
    <AutoReplyTemplateManagement
      languages={langs}
      initialTemplates={templates}
    />
  );
}
