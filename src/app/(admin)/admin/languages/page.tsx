export const metadata = { title: '语言管理' };

import { getAllLanguages } from '@/server/services/language.service';
import { LanguageManagement } from '@/components/admin/languages/language-management';

/**
 * 语言管理页面
 * Server Component 直接调用 Service（读取场景）
 */
export default async function LanguagesPage() {
  const languages = await getAllLanguages();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">语言管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            基于标准语言库管理代码、中文名和自动翻译映射
          </p>
        </div>
      </div>
      <LanguageManagement initialLanguages={languages} />
    </div>
  );
}
