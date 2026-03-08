import { getActiveLanguages } from '@/server/services/language.service';
import { getFormFields } from '@/server/services/inquiry-form-field.service';
import { InquiryFormFieldManagement } from '@/components/admin/inquiries/inquiry-form-field-management';

export default async function InquiryFormConfigPage() {
  const [fields, languages] = await Promise.all([
    getFormFields(),
    getActiveLanguages(),
  ]);

  const langs = languages.map((l) => ({
    code: l.code,
    name: l.nativeName ?? l.chineseName ?? l.englishName,
  }));

  return <InquiryFormFieldManagement initialFields={fields} languages={langs} />;
}
