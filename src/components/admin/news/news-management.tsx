'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createNewsAction,
  deleteNewsAction,
  getNewsByIdAction,
  updateNewsAction,
} from '@/server/actions/news.actions';
import type { Language, Media, NewsListItem } from '@/types/admin';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/admin/common/rich-text-editor';

interface NewsManagementProps {
  initialNews: NewsListItem[];
  locales: Language[];
  mediaItems: Array<Media & { url: string }>;
}

type TranslationForm = {
  locale: string;
  title: string;
  summary: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
};

export function NewsManagement({ initialNews, locales, mediaItems }: NewsManagementProps) {
  const router = useRouter();
  const [newsList, setNewsList] = useState(initialNews);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [coverImageId, setCoverImageId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('basic');
  const [translations, setTranslations] = useState<TranslationForm[]>([]);

  const resetForm = () => {
    setSlug('');
    setStatus('draft');
    setCoverImageId('');
    setActiveTab('basic');
    setTranslations(
      locales.map((l) => ({
        locale: l.code,
        title: '',
        summary: '',
        content: '',
        seoTitle: '',
        seoDescription: '',
      })),
    );
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item: NewsListItem) => {
    setEditingId(item.id);
    setSlug(item.slug);
    setStatus(item.status as 'draft' | 'published');
    setCoverImageId(item.coverImage?.id ?? '');
    setActiveTab('basic');

    startTransition(async () => {
      const result = await getNewsByIdAction(item.id);
      if (!result.success) {
        toast.error('加载新闻详情失败');
        return;
      }
      const detail = result.data;
      setTranslations(
        locales.map((l) => {
          const existing = detail.translations.find((t) => t.locale === l.code);
          return {
            locale: l.code,
            title: existing?.title ?? '',
            summary: existing?.summary ?? '',
            content: existing?.content ?? '',
            seoTitle: existing?.seoTitle ?? '',
            seoDescription: existing?.seoDescription ?? '',
          };
        }),
      );
      setCoverImageId(detail.coverImageId ?? '');
      setDialogOpen(true);
    });
  };

  const handleSave = () => {
    if (!slug.trim()) {
      toast.error('Slug 不能为空');
      return;
    }

    const translationData = translations
      .filter((t) => t.title || t.summary || t.content)
      .map((t) => ({
        locale: t.locale,
        title: t.title || undefined,
        summary: t.summary || undefined,
        content: t.content || undefined,
        seoTitle: t.seoTitle || undefined,
        seoDescription: t.seoDescription || undefined,
      }));

    if (translationData.length === 0) {
      toast.error('请至少填写一种语言的标题');
      return;
    }

    startTransition(async () => {
      if (editingId) {
        const result = await updateNewsAction(editingId, {
          slug,
          status,
          coverImageId: coverImageId || null,
          translations: translationData,
        });
        if (result.success) {
          toast.success('新闻已更新');
          setDialogOpen(false);
          router.refresh();
        } else {
          toast.error(typeof result.error === 'string' ? result.error : '更新失败');
        }
      } else {
        const result = await createNewsAction({
          slug,
          status,
          coverImageId: coverImageId || null,
          translations: translationData,
        });
        if (result.success) {
          toast.success('新闻已创建');
          setDialogOpen(false);
          router.refresh();
        } else {
          toast.error(typeof result.error === 'string' ? result.error : '创建失败');
        }
      }
    });
  };

  const handleDelete = () => {
    if (!deletingId) return;
    startTransition(async () => {
      const result = await deleteNewsAction(deletingId);
      if (result.success) {
        toast.success('新闻已删除');
        setDeleteDialogOpen(false);
        setDeletingId(null);
        router.refresh();
      } else {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
      }
    });
  };

  const updateTranslation = (locale: string, field: keyof TranslationForm, value: string) => {
    setTranslations((prev) =>
      prev.map((t) => (t.locale === locale ? { ...t, [field]: value } : t)),
    );
  };

  const imageOptions = mediaItems.filter((m) => m.mimeType.startsWith('image/'));
  const selectedCover = imageOptions.find((m) => m.id === coverImageId);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新建新闻
        </Button>
      </div>

      {/* News list table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>封面</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>发布时间</TableHead>
              <TableHead className="w-28">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  暂无新闻
                </TableCell>
              </TableRow>
            ) : (
              newsList.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage.url}
                        alt={item.coverImage.alt ?? ''}
                        width={60}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-15 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-64 font-medium">
                    <span className="line-clamp-1">{item.title}</span>
                    {item.summary ? (
                      <span className="line-clamp-1 text-xs text-muted-foreground">{item.summary}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.slug}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'published' ? 'default' : 'secondary'}>
                      {item.status === 'published' ? '已发布' : '草稿'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString('zh-CN')
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingId(item.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '编辑新闻' : '新建新闻'}</DialogTitle>
            <DialogDescription>
              {editingId ? '修改新闻文章内容和翻译' : '创建新闻文章并填写多语言内容'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">基础信息</TabsTrigger>
              <TabsTrigger value="i18n" className="flex-1">多语言内容</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Slug <span className="text-destructive">*</span></label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="news-article-slug"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">状态</label>
                  <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="published">已发布</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">封面图片</label>
                {selectedCover ? (
                  <div className="relative inline-block">
                    <Image
                      src={selectedCover.url}
                      alt={selectedCover.alt ?? ''}
                      width={200}
                      height={120}
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setCoverImageId('')}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <Select value={coverImageId} onValueChange={setCoverImageId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="选择封面图片" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无封面</SelectItem>
                    {imageOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.originalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="i18n" className="space-y-6 pt-4">
              {translations.map((t) => {
                const lang = locales.find((l) => l.code === t.locale);
                return (
                  <div key={t.locale} className="space-y-3 rounded-lg border border-border p-4">
                    <h3 className="text-sm font-semibold">
                      {lang?.nativeName ?? t.locale}
                      <span className="ml-2 text-xs text-muted-foreground">{t.locale}</span>
                    </h3>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">标题</label>
                      <Input
                        value={t.title}
                        onChange={(e) => updateTranslation(t.locale, 'title', e.target.value)}
                        placeholder="文章标题"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">摘要</label>
                      <textarea
                        value={t.summary}
                        onChange={(e) => updateTranslation(t.locale, 'summary', e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                        placeholder="简短摘要，用于列表展示"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">正文</label>
                      <RichTextEditor
                        value={t.content}
                        onChange={(val) => updateTranslation(t.locale, 'content', val)}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">SEO 标题</label>
                        <Input
                          value={t.seoTitle}
                          onChange={(e) => updateTranslation(t.locale, 'seoTitle', e.target.value)}
                          placeholder="SEO 标题"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">SEO 描述</label>
                        <Input
                          value={t.seoDescription}
                          onChange={(e) => updateTranslation(t.locale, 'seoDescription', e.target.value)}
                          placeholder="SEO 描述"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? '保存中…' : editingId ? '保存修改' : '创建新闻'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>此操作不可恢复，确定要删除这篇新闻吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? '删除中…' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
