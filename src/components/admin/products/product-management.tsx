'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from '@/server/actions/product.actions';
import type { CategoryListItem, Language, Media, ProductListItem, ProductStatus, TagListItem } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RichTextEditor } from '@/components/admin/common/rich-text-editor';

interface ProductManagementProps {
  initialProducts: ProductListItem[];
  locales: Language[];
  categories: CategoryListItem[];
  tags: TagListItem[];
  mediaItems: Array<Media & { url: string }>;
}

type TranslationForm = {
  locale: string;
  name: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

type ProductEditTab = 'basic' | 'media' | 'commercial' | 'i18n';

type ProductFormPayload = {
  sku: string;
  slug: string;
  status: ProductStatus;
  sortOrder: number;
  primaryCategoryId: string;
  featuredImageId: string | null;
  videoLinks: string[];
  moq: number | null;
  leadTimeDays: number | null;
  tradeTerms: string | null;
  paymentTerms: string | null;
  packagingDetails: string | null;
  customizationSupport: boolean;
  additionalCategoryIds: string[];
  tagIds: string[];
  galleryImageIds: string[];
  attachmentIds: string[];
  translations: Array<{
    locale: string;
    name?: string;
    shortDescription?: string;
    description?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

function buildTranslationForm(locales: Language[]): TranslationForm[] {
  return locales.map((locale) => ({
    locale: locale.code,
    name: '',
    shortDescription: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
  }));
}

function statusText(status: ProductStatus): string {
  if (status === 'published') return '已发布';
  if (status === 'archived') return '已归档';
  return '草稿';
}

export function ProductManagement({
  initialProducts,
  locales,
  categories,
  tags,
  mediaItems,
}: ProductManagementProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [mediaLibrary, setMediaLibrary] = useState<Array<Media & { url: string }>>(mediaItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── 搜索 / 筛选 / 分页 ───
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProductEditTab>('basic');
  const [editing, setEditing] = useState<ProductListItem | null>(null);
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<ProductStatus>('draft');
  const [sortOrder, setSortOrder] = useState(0);
  const [primaryCategoryId, setPrimaryCategoryId] = useState('');
  const [featuredImageId, setFeaturedImageId] = useState('');
  const [moq, setMoq] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [tradeTerms, setTradeTerms] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [packagingDetails, setPackagingDetails] = useState('');
  const [customizationSupport, setCustomizationSupport] = useState(false);
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [galleryImageIds, setGalleryImageIds] = useState<string[]>([]);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [videoLinksText, setVideoLinksText] = useState('');
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales),
  );
  const defaultLocale = useMemo(
    () => locales.find((item) => item.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );
  const [expandedLocales, setExpandedLocales] = useState<string[]>([]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    // 搜索
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      );
    }
    // 状态筛选
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    // 分类筛选
    if (categoryFilter !== 'all') {
      list = list.filter(
        (p) =>
          p.primaryCategoryId === categoryFilter ||
          p.additionalCategoryIds.includes(categoryFilter),
      );
    }
    // 排序
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list;
  }, [products, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function serializePayload(payload: ProductFormPayload): string {
    return JSON.stringify({
      ...payload,
      additionalCategoryIds: [...payload.additionalCategoryIds].sort(),
      tagIds: [...payload.tagIds].sort(),
      galleryImageIds: [...payload.galleryImageIds].sort(),
      attachmentIds: [...payload.attachmentIds].sort(),
      translations: [...payload.translations].sort((a, b) => a.locale.localeCompare(b.locale)),
    });
  }

  function buildCurrentPayload(): ProductFormPayload {
    return {
      sku: sku.trim(),
      slug: slug.trim().toLowerCase(),
      status,
      sortOrder,
      primaryCategoryId,
      featuredImageId: featuredImageId || null,
      videoLinks: videoLinksText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      moq: moq ? Number(moq) : null,
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : null,
      tradeTerms: tradeTerms.trim() || null,
      paymentTerms: paymentTerms.trim() || null,
      packagingDetails: packagingDetails.trim() || null,
      customizationSupport,
      additionalCategoryIds: additionalCategoryIds.filter((id) => id !== primaryCategoryId),
      tagIds,
      galleryImageIds,
      attachmentIds,
      translations: translations.map((item) => ({
        locale: item.locale,
        name: item.name || undefined,
        shortDescription: item.shortDescription || undefined,
        description: item.description || undefined,
        seoTitle: item.seoTitle || undefined,
        seoDescription: item.seoDescription || undefined,
      })),
    };
  }

  function openCreateDialog() {
    const initTranslations = buildTranslationForm(locales);
    const initPayload: ProductFormPayload = {
      sku: '',
      slug: '',
      status: 'draft',
      sortOrder: products.length,
      primaryCategoryId: categories[0]?.id ?? '',
      featuredImageId: null,
      videoLinks: [],
      moq: null,
      leadTimeDays: null,
      tradeTerms: null,
      paymentTerms: null,
      packagingDetails: null,
      customizationSupport: false,
      additionalCategoryIds: [],
      tagIds: [],
      galleryImageIds: [],
      attachmentIds: [],
      translations: initTranslations.map((item) => ({
        locale: item.locale,
      })),
    };

    setEditing(null);
    setSku('');
    setSlug('');
    setStatus('draft');
    setSortOrder(products.length);
    setPrimaryCategoryId(categories[0]?.id ?? '');
    setFeaturedImageId('');
    setMoq('');
    setLeadTimeDays('');
    setTradeTerms('');
    setPaymentTerms('');
    setPackagingDetails('');
    setCustomizationSupport(false);
    setAdditionalCategoryIds([]);
    setTagIds([]);
    setGalleryImageIds([]);
    setAttachmentIds([]);
    setVideoLinksText('');
    setTranslations(initTranslations);
    setActiveTab('basic');
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setInitialSnapshot(serializePayload(initPayload));
    setDialogOpen(true);
  }

  function openEditDialog(item: ProductListItem) {
    const nextTranslations = locales.map((locale) => {
      const matched = item.translations.find((tr) => tr.locale === locale.code);
      return {
        locale: locale.code,
        name: matched?.name ?? '',
        shortDescription: matched?.shortDescription ?? '',
        description: matched?.description ?? '',
        seoTitle: matched?.seoTitle ?? '',
        seoDescription: matched?.seoDescription ?? '',
      };
    });
    const initPayload: ProductFormPayload = {
      sku: item.sku,
      slug: item.slug,
      status: item.status as ProductStatus,
      sortOrder: item.sortOrder,
      primaryCategoryId: item.primaryCategoryId,
      featuredImageId: item.featuredImageId ?? null,
      videoLinks: item.videoLinks ?? [],
      moq: item.moq ?? null,
      leadTimeDays: item.leadTimeDays ?? null,
      tradeTerms: item.tradeTerms ?? null,
      paymentTerms: item.paymentTerms ?? null,
      packagingDetails: item.packagingDetails ?? null,
      customizationSupport: item.customizationSupport ?? false,
      additionalCategoryIds: item.additionalCategoryIds.filter(
        (id) => id !== item.primaryCategoryId,
      ),
      tagIds: item.tagIds,
      galleryImageIds: item.galleryImageIds,
      attachmentIds: item.attachmentIds,
      translations: nextTranslations.map((tr) => ({
        locale: tr.locale,
        name: tr.name || undefined,
        shortDescription: tr.shortDescription || undefined,
        description: tr.description || undefined,
        seoTitle: tr.seoTitle || undefined,
        seoDescription: tr.seoDescription || undefined,
      })),
    };

    setEditing(item);
    setSku(item.sku);
    setSlug(item.slug);
    setStatus(item.status as ProductStatus);
    setSortOrder(item.sortOrder);
    setPrimaryCategoryId(item.primaryCategoryId);
    setFeaturedImageId(item.featuredImageId ?? '');
    setMoq(item.moq === null ? '' : String(item.moq ?? ''));
    setLeadTimeDays(item.leadTimeDays === null ? '' : String(item.leadTimeDays ?? ''));
    setTradeTerms(item.tradeTerms ?? '');
    setPaymentTerms(item.paymentTerms ?? '');
    setPackagingDetails(item.packagingDetails ?? '');
    setCustomizationSupport(item.customizationSupport ?? false);
    setAdditionalCategoryIds(item.additionalCategoryIds);
    setTagIds(item.tagIds);
    setGalleryImageIds(item.galleryImageIds);
    setAttachmentIds(item.attachmentIds);
    setVideoLinksText((item.videoLinks ?? []).join('\n'));
    setTranslations(nextTranslations);
    setActiveTab('basic');
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setInitialSnapshot(serializePayload(initPayload));
    setDialogOpen(true);
  }

  function toggleLocalePanel(locale: string) {
    setExpandedLocales((prev) =>
      prev.includes(locale) ? prev.filter((item) => item !== locale) : [...prev, locale],
    );
  }

  function updateTranslation(
    locale: string,
    key: keyof Omit<TranslationForm, 'locale'>,
    value: string,
  ) {
    setTranslations((prev) =>
      prev.map((item) => (item.locale === locale ? { ...item, [key]: value } : item)),
    );
  }

  function toggleAdditionalCategory(categoryId: string, checked: boolean) {
    setAdditionalCategoryIds((prev) => {
      if (checked) {
        if (prev.includes(categoryId)) return prev;
        return [...prev, categoryId];
      }
      return prev.filter((item) => item !== categoryId);
    });
  }

  function toggleTag(tagId: string, checked: boolean) {
    setTagIds((prev) => {
      if (checked) {
        if (prev.includes(tagId)) return prev;
        return [...prev, tagId];
      }
      return prev.filter((item) => item !== tagId);
    });
  }

  function toggleGalleryImage(mediaId: string, checked: boolean) {
    setGalleryImageIds((prev) => {
      if (checked) {
        if (prev.includes(mediaId)) return prev;
        return [...prev, mediaId];
      }
      return prev.filter((item) => item !== mediaId);
    });
  }

  function toggleAttachment(mediaId: string, checked: boolean) {
    setAttachmentIds((prev) => {
      if (checked) {
        if (prev.includes(mediaId)) return prev;
        return [...prev, mediaId];
      }
      return prev.filter((item) => item !== mediaId);
    });
  }

  async function uploadFiles(files: FileList | null): Promise<Array<Media & { url: string }>> {
    if (!files || files.length === 0) return [];

    const uploaded: Array<Media & { url: string }> = [];
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json()) as
        | { success: true; data: Media & { url: string } }
        | { success: false; error: string };

      if (!response.ok || !result.success) {
        throw new Error(result.success ? 'Upload failed' : result.error);
      }
      uploaded.push(result.data);
    }

    setMediaLibrary((prev) => [...uploaded, ...prev]);
    return uploaded;
  }

  async function handleUploadFeatured(file: FileList | null) {
    setIsSubmitting(true);
    try {
      const uploaded = await uploadFiles(file);
      if (uploaded.length > 0) {
        setFeaturedImageId(uploaded[0].id);
        toast.success('主图上传成功');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadGallery(file: FileList | null) {
    setIsSubmitting(true);
    try {
      const uploaded = await uploadFiles(file);
      if (uploaded.length > 0) {
        setGalleryImageIds((prev) => [...prev, ...uploaded.map((item) => item.id)]);
        toast.success(`图集上传成功（${uploaded.length}个）`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadAttachments(file: FileList | null) {
    setIsSubmitting(true);
    try {
      const uploaded = await uploadFiles(file);
      if (uploaded.length > 0) {
        setAttachmentIds((prev) => [...prev, ...uploaded.map((item) => item.id)]);
        toast.success(`附件上传成功（${uploaded.length}个）`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSave() {
    if (!sku.trim() || !slug.trim()) {
      toast.error('SKU 和 Slug 不能为空');
      return;
    }
    if (!primaryCategoryId) {
      toast.error('请选择主分类');
      return;
    }

    const payload = buildCurrentPayload();

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updateProductAction(editing.id, payload)
        : await createProductAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(editing ? '产品已更新' : '产品已创建');
      setDialogOpen(false);
      setInitialSnapshot(null);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsSubmitting(true);
    try {
      const result = await deleteProductAction(deleteTarget.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }

      setProducts((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      toast.success('产品已删除');
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const orderedTranslations = useMemo(() => {
    const list = [...translations];
    list.sort((a, b) => {
      if (a.locale === defaultLocale) return -1;
      if (b.locale === defaultLocale) return 1;
      return a.locale.localeCompare(b.locale);
    });
    return list;
  }, [defaultLocale, translations]);

  const featuredMedia = featuredImageId
    ? mediaLibrary.find((item) => item.id === featuredImageId) ?? null
    : null;
  const selectedGallery = mediaLibrary.filter((item) => galleryImageIds.includes(item.id));
  const selectedAttachments = mediaLibrary.filter((item) => attachmentIds.includes(item.id));
  const hasUnsavedChanges =
    dialogOpen && initialSnapshot
      ? serializePayload(buildCurrentPayload()) !== initialSnapshot
      : false;

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  function handleDialogOpenChange(open: boolean) {
    if (open) {
      setDialogOpen(true);
      return;
    }
    if (isSubmitting) return;
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }
    setDialogOpen(false);
    setInitialSnapshot(null);
  }

  function getRowCompletion(item: ProductListItem): {
    i18nCount: number;
    i18nTotal: number;
    mediaReady: boolean;
    publishReady: boolean;
  } {
    const i18nTotal = locales.length;
    const i18nCount = locales.filter((locale) => {
      const matched = item.translations.find((tr) => tr.locale === locale.code);
      return Boolean(matched?.name?.trim());
    }).length;
    const mediaReady = Boolean(item.featuredImageId || item.galleryImageIds.length > 0);
    const defaultName = item.translations.find((tr) => tr.locale === defaultLocale)?.name?.trim();
    const publishReady = Boolean(item.sku && item.slug && item.primaryCategoryId && defaultName && mediaReady);
    return { i18nCount, i18nTotal, mediaReady, publishReady };
  }

  return (
    <div className="space-y-4">
      {/* ─── 搜索栏 + 筛选 + 新建 ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索名称 / SKU / Slug…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as ProductStatus | 'all'); setCurrentPage(1); }}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="archived">已归档</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); setCurrentPage(1); }}>
              清除筛选
            </Button>
          )}
        </div>
        <Button onClick={openCreateDialog} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          新建产品
        </Button>
      </div>

      {/* ─── 结果统计 ─── */}
      <p className="text-xs text-muted-foreground">
        共 {filteredProducts.length} 条{filteredProducts.length !== products.length ? `（已筛选，总 ${products.length}）` : ''}
      </p>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>名称</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>主分类</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>完成度</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? '没有匹配的产品，请尝试调整筛选条件'
                    : '暂无产品'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((item) => {
                const completion = getRowCompletion(item);
                return (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell className="max-w-[200px]">
                    <div className="truncate font-medium">{item.displayName}</div>
                    <div className="truncate text-xs text-muted-foreground">{item.slug}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                  <TableCell>{item.primaryCategoryName}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'published' ? 'default' : item.status === 'archived' ? 'outline' : 'secondary'}>
                      {statusText(item.status as ProductStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        i18n {completion.i18nCount}/{completion.i18nTotal}
                      </Badge>
                      <Badge variant={completion.publishReady ? 'default' : 'outline'} className="text-[10px]">
                        {completion.publishReady ? '可发布' : '待完善'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{formatDate(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => router.push(`/admin/products/attributes?productId=${item.id}`)}
                      >
                        参数
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        disabled={isSubmitting}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── 分页 ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            第 {safePage} / {totalPages} 页
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑产品' : '新建产品'}</DialogTitle>
            <DialogDescription>
              管理产品基础信息、状态生命周期、分类标签与多语言内容。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button
                type="button"
                variant={activeTab === 'basic' ? 'default' : 'outline'}
                onClick={() => setActiveTab('basic')}
              >
                基础信息
              </Button>
              <Button
                type="button"
                variant={activeTab === 'media' ? 'default' : 'outline'}
                onClick={() => setActiveTab('media')}
              >
                媒体附件
              </Button>
              <Button
                type="button"
                variant={activeTab === 'commercial' ? 'default' : 'outline'}
                onClick={() => setActiveTab('commercial')}
              >
                商业信息
              </Button>
              <Button
                type="button"
                variant={activeTab === 'i18n' ? 'default' : 'outline'}
                onClick={() => setActiveTab('i18n')}
              >
                多语言
              </Button>
            </div>

            {activeTab === 'basic' ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SKU</label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="例如：VAL-1001"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slug</label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="例如：industrial-valve"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">状态</label>
                    <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)} disabled={isSubmitting}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <label className="text-sm font-medium">主分类</label>
                  <Select value={primaryCategoryId} onValueChange={setPrimaryCategoryId} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.displayName} ({item.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-md border border-border/50 p-3">
                    <p className="text-sm font-medium">附加分类</p>
                    <div className="max-h-40 space-y-2 overflow-auto">
                      {categories.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={additionalCategoryIds.includes(item.id)}
                            onChange={(e) => toggleAdditionalCategory(item.id, e.target.checked)}
                            disabled={isSubmitting || item.id === primaryCategoryId}
                          />
                          <span>{item.displayName}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border border-border/50 p-3">
                    <p className="text-sm font-medium">标签</p>
                    <div className="max-h-40 space-y-2 overflow-auto">
                      {tags.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={tagIds.includes(item.id)}
                            onChange={(e) => toggleTag(item.id, e.target.checked)}
                            disabled={isSubmitting}
                          />
                          <span>{item.displayName}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {activeTab === 'media' ? (
              <div className="space-y-3 rounded-md border border-border/50 p-3">
                <p className="text-sm font-medium">主图与视频</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">主图</label>
                    <Select value={featuredImageId || '__none__'} onValueChange={(v) => setFeaturedImageId(v === '__none__' ? '' : v)} disabled={isSubmitting}>
                      <SelectTrigger><SelectValue placeholder="不设置主图" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">不设置主图</SelectItem>
                        {mediaLibrary
                          .filter((media) => media.mimeType.startsWith('image/'))
                          .map((media) => (
                            <SelectItem key={media.id} value={media.id}>
                              {media.originalName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <label className="inline-flex cursor-pointer items-center text-xs text-primary">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isSubmitting}
                        onChange={(e) => void handleUploadFeatured(e.target.files)}
                      />
                      直接上传并设为主图
                    </label>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">视频链接（每行一个 URL）</label>
                    <textarea
                      rows={4}
                      className="min-h-[88px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoLinksText}
                      onChange={(e) => setVideoLinksText(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {featuredMedia ? (
                  <div className="rounded-md border border-border/50 p-2">
                    <p className="mb-2 text-xs text-muted-foreground">当前主图</p>
                    <div className="flex items-center gap-3">
                      <Image
                        src={featuredMedia.url}
                        alt={featuredMedia.alt ?? featuredMedia.originalName}
                        width={72}
                        height={72}
                        className="h-18 w-18 rounded-md object-cover"
                      />
                      <p className="text-sm">{featuredMedia.originalName}</p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">图集（已选 {selectedGallery.length}）</p>
                    <label className="inline-flex cursor-pointer items-center text-xs text-primary">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={isSubmitting}
                        onChange={(e) => void handleUploadGallery(e.target.files)}
                      />
                      直接上传图集
                    </label>
                  </div>
                  <div className="grid max-h-48 gap-2 overflow-auto sm:grid-cols-2">
                    {mediaLibrary
                      .filter((media) => media.mimeType.startsWith('image/'))
                      .map((media) => (
                        <label
                          key={media.id}
                          className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                            galleryImageIds.includes(media.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={galleryImageIds.includes(media.id)}
                            onChange={(e) => toggleGalleryImage(media.id, e.target.checked)}
                            disabled={isSubmitting}
                          />
                          <Image
                            src={media.url}
                            alt={media.alt ?? media.originalName}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded object-cover"
                          />
                          <span className="truncate">{media.originalName}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">附件（已选 {selectedAttachments.length}）</p>
                    <label className="inline-flex cursor-pointer items-center text-xs text-primary">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        disabled={isSubmitting}
                        onChange={(e) => void handleUploadAttachments(e.target.files)}
                      />
                      直接上传附件
                    </label>
                  </div>
                  <div className="grid max-h-40 gap-2 overflow-auto sm:grid-cols-2">
                    {mediaLibrary.map((media) => (
                      <label
                        key={`attachment-${media.id}`}
                        className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                          attachmentIds.includes(media.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={attachmentIds.includes(media.id)}
                          onChange={(e) => toggleAttachment(media.id, e.target.checked)}
                          disabled={isSubmitting}
                        />
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{media.originalName}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'commercial' ? (
              <div className="space-y-2 rounded-md border border-border/50 p-3">
                <p className="text-sm font-medium">商业信息（全部可选，不填前台不显示）</p>
                <div className="grid gap-3 sm:grid-cols-2">
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
                      rows={2}
                      className="min-h-[64px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={packagingDetails}
                      onChange={(e) => setPackagingDetails(e.target.value)}
                      placeholder="可留空；例如：出口标准纸箱"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={customizationSupport}
                        onChange={(e) => setCustomizationSupport(e.target.checked)}
                        disabled={isSubmitting}
                      />
                      支持定制（OEM/ODM）
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'i18n' ? (
              <div className="space-y-3">
                {orderedTranslations.map((item) => {
                  const expanded = expandedLocales.includes(item.locale);
                  const isDefault = item.locale === defaultLocale;
                  return (
                    <div key={item.locale} className="rounded-md border border-border/50 p-3">
                      <button
                        type="button"
                        className="mb-2 flex w-full items-center justify-between text-left"
                        onClick={() => toggleLocalePanel(item.locale)}
                      >
                        <span className="text-sm font-semibold">
                          {item.locale} {isDefault ? '(默认)' : ''}
                        </span>
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expanded ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="产品名称"
                            value={item.name}
                            onChange={(e) => updateTranslation(item.locale, 'name', e.target.value)}
                            disabled={isSubmitting}
                          />
                          <Input
                            placeholder="SEO 标题（可选）"
                            value={item.seoTitle}
                            onChange={(e) => updateTranslation(item.locale, 'seoTitle', e.target.value)}
                            disabled={isSubmitting}
                          />
                          <textarea
                            rows={2}
                            className="min-h-[64px] rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
                            placeholder="短描述（可选）"
                            value={item.shortDescription}
                            onChange={(e) =>
                              updateTranslation(item.locale, 'shortDescription', e.target.value)
                            }
                            disabled={isSubmitting}
                          />
                          <div className="sm:col-span-2">
                            <RichTextEditor
                              value={item.description}
                              onChange={(html) => updateTranslation(item.locale, 'description', html)}
                              placeholder="详细描述（可选）"
                              disabled={isSubmitting}
                            />
                          </div>
                          <textarea
                            rows={2}
                            className="min-h-[64px] rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2"
                            placeholder="SEO 描述（可选）"
                            value={item.seoDescription}
                            onChange={(e) =>
                              updateTranslation(item.locale, 'seoDescription', e.target.value)
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── 删除确认 ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除产品</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除产品 <strong>{deleteTarget?.displayName}</strong> 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? '删除中…' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── 未保存变更确认 ─── */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
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
              onClick={() => {
                setShowUnsavedDialog(false);
                setDialogOpen(false);
                setInitialSnapshot(null);
              }}
            >
              放弃修改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
