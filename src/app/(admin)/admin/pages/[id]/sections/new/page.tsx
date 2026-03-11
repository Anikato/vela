import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { SectionForm } from '@/components/admin/pages/section-form';
import { Button } from '@/components/ui/button';
import { getAllLanguages } from '@/server/services/language.service';
import { getPageById } from '@/server/services/page.service';
import { listMedia } from '@/server/services/media.service';
import { getStorageAdapter } from '@/server/storage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewSectionPage({ params }: PageProps) {
  const { id: pageId } = await params;

  const [allLanguages, page, mediaResult] = await Promise.all([
    getAllLanguages(),
    getPageById(pageId),
    listMedia({ page: 1, pageSize: 200 }),
  ]);

  const storage = getStorageAdapter();
  const mediaItems = mediaResult.items.map((m) => ({
    ...m,
    url: storage.getPublicUrl(m.filename),
  }));

  return (
    <div>
      <div className="mb-6 space-y-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/pages/${pageId}/sections`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回区块管理
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">新增区块</h1>
        <p className="text-sm text-muted-foreground">
          页面：{page.slug}
        </p>
      </div>

      <SectionForm
        pageId={pageId}
        locales={allLanguages}
        mediaItems={mediaItems}
        backUrl={`/admin/pages/${pageId}/sections`}
      />
    </div>
  );
}
