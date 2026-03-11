import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { SectionForm } from '@/components/admin/pages/section-form';
import { Button } from '@/components/ui/button';
import { getTranslation } from '@/lib/i18n';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getCategoryById } from '@/server/services/category.service';
import { listMedia } from '@/server/services/media.service';
import { getStorageAdapter } from '@/server/storage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewCategorySectionPage({ params }: PageProps) {
  const { id: categoryId } = await params;

  const [allLanguages, defaultLanguage, category, mediaResult] = await Promise.all([
    getAllLanguages(),
    getDefaultLanguage(),
    getCategoryById(categoryId),
    listMedia({ page: 1, pageSize: 200 }),
  ]);

  const categoryName = getTranslation(category.translations, defaultLanguage.code, defaultLanguage.code)?.name ?? category.slug;

  const storage = getStorageAdapter();
  const mediaItems = mediaResult.items.map((m) => ({
    ...m,
    url: storage.getPublicUrl(m.filename),
  }));

  return (
    <div>
      <div className="mb-6 space-y-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/admin/categories/${categoryId}/sections`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回区块管理
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">新增区块</h1>
        <p className="text-sm text-muted-foreground">
          分类：{categoryName}
        </p>
      </div>

      <SectionForm
        categoryId={categoryId}
        locales={allLanguages}
        mediaItems={mediaItems}
        backUrl={`/admin/categories/${categoryId}/sections`}
      />
    </div>
  );
}
