import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { SectionList } from '@/components/admin/pages/section-list';
import { Button } from '@/components/ui/button';
import { getDefaultLanguage } from '@/server/services/language.service';
import { getPageById } from '@/server/services/page.service';
import { getPageSections } from '@/server/services/section.service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PageSectionsPage({ params }: PageProps) {
  const { id } = await params;

  const [defaultLanguage, page] = await Promise.all([
    getDefaultLanguage(),
    getPageById(id),
  ]);
  const sections = await getPageSections(id, defaultLanguage.code, defaultLanguage.code);

  const previewSlug = page.isHomepage
    ? '/'
    : page.slug === 'about'
      ? '/about'
      : `/page/${page.slug}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/pages">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回页面管理
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">页面区块管理</h1>
          <p className="text-sm text-muted-foreground">
            页面：{page.slug}（{page.status === 'published' ? '已发布' : '草稿'}）
          </p>
        </div>
      </div>

      <SectionList
        pageId={id}
        sections={sections}
        editBasePath={`/admin/pages/${id}/sections`}
        previewUrl={previewSlug}
      />
    </div>
  );
}
