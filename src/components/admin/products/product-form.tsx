'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  CategoryListItem,
  Language,
  Media,
  ProductListItem,
  ProductStatus,
  TagListItem,
} from '@/types/admin';
import {
  createProductAction,
  updateProductAction,
} from '@/server/actions/product.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RichTextEditor } from '@/components/admin/common/rich-text-editor';
import { MediaPickerDialog } from '@/components/admin/common/media-picker-dialog';
import { SortableImageGrid } from '@/components/admin/common/sortable-image-grid';

type MediaWithUrl = Media & { url: string };

type TranslationForm = {
  locale: string;
  name: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

type ProductEditTab = 'basic' | 'media' | 'commercial' | 'i18n';

interface ProductFormProps {
  product?: ProductListItem | null;
  locales: Language[];
  categories: CategoryListItem[];
  tags: TagListItem[];
  mediaItems: MediaWithUrl[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildTranslationForm(
  locales: Language[],
  existing?: ProductListItem['translations'],
): TranslationForm[] {
  return locales.map((locale) => {
    const matched = existing?.find((tr) => tr.locale === locale.code);
    return {
      locale: locale.code,
      name: matched?.name ?? '',
      shortDescription: matched?.shortDescription ?? '',
      description: matched?.description ?? '',
      seoTitle: matched?.seoTitle ?? '',
      seoDescription: matched?.seoDescription ?? '',
    };
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function ProductForm({
  product,
  locales,
  categories,
  tags,
  mediaItems,
}: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(product);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<MediaWithUrl[]>(mediaItems);

  const defaultLocale = useMemo(
    () => locales.find((l) => l.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );

  // ─── Form State ───
  const [activeTab, setActiveTab] = useState<ProductEditTab>('basic');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [status, setStatus] = useState<ProductStatus>(
    (product?.status as ProductStatus) ?? 'draft',
  );
  const [sortOrder, setSortOrder] = useState(product?.sortOrder ?? 0);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(
    product?.primaryCategoryId ?? categories[0]?.id ?? '',
  );
  const [featuredImageId, setFeaturedImageId] = useState(
    product?.featuredImageId ?? '',
  );
  const [moq, setMoq] = useState(
    product?.moq == null ? '' : String(product.moq),
  );
  const [leadTimeDays, setLeadTimeDays] = useState(
    product?.leadTimeDays == null ? '' : String(product.leadTimeDays),
  );
  const [tradeTerms, setTradeTerms] = useState(product?.tradeTerms ?? '');
  const [paymentTerms, setPaymentTerms] = useState(product?.paymentTerms ?? '');
  const [packagingDetails, setPackagingDetails] = useState(
    product?.packagingDetails ?? '',
  );
  const [customizationSupport, setCustomizationSupport] = useState(
    product?.customizationSupport ?? false,
  );
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>(
    product?.additionalCategoryIds ?? [],
  );
  const [tagIds, setTagIds] = useState<string[]>(product?.tagIds ?? []);
  const [galleryImageIds, setGalleryImageIds] = useState<string[]>(
    product?.galleryImageIds ?? [],
  );
  const [attachmentIds, setAttachmentIds] = useState<string[]>(
    product?.attachmentIds ?? [],
  );
  const [videoLinksText, setVideoLinksText] = useState(
    (product?.videoLinks ?? []).join('\n'),
  );
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales, product?.translations),
  );
  const [expandedLocales, setExpandedLocales] = useState<string[]>(
    defaultLocale ? [defaultLocale] : [],
  );

  // ─── Media Picker State ───
  const [pickerMode, setPickerMode] = useState<
    'featured' | 'gallery' | 'attachment' | null
  >(null);

  // ─── Unsaved Changes Dialog ───
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // ─── Derived ───
  const featuredMedia = featuredImageId
    ? mediaLibrary.find((m) => m.id === featuredImageId) ?? null
    : null;
  const galleryMedia = useMemo(
    () =>
      galleryImageIds
        .map((id) => mediaLibrary.find((m) => m.id === id))
        .filter(Boolean) as MediaWithUrl[],
    [galleryImageIds, mediaLibrary],
  );
  const attachmentMedia = useMemo(
    () =>
      attachmentIds
        .map((id) => mediaLibrary.find((m) => m.id === id))
        .filter(Boolean) as MediaWithUrl[],
    [attachmentIds, mediaLibrary],
  );
  const orderedTranslations = useMemo(() => {
    const list = [...translations];
    list.sort((a, b) => {
      if (a.locale === defaultLocale) return -1;
      if (b.locale === defaultLocale) return 1;
      return a.locale.localeCompare(b.locale);
    });
    return list;
  }, [defaultLocale, translations]);

  // ─── Helpers ───
  function handleMediaUploaded(items: MediaWithUrl[]) {
    setMediaLibrary((prev) => [...items, ...prev]);
  }

  function updateTranslation(
    locale: string,
    key: keyof Omit<TranslationForm, 'locale'>,
    value: string,
  ) {
    setTranslations((prev) =>
      prev.map((t) => (t.locale === locale ? { ...t, [key]: value } : t)),
    );

    if (key === 'name' && locale === defaultLocale && !slugTouched) {
      setSlug(slugify(value));
    }
  }

  function toggleLocalePanel(locale: string) {
    setExpandedLocales((prev) =>
      prev.includes(locale)
        ? prev.filter((l) => l !== locale)
        : [...prev, locale],
    );
  }

  // ─── Save ───
  async function handleSave() {
    if (!sku.trim() || !slug.trim()) {
      toast.error('SKU 和 Slug 不能为空');
      return;
    }
    if (!primaryCategoryId) {
      toast.error('请选择主分类');
      return;
    }

    const payload = {
      sku: sku.trim(),
      slug: slug.trim().toLowerCase(),
      status,
      sortOrder,
      primaryCategoryId,
      featuredImageId: featuredImageId || null,
      videoLinks: videoLinksText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      moq: moq ? Number(moq) : null,
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
      tradeTerms: tradeTerms.trim() || null,
      paymentTerms: paymentTerms.trim() || null,
      packagingDetails: packagingDetails.trim() || null,
      customizationSupport,
      additionalCategoryIds: additionalCategoryIds.filter(
        (id) => id !== primaryCategoryId,
      ),
      tagIds,
      galleryImageIds,
      attachmentIds,
      translations: translations.map((t) => ({
        locale: t.locale,
        name: t.name || undefined,
        shortDescription: t.shortDescription || undefined,
        description: t.description || undefined,
        seoTitle: t.seoTitle || undefined,
        seoDescription: t.seoDescription || undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      const result = product
        ? await updateProductAction(product.id, payload)
        : await createProductAction(payload);

      if (!result.success) {
        const errMsg =
          typeof result.error === 'string'
            ? result.error
            : Object.values(result.error).flat().join('；');
        toast.error(errMsg || '保存失败');
        return;
      }

      toast.success(product ? '产品已更新' : '产品已创建');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      console.error('Save error:', err);
      toast.error('保存时发生错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    router.push('/admin/products');
  }

  const tabs: { key: ProductEditTab; label: string }[] = [
    { key: 'basic', label: '基础信息' },
    { key: 'media', label: '媒体附件' },
    { key: 'commercial', label: '商业信息' },
    { key: 'i18n', label: '多语言' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ─── 面包屑 / 头部 ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {isEditing ? '编辑产品' : '新建产品'}
            </h1>
            {product && (
              <p className="text-sm text-muted-foreground">
                {product.sku} · {product.slug}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              status === 'published'
                ? 'default'
                : status === 'archived'
                  ? 'outline'
                  : 'secondary'
            }
          >
            {status === 'published'
              ? '已发布'
              : status === 'archived'
                ? '已归档'
                : '草稿'}
          </Badge>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* ─── 标签页 ─── */}
      <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── 基础信息 ─── */}
      {activeTab === 'basic' && (
        <div className="space-y-6 rounded-lg border border-border/50 bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU *</label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="例如：VAL-1001"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug *</label>
              <Input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                placeholder="根据产品名自动生成"
                disabled={isSubmitting}
              />
              <p className="text-[11px] text-muted-foreground">
                根据默认语言的产品名自动生成，也可手动修改
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as ProductStatus)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">排序值</label>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value || 0))}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">主分类 *</label>
            <Select
              value={primaryCategoryId}
              onValueChange={setPrimaryCategoryId}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.displayName} ({c.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <p className="text-sm font-medium">附加分类</p>
              <div className="max-h-48 space-y-2 overflow-auto">
                {categories.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={additionalCategoryIds.includes(c.id)}
                      onCheckedChange={(checked) => {
                        setAdditionalCategoryIds((prev) =>
                          checked
                            ? [...prev.filter((id) => id !== c.id), c.id]
                            : prev.filter((id) => id !== c.id),
                        );
                      }}
                      disabled={
                        isSubmitting || c.id === primaryCategoryId
                      }
                    />
                    <span>{c.displayName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 p-4">
              <p className="text-sm font-medium">标签</p>
              <div className="max-h-48 space-y-2 overflow-auto">
                {tags.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={tagIds.includes(t.id)}
                      onCheckedChange={(checked) => {
                        setTagIds((prev) =>
                          checked
                            ? [...prev.filter((id) => id !== t.id), t.id]
                            : prev.filter((id) => id !== t.id),
                        );
                      }}
                      disabled={isSubmitting}
                    />
                    <span>{t.displayName}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 媒体附件 ─── */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          {/* 主图 */}
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">主图</p>
                <p className="text-xs text-muted-foreground">
                  在产品列表和详情页展示的主图片
                </p>
              </div>
              <div className="flex gap-2">
                {featuredImageId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setFeaturedImageId('')}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    移除
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerMode('featured')}
                >
                  <ImageIcon className="mr-1 h-3.5 w-3.5" />
                  {featuredImageId ? '更换' : '选择'}
                </Button>
              </div>
            </div>
            {featuredMedia ? (
              <div className="flex items-center gap-4 rounded-lg border border-border/50 p-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={featuredMedia.url}
                    alt={featuredMedia.alt ?? featuredMedia.originalName}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {featuredMedia.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {featuredMedia.width && featuredMedia.height
                      ? `${featuredMedia.width} × ${featuredMedia.height} · `
                      : ''}
                    {formatBytes(featuredMedia.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-border/50 text-sm text-muted-foreground">
                未选择主图
              </div>
            )}
          </div>

          {/* 图集 */}
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  图集（{galleryImageIds.length} 张）
                </p>
                <p className="text-xs text-muted-foreground">
                  拖拽可排序，悬浮可预览或移除
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPickerMode('gallery')}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加图片
              </Button>
            </div>
            <SortableImageGrid
              items={galleryMedia}
              onRemove={(id) =>
                setGalleryImageIds((prev) => prev.filter((i) => i !== id))
              }
              onReorder={setGalleryImageIds}
            />
          </div>

          {/* 附件 */}
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  附件（{attachmentIds.length} 个）
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF 数据表、规格书、证书等
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPickerMode('attachment')}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                添加文件
              </Button>
            </div>
            {attachmentMedia.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground">
                暂无附件
              </div>
            ) : (
              <div className="space-y-2">
                {attachmentMedia.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {item.mimeType.startsWith('image/') ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                          <Image
                            src={item.url}
                            alt={item.alt ?? item.originalName}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted/50">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm">
                          {item.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.mimeType} · {formatBytes(item.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() =>
                        setAttachmentIds((prev) =>
                          prev.filter((id) => id !== item.id),
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 视频链接 */}
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <p className="mb-2 text-sm font-medium">视频链接</p>
            <p className="mb-3 text-xs text-muted-foreground">
              每行一个 URL（YouTube、Vimeo 等）
            </p>
            <textarea
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoLinksText}
              onChange={(e) => setVideoLinksText(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* ─── 商业信息 ─── */}
      {activeTab === 'commercial' && (
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <p className="mb-1 text-sm font-medium">商业信息</p>
          <p className="mb-4 text-xs text-muted-foreground">
            所有字段均为可选，未填写的字段不会在前台显示
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">MOQ（最小起订量）</label>
              <Input
                type="number"
                min={0}
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="例如：100"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">交期（天）</label>
              <Input
                type="number"
                min={0}
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(e.target.value)}
                placeholder="例如：15"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">贸易条款</label>
              <Input
                value={tradeTerms}
                onChange={(e) => setTradeTerms(e.target.value)}
                placeholder="例如：FOB Shanghai"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">付款方式</label>
              <Input
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="例如：T/T 30% 预付款"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">包装说明</label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={packagingDetails}
                onChange={(e) => setPackagingDetails(e.target.value)}
                placeholder="例如：出口标准纸箱"
                disabled={isSubmitting}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={customizationSupport}
                  onCheckedChange={(checked) =>
                    setCustomizationSupport(checked === true)
                  }
                  disabled={isSubmitting}
                />
                支持定制（OEM/ODM）
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── 多语言 ─── */}
      {activeTab === 'i18n' && (
        <div className="space-y-4">
          {orderedTranslations.map((t) => {
            const expanded = expandedLocales.includes(t.locale);
            const isDefault = t.locale === defaultLocale;
            return (
              <div
                key={t.locale}
                className="rounded-lg border border-border/50 bg-card"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 text-left"
                  onClick={() => toggleLocalePanel(t.locale)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{t.locale}</span>
                    {isDefault && (
                      <Badge variant="secondary" className="text-[10px]">
                        默认
                      </Badge>
                    )}
                    {t.name && (
                      <span className="text-xs text-muted-foreground">
                        — {t.name}
                      </span>
                    )}
                  </div>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {expanded && (
                  <div className="border-t border-border/50 p-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          产品名称 {isDefault && '*'}
                        </label>
                        <Input
                          value={t.name}
                          onChange={(e) =>
                            updateTranslation(t.locale, 'name', e.target.value)
                          }
                          placeholder="产品名称"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          SEO 标题
                        </label>
                        <Input
                          value={t.seoTitle}
                          onChange={(e) =>
                            updateTranslation(
                              t.locale,
                              'seoTitle',
                              e.target.value,
                            )
                          }
                          placeholder="SEO 标题（可选）"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium">
                          短描述
                        </label>
                        <textarea
                          rows={2}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="短描述（可选）"
                          value={t.shortDescription}
                          onChange={(e) =>
                            updateTranslation(
                              t.locale,
                              'shortDescription',
                              e.target.value,
                            )
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-medium">
                          详细描述
                        </label>
                        <RichTextEditor
                          value={t.description}
                          onChange={(html) =>
                            updateTranslation(t.locale, 'description', html)
                          }
                          placeholder="详细描述（可选）"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium">
                          SEO 描述
                        </label>
                        <textarea
                          rows={2}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          placeholder="SEO 描述（可选）"
                          value={t.seoDescription}
                          onChange={(e) =>
                            updateTranslation(
                              t.locale,
                              'seoDescription',
                              e.target.value,
                            )
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 底部保存栏 ─── */}
      <div className="flex items-center justify-end gap-3 border-t border-border/50 pt-4">
        <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
          取消
        </Button>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEditing ? '保存修改' : '创建产品'}
        </Button>
      </div>

      {/* ─── 媒体选择器 ─── */}
      <MediaPickerDialog
        open={pickerMode === 'featured'}
        onOpenChange={(open) => !open && setPickerMode(null)}
        mediaItems={mediaLibrary}
        onMediaUploaded={handleMediaUploaded}
        onConfirm={(ids) => {
          if (ids.length > 0) setFeaturedImageId(ids[0]);
        }}
        multiple={false}
        accept="image"
        initialSelectedIds={featuredImageId ? [featuredImageId] : []}
        title="选择主图"
      />
      <MediaPickerDialog
        open={pickerMode === 'gallery'}
        onOpenChange={(open) => !open && setPickerMode(null)}
        mediaItems={mediaLibrary}
        onMediaUploaded={handleMediaUploaded}
        onConfirm={(ids) => {
          setGalleryImageIds((prev) => {
            const existing = new Set(prev);
            const merged = [...prev];
            for (const id of ids) {
              if (!existing.has(id)) merged.push(id);
            }
            return merged;
          });
        }}
        multiple
        accept="image"
        initialSelectedIds={galleryImageIds}
        title="选择图集图片"
      />
      <MediaPickerDialog
        open={pickerMode === 'attachment'}
        onOpenChange={(open) => !open && setPickerMode(null)}
        mediaItems={mediaLibrary}
        onMediaUploaded={handleMediaUploaded}
        onConfirm={(ids) => {
          setAttachmentIds((prev) => {
            const existing = new Set(prev);
            const merged = [...prev];
            for (const id of ids) {
              if (!existing.has(id)) merged.push(id);
            }
            return merged;
          });
        }}
        multiple
        accept="all"
        initialSelectedIds={attachmentIds}
        title="选择附件"
      />

      {/* ─── 未保存变更确认 ─── */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>放弃修改？</AlertDialogTitle>
            <AlertDialogDescription>
              有未保存的修改，确认关闭吗？所有未保存的内容将丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>继续编辑</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => router.push('/admin/products')}
            >
              放弃修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
