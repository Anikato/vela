'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Copy,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  createSectionAction,
  updateSectionAction,
} from '@/server/actions/section.actions';
import {
  createSectionItemAction,
  deleteSectionItemAction,
  reorderSectionItemsAction,
  updateSectionItemAction,
} from '@/server/actions/section-item.actions';
import type { Language, SectionListItem } from '@/types/admin';
import type { Media } from '@/types/admin';
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RichTextEditor } from '@/components/admin/common/rich-text-editor';
import { ConfirmDeleteDialog } from '@/components/admin/common/confirm-delete-dialog';
import { MediaPickerDialog } from '@/components/admin/common/media-picker-dialog';
import { BlockConfigForm } from './block-config-form';

// ─── Types ───

type MediaWithUrl = Media & { url: string };

type SectionType =
  | 'hero' | 'rich_text' | 'cta' | 'product_showcase' | 'feature_grid'
  | 'carousel_banner' | 'stats' | 'faq' | 'two_column' | 'partner_logos'
  | 'testimonials' | 'category_nav' | 'video_embed' | 'timeline'
  | 'image_gallery' | 'team' | 'contact_form' | 'news_showcase' | 'custom_html'
  | 'google_map' | 'image_marquee' | 'video_gallery';

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

export interface SectionItemForUI {
  id: string;
  sectionId: string;
  iconName: string | null;
  imageId: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  config: Record<string, unknown>;
  sortOrder: number;
  displayTitle: string;
  translations: {
    id: string;
    itemId: string;
    locale: string;
    title: string | null;
    description: string | null;
    content: string | null;
  }[];
}

type ItemTranslationForm = {
  locale: string;
  title: string;
  description: string;
  content: string;
};

interface SectionFormProps {
  pageId?: string;
  categoryId?: string;
  section?: SectionListItem;
  initialItems?: SectionItemForUI[];
  locales: Language[];
  mediaItems: MediaWithUrl[];
  backUrl: string;
}

// ─── Constants ───

const itemBasedBlockTypes = new Set([
  'hero', 'feature_grid', 'carousel_banner', 'two_column', 'timeline',
  'team', 'partner_logos', 'image_gallery', 'stats', 'testimonials', 'faq',
  'image_marquee', 'video_gallery',
]);

const richTextBlockTypes = new Set([
  'hero', 'rich_text', 'cta', 'two_column', 'contact_form',
]);

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: '首屏横幅',
  two_column: '双栏布局',
  carousel_banner: '轮播横幅',
  rich_text: '富文本',
  feature_grid: '特性网格',
  stats: '数据统计',
  faq: '常见问答',
  testimonials: '客户评价',
  timeline: '时间线',
  team: '团队介绍',
  partner_logos: '合作伙伴Logo',
  image_gallery: '图片画廊',
  video_embed: '视频嵌入',
  product_showcase: '产品展示',
  category_nav: '分类导航',
  news_showcase: '新闻展示',
  cta: '行动号召',
  contact_form: '联系表单',
  custom_html: '自定义HTML',
  google_map: '谷歌地图',
  image_marquee: '图片走马灯',
  video_gallery: '视频画廊',
};

const ITEM_FIELDS_BY_TYPE: Record<
  string,
  {
    showIcon: boolean;
    showImage: boolean;
    showLink: boolean;
    showDescription: boolean;
    showContent: boolean;
    itemLabel: string;
    hint: string;
  }
