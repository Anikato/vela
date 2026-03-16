'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, FileUp, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  copyAttributesFromProductAction,
  createAttributeAction,
  createAttributeGroupAction,
  deleteAttributeAction,
  deleteAttributeGroupAction,
  getProductOptionsAction,
  moveAttributeToGroupAction,
  reorderAttributeGroupsAction,
  reorderAttributesAction,
  updateAttributeAction,
  updateAttributeGroupAction,
} from '@/server/actions/product-attribute.actions';
import type {
  Language,
  ProductAttributeEditorData,
  ProductOption,
} from '@/types/admin';
import { Checkbox } from '@/components/ui/checkbox';
import { CsvAttributeImportDialog } from './csv-attribute-import-dialog';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/admin/common/confirm-delete-dialog';
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

export interface ProductAttributeEditorProps {
  productId: string;
  initialData: ProductAttributeEditorData;
  locales: Language[];
  toolbarExtra?: React.ReactNode;
}

type GroupTranslationForm = {
  locale: string;
  name: string;
};

type AttributeTranslationForm = {
  locale: string;
  name: string;
  value: string;
};

type EditingGroup = {
  id: string;
} | null;

type EditingAttribute = {
  id: string;
  groupId: string;
} | null;

function buildGroupTranslations(locales: Language[]): GroupTranslationForm[] {
  return locales.map((item) => ({ locale: item.code, name: '' }));
}

function buildAttributeTranslations(locales: Language[]): AttributeTranslationForm[] {
  return locales.map((item) => ({ locale: item.code, name: '', value: '' }));
}

