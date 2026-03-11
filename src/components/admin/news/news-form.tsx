'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ImageIcon,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Language, Media, NewsDetail, TagListItem } from '@/types/admin';
import {
  createNewsAction,
  updateNewsAction,
} from '@/server/actions/news.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/admin/common/rich-text-editor';
import { MediaPickerDialog } from '@/components/admin/common/media-picker-dialog';

type MediaWithUrl = Media & { url: string };

type TranslationForm = {
  locale: string;
  title: string;
  summary: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
};

interface NewsFormProps {
  news?: NewsDetail | null;
  locales: Language[];
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
  existing?: NewsDetail['translations'],
): TranslationForm[] {
  return locales.map((locale) => {
    const matched = existing?.find((tr) => tr.locale === locale.code);
    return {
      locale: locale.code,
      title: matched?.title ?? '',
      summary: matched?.summary ?? '',
      content: matched?.content ?? '',
      seoTitle: matched?.seoTitle ?? '',
      seoDescription: matched?.seoDescription ?? '',
    };
  });
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewsForm({ news, locales, tags, mediaItems }: NewsFormProps) {
  const router = useRouter();
  const isEditing = Boolean(news);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<MediaWithUrl[]>(mediaItems);

  const defaultLocale = useMemo(
    () => locales.find((l) => l.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );

  // ─── Form State ───
  const [slug, setSlug] = useState(news?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [status, setStatus] = useState<'draft' | 'published'>(
    (news?.status as 'draft' | 'published') ?? 'draft',
  );
  const [publishedAt, setPublishedAt] = useState<string>(
    formatDateForInput(news?.publishedAt ?? null),
  );
  const [coverImageId, setCoverImageId] = useState(news?.coverImageId ?? '');
  const [tagIds, setTagIds] = useState<string[]>(news?.tagIds ?? []);
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales, news?.translations),
  );
  const [expandedLocales, setExpandedLocales] = useState<string[]>(
    defaultLocale ? [defaultLocale] : [],
  );

  // ─── Media Picker ───
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // ─── Derived ───
  const coverMedia = coverImageId
    ? mediaLibrary.find((m) => m.id === coverImageId) ?? null
    : null;

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

    if (key === 'title' && locale === defaultLocale && !slugTouched) {
      setSlug(slugify(value));
    }
  }

  function toggleLocalePanel(locale: string) {
    setExpandedLocales((prev) =>
      prev.includes(locale) ? prev.filter((l) => l !== locale) : [...prev, locale],
    );
  }

  function toggleTag(tagId: string) {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  }

  // ─── Save ───
  async function handleSave() {
    if (!slug.trim()) {
      toast.error('Slug 不能为空');
      return;
    }

    const hasTitle = translations.some((t) => t.title.trim());
    if (!hasTitle) {
      toast.error('至少需要填写一个语言版本的标题');
      return;
    }

    setIsSubmitting(true);

    const effectivePublishedAt =
      status === 'published'
        ? publishedAt || new Date().toISOString()
        : publishedAt || null;

    const payload = {
      slug: slug.trim().toLowerCase(),
      status,
      coverImageId: coverImageId || null,
      publishedAt: effectivePublishedAt,
      tagIds,
      translations: translations.map((t) => ({
        locale: t.locale,
        title: t.title.trim() || undefined,
        summary: t.summary.trim() || undefined,
        content: t.content || undefined,
        seoTitle: t.seoTitle.trim() || undefined,
        seoDescription: t.seoDescription.trim() || undefined,
      })),
    };

    try {
      if (isEditing && news) {
        const result = await updateNewsAction(news.id, payload);
        if (result.success) {
          toast.success('保存成功');
          router.push('/admin/news');
        } else {
          toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        }
      } else {
        const result = await createNewsAction(payload);
        if (result.success) {
          toast.success('创建成功');
          router.push('/admin/news');
        } else {
          toast.error(typeof result.error === 'string' ? result.error : '创建失败');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/admin/news')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditing ? '编辑新闻' : '新建新闻'}</h1>
            {isEditing && (
              <span className="text-sm text-muted-foreground">/{news!.slug}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/news')}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? '保存' : '创建'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Translations */}
          {orderedTranslations.map((tf) => {
            const loc = locales.find((l) => l.code === tf.locale);
            const localeName = loc?.chineseName || loc?.englishName || tf.locale;
            const isExpanded = expandedLocales.includes(tf.locale);
            const isDefault = tf.locale === defaultLocale;
            return (
              <div key={tf.locale} className="rounded-lg border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
                  onClick={() => toggleLocalePanel(tf.locale)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{localeName}</span>
                    {isDefault && (
                      <Badge variant="outline" className="text-xs">
                        默认
                      </Badge>
                    )}
                    {tf.title && (
                      <span className="truncate text-sm text-muted-foreground">
                        — {tf.title}
                      </span>
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="space-y-4 border-t p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">标题</label>
                      <Input
                        value={tf.title}
                        onChange={(e) => updateTranslation(tf.locale, 'title', e.target.value)}
                        placeholder="文章标题"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">摘要</label>
                      <Textarea
                        value={tf.summary}
                        onChange={(e) => updateTranslation(tf.locale, 'summary', e.target.value)}
                        placeholder="简短描述（用于列表和 SEO）"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">正文内容</label>
                      <RichTextEditor
                        value={tf.content}
                        onChange={(html) => updateTranslation(tf.locale, 'content', html)}
                      />
                    </div>
                    <details className="rounded border p-3">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                        SEO 设置
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="mb-1 block text-sm">SEO 标题</label>
                          <Input
                            value={tf.seoTitle}
                            onChange={(e) => updateTranslation(tf.locale, 'seoTitle', e.target.value)}
                            placeholder="留空则使用文章标题"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm">SEO 描述</label>
                          <Textarea
                            value={tf.seoDescription}
                            onChange={(e) => updateTranslation(tf.locale, 'seoDescription', e.target.value)}
                            placeholder="留空则使用文章摘要"
                            rows={2}
                          />
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Status & Publish */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">发布设置</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm">状态</label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'published')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm">
                  发布时间
                  <span className="ml-1 text-xs text-muted-foreground">
                    （留空则使用当前时间）
                  </span>
                </label>
                <Input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Slug */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">URL Slug</h3>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="url-friendly-slug"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              只允许小写字母、数字和连字符
            </p>
          </div>

          {/* Cover Image */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">封面图片</h3>
            {coverMedia ? (
              <div className="relative group">
                <Image
                  src={coverMedia.url}
                  alt={coverMedia.alt ?? '封面'}
                  width={300}
                  height={200}
                  className="w-full rounded object-cover"
                  style={{ maxHeight: 200 }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setCoverImageId('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                onClick={() => setShowCoverPicker(true)}
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm">选择封面图片</span>
              </button>
            )}
            {coverMedia && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => setShowCoverPicker(true)}
              >
                更换封面
              </Button>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-medium">标签</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = tagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer select-none transition-colors"
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.displayName}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
              {tagIds.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  已选择 {tagIds.length} 个标签
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Picker */}
      <MediaPickerDialog
        open={showCoverPicker}
        onOpenChange={setShowCoverPicker}
        mediaItems={mediaLibrary}
        onMediaUploaded={handleMediaUploaded}
        onConfirm={(ids) => {
          if (ids.length > 0) setCoverImageId(ids[0]);
          setShowCoverPicker(false);
        }}
        accept="image"
        title="选择封面图片"
        initialSelectedIds={coverImageId ? [coverImageId] : []}
      />
    </div>
  );
}
