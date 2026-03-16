'use client';

import { useRouter } from 'next/navigation';

import type {
  Language,
  ProductAttributeEditorData,
  ProductOption,
} from '@/types/admin';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductAttributeEditor } from './product-attribute-editor';

interface ProductAttributeManagementProps {
  productOptions: ProductOption[];
  selectedProductId: string;
  initialData: ProductAttributeEditorData | null;
  locales: Language[];
}

export function ProductAttributeManagement({
  productOptions,
  selectedProductId,
  initialData,
  locales,
}: ProductAttributeManagementProps) {
  const router = useRouter();

  function onChangeProduct(nextProductId: string) {
    if (!nextProductId) return;
    router.push(`/admin/products/attributes?productId=${nextProductId}`);
  }

  if (!initialData) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border/50 bg-card p-6 text-sm text-muted-foreground">
          暂无可编辑产品，请先在产品管理中创建产品。
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <label className="mb-2 block text-sm font-medium">选择产品</label>
        <Select value={selectedProductId} onValueChange={onChangeProduct}>
          <SelectTrigger><SelectValue placeholder="选择产品" /></SelectTrigger>
          <SelectContent>
            {productOptions.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.displayName} ({product.sku})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProductAttributeEditor
        productId={selectedProductId}
        initialData={initialData}
        locales={locales}
      />
    </div>
  );
}
