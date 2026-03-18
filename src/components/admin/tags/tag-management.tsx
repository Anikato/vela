'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { createTagAction, deleteTagAction, updateTagAction } from '@/server/actions/tag.actions';
import type { Language, TagListItem } from '@/types/admin';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDeleteDialog } from '@/components/admin/common/confirm-delete-dialog';

interface TagManagementProps {
  initialTags: TagListItem[];
  locales: Language[];
}

type TranslationForm = {
  locale: string;
  name: string;
};

const BADGE_STYLES = [
  { value: 'none', label: '无角标' },
  { value: 'ribbon', label: '飘带' },
  { value: 'badge', label: '标签' },
  { value: 'corner', label: '角标' },
] as const;

const BADGE_COLORS = [
  { value: 'red', label: '红色', className: 'bg-red-500' },
  { value: 'orange', label: '橙色', className: 'bg-orange-500' },
  { value: 'green', label: '绿色', className: 'bg-green-500' },
  { value: 'blue', label: '蓝色', className: 'bg-blue-500' },
  { value: 'purple', label: '紫色', className: 'bg-purple-500' },
  { value: 'black', label: '黑色', className: 'bg-black' },
] as const;

const BADGE_POSITIONS = [
  { value: 'top-left', label: '左上角' },
  { value: 'top-right', label: '右上角' },
] as const;

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
  return locales.map((item) => ({
    locale: item.code,
    name: '',
  }));
}

function BadgePreview({ style, color, position, text }: { style: string; color: string; position: string; text: string }) {
  const colorClass =
    color === 'red' ? 'bg-red-500' :
    color === 'orange' ? 'bg-orange-500' :
    color === 'green' ? 'bg-green-500' :
    color === 'blue' ? 'bg-blue-500' :
    color === 'purple' ? 'bg-purple-500' :
    color === 'black' ? 'bg-gray-900' : 'bg-gray-500';

  const isLeft = position === 'top-left';

  if (style === 'ribbon') {
    return (
      <div className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-0 z-10`}>
        <div className={`${colorClass} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white ${
          isLeft ? 'rounded-br-lg' : 'rounded-bl-lg'
        }`}>
          {text}
        </div>
      </div>
    );
  }

  if (style === 'badge') {
    return (
      <div className={`absolute ${isLeft ? 'left-2' : 'right-2'} top-2 z-10`}>
        <div className={`${colorClass} rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}>
          {text}
        </div>
      </div>
    );
  }

  if (style === 'corner') {
    return (
      <div className={`absolute ${isLeft ? 'left-0' : 'right-0'} top-0 z-10 overflow-hidden`} style={{ width: 60, height: 60 }}>
        <div className={`${colorClass} absolute ${isLeft ? '-left-[14px]' : '-right-[14px]'} top-[8px] w-[90px] text-center ${isLeft ? '-rotate-45' : 'rotate-45'} py-[2px] text-[9px] font-bold uppercase tracking-wider text-white shadow-sm`}>
          {text}
        </div>
      </div>
    );
  }

  return null;
}

