'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createNavigationItemAction,
  deleteNavigationItemAction,
  updateNavigationItemAction,
} from '@/server/actions/navigation.actions';
import type { Language, NavigationListItem } from '@/types/admin';
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

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);
  const [deleteTarget, setDeleteTarget] = useState<NavigationListItem | null>(null);

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
  const defaultLocale = useMemo(
    () => locales.find((item) => item.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );
  const [expandedLocales, setExpandedLocales] = useState<string[]>([]);

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

  function toggleLocalePanel(locale: string) {
    setExpandedLocales((prev) =>
      prev.includes(locale) ? prev.filter((item) => item !== locale) : [...prev, locale],
    );
  }

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
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
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
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setDialogOpen(true);
  }

  function updateTranslation(locale: string, value: string) {
    setTranslations((prev) =>
      prev.map((item) => (item.locale === locale ? { ...item, label: value } : item)),
    );
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

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsSubmitting(true);
    try {
      const result = await deleteNavigationItemAction(deleteTarget.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      setItems((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      toast.success('菜单项已删除');
      setDeleteTarget(null);
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
            <DialogTitle>{editing ? '编辑菜单项' : '新建菜单项'}</DialogTitle>
            <DialogDescription>支持内部链接、外部链接、关联分类、关联页面四种类型。</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">基础信息</TabsTrigger>
              <TabsTrigger value="i18n" className="flex-1">多语言内容</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">链接类型</label>
                  <Select value={type} onValueChange={(v) => setType(v as LinkType)} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">内部链接</SelectItem>
                      <SelectItem value="external">外部链接</SelectItem>
                      <SelectItem value="category">关联分类</SelectItem>
                      <SelectItem value="page">关联页面</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">父级菜单</label>
                  <Select value={parentId} onValueChange={setParentId} disabled={isSubmitting}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_ID}>无（顶级菜单）</SelectItem>
                      {parentOptions.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.displayLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                      <SelectTrigger><SelectValue placeholder="请选择分类" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_ID}>请选择分类</SelectItem>
                        {categories.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label} ({item.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {type === 'page' && (
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium">关联页面</label>
                    <Select value={pageId} onValueChange={setPageId} disabled={isSubmitting}>
                      <SelectTrigger><SelectValue placeholder="请选择页面" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_ID}>请选择页面</SelectItem>
                        {pages.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label} ({item.slug})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            </TabsContent>

            <TabsContent value="i18n" className="space-y-3 pt-4">
              {orderedTranslations.map((item) => {
                const expanded = expandedLocales.includes(item.locale);
                const isDefault = item.locale === defaultLocale;
                return (
                  <div key={item.locale} className="rounded-md border border-border/50 p-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left"
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
                      <div className="mt-2">
                        <Input
                          placeholder="菜单名称"
                          value={item.label}
                          onChange={(e) => updateTranslation(item.locale, e.target.value)}
                          disabled={isSubmitting}
                        />
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
        description={<>确定删除菜单项 <strong>{deleteTarget?.displayLabel}</strong> 吗？此操作不可撤销。</>}
        onConfirm={handleDelete}
        loading={isSubmitting}
      />
    </div>
  );
}