export function ProductAttributeEditor({
  productId,
  initialData,
  locales,
  toolbarExtra,
}: ProductAttributeEditorProps) {
  const router = useRouter();
  const [data, setData] = useState<ProductAttributeEditorData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EditingGroup>(null);
  const [groupTranslations, setGroupTranslations] = useState<GroupTranslationForm[]>(() =>
    buildGroupTranslations(locales),
  );

  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<EditingAttribute>(null);
  const [attributeGroupId, setAttributeGroupId] = useState('');
  const [attributeTranslations, setAttributeTranslations] = useState<AttributeTranslationForm[]>(() =>
    buildAttributeTranslations(locales),
  );

  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null);
  const [draggingAttribute, setDraggingAttribute] = useState<{ id: string; groupId: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'group' | 'attribute'; id: string; label: string } | null>(null);

  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyProductOptions, setCopyProductOptions] = useState<ProductOption[]>([]);
  const [copySourceId, setCopySourceId] = useState('');
  const [copyValues, setCopyValues] = useState(true);
  const [copyLoading, setCopyLoading] = useState(false);

  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const defaultLocale = useMemo(
    () => locales.find((l) => l.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );

  const groupMap = useMemo(() => {
    const map = new Map<string, ProductAttributeEditorData['groups'][number]>();
    for (const group of data.groups) {
      map.set(group.id, group);
    }
    return map;
  }, [data.groups]);

  function reload() {
    router.refresh();
  }

  async function openCopyDialog() {
    setCopyLoading(true);
    setCopyDialogOpen(true);
    setCopySourceId('');
    setCopyValues(true);
    try {
      const result = await getProductOptionsAction(
        locales.find((l) => l.isDefault)?.code ?? locales[0]?.code ?? 'en',
        locales.find((l) => l.isDefault)?.code ?? locales[0]?.code ?? 'en',
      );
      if (result.success) {
        setCopyProductOptions(result.data.filter((p) => p.id !== productId));
      } else {
        toast.error('加载产品列表失败');
      }
    } finally {
      setCopyLoading(false);
    }
  }

  async function handleCopyAttributes() {
    if (!copySourceId) {
      toast.error('请选择来源产品');
      return;
    }
    setCopyLoading(true);
    try {
      const result = await copyAttributesFromProductAction({
        sourceProductId: copySourceId,
        targetProductId: productId,
        copyValues,
      });
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '复制失败');
        return;
      }
      toast.success(`已复制 ${result.data.groupsCopied} 个分组、${result.data.attributesCopied} 个参数`);
      setCopyDialogOpen(false);
      reload();
    } finally {
      setCopyLoading(false);
    }
  }

  function openCreateGroupDialog() {
    setEditingGroup(null);
    setGroupTranslations(buildGroupTranslations(locales));
    setGroupDialogOpen(true);
  }

  function openEditGroupDialog(groupId: string) {
    const group = groupMap.get(groupId);
    if (!group) return;
    setEditingGroup({ id: groupId });
    setGroupTranslations(
      locales.map((locale) => {
        const matched = group.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          name: matched?.name ?? '',
        };
      }),
    );
    setGroupDialogOpen(true);
  }

  function openCreateAttributeDialog(groupId: string) {
    setEditingAttribute(null);
    setAttributeGroupId(groupId);
    setAttributeTranslations(buildAttributeTranslations(locales));
    setAttributeDialogOpen(true);
  }

  function openEditAttributeDialog(groupId: string, attributeId: string) {
    const group = groupMap.get(groupId);
    if (!group) return;
    const attribute = group.attributes.find((item) => item.id === attributeId);
    if (!attribute) return;

    setEditingAttribute({ id: attributeId, groupId });
    setAttributeGroupId(groupId);
    setAttributeTranslations(
      locales.map((locale) => {
        const matched = attribute.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          name: matched?.name ?? '',
          value: matched?.value ?? '',
        };
      }),
    );
    setAttributeDialogOpen(true);
  }

  async function handleSaveGroup() {
    setIsSubmitting(true);
    try {
      if (editingGroup) {
        const result = await updateAttributeGroupAction(editingGroup.id, {
          translations: groupTranslations.map((item) => ({
            locale: item.locale,
            name: item.name || undefined,
          })),
        });
        if (!result.success) {
          toast.error(typeof result.error === 'string' ? result.error : '保存失败');
          return;
        }
        toast.success('分组已更新');
      } else {
        const result = await createAttributeGroupAction({
          productId,
          translations: groupTranslations.map((item) => ({
            locale: item.locale,
            name: item.name || undefined,
          })),
        });
        if (!result.success) {
          toast.error(typeof result.error === 'string' ? result.error : '保存失败');
          return;
        }
        toast.success('分组已创建');
      }
      setGroupDialogOpen(false);
      reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteGroup(groupId: string) {
    setIsSubmitting(true);
    try {
      const result = await deleteAttributeGroupAction(groupId);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      toast.success('分组已删除');
      setDeleteConfirm(null);
      reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveAttribute() {
    if (!attributeGroupId) {
      toast.error('请选择分组');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAttribute) {
        const result = await updateAttributeAction(editingAttribute.id, {
          groupId: attributeGroupId,
          translations: attributeTranslations.map((item) => ({
            locale: item.locale,
            name: item.name || undefined,
            value: item.value || undefined,
          })),
        });
        if (!result.success) {
          toast.error(typeof result.error === 'string' ? result.error : '保存失败');
          return;
        }
        toast.success('参数已更新');
      } else {
        const result = await createAttributeAction({
          groupId: attributeGroupId,
          translations: attributeTranslations.map((item) => ({
            locale: item.locale,
            name: item.name || undefined,
            value: item.value || undefined,
          })),
        });
        if (!result.success) {
          toast.error(typeof result.error === 'string' ? result.error : '保存失败');
          return;
        }
        toast.success('参数已创建');
      }
      setAttributeDialogOpen(false);
      reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteAttribute(attributeId: string) {
    setIsSubmitting(true);
    try {
      const result = await deleteAttributeAction(attributeId);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      toast.success('参数已删除');
      setDeleteConfirm(null);
      reload();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function persistGroupOrder(nextGroupIds: string[]) {
    const result = await reorderAttributeGroupsAction(productId, nextGroupIds);
    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : '分组排序保存失败');
      return false;
    }
    return true;
  }

  async function persistAttributeOrder(groupId: string, nextAttributeIds: string[]) {
    const result = await reorderAttributesAction(groupId, nextAttributeIds);
    if (!result.success) {
      toast.error(typeof result.error === 'string' ? result.error : '参数排序保存失败');
      return false;
    }
    return true;
  }

  async function onDropGroup(targetGroupId: string) {
    if (!draggingGroupId || draggingGroupId === targetGroupId) return;
    const groups = [...data.groups];
    const from = groups.findIndex((item) => item.id === draggingGroupId);
    const to = groups.findIndex((item) => item.id === targetGroupId);
    if (from < 0 || to < 0) return;

    const next = [...groups];
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);
    setData({ ...data, groups: next.map((item, index) => ({ ...item, sortOrder: index })) });

    const ok = await persistGroupOrder(next.map((item) => item.id));
    if (!ok) {
      reload();
      return;
    }
    reload();
  }

  async function onDropAttribute(targetGroupId: string, targetAttributeId: string | null) {
    if (!draggingAttribute) return;
    const { id: sourceId, groupId: sourceGroupId } = draggingAttribute;
    if (!sourceId) return;

    if (sourceGroupId !== targetGroupId) {
      const moveResult = await moveAttributeToGroupAction(sourceId, targetGroupId);
      if (!moveResult.success) {
        toast.error(typeof moveResult.error === 'string' ? moveResult.error : '跨组移动失败');
        reload();
        return;
      }
      toast.success('参数已移动到目标分组');
      reload();
      return;
    }

    if (!targetAttributeId || sourceId === targetAttributeId) return;
    const sourceGroup = groupMap.get(sourceGroupId);
    if (!sourceGroup) return;

    const rows = [...sourceGroup.attributes];
    const from = rows.findIndex((item) => item.id === sourceId);
    const to = rows.findIndex((item) => item.id === targetAttributeId);
    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [moving] = next.splice(from, 1);
    next.splice(to, 0, moving);

    const ok = await persistAttributeOrder(sourceGroupId, next.map((item) => item.id));
    if (!ok) {
      reload();
      return;
    }
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        {toolbarExtra}
        <Button variant="outline" onClick={() => setCsvDialogOpen(true)}>
          <FileUp className="mr-2 h-4 w-4" />
          CSV 导入
        </Button>
        <Button variant="outline" onClick={openCopyDialog}>
          <Copy className="mr-2 h-4 w-4" />
          从其他产品复制
        </Button>
        <Button onClick={openCreateGroupDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新建参数分组
        </Button>
      </div>

      <div className="space-y-3">
        {data.groups.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground">
            当前产品暂无参数分组
          </div>
        ) : (
          data.groups.map((group) => (
            <div
              key={group.id}
              className="rounded-lg border border-border/50 bg-card"
              draggable
              onDragStart={() => setDraggingGroupId(group.id)}
              onDragEnd={() => setDraggingGroupId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void onDropGroup(group.id);
              }}
            >
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">{group.displayName}</h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => openCreateAttributeDialog(group.id)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    新增参数
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => openEditGroupDialog(group.id)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    编辑分组
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirm({ type: 'group', id: group.id, label: group.displayName })}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    删除分组
                  </Button>
                </div>
              </div>

              <div
                className="divide-y divide-border/40"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void onDropAttribute(group.id, null);
                }}
              >
                {group.attributes.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">该分组暂无参数</div>
                ) : (
                  group.attributes.map((attribute) => (
                    <div
                      key={attribute.id}
                      className="flex items-center justify-between px-4 py-3"
                      draggable
                      onDragStart={() =>
                        setDraggingAttribute({ id: attribute.id, groupId: group.id })
                      }
                      onDragEnd={() => setDraggingAttribute(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        void onDropAttribute(group.id, attribute.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attribute.displayName}</p>
                          <p className="text-xs text-muted-foreground">{attribute.displayValue}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => openEditAttributeDialog(group.id, attribute.id)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          编辑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm({ type: 'attribute', id: attribute.id, label: attribute.displayName })}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          删除
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? '编辑分组' : '新建分组'}</DialogTitle>
            <DialogDescription>填写分组多语言名称。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {groupTranslations.map((translation) => (
              <div key={translation.locale} className="space-y-2 rounded-md border border-border/50 p-3">
                <p className="text-sm font-medium">{translation.locale}</p>
                <Input
                  value={translation.name}
                  onChange={(e) =>
                    setGroupTranslations((prev) =>
                      prev.map((item) =>
                        item.locale === translation.locale ? { ...item, name: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="分组名称"
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSaveGroup} disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={attributeDialogOpen} onOpenChange={setAttributeDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAttribute ? '编辑参数' : '新建参数'}</DialogTitle>
            <DialogDescription>填写参数多语言名称和值，可选择所属分组。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">所属分组</label>
              <Select value={attributeGroupId} onValueChange={setAttributeGroupId} disabled={isSubmitting}>
                <SelectTrigger><SelectValue placeholder="选择分组" /></SelectTrigger>
                <SelectContent>
                  {data.groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {attributeTranslations.map((translation) => (
              <div key={translation.locale} className="space-y-2 rounded-md border border-border/50 p-3">
                <p className="text-sm font-medium">{translation.locale}</p>
                <Input
                  value={translation.name}
                  onChange={(e) =>
                    setAttributeTranslations((prev) =>
                      prev.map((item) =>
                        item.locale === translation.locale ? { ...item, name: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="参数名（如：功率）"
                  disabled={isSubmitting}
                />
                <Input
                  value={translation.value}
                  onChange={(e) =>
                    setAttributeTranslations((prev) =>
                      prev.map((item) =>
                        item.locale === translation.locale ? { ...item, value: e.target.value } : item,
                      ),
                    )
                  }
                  placeholder="参数值（如：5.5 kW）"
                  disabled={isSubmitting}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttributeDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSaveAttribute} disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CsvAttributeImportDialog
        open={csvDialogOpen}
        onOpenChange={setCsvDialogOpen}
        productId={productId}
        defaultLocale={defaultLocale}
        onImported={reload}
      />

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>从其他产品复制参数</DialogTitle>
            <DialogDescription>选择来源产品，其参数将追加到当前产品。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">来源产品</label>
              <Select value={copySourceId} onValueChange={setCopySourceId} disabled={copyLoading}>
                <SelectTrigger><SelectValue placeholder="选择产品" /></SelectTrigger>
                <SelectContent>
                  {copyProductOptions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.displayName} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={copyValues}
                onCheckedChange={(checked) => setCopyValues(checked === true)}
                disabled={copyLoading}
              />
              同时复制参数值
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)} disabled={copyLoading}>
              取消
            </Button>
            <Button onClick={handleCopyAttributes} disabled={copyLoading || !copySourceId}>
              确认复制
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        description={
          deleteConfirm?.type === 'group'
            ? <>确定删除参数分组 <strong>{deleteConfirm.label}</strong> 及其全部参数吗？此操作不可撤销。</>
            : <>确定删除参数 <strong>{deleteConfirm?.label}</strong> 吗？此操作不可撤销。</>
        }
        onConfirm={() => {
          if (deleteConfirm?.type === 'group') handleDeleteGroup(deleteConfirm.id);
          else if (deleteConfirm?.type === 'attribute') handleDeleteAttribute(deleteConfirm.id);
        }}
        loading={isSubmitting}
      />
    </div>
  );
}
