import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { getTranslation } from '@/lib/i18n';
import { PageSectionsManagement } from '@/components/admin/pages/page-sections-management';
import { Button } from '@/components/ui/button';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getCategorySections } from '@/server/services/section.service';
import { getCategoryById } from '@/server/services/category.service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CategorySectionsPage({ params }: PageProps) {
  const { id } = await params;

  const [allLanguages, defaultLanguage] = await Promise.all([
    getAllLanguages(),
    getDefaultLanguage(),
  ]);

  const category = await getCategoryById(id);
  const categoryName = getTranslation(category.translations, defaultLanguage.code, defaultLanguage.code)?.name ?? category.slug;
  const sections = await getCategorySections(id, defaultLanguage.code, defaultLanguage.code);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/categories">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回分类管理
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl font-bold">分类区块管理</h1>
          <p className="text-sm text-muted-foreground">
            分类：{categoryName}
          </p>
        </div>
      </div>

      <PageSectionsManagement
        categoryId={id}
        initialSections={sections}
        locales={allLanguages}
        itemsBasePath={`/admin/categories/${id}/sections`}
      />
    </div>
  );
}