> = {
  hero: { showIcon: false, showImage: true, showLink: false, showDescription: false, showContent: false, itemLabel: '背景图片', hint: '上传一张图片作为 Hero 区块的背景。通常只需 1 项。' },
  feature_grid: { showIcon: true, showImage: true, showLink: true, showDescription: true, showContent: false, itemLabel: '特性卡片', hint: '每个子项是一张特性卡片，可使用图标或图片。' },
  carousel_banner: { showIcon: false, showImage: true, showLink: true, showDescription: true, showContent: false, itemLabel: '轮播幻灯片', hint: '每个子项是一张轮播图，包含图片、标题、描述和链接。' },
  two_column: { showIcon: false, showImage: true, showLink: false, showDescription: false, showContent: false, itemLabel: '侧栏图片', hint: '上传一张图片用于双栏布局的图片列。通常只需 1 项。' },
  timeline: { showIcon: false, showImage: false, showLink: false, showDescription: true, showContent: false, itemLabel: '里程碑', hint: '每个子项是一个时间线节点。标题格式建议："2020 — 事件名称"。' },
  team: { showIcon: false, showImage: true, showLink: true, showDescription: true, showContent: false, itemLabel: '团队成员', hint: '每个子项是一位团队成员。标题 = 姓名，描述 = 职位/简介。' },
  partner_logos: { showIcon: false, showImage: true, showLink: true, showDescription: false, showContent: false, itemLabel: '合作伙伴 Logo', hint: '每个子项是一个合作伙伴的 Logo 图片。' },
  image_gallery: { showIcon: false, showImage: true, showLink: false, showDescription: false, showContent: false, itemLabel: '图库图片', hint: '每个子项是一张图库图片。' },
  stats: { showIcon: false, showImage: false, showLink: false, showDescription: true, showContent: false, itemLabel: '数据统计项', hint: '标题 = 数据标签，描述 = 数值+后缀（如 "1000+"）。' },
  testimonials: { showIcon: false, showImage: true, showLink: false, showDescription: true, showContent: false, itemLabel: '客户评价', hint: '标题 = 客户姓名，描述 = 评价内容。可上传头像。' },
  faq: { showIcon: false, showImage: false, showLink: false, showDescription: true, showContent: false, itemLabel: 'FAQ 条目', hint: '标题 = 问题，描述 = 答案。' },
  image_marquee: { showIcon: false, showImage: true, showLink: false, showDescription: true, showContent: false, itemLabel: '走马灯图片', hint: '每个子项是一张滚动展示的图片。标题用于悬停时显示，描述可选。' },
  video_gallery: { showIcon: false, showImage: true, showLink: true, showDescription: true, showContent: false, itemLabel: '视频', hint: '每个子项是一个视频。链接 = 视频地址（YouTube/Vimeo/Bilibili），标题 = 视频名称，描述 = 简介，图片 = 自定义缩略图（可选）。' },
};

const DEFAULT_ITEM_FIELDS = {
  showIcon: true, showImage: true, showLink: true, showDescription: true, showContent: true,
  itemLabel: '子项', hint: '管理此区块的子项内容。',
};

// ─── Component ───

