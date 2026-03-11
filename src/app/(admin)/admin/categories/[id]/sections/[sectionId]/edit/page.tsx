import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { SectionForm, type SectionItemForUI } from '@/components/admin/pages/section-form';
import { Button } from '@/components/ui/button';
import { getTranslation } from '@/lib/i18n';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getCategoryById } from '@/server/services/category.service';
import { getSectionById } from '@/server/services/section.service';
import { getSectionItems } from '@/server/services/section-item.service';
import { listMedia } from '@/server/services/media.service';
import { getStorageAdapter } from '@/server/storage';

interface PageProps {
  params: Promise<{ id: string; sectionId: string }>;
}

export default async function EditCategorySectionPage({ params }: PageProps) {
  const { id: categoryId, sectionId } = await params;

  const [allLanguages, defaultLanguage, section, category, mediaResult] = await Promise.all([
    getAllLanguages(),
    getDefaultLanguage(),
    getSectionById(sectionId),
    getCategoryById(categoryId),
    listMedia({ page: 1, pageSize: 200 }),
  ]);

  const items = await getSectionItems(sectionId, defaultLanguage.code, defaultLanguage.code);
  const categoryName = getTranslation(category.translations, defaultLanguage.code, defaultLanguage.code)?.name ?? category.slug;

  const storage = getStorageAdapter();
  const mediaItems = mediaResult.items.map((m) => ({
    ...m,
    url: storage.getPublicUrl(m.filename),
  }));

  const sectionTitle =
    getTranslation(section.translations, defaultLanguage.code, defaultLanguage.code)?.title
    ?? `(${section.type})`;

  const sectionForList = { ...section, displayTitle: sectionTitle };

  const clientItems: SectionItemForUI[] = items.map((item) => ({
    id: item.id,
    sectionId: item.sectionId,
    iconName: item.iconName,
    imageId: item.imageId,
    imageUrl: item.imageUrl,
    linkUrl: item.linkUrl,
    config: item.config ?? {},
    sortOrder: item.sortOrder,
    displayTitle: item.displayTitle,
    translations: item.translations.map((tr) => ({
      id: tr.id,
      itemId: tr.itemId,
      locale: tr.locale,
      title: tr.title,
      description: tr.description,
      content: tr.content,
    })),
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
        <h1 className="text-2xl font-bold">编辑区块</h1>
        <p className="text-sm text-muted-foreground">
          分类：{categoryName} · {sectionTitle}（{section.type}）
        </p>
      </div>

      <SectionForm
        categoryId={categoryId}
        section={sectionForList}
        initialItems={clientItems}
        locales={allLanguages}
        mediaItems={mediaItems}
        backUrl={`/admin/categories/${categoryId}/sections`}
      />
    </div>
  );
}
