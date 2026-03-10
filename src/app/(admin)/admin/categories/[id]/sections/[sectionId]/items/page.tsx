import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import {
  SectionItemsManagement,
  type SectionItemForUI,
} from '@/components/admin/pages/section-items-management';
import { Button } from '@/components/ui/button';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getSectionById } from '@/server/services/section.service';
import { getSectionItems } from '@/server/services/section-item.service';
import { listMedia } from '@/server/services/media.service';
import { getStorageAdapter } from '@/server/storage';
import { getTranslation } from '@/lib/i18n';

interface PageProps {
  params: Promise<{ id: string; sectionId: string }>;
}

export default async function CategorySectionItemsPage({ params }: PageProps) {
  const { id: categoryId, sectionId } = await params;

  const [allLanguages, defaultLanguage, section, mediaResult] =
    await Promise.all([
      getAllLanguages(),
      getDefaultLanguage(),
      getSectionById(sectionId),
      listMedia({ page: 1, pageSize: 200 }),
    ]);

  const items = await getSectionItems(
    sectionId,
    defaultLanguage.code,
    defaultLanguage.code,
  );

  const storage = getStorageAdapter();
  const mediaItems = mediaResult.items.map((m) => ({
    id: m.id,
    filename: m.filename,
    originalName: m.originalName,
    url: storage.getPublicUrl(m.filename),
    mimeType: m.mimeType,
  }));

  const sectionTitle =
    getTranslation(section.translations, defaultLanguage.code, defaultLanguage.code)
      ?.title ?? `(${section.type})`;

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
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/categories/${categoryId}/sections`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回区块管理
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">管理区块子项</h1>
        <p className="text-sm text-muted-foreground">
          区块：{sectionTitle}（类型：{section.type}）
        </p>
      </div>

      <SectionItemsManagement
        sectionId={sectionId}
        sectionType={section.type}
        initialItems={clientItems}
        locales={allLanguages}
        mediaItems={mediaItems}
      />
    </div>
  );
}
