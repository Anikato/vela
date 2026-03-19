'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronDown, ChevronRight, FolderInput, GripVertical, Layers, Pencil, Plus, PowerOff, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  batchDeleteCategoriesAction,
  batchMoveCategoriesAction,
  batchToggleCategoriesAction,
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoryTreeAction,
  updateCategoryAction,
} from '@/server/actions/category.actions';
import type { CategoryListItem, Language, Media } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDeleteDialog } from '@/components/admin/common/confirm-delete-dialog';
import { ImagePickerUpload } from '@/components/admin/common/image-picker-upload';
function handleTextareaClassName() {
  return 'min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm';
}


type MediaWithUrl = Media & { url: string };

interface CategoryManagementProps {
  initialCategories: CategoryListItem[];
  locales: Language[];
  mediaItems: MediaWithUrl[];
}

type TranslationForm = {
  locale: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

type TreeRow = CategoryListItem & { depth: number };

const EMPTY_ID = '__none__';

function buildTranslationForm(locales: Language[]): TranslationForm[] {
  return locales.map((item) => ({
    locale: item.code,
    name: '',
    description: '',
    seoTitle: '',
    seoDescription: '',
  }));
}

function buildTreeRows(list: CategoryListItem[]): TreeRow[] {
  const childrenMap = new Map<string | null, CategoryListItem[]>();
  const allIds = new Set(list.map((item) => item.id));

  for (const item of list) {
    const parentKey = item.parentId && allIds.has(item.parentId) ? item.parentId : null;
    const bucket = childrenMap.get(parentKey) ?? [];
    bucket.push(item);
    childrenMap.set(parentKey, bucket);
  }

  for (const bucket of childrenMap.values()) {
    bucket.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  const result: TreeRow[] = [];
  const visited = new Set<string>();

  function dfs(parentId: string | null, depth: number): void {
    const children = childrenMap.get(parentId) ?? [];
    for (const child of children) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      result.push({ ...child, depth });
      dfs(child.id, depth + 1);
    }
  }

  dfs(null, 0);

  for (const item of list) {
    if (!visited.has(item.id)) {
      result.push({ ...item, depth: 0 });
    }
  }

  return result;
}

function isDescendant(
  possibleDescendantId: string,
  ancestorId: string,
  list: CategoryListItem[],
): boolean {
  const map = new Map(list.map((item) => [item.id, item]));
  let cursor = map.get(possibleDescendantId)?.parentId ?? null;
  while (cursor) {
    if (cursor === ancestorId) return true;
    cursor = map.get(cursor)?.parentId ?? null;
  }
  return false;
}

function reindexSiblingSortOrder(
  list: CategoryListItem[],
  parentId: string | null,
): CategoryListItem[] {
  const siblings = list
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const orderMap = new Map(siblings.map((item, index) => [item.id, index]));

  return list.map((item) => {
    const nextOrder = orderMap.get(item.id);
    if (nextOrder === undefined) return item;
    return { ...item, sortOrder: nextOrder };
  });
}

export function CategoryManagement({ initialCategories, locales, mediaItems: initialMediaItems }: CategoryManagementProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaItems, setMediaItems] = useState(initialMediaItems);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetParentId, setMoveTargetParentId] = useState(EMPTY_ID);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(null);
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState(EMPTY_ID);
  const [imageId, setImageId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales),
  );
  const defaultLocale = useMemo(
    () => locales.find((item) => item.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );
  const [expandedLocales, setExpandedLocales] = useState<string[]>([]);

  const treeRows = useMemo(() => buildTreeRows(categories), [categories]);
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const parentOptions = useMemo(() => {
    return sortedCategories.filter((item) => item.id !== editing?.id);
  }, [editing?.id, sortedCategories]);

  function toggleLocalePanel(locale: string) {
    setExpandedLocales((prev) =>
      prev.includes(locale) ? prev.filter((item) => item !== locale) : [...prev, locale],
    );
  }

  const handleMediaUploaded = useCallback((items: MediaWithUrl[]) => {
    setMediaItems((prev) => [...items, ...prev]);
  }, []);

  function openCreateDialog() {
    setEditing(null);
    setSlug('');
    setParentId(EMPTY_ID);
    setImageId(null);
    setImageUrl(null);
    setIsActive(true);
    setSortOrder(categories.length);
    setTranslations(buildTranslationForm(locales));
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setDialogOpen(true);
  }

  function openEditDialog(item: CategoryListItem) {
    setEditing(item);
    setSlug(item.slug);
    setParentId(item.parentId ?? EMPTY_ID);
    setImageId(item.imageId);
    const matchedMedia = item.imageId ? mediaItems.find((m) => m.id === item.imageId) : null;
    setImageUrl(matchedMedia?.url ?? null);
    setIsActive(item.isActive);
    setSortOrder(item.sortOrder);
    setTranslations(
      locales.map((locale) => {
        const matched = item.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          name: matched?.name ?? '',
          description: matched?.description ?? '',
          seoTitle: matched?.seoTitle ?? '',
          seoDescription: matched?.seoDescription ?? '',
        };
      }),
    );
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setDialogOpen(true);
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

  async function handleSave() {
    if (!slug.trim()) {
      toast.error('Slug 不能为空');
      return;
    }

    const payload = {
      slug: slug.trim().toLowerCase(),
      parentId: parentId === EMPTY_ID ? null : parentId,
      imageId,
      isActive,
      sortOrder,
      translations: translations.map((item) => ({
        locale: item.locale,
        name: item.name || undefined,
        description: item.description || undefined,
        seoTitle: item.seoTitle || undefined,
        seoDescription: item.seoDescription || undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updateCategoryAction(editing.id, payload)
        : await createCategoryAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(editing ? '分类已更新' : '分类已创建');
      setDialogOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteCategoryAction(deleteTarget.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }

      setCategories((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      toast.success('分类已删除');
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === treeRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(treeRows.map((r) => r.id)));
    }
  }

  async function handleBatchToggle(isActive: boolean) {
    const ids = Array.from(selectedIds);
    setBatchLoading(true);
    try {
      const result = await batchToggleCategoriesAction(ids, isActive);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '操作失败');
        return;
      }
      toast.success(`已${isActive ? '启用' : '停用'} ${result.data.count} 个分类`);
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setBatchLoading(false);
    }
  }

  async function handleBatchDelete() {
    const ids = Array.from(selectedIds);
    setBatchLoading(true);
    try {
      const result = await batchDeleteCategoriesAction(ids);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      if (result.data.skipped.length > 0) {
        const skippedNames = result.data.skipped
          .map((id) => categories.find((c) => c.id === id)?.displayName ?? id)
          .join('、');
        toast.warning(`已删除 ${result.data.deleted} 个，${result.data.skipped.length} 个含子分类无法删除: ${skippedNames}`);
      } else {
        toast.success(`已删除 ${result.data.deleted} 个分类`);
      }
      setSelectedIds(new Set());
      setBatchDeleteOpen(false);
      router.refresh();
    } finally {
      setBatchLoading(false);
    }
  }

  async function handleBatchMove() {
    const ids = Array.from(selectedIds);
    const targetParent = moveTargetParentId === EMPTY_ID ? null : moveTargetParentId;
    setBatchLoading(true);
    try {
      const result = await batchMoveCategoriesAction(ids, targetParent);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '移动失败');
        return;
      }
      toast.success(`已移动 ${result.data.count} 个分类`);
      setSelectedIds(new Set());
      setMoveDialogOpen(false);
      router.refresh();
    } finally {
      setBatchLoading(false);
    }
  }

  const moveParentOptions = useMemo(() => {
    return categories.filter((c) => !selectedIds.has(c.id));
  }, [categories, selectedIds]);

  const orderedTranslations = useMemo(() => {
    const list = [...translations];
    list.sort((a, b) => {
      if (a.locale === defaultLocale) return -1;
      if (b.locale === defaultLocale) return 1;
      return a.locale.localeCompare(b.locale);
    });
    return list;
  }, [defaultLocale, translations]);

  async function persistTree(nextList: CategoryListItem[], fallbackList: CategoryListItem[]) {
    const result = await reorderCategoryTreeAction({
      items: nextList.map((item) => ({
        id: item.id,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
      })),
    });

    if (!result.success) {
      setCategories(fallbackList);
      toast.error(typeof result.error === 'string' ? result.error : '排序保存失败');
      return;
    }

    router.refresh();
  }

  function moveByDrop(
    sourceId: string,
    targetId: string,
    currentList: CategoryListItem[],
  ): CategoryListItem[] | null {
    const source = currentList.find((item) => item.id === sourceId);
    const target = currentList.find((item) => item.id === targetId);
    if (!source || !target) return null;
    if (source.id === target.id) return null;
    if (isDescendant(target.id, source.id, currentList)) {
      toast.error('不能将分类拖拽到自己的子分类下');
      return null;
    }

    if (source.parentId === target.parentId) {
      const siblings = currentList
        .filter((item) => item.parentId === source.parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      const fromIdx = siblings.findIndex((item) => item.id === source.id);
      const toIdx = siblings.findIndex((item) => item.id === target.id);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return null;

      const reordered = [...siblings];
      const [moving] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moving);
      const orderMap = new Map(reordered.map((item, index) => [item.id, index]));

      return currentList.map((item) => {
        const nextOrder = orderMap.get(item.id);
        if (nextOrder === undefined) return item;
        return { ...item, sortOrder: nextOrder };
      });
    }

    const targetChildren = currentList
      .filter((item) => item.parentId === target.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const nextChildOrder = targetChildren.length;
    const oldParentId = source.parentId;

    const movedList = currentList.map((item) => {
      if (item.id !== source.id) return item;
      return {
        ...item,
        parentId: target.id,
        sortOrder: nextChildOrder,
      };
    });

    const normalizedOldParent = reindexSiblingSortOrder(movedList, oldParentId);
    return reindexSiblingSortOrder(normalizedOldParent, target.id);
  }

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const prev = categories;
    const next = moveByDrop(draggingId, targetId, prev);
    setDraggingId(null);
    setDragOverId(null);
    if (!next) return;

    setCategories(next);
    await persistTree(next, prev);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                已选 {selectedIds.size} 项
              </span>
              <Button
                variant="outline" size="sm" disabled={batchLoading}
                onClick={() => handleBatchToggle(true)}
              >
                <Check className="mr-1 h-3.5 w-3.5" />启用
              </Button>
              <Button
                variant="outline" size="sm" disabled={batchLoading}
                onClick={() => handleBatchToggle(false)}
              >
                <PowerOff className="mr-1 h-3.5 w-3.5" />停用
              </Button>
              <Button
                variant="outline" size="sm" disabled={batchLoading}
                onClick={() => { setMoveTargetParentId(EMPTY_ID); setMoveDialogOpen(true); }}
              >
                <FolderInput className="mr-1 h-3.5 w-3.5" />移动
              </Button>
              <Button
                variant="outline" size="sm" disabled={batchLoading}
                className="text-destructive hover:text-destructive"
                onClick={() => setBatchDeleteOpen(true)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />删除
              </Button>
              <Button
                variant="ghost" size="sm" disabled={batchLoading}
                onClick={() => setSelectedIds(new Set())}
              >
                <X className="mr-1 h-3.5 w-3.5" />取消
              </Button>
            </div>
          )}
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新建分类
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <div className="border-b border-border/50 px-4 py-2 text-xs text-muted-foreground">
          拖拽行左侧手柄：同级可调整顺序，跨级会自动移动为目标分类的子分类
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={treeRows.length > 0 && selectedIds.size === treeRows.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead>名称</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>父级</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {treeRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  暂无分类
                </TableCell>
              </TableRow>
            ) : (
              treeRows.map((item) => (
                <TableRow
                  key={item.id}
                  className={`border-border/50 ${dragOverId === item.id ? 'bg-primary/5' : ''}`}
                  draggable
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingId !== item.id) {
                      setDragOverId(item.id);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    void handleDrop(item.id);
                  }}
                >
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      aria-label={`选择 ${item.displayName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center gap-2"
                      style={{ paddingLeft: `${item.depth * 20}px` }}
                    >
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                      <span>{item.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.slug}</TableCell>
                  <TableCell>{item.parentDisplayName ?? '-'}</TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? '启用' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="h-8">
                        <Link href={`/admin/categories/${item.id}/sections`}>
                          <Layers className="mr-1 h-3.5 w-3.5" />
                          区块
                        </Link>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑分类' : '新建分类'}</DialogTitle>
            <DialogDescription>
              填写分类基础信息与多语言内容，至少一个语言名称不能为空。
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">基础信息</TabsTrigger>
              <TabsTrigger value="i18n" className="flex-1">多语言内容</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <ImagePickerUpload
                label="分类图片"
                currentUrl={imageUrl}
                mediaItems={mediaItems}
                onSelect={(id, url) => { setImageId(id); setImageUrl(url); }}
                onClear={() => { setImageId(null); setImageUrl(null); }}
                onMediaUploaded={handleMediaUploaded}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Slug</label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="例如：industrial-equipment"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">父级分类</label>
                  <Select value={parentId} onValueChange={setParentId} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_ID}>无（顶级分类）</SelectItem>
                      {parentOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.displayName} ({item.slug})
                        </SelectItem>
                      ))}
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
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      disabled={isSubmitting}
                    />
                    启用分类
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="i18n" className="space-y-3 pt-4">
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
                          placeholder="分类名称"
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
                        <div className="sm:col-span-2">
                          <textarea
                            rows={3}
                            className={handleTextareaClassName()}
                            placeholder="分类描述（可选）"
                            value={item.description}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                              updateTranslation(item.locale, 'description', e.target.value)
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <textarea
                            rows={2}
                            className={handleTextareaClassName()}
                            placeholder="SEO 描述（可选）"
                            value={item.seoDescription}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                              updateTranslation(item.locale, 'seoDescription', e.target.value)
                            }
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>

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

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        description={<>确定删除分类 <strong>{deleteTarget?.displayName}</strong> 吗？此操作不可撤销。</>}
        onConfirm={handleDelete}
        loading={isSubmitting}
      />

      <ConfirmDeleteDialog
        open={batchDeleteOpen}
        onOpenChange={setBatchDeleteOpen}
        description={<>确定删除选中的 <strong>{selectedIds.size}</strong> 个分类吗？含有子分类的将被跳过。此操作不可撤销。</>}
        onConfirm={handleBatchDelete}
        loading={batchLoading}
      />

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>批量移动分类</DialogTitle>
            <DialogDescription>
              将选中的 {selectedIds.size} 个分类移动到指定父级下
            </DialogDescription>
          </DialogHeader>
          <Select value={moveTargetParentId} onValueChange={setMoveTargetParentId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={EMPTY_ID}>无（顶级分类）</SelectItem>
              {moveParentOptions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.displayName} ({item.slug})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)} disabled={batchLoading}>
              取消
            </Button>
            <Button onClick={handleBatchMove} disabled={batchLoading}>
              确认移动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
