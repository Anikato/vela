export const metadata = { title: '页面管理' };

import { PageManagement } from '@/components/admin/pages/page-management';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { ensureSystemRoutePage, getPageList, SYSTEM_ROUTES } from '@/server/services/page.service';

export default async function PagesPage() {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();

  await Promise.all(
    (Object.keys(SYSTEM_ROUTES) as Array<keyof typeof SYSTEM_ROUTES>).map((route) =>
      ensureSystemRoutePage(route),
    ),
  );

  const pages = await getPageList(defaultLanguage.code, defaultLanguage.code);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">页面管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理自定义页面基础信息和多语言 SEO 文案，系统页面的区块将显示在对应系统路由上
          </p>
        </div>
      </div>
      <PageManagement initialPages={pages} locales={allLanguages} />
    </div>
  );
}
