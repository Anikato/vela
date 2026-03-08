'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createNavigationItemAction,
  deleteNavigationItemAction,
  updateNavigationItemAction,
} from '@/server/actions/navigation.actions';
import type { Language } from '@/server/services/language.service';
import type { NavigationListItem } from '@/server/services/navigation.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface NavigationOption {
  id: string;
  label: string;
  slug: string;
}

interface NavigationManagementProps {
  initialItems: NavigationListItem[];
  locales: Language[];
  categories: NavigationOption[];
  pages: NavigationOption[];
}

type TranslationForm = {
  locale: string;
  label: string;
};

type LinkType = 'internal' | 'external' | 'category' | 'page';

const EMPTY_ID = '__none__';

function buildTranslationForm(locales: Language[]): TranslationForm[] {
  return locales.map((item) => ({
    locale: item.code,
    label: '',
  }));
}

export function NavigationManagement({
  initialItems,
  locales,
  categories,
  pages,
}: NavigationManagementProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NavigationListItem | null>(null);

  const [parentId, setParentId] = useState(EMPTY_ID);
  const [type, setType] = useState<LinkType>('internal');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState(EMPTY_ID);
  const [pageId, setPageId] = useState(EMPTY_ID);
  const [showChildren, setShowChildren] = useState(false);
  const [icon, setIcon] = useState('');
  const [openNewTab, setOpenNewTab] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales),
  );

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if ((a.parentId ?? '') !== (b.parentId ?? '')) {
          return (a.parentId ?? '').localeCompare(b.parentId ?? '');
        }
        return a.sortOrder - b.sortOrder;
      }),
    [items],
  );

  const parentOptions = useMemo(() => {
    return sortedItems.filter((item) => item.id !== editing?.id);
  }, [editing?.id, sortedItems]);

  function openCreateDialog() {
    setEditing(null);
    setParentId(EMPTY_ID);
    setType('internal');
    setUrl('');
    setCategoryId(EMPTY_ID);
    setPageId(EMPTY_ID);
    setShowChildren(false);
    setIcon('');
    setOpenNewTab(false);
    setSortOrder(items.length);
    setIsActive(true);
    setTranslations(buildTranslationForm(locales));
    setDialogOpen(true);
  }

  function openEditDialog(item: NavigationListItem) {
    setEditing(item);
    setParentId(item.parentId ?? EMPTY_ID);
    setType(item.type as LinkType);
    setUrl(item.url ?? '');
    setCategoryId(item.categoryId ?? EMPTY_ID);
    setPageId(item.pageId ?? EMPTY_ID);
    setShowChildren(item.showChildren);
    setIcon(item.icon ?? '');
    setOpenNewTab(item.openNewTab);
    setSortOrder(item.sortOrder);
    setIsActive(item.isActive);
    setTranslations(
      locales.map((locale) => {
        const matched = item.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          label: matched?.label ?? '',
        };
      }),
    );
    setDialogOpen(true);
  }

  function updateTranslation(locale: string, value: string) {
    setTranslations((prev) =>
      prev.map((item) => (item.locale === locale ? { ...item, label: value } : item)),
    );
  }

  function buildPayload() {
    return {
      parentId: parentId === EMPTY_ID ? null : parentId,
      type,
      url: type === 'internal' || type === 'external' ? url || null : null,
      categoryId: type === 'category' && categoryId !== EMPTY_ID ? categoryId : null,
      pageId: type === 'page' && pageId !== EMPTY_ID ? pageId : null,
      showChildren,
      icon: icon || null,
      openNewTab,
      sortOrder,
      isActive,
      translations: translations.map((item) => ({
        locale: item.locale,
        label: item.label || undefined,
      })),
    };
  }

  async function handleSave() {
    const payload = buildPayload();

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updateNavigationItemAction(editing.id, payload)
        : await createNavigationItemAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(editing ? '菜单项已更新' : '菜单项已创建');
      setDialogOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: NavigationListItem) {
    const confirmed = window.confirm(`确认删除菜单项“${item.displayLabel}”吗？`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const result = await deleteNavigationItemAction(item.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      setItems((prev) => prev.filter((row) => row.id !== item.id));
      toast.success('菜单项已删除');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新建菜单项
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>名称</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>父级</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  暂无菜单项
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell>{item.displayLabel}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.type}</Badge>
                  </TableCell>
                  <TableCell>{item.parentDisplayLabel ?? '-'}</TableCell>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        disabled={isSubmitting}
                        onClick={() => handleDelete(item)}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑菜单项' : '新建菜单项'}</DialogTitle>
            <DialogDescription>支持内部链接、外部链接、关联分类、关联页面四种类型。</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">链接类型</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as LinkType)}
                  disabled={isSubmitting}
                >
                  <option value="internal">internal</option>
                  <option value="external">external</option>
                  <option value="category">category</option>
                  <option value="page">page</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">父级菜单</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value={EMPTY_ID}>无（顶级菜单）</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayLabel}
                    </option>
                  ))}
                </select>
              </div>

              {(type === 'internal' || type === 'external') && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">URL</label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={type === 'internal' ? '/about' : 'https://example.com'}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {type === 'category' && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">关联分类</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value={EMPTY_ID}>请选择分类</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} ({item.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === 'page' && (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">关联页面</label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value={EMPTY_ID}>请选择页面</option>
                    {pages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label} ({item.slug})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">图标（可选）</label>
                <Input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="例如：Home"
                  disabled={isSubmitting}
                />
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
              <div className="flex items-end gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={showChildren}
                    onCheckedChange={setShowChildren}
                    disabled={isSubmitting}
                  />
                  显示子菜单
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={openNewTab}
                    onCheckedChange={setOpenNewTab}
                    disabled={isSubmitting}
                  />
                  新窗口打开
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isSubmitting}
                  />
                  启用菜单项
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {translations.map((item) => (
                <div key={item.locale} className="rounded-md border border-border/50 p-3">
                  <p className="mb-2 text-sm font-semibold">{item.locale}</p>
                  <Input
                    placeholder="菜单名称"
                    value={item.label}
                    onChange={(e) => updateTranslation(item.locale, e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
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
    </div>
  );
}
