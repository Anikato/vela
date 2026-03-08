'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Blocks, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createPageAction,
  deletePageAction,
  updatePageAction,
} from '@/server/actions/page.actions';
import type { Language, PageListItem } from '@/types/admin';
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

interface PageManagementProps {
  initialPages: PageListItem[];
  locales: Language[];
}

type TranslationForm = {
  locale: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
};

type PageStatus = 'draft' | 'published';

function buildTranslationForm(locales: Language[]): TranslationForm[] {
  return locales.map((item) => ({
    locale: item.code,
    title: '',
    seoTitle: '',
    seoDescription: '',
  }));
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

export function PageManagement({ initialPages, locales }: PageManagementProps) {
  const router = useRouter();
  const [pages, setPages] = useState(initialPages);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PageListItem | null>(null);
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<PageStatus>('draft');
  const [isHomepage, setIsHomepage] = useState(false);
  const [template, setTemplate] = useState('');
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales),
  );

  const sortedPages = useMemo(
    () =>
      [...pages].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [pages],
  );

  function openCreateDialog() {
    setEditing(null);
    setSlug('');
    setStatus('draft');
    setIsHomepage(false);
    setTemplate('');
    setTranslations(buildTranslationForm(locales));
    setDialogOpen(true);
  }

  function openEditDialog(item: PageListItem) {
    setEditing(item);
    setSlug(item.slug);
    setStatus(item.status as PageStatus);
    setIsHomepage(item.isHomepage);
    setTemplate(item.template ?? '');
    setTranslations(
      locales.map((locale) => {
        const matched = item.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          title: matched?.title ?? '',
          seoTitle: matched?.seoTitle ?? '',
          seoDescription: matched?.seoDescription ?? '',
        };
      }),
    );
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
      status,
      isHomepage,
      template: template.trim() || null,
      translations: translations.map((item) => ({
        locale: item.locale,
        title: item.title || undefined,
        seoTitle: item.seoTitle || undefined,
        seoDescription: item.seoDescription || undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updatePageAction(editing.id, payload)
        : await createPageAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(editing ? '页面已更新' : '页面已创建');
      setDialogOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: PageListItem) {
    const confirmed = window.confirm(`确认删除页面“${item.displayTitle}”吗？`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const result = await deletePageAction(item.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }

      setPages((prev) => prev.filter((row) => row.id !== item.id));
      toast.success('页面已删除');
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
          新建页面
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>标题</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>首页</TableHead>
              <TableHead>模板</TableHead>
              <TableHead>更新时间</TableHead>
              <TableHead className="w-56 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  暂无页面
                </TableCell>
              </TableRow>
            ) : (
              sortedPages.map((item) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell>{item.displayTitle}</TableCell>
                  <TableCell>{item.slug}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                      {item.status === 'published' ? '已发布' : '草稿'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.isHomepage ? (
                      <Badge variant="default">是</Badge>
                    ) : (
                      <Badge variant="secondary">否</Badge>
                    )}
                  </TableCell>
                  <TableCell>{item.template || '-'}</TableCell>
                  <TableCell>{formatDate(item.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm" className="h-8">
                        <Link href={`/admin/pages/${item.id}/sections`}>
                          <Blocks className="mr-1 h-3.5 w-3.5" />
                          区块
                        </Link>
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
            <DialogTitle>{editing ? '编辑页面' : '新建页面'}</DialogTitle>
            <DialogDescription>
              填写页面基础信息和多语言标题，至少一个语言标题不能为空。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="例如：about"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">模板（可选）</label>
                <Input
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="例如：full-width"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">状态</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PageStatus)}
                  disabled={isSubmitting}
                >
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={isHomepage}
                    onCheckedChange={setIsHomepage}
                    disabled={isSubmitting}
                  />
                  设为首页
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {translations.map((item) => (
                <div key={item.locale} className="rounded-md border border-border/50 p-3">
                  <p className="mb-2 text-sm font-semibold">{item.locale}</p>
                  <div className="grid gap-3">
                    <Input
                      placeholder="页面标题"
                      value={item.title}
                      onChange={(e) => updateTranslation(item.locale, 'title', e.target.value)}
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
                      className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="SEO 描述（可选）"
                      value={item.seoDescription}
                      onChange={(e) =>
                        updateTranslation(item.locale, 'seoDescription', e.target.value)
                      }
                      disabled={isSubmitting}
                    />
                  </div>
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
