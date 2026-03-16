'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileText,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  batchDeleteProductsAction,
  batchUpdateProductStatusAction,
  cloneProductAction,
  deleteProductAction,
} from '@/server/actions/product.actions';
import type {
  CategoryListItem,
  Language,
  Media,
  ProductListItem,
  ProductStatus,
} from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

interface ProductManagementProps {
  initialProducts: ProductListItem[];
  locales: Language[];
  categories: CategoryListItem[];
  mediaItems: Array<Media & { url: string }>;
}

function statusText(status: ProductStatus): string {
  if (status === 'published') return '已发布';
  if (status === 'archived') return '已归档';
  return '草稿';
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

const PAGE_SIZE = 20;

export function ProductManagement({
  initialProducts,
  locales,
  categories,
  mediaItems,
}: ProductManagementProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>(
    'all',
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductListItem | null>(
    null,
  );
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cloneTarget, setCloneTarget] = useState<ProductListItem | null>(null);
  const [cloneSku, setCloneSku] = useState('');
  const [cloneSlug, setCloneSlug] = useState('');
  const [densityCompact, setDensityCompact] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vela:product-list-density') === 'compact';
    }
    return false;
  });

  function toggleDensity() {
    setDensityCompact((prev) => {
      const next = !prev;
      localStorage.setItem('vela:product-list-density', next ? 'compact' : 'comfortable');
      return next;
    });
  }

  const thumbClass = densityCompact ? 'h-10 w-10' : 'h-16 w-16';
  const thumbSize = densityCompact ? '40px' : '64px';

  const defaultLocale = useMemo(
    () => locales.find((l) => l.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );

  const mediaMap = useMemo(() => {
    const map = new Map<string, (typeof mediaItems)[0]>();
    for (const m of mediaItems) map.set(m.id, m);
    return map;
  }, [mediaItems]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      list = list.filter(
        (p) =>
          p.primaryCategoryId === categoryFilter ||
          p.additionalCategoryIds.includes(categoryFilter),
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return list;
  }, [products, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function toggleSelectProduct(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === paginatedProducts.length
        ? new Set()
        : new Set(paginatedProducts.map((p) => p.id)),
    );
  }

  async function handleBatchStatus(status: ProductStatus) {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      const result = await batchUpdateProductStatusAction(
        [...selectedIds],
        status,
      );
      if (!result.success) {
        toast.error(
          typeof result.error === 'string' ? result.error : '操作失败',
        );
        return;
      }
      toast.success(`已更新 ${result.data.count} 个产品`);
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) return;
    setIsSubmitting(true);
    try {
      const result = await batchDeleteProductsAction([...selectedIds]);
      if (!result.success) {
        toast.error(
          typeof result.error === 'string' ? result.error : '删除失败',
        );
        return;
      }
      setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      toast.success(`已删除 ${result.data.count} 个产品`);
      setSelectedIds(new Set());
      setBatchDeleteOpen(false);
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
        toast.error(
          typeof result.error === 'string' ? result.error : '删除失败',
        );
        return;
      }
      setProducts((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success('产品已删除');
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClone() {
    if (!cloneTarget) return;
    if (!cloneSku.trim() || !cloneSlug.trim()) {
      toast.error('SKU 和 Slug 不能为空');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await cloneProductAction(
        cloneTarget.id,
        cloneSku.trim(),
        cloneSlug.trim(),
      );
      if (!result.success) {
        toast.error(
          typeof result.error === 'string' ? result.error : '克隆失败',
        );
        return;
      }
      toast.success('产品已克隆');
      setCloneTarget(null);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function getRowCompletion(item: ProductListItem) {
    const i18nTotal = locales.length;
    const i18nCount = locales.filter((locale) => {
      const m = item.translations.find((tr) => tr.locale === locale.code);
      return Boolean(m?.name?.trim());
    }).length;
    const mediaReady = Boolean(
      item.featuredImageId || item.galleryImageIds.length > 0,
    );
    const defaultName = item.translations
      .find((tr) => tr.locale === defaultLocale)
      ?.name?.trim();
    const publishReady = Boolean(
      item.sku &&
        item.slug &&
        item.primaryCategoryId &&
        defaultName &&
        mediaReady,
    );
    return { i18nCount, i18nTotal, mediaReady, publishReady };
  }

  return (
    <div className="space-y-4">
      {/* ─── 搜索 / 筛选 / 新建 ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索名称 / SKU / Slug…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ProductStatus | 'all');
              setCurrentPage(1);
            }}
          >
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
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery ||
            statusFilter !== 'all' ||
            categoryFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setCurrentPage(1);
              }}
            >
              清除筛选
            </Button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={toggleDensity}
            title={densityCompact ? '宽松视图' : '紧凑视图'}
          >
            {densityCompact ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          <Button onClick={() => router.push('/admin/products/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新建产品
          </Button>
        </div>
      </div>

      {/* ─── 批量操作 ─── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            已选 {selectedIds.size} 项
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleBatchStatus('published')}
            disabled={isSubmitting}
          >
            批量发布
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleBatchStatus('draft')}
            disabled={isSubmitting}
          >
            设为草稿
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleBatchStatus('archived')}
            disabled={isSubmitting}
          >
            批量归档
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setBatchDeleteOpen(true)}
            disabled={isSubmitting}
          >
            批量删除
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            取消选择
          </Button>
        </div>
      )}

      {/* ─── 统计 ─── */}
      <p className="text-xs text-muted-foreground">
        共 {filteredProducts.length} 条
        {filteredProducts.length !== products.length
          ? `（已筛选，总 ${products.length}）`
          : ''}
      </p>

      {/* ─── 表格 ─── */}
      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    paginatedProducts.length > 0 &&
                    selectedIds.size === paginatedProducts.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-16">图片</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>主分类</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>完成度</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-36 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-24 text-center text-muted-foreground"
                >
                  {searchQuery ||
                  statusFilter !== 'all' ||
                  categoryFilter !== 'all'
                    ? '没有匹配的产品，请尝试调整筛选条件'
                    : '暂无产品'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((item) => {
                const completion = getRowCompletion(item);
                const thumb = item.featuredImageId
                  ? mediaMap.get(item.featuredImageId)
                  : null;
                return (
                  <TableRow key={item.id} className="border-border/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={() => toggleSelectProduct(item.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className={`relative ${thumbClass} overflow-hidden rounded-md border border-border/50 bg-muted/20 transition-all`}>
                        {thumb && thumb.mimeType.startsWith('image/') ? (
                          <Image
                            src={thumb.url}
                            alt={item.displayName}
                            fill
                            sizes={thumbSize}
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <FileText className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate font-medium">
                        {item.displayName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.slug}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.sku}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.primaryCategoryName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'published'
                            ? 'default'
                            : item.status === 'archived'
                              ? 'outline'
                              : 'secondary'
                        }
                      >
                        {statusText(item.status as ProductStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          i18n {completion.i18nCount}/{completion.i18nTotal}
                        </Badge>
                        <Badge
                          variant={
                            completion.publishReady ? 'default' : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {completion.publishReady ? '可发布' : '待完善'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {formatDate(item.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {item.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            asChild
                          >
                            <a
                              href={`/products/${categories.find((c) => c.id === item.primaryCategoryId)?.slug ?? 'c'}/${item.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              预览
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            setCloneTarget(item);
                            setCloneSku(`${item.sku}-copy`);
                            setCloneSlug(`${item.slug}-copy`);
                          }}
                          disabled={isSubmitting}
                        >
                          <Copy className="mr-1 h-3.5 w-3.5" />
                          克隆
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            router.push(`/admin/products/${item.id}/edit`)
                          }
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
                );
              })
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
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(safePage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── 删除确认 ─── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
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

      {/* ─── 批量删除确认 ─── */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除 {selectedIds.size} 个产品</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除选中的 {selectedIds.size} 个产品吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBatchDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? '删除中…' : `确认删除 ${selectedIds.size} 个`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── 克隆对话框 ─── */}
      <Dialog
        open={!!cloneTarget}
        onOpenChange={(open) => !open && setCloneTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>克隆产品</DialogTitle>
            <DialogDescription>
              从 <strong>{cloneTarget?.displayName}</strong> 复制，请为新产品指定唯一 SKU 和 Slug。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">新 SKU</label>
              <Input
                value={cloneSku}
                onChange={(e) => setCloneSku(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">新 Slug</label>
              <Input
                value={cloneSlug}
                onChange={(e) => setCloneSlug(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloneTarget(null)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleClone} disabled={isSubmitting}>
              {isSubmitting ? '克隆中…' : '确认克隆'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
