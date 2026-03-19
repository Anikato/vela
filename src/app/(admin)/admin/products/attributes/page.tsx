export const metadata = { title: '产品参数' };

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { ProductAttributeManagement } from '@/components/admin/products/product-attribute-management';
import { Button } from '@/components/ui/button';
import { getAllLanguages, getDefaultLanguage } from '@/server/services/language.service';
import {
  getProductAttributeEditorData,
  getProductOptions,
} from '@/server/services/product-attribute.service';

interface ProductAttributesPageProps {
  searchParams?: Promise<{
    productId?: string;
  }>;
}

export default async function ProductAttributesPage({ searchParams }: ProductAttributesPageProps) {
  const allLanguages = await getAllLanguages();
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;

  const productOptions = await getProductOptions(locale, locale);
  const resolvedSearch = (await searchParams) ?? {};
  const selectedProductId = resolvedSearch.productId ?? productOptions[0]?.id ?? '';

  const initialData = selectedProductId
    ? await getProductAttributeEditorData(selectedProductId, locale, locale)
    : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">产品参数管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理参数分组、参数项多语言内容，并支持拖拽排序
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/i18n/ui?search=product.parameterHeader">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            自定义参数表头
          </Link>
        </Button>
      </div>
      <ProductAttributeManagement
        productOptions={productOptions}
        selectedProductId={selectedProductId}
        initialData={initialData}
        locales={allLanguages}
      />
    </div>
  );
}
