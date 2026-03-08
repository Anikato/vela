'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  createSectionAction,
  deleteSectionAction,
  reorderPageSectionsAction,
  updateSectionAction,
} from '@/server/actions/section.actions';
import type { Language, SectionListItem } from '@/types/admin';
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

interface PageSectionsManagementProps {
  pageId: string;
  initialSections: SectionListItem[];
  locales: Language[];
}

type TranslationForm = {
  locale: string;
  title: string;
  subtitle: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
};

type SectionType = 'hero' | 'rich_text' | 'cta' | 'product_showcase' | 'feature_grid' | 'carousel_banner' | 'stats' | 'faq' | 'two_column' | 'partner_logos' | 'testimonials' | 'category_nav' | 'video_embed' | 'timeline' | 'image_gallery' | 'team' | 'contact_form' | 'custom_html';

function buildTranslationForm(locales: Language[]): TranslationForm[] {
  return locales.map((item) => ({
    locale: item.code,
    title: '',
    subtitle: '',
    content: '',
    buttonText: '',
    buttonLink: '',
    secondaryButtonText: '',
    secondaryButtonLink: '',
  }));
}

function parseConfigJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('配置 JSON 必须是对象');
  }
  return parsed as Record<string, unknown>;
}

export function PageSectionsManagement({
  pageId,
  initialSections,
  locales,
}: PageSectionsManagementProps) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SectionListItem | null>(null);

  const [type, setType] = useState<SectionType>('hero');
  const [isActive, setIsActive] = useState(true);
  const [anchorId, setAnchorId] = useState('');
  const [cssClass, setCssClass] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales),
  );

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections],
  );

  function openCreateDialog() {
    setEditing(null);
    setType('hero');
    setIsActive(true);
    setAnchorId('');
    setCssClass('');
    setConfigJson('{}');
    setTranslations(buildTranslationForm(locales));
    setDialogOpen(true);
  }

  function openEditDialog(item: SectionListItem) {
    setEditing(item);
    setType(item.type as SectionType);
    setIsActive(item.isActive);
    setAnchorId(item.anchorId ?? '');
    setCssClass(item.cssClass ?? '');
    setConfigJson(JSON.stringify(item.config ?? {}, null, 2));
    setTranslations(
      locales.map((locale) => {
        const matched = item.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          title: matched?.title ?? '',
          subtitle: matched?.subtitle ?? '',
          content: matched?.content ?? '',
          buttonText: matched?.buttonText ?? '',
          buttonLink: matched?.buttonLink ?? '',
          secondaryButtonText: matched?.secondaryButtonText ?? '',
          secondaryButtonLink: matched?.secondaryButtonLink ?? '',
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

  async function saveSection() {
    let config: Record<string, unknown>;
    try {
      config = parseConfigJson(configJson);
    } catch {
      toast.error('配置 JSON 格式不正确');
      return;
    }

    const payload = {
      pageId,
      type,
      config,
      isActive,
      anchorId: anchorId || null,
      cssClass: cssClass || null,
      translations: translations.map((item) => ({
        locale: item.locale,
        title: item.title || undefined,
        subtitle: item.subtitle || undefined,
        content: item.content || undefined,
        buttonText: item.buttonText || undefined,
        buttonLink: item.buttonLink || undefined,
        secondaryButtonText: item.secondaryButtonText || undefined,
        secondaryButtonLink: item.secondaryButtonLink || undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updateSectionAction(editing.id, payload)
        : await createSectionAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(editing ? '区块已更新' : '区块已创建');
      setDialogOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: SectionListItem) {
    const confirmed = window.confirm(`确认删除区块“${item.displayTitle}”吗？`);
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const result = await deleteSectionAction(item.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      setSections((prev) => prev.filter((x) => x.id !== item.id));
      toast.success('区块已删除');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function moveItem(id: string, direction: 'up' | 'down') {
    const current = [...sortedSections];
    const index = current.findIndex((item) => item.id === id);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    const next = [...current];
    const [moving] = next.splice(index, 1);
    next.splice(targetIndex, 0, moving);

    setIsSubmitting(true);
    try {
      const result = await reorderPageSectionsAction({
        pageId,
        orderedSectionIds: next.map((item) => item.id),
      });
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '排序失败');
        return;
      }
      setSections(next.map((item, idx) => ({ ...item, sortOrder: idx })));
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
          新增区块
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>标题</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>排序</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-52 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  暂无区块
                </TableCell>
              </TableRow>
            ) : (
              sortedSections.map((item, index) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell>{item.displayTitle}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.type}</Badge>
                  </TableCell>
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
                        disabled={isSubmitting || index === 0}
                        onClick={() => moveItem(item.id, 'up')}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        disabled={isSubmitting || index === sortedSections.length - 1}
                        onClick={() => moveItem(item.id, 'down')}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑区块' : '新增区块'}</DialogTitle>
            <DialogDescription>
              支持 18 种区块类型，涵盖布局、内容、媒体、交互四大类。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">区块类型</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={type}
                  onChange={(e) => setType(e.target.value as SectionType)}
                  disabled={isSubmitting}
                >
                  <optgroup label="布局类">
                    <option value="hero">hero — 首屏横幅</option>
                    <option value="two_column">two_column — 双栏布局</option>
                    <option value="carousel_banner">carousel_banner — 轮播横幅</option>
                  </optgroup>
                  <optgroup label="内容类">
                    <option value="rich_text">rich_text — 富文本</option>
                    <option value="feature_grid">feature_grid — 特性网格</option>
                    <option value="stats">stats — 数据统计</option>
                    <option value="faq">faq — 常见问答</option>
                    <option value="testimonials">testimonials — 客户评价</option>
                    <option value="timeline">timeline — 时间线</option>
                    <option value="team">team — 团队介绍</option>
                  </optgroup>
                  <optgroup label="媒体类">
                    <option value="partner_logos">partner_logos — 合作伙伴Logo</option>
                    <option value="image_gallery">image_gallery — 图片画廊</option>
                    <option value="video_embed">video_embed — 视频嵌入</option>
                  </optgroup>
                  <optgroup label="交互类">
                    <option value="product_showcase">product_showcase — 产品展示</option>
                    <option value="category_nav">category_nav — 分类导航</option>
                    <option value="cta">cta — 行动号召</option>
                    <option value="contact_form">contact_form — 联系表单</option>
                  </optgroup>
                  <optgroup label="其他">
                    <option value="custom_html">custom_html — 自定义HTML</option>
                  </optgroup>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">锚点 ID（可选）</label>
                <Input
                  value={anchorId}
                  onChange={(e) => setAnchorId(e.target.value)}
                  placeholder="例如：features"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">自定义 CSS 类（可选）</label>
                <Input
                  value={cssClass}
                  onChange={(e) => setCssClass(e.target.value)}
                  placeholder="例如：rounded-xl shadow-lg"
                  disabled={isSubmitting}
                />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium">配置 JSON</label>
                <textarea
                  rows={6}
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  disabled={isSubmitting}
                />
                {type === 'product_showcase' ? (
                  <p className="text-xs text-muted-foreground">
                    可用字段：`limit`（1-24），`category_slug`，`tag_slug`。例如：
                    {` {"limit": 6, "category_slug": "pumps", "tag_slug": "featured"}`}
                  </p>
                ) : null}
              </div>
              <div className="flex items-end sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    disabled={isSubmitting}
                  />
                  启用区块
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {translations.map((item) => (
                <div key={item.locale} className="rounded-md border border-border/50 p-3">
                  <p className="mb-2 text-sm font-semibold">{item.locale}</p>
                  <div className="grid gap-3">
                    <Input
                      placeholder="标题"
                      value={item.title}
                      onChange={(e) => updateTranslation(item.locale, 'title', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <Input
                      placeholder="副标题"
                      value={item.subtitle}
                      onChange={(e) => updateTranslation(item.locale, 'subtitle', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <textarea
                      rows={4}
                      className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="正文（可选，支持 HTML）"
                      value={item.content}
                      onChange={(e) => updateTranslation(item.locale, 'content', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="主按钮文本"
                        value={item.buttonText}
                        onChange={(e) =>
                          updateTranslation(item.locale, 'buttonText', e.target.value)
                        }
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="主按钮链接"
                        value={item.buttonLink}
                        onChange={(e) =>
                          updateTranslation(item.locale, 'buttonLink', e.target.value)
                        }
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="次按钮文本"
                        value={item.secondaryButtonText}
                        onChange={(e) =>
                          updateTranslation(item.locale, 'secondaryButtonText', e.target.value)
                        }
                        disabled={isSubmitting}
                      />
                      <Input
                        placeholder="次按钮链接"
                        value={item.secondaryButtonLink}
                        onChange={(e) =>
                          updateTranslation(item.locale, 'secondaryButtonLink', e.target.value)
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={saveSection} disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