export function SectionForm({
  pageId,
  categoryId,
  section,
  initialItems = [],
  locales,
  mediaItems: initialMediaItems,
  backUrl,
}: SectionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(section);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<MediaWithUrl[]>(initialMediaItems);

  // Section form state
  const [type, setType] = useState<SectionType>((section?.type as SectionType) ?? 'hero');
  const [isActive, setIsActive] = useState(section?.isActive ?? true);
  const [anchorId, setAnchorId] = useState(section?.anchorId ?? '');
  const [cssClass, setCssClass] = useState(section?.cssClass ?? '');
  const [configObj, setConfigObj] = useState<Record<string, unknown>>(section?.config ?? {});
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    locales.map((locale) => {
      const matched = section?.translations.find((tr) => tr.locale === locale.code);
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

  const defaultLocale = useMemo(
    () => locales.find((l) => l.isDefault)?.code ?? locales[0]?.code ?? '',
    [locales],
  );

  // Items state
  const [items, setItems] = useState<SectionItemForUI[]>(initialItems);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SectionItemForUI | null>(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<SectionItemForUI | null>(null);
  const [itemIsSubmitting, setItemIsSubmitting] = useState(false);

  // Item form state
  const [itemIconName, setItemIconName] = useState('');
  const [itemImageId, setItemImageId] = useState<string | null>(null);
  const [itemImageUrl, setItemImageUrl] = useState<string | null>(null);
  const [itemLinkUrl, setItemLinkUrl] = useState('');
  const [itemTranslations, setItemTranslations] = useState<ItemTranslationForm[]>([]);
  const [expandedLocales, setExpandedLocales] = useState<string[]>([]);

  // MediaPicker for items
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );

  const itemFields = ITEM_FIELDS_BY_TYPE[type] ?? DEFAULT_ITEM_FIELDS;
  const hasItems = itemBasedBlockTypes.has(type);

  // ─── Section translation helpers ───

  function updateTranslation(locale: string, key: keyof Omit<TranslationForm, 'locale'>, value: string) {
    setTranslations((prev) =>
      prev.map((item) => (item.locale === locale ? { ...item, [key]: value } : item)),
    );
  }

  // ─── Save section ───

  async function saveSection() {
    const ownerFields = categoryId ? { categoryId } : { pageId: pageId! };
    const payload = {
      ...ownerFields,
      type,
      config: configObj,
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
      const result = isEditing
        ? await updateSectionAction(section!.id, payload)
        : await createSectionAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(isEditing ? '区块已更新' : '区块已创建');
      router.refresh();
      router.push(backUrl);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Item management ───

  function buildItemTranslationForm(): ItemTranslationForm[] {
    return locales.map((l) => ({ locale: l.code, title: '', description: '', content: '' }));
  }

  function openCreateItemDialog() {
    setEditingItem(null);
    setItemIconName('');
    setItemImageId(null);
    setItemImageUrl(null);
    setItemLinkUrl('');
    setItemTranslations(buildItemTranslationForm());
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setItemDialogOpen(true);
  }

  function openEditItemDialog(item: SectionItemForUI) {
    setEditingItem(item);
    setItemIconName(item.iconName ?? '');
    setItemImageId(item.imageId);
    setItemImageUrl(item.imageUrl);
    setItemLinkUrl(item.linkUrl ?? '');
    setItemTranslations(
      locales.map((locale) => {
        const matched = item.translations.find((tr) => tr.locale === locale.code);
        return {
          locale: locale.code,
          title: matched?.title ?? '',
          description: matched?.description ?? '',
          content: matched?.content ?? '',
        };
      }),
    );
    setExpandedLocales(defaultLocale ? [defaultLocale] : []);
    setItemDialogOpen(true);
  }

  function updateItemTranslation(locale: string, key: keyof Omit<ItemTranslationForm, 'locale'>, value: string) {
    setItemTranslations((prev) =>
      prev.map((item) => (item.locale === locale ? { ...item, [key]: value } : item)),
    );
  }

  function toggleLocalePanel(locale: string) {
    setExpandedLocales((prev) =>
      prev.includes(locale) ? prev.filter((l) => l !== locale) : [...prev, locale],
    );
  }

  const orderedItemTranslations = useMemo(() => {
    const list = [...itemTranslations];
    list.sort((a, b) => {
      if (a.locale === defaultLocale) return -1;
      if (b.locale === defaultLocale) return 1;
      return a.locale.localeCompare(b.locale);
    });
    return list;
  }, [defaultLocale, itemTranslations]);

  async function saveItem() {
    if (!section) {
      toast.error('请先保存区块，然后再添加子项');
      return;
    }

    const payload = {
      sectionId: section.id,
      iconName: itemIconName || null,
      imageId: itemImageId || null,
      linkUrl: itemLinkUrl || null,
      translations: itemTranslations.map((item) => ({
        locale: item.locale,
        title: item.title || undefined,
        description: item.description || undefined,
        content: item.content || undefined,
      })),
    };

    setItemIsSubmitting(true);
    try {
      const result = editingItem
        ? await updateSectionItemAction(editingItem.id, payload)
        : await createSectionItemAction(payload);

      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }

      toast.success(editingItem ? '子项已更新' : '子项已创建');
      setItemDialogOpen(false);
      router.refresh();
    } finally {
      setItemIsSubmitting(false);
    }
  }

  async function handleDeleteItem() {
    if (!deleteItemTarget) return;

    setItemIsSubmitting(true);
    try {
      const result = await deleteSectionItemAction(deleteItemTarget.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== deleteItemTarget.id));
      toast.success('子项已删除');
      setDeleteItemTarget(null);
      router.refresh();
    } finally {
      setItemIsSubmitting(false);
    }
  }

  async function moveItem(id: string, direction: 'up' | 'down') {
    if (!section) return;
    const current = [...sortedItems];
    const idx = current.findIndex((item) => item.id === id);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= current.length) return;

    [current[idx], current[swapIdx]] = [current[swapIdx], current[idx]];
    const orderedIds = current.map((item) => item.id);

    setItems(current.map((item, i) => ({ ...item, sortOrder: i })));

    const result = await reorderSectionItemsAction({
      sectionId: section.id,
      orderedItemIds: orderedIds,
    });

    if (!result.success) {
      toast.error('排序失败');
      router.refresh();
    }
  }

  const handleMediaUploaded = useCallback((newItems: MediaWithUrl[]) => {
    setMediaLibrary((prev) => [...newItems, ...prev]);
  }, []);

  // ─── Render ───

  return (
    <div className="space-y-6">
      {/* ─── Section Settings ─── */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1">基础设置</TabsTrigger>
          <TabsTrigger value="content" className="flex-1">多语言内容</TabsTrigger>
          {hasItems && isEditing && (
            <TabsTrigger value="items" className="flex-1">
              {itemFields.itemLabel}管理
              {items.length > 0 && (
                <Badge variant="secondary" className="ml-1.5">{items.length}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* ─── Tab: Basic ─── */}
        <TabsContent value="basic" className="mt-6">
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">区块类型</label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v as SectionType);
                    setConfigObj({});
                  }}
                  disabled={isSubmitting || isEditing}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>布局类</SelectLabel>
                      <SelectItem value="hero">hero — 首屏横幅</SelectItem>
                      <SelectItem value="two_column">two_column — 双栏布局</SelectItem>
                      <SelectItem value="carousel_banner">carousel_banner — 轮播横幅</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>内容类</SelectLabel>
                      <SelectItem value="rich_text">rich_text — 富文本</SelectItem>
                      <SelectItem value="feature_grid">feature_grid — 特性网格</SelectItem>
                      <SelectItem value="stats">stats — 数据统计</SelectItem>
                      <SelectItem value="faq">faq — 常见问答</SelectItem>
                      <SelectItem value="testimonials">testimonials — 客户评价</SelectItem>
                      <SelectItem value="timeline">timeline — 时间线</SelectItem>
                      <SelectItem value="team">team — 团队介绍</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>媒体类</SelectLabel>
                      <SelectItem value="partner_logos">partner_logos — 合作伙伴Logo</SelectItem>
                      <SelectItem value="image_gallery">image_gallery — 图片画廊</SelectItem>
                      <SelectItem value="video_embed">video_embed — 视频嵌入</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>交互类</SelectLabel>
                      <SelectItem value="product_showcase">product_showcase — 产品展示</SelectItem>
                      <SelectItem value="category_nav">category_nav — 分类导航</SelectItem>
                      <SelectItem value="news_showcase">news_showcase — 新闻展示</SelectItem>
                      <SelectItem value="cta">cta — 行动号召</SelectItem>
                      <SelectItem value="contact_form">contact_form — 联系表单</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>其他</SelectLabel>
                      <SelectItem value="custom_html">custom_html — 自定义HTML</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">编辑模式下不可更改区块类型</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">锚点 ID（可选）</label>
                <Input
                  value={anchorId}
                  onChange={(e) => setAnchorId(e.target.value)}
                  placeholder="例如：features"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">用于页内导航，如 #features</p>
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

              <div className="sm:col-span-2">
                <BlockConfigForm type={type} value={configObj} onChange={setConfigObj} disabled={isSubmitting} />
              </div>

              <div className="flex items-center gap-3 sm:col-span-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} disabled={isSubmitting} />
                <label className="text-sm font-medium">启用区块</label>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab: Content (translations) ─── */}
        <TabsContent value="content" className="mt-6 space-y-4">
          {translations.map((item) => {
            const isDefault = item.locale === defaultLocale;
            return (
              <div key={item.locale} className="rounded-lg border border-border/50 bg-card p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.locale}</span>
                  {isDefault && <Badge variant="secondary">默认</Badge>}
                </div>
                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">标题</label>
                      <Input
                        value={item.title}
                        onChange={(e) => updateTranslation(item.locale, 'title', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="区块标题"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">副标题</label>
                      <Input
                        value={item.subtitle}
                        onChange={(e) => updateTranslation(item.locale, 'subtitle', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="区块副标题"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">正文</label>
                    {richTextBlockTypes.has(type) ? (
                      <RichTextEditor
                        value={item.content}
                        onChange={(html) => updateTranslation(item.locale, 'content', html)}
                        placeholder="正文内容（可选）"
                        disabled={isSubmitting}
                      />
                    ) : (
                      <textarea
                        rows={4}
                        className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="正文内容（可选）"
                        value={item.content}
                        onChange={(e) => updateTranslation(item.locale, 'content', e.target.value)}
                        disabled={isSubmitting}
                      />
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">主按钮文本</label>
                      <Input
                        value={item.buttonText}
                        onChange={(e) => updateTranslation(item.locale, 'buttonText', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="如：了解更多"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">主按钮链接</label>
                      <Input
                        value={item.buttonLink}
                        onChange={(e) => updateTranslation(item.locale, 'buttonLink', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="如：/products"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">次按钮文本</label>
                      <Input
                        value={item.secondaryButtonText}
                        onChange={(e) => updateTranslation(item.locale, 'secondaryButtonText', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="如：联系我们"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">次按钮链接</label>
                      <Input
                        value={item.secondaryButtonLink}
                        onChange={(e) => updateTranslation(item.locale, 'secondaryButtonLink', e.target.value)}
                        disabled={isSubmitting}
                        placeholder="如：/contact"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ─── Tab: Items ─── */}
        {hasItems && isEditing && (
          <TabsContent value="items" className="mt-6 space-y-4">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{itemFields.hint}</p>
            </div>

            <div className="flex justify-end">
              <Button onClick={openCreateItemDialog} size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                新增{itemFields.itemLabel}
              </Button>
            </div>

            {sortedItems.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
                暂无{itemFields.itemLabel}，点击上方按钮添加
              </div>
            ) : (
              <div className="space-y-2">
                {sortedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-accent/30"
                  >
                    {/* Sort controls */}
                    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <button
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={idx === 0 || itemIsSubmitting}
                        className="hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={idx === sortedItems.length - 1 || itemIsSubmitting}
                        className="hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Image preview */}
                    {itemFields.showImage && (
                      <div className="shrink-0">
                        {item.imageUrl ? (
                          <div className="relative h-14 w-14 overflow-hidden rounded-md border bg-muted">
                            <Image src={item.imageUrl} alt="" fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md border bg-muted/30">
                            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.displayTitle}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {itemFields.showIcon && item.iconName && (
                          <Badge variant="outline" className="text-xs">{item.iconName}</Badge>
                        )}
                        {itemFields.showLink && item.linkUrl && (
                          <span className="truncate">{item.linkUrl}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => openEditItemDialog(item)}
                        disabled={itemIsSubmitting}
                      >
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteItemTarget(item)}
                        disabled={itemIsSubmitting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ─── Save bar ─── */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4">
        {hasItems && !isEditing && (
          <p className="text-sm text-muted-foreground">
            保存后可添加{itemFields.itemLabel}
          </p>
        )}
        {(!hasItems || isEditing) && <div />}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push(backUrl)} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={saveSection} disabled={isSubmitting}>
            <Save className="mr-1.5 h-4 w-4" />
            {isSubmitting ? '保存中...' : isEditing ? '保存修改' : '创建区块'}
          </Button>
        </div>
      </div>

      {/* ─── Item create/edit dialog ─── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? '编辑' : '新增'}{itemFields.itemLabel}
            </DialogTitle>
            <DialogDescription>{itemFields.hint}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Image */}
            {itemFields.showImage && (
              <div>
                <label className="mb-2 block text-sm font-medium">图片</label>
                <div className="flex items-center gap-3">
                  {itemImageUrl ? (
                    <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
                      <Image src={itemImageUrl} alt="" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => { setItemImageId(null); setItemImageUrl(null); }}
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition-colors hover:bg-accent/50"
                      onClick={() => setItemPickerOpen(true)}
                    >
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setItemPickerOpen(true)}
                  >
                    {itemImageUrl ? '更换' : '选择图片'}
                  </Button>
                </div>
              </div>
            )}

            {/* Icon & Link */}
            <div className="grid gap-4 sm:grid-cols-2">
              {itemFields.showIcon && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">图标名称（Lucide）</label>
                  <Input
                    placeholder="例如 Shield, Zap, Globe"
                    value={itemIconName}
                    onChange={(e) => setItemIconName(e.target.value)}
                    disabled={itemIsSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      Lucide 图标
                    </a>{' '}名称
                  </p>
                </div>
              )}
              {itemFields.showLink && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">链接 URL（可选）</label>
                  <Input
                    placeholder="/products 或 https://..."
                    value={itemLinkUrl}
                    onChange={(e) => setItemLinkUrl(e.target.value)}
                    disabled={itemIsSubmitting}
                  />
                </div>
              )}
            </div>

            {/* Translations */}
            <div className="space-y-3">
              <label className="text-sm font-medium">多语言内容</label>
              {orderedItemTranslations.map((item) => {
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
                    {expanded && (
                      <div className="mt-3 grid gap-3">
                        <Input
                          placeholder="标题"
                          value={item.title}
                          onChange={(e) => updateItemTranslation(item.locale, 'title', e.target.value)}
                          disabled={itemIsSubmitting}
                        />
                        {itemFields.showDescription && (
                          <textarea
                            rows={3}
                            className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="描述"
                            value={item.description}
                            onChange={(e) => updateItemTranslation(item.locale, 'description', e.target.value)}
                            disabled={itemIsSubmitting}
                          />
                        )}
                        {itemFields.showContent && (
                          <textarea
                            rows={4}
                            className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="富文本内容（可选）"
                            value={item.content}
                            onChange={(e) => updateItemTranslation(item.locale, 'content', e.target.value)}
                            disabled={itemIsSubmitting}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)} disabled={itemIsSubmitting}>
              取消
            </Button>
            <Button onClick={saveItem} disabled={itemIsSubmitting}>
              {itemIsSubmitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Media picker for items ─── */}
      <MediaPickerDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        mediaItems={mediaLibrary}
        onMediaUploaded={handleMediaUploaded}
        onConfirm={(ids) => {
          if (ids.length > 0) {
            const selected = mediaLibrary.find((m) => m.id === ids[0]);
            if (selected) {
              setItemImageId(selected.id);
              setItemImageUrl(selected.url);
            }
          }
          setItemPickerOpen(false);
        }}
        accept="image"
        title="选择图片"
      />

      {/* ─── Item delete confirmation ─── */}
      <ConfirmDeleteDialog
        open={!!deleteItemTarget}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        description={<>确定删除{itemFields.itemLabel} <strong>{deleteItemTarget?.displayTitle}</strong> 吗？此操作不可撤销。</>}
        onConfirm={handleDeleteItem}
        loading={itemIsSubmitting}
      />
    </div>
  );
}