export function TagManagement({ initialTags, locales }: TagManagementProps) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);

  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TagListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TagListItem | null>(null);
  const [slug, setSlug] = useState('');
  const [badgeStyle, setBadgeStyle] = useState<string>('none');
  const [badgeColor, setBadgeColor] = useState<string>('red');
  const [badgePosition, setBadgePosition] = useState<string>('top-left');
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales),
  );
  const defaultLocale = useMemo(
    () => locales.find((item) => item.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );
  const [expandedLocales, setExpandedLocales] = useState<string[]>([]);

  const sortedTags = useMemo(
    () =>
      [...tags].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [tags],
  );

  function toggleLocalePanel(locale: string) {
    setExpandedLocales((prev) =>
      prev.includes(locale) ? prev.filter((item) => item !== locale) : [...prev, locale],
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

  function openCreateDialog() {
    setEditing(null);
    setSlug('');
    setBadgeStyle('none');
    setBadgeColor('red');
    setBadgePosition('top-left');
    setTranslations(buildTranslationForm(locales));
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setDialogOpen(true);
  }

  function openEditDialog(item: TagListItem) {
    setEditing(item);
    setSlug(item.slug);
    setBadgeStyle(item.badgeStyle ?? 'none');
    setBadgeColor(item.badgeColor ?? 'red');
    setBadgePosition(item.badgePosition ?? 'top-left');
    setTranslations(
      locales.map((locale) => {
        const matched = item.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          name: matched?.name ?? '',
        };
      }),
    );
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setDialogOpen(true);
  }

  function updateTranslation(locale: string, value: string) {
    setTranslations((prev) =>
      prev.map((item) => (item.locale === locale ? { ...item, name: value } : item)),
    );
  }

  async function handleSave() {
    if (!slug.trim()) {
      toast.error('Slug 不能为空');
      return;
    }

    const payload = {
      slug: slug.trim().toLowerCase(),
      badgeStyle: badgeStyle as 'none' | 'ribbon' | 'badge' | 'corner',
      badgeColor: badgeColor as 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'black' | 'custom',
      badgePosition: badgePosition as 'top-left' | 'top-right',
      translations: translations.map((item) => ({
        locale: item.locale,
        name: item.name || undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updateTagAction(editing.id, payload)
        : await createTagAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(editing ? '标签已更新' : '标签已创建');
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
      const result = await deleteTagAction(deleteTarget.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }

      setTags((prev) => prev.filter((row) => row.id !== deleteTarget.id));
      toast.success('标签已删除');
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
          新建标签
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>名称</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>角标</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="w-40 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  暂无标签
                </TableCell>
              </TableRow>
            ) : (
              sortedTags.map((item) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell>{item.displayName}</TableCell>
                  <TableCell>{item.slug}</TableCell>
                  <TableCell>
                    {item.badgeStyle && item.badgeStyle !== 'none' ? (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                        item.badgeColor === 'red' ? 'bg-red-500' :
                        item.badgeColor === 'orange' ? 'bg-orange-500' :
                        item.badgeColor === 'green' ? 'bg-green-500' :
                        item.badgeColor === 'blue' ? 'bg-blue-500' :
                        item.badgeColor === 'purple' ? 'bg-purple-500' :
                        item.badgeColor === 'black' ? 'bg-black' : 'bg-gray-500'
                      }`}>
                        {BADGE_STYLES.find((s) => s.value === item.badgeStyle)?.label ?? item.badgeStyle}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑标签' : '新建标签'}</DialogTitle>
            <DialogDescription>填写标签基础信息和多语言名称。</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">基础信息</TabsTrigger>
              <TabsTrigger value="badge" className="flex-1">角标样式</TabsTrigger>
              <TabsTrigger value="i18n" className="flex-1">多语言内容</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="例如：hot-sale"
                  disabled={isSubmitting}
                />
              </div>
            </TabsContent>

            <TabsContent value="badge" className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">角标样式</label>
                <p className="text-xs text-muted-foreground">启用后，带此标签的产品图片上将显示角标</p>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={badgeStyle}
                  onChange={(e) => setBadgeStyle(e.target.value)}
                  disabled={isSubmitting}
                >
                  {BADGE_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              {badgeStyle !== 'none' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">颜色</label>
                    <div className="flex flex-wrap gap-2">
                      {BADGE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${c.className} ${
                            badgeColor === c.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                          }`}
                          title={c.label}
                          onClick={() => setBadgeColor(c.value)}
                          disabled={isSubmitting}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">位置</label>
                    <select
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      value={badgePosition}
                      onChange={(e) => setBadgePosition(e.target.value)}
                      disabled={isSubmitting}
                    >
                      {BADGE_POSITIONS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">预览</label>
                    <div className="relative h-32 w-40 overflow-hidden rounded-lg border border-border bg-muted/20">
                      <BadgePreview
                        style={badgeStyle}
                        color={badgeColor}
                        position={badgePosition}
                        text={translations.find((t) => t.locale === defaultLocale)?.name || slug || 'Tag'}
                      />
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">产品图片</div>
                    </div>
                  </div>
                </>
              )}
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
                          placeholder="标签名称"
                          value={item.name}
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
        description={<>确定删除标签 <strong>{deleteTarget?.displayName}</strong> 吗？此操作不可撤销。</>}
        onConfirm={handleDelete}
        loading={isSubmitting}
      />
    </div>
  );
}
