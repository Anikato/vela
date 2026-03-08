import { PageManagement } from '@/components/admin/pages/page-management';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getPageList } from '@/server/services/page.service';

export default async function PagesPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const pages = await getPageList(defaultLanguage.code, defaultLanguage.code);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">页面管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理自定义页面基础信息和多语言 SEO 文案
          </p>
        </div>
      </div>
      <PageManagement initialPages={pages} locales={allLanguages} />
    </div>
  );
}
