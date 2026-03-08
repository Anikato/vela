'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  createSectionItemAction,
  deleteSectionItemAction,
  reorderSectionItemsAction,
  updateSectionItemAction,
} from '@/server/actions/section-item.actions';
import type { Language } from '@/types/admin';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Types ───

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
}

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

interface SectionItemsManagementProps {
  sectionId: string;
  sectionType: string;
  initialItems: SectionItemForUI[];
  locales: Language[];
  mediaItems: MediaItem[];
}

type TranslationForm = {
  locale: string;
  title: string;
  description: string;
  content: string;
};

function buildTranslationForm(locales: Language[]): TranslationForm[] {
  return locales.map((l) => ({
    locale: l.code,
    title: '',
    description: '',
    content: '',
  }));
}

/* ---- 哪些字段在不同区块类型中显示 ---- */
const FIELDS_BY_TYPE: Record<
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
  hero: {
    showIcon: false,
    showImage: true,
    showLink: false,
    showDescription: false,
    showContent: false,
    itemLabel: '背景图片',
    hint: '上传一张图片作为 Hero 区块的背景。通常只需 1 项。',
  },
  feature_grid: {
    showIcon: true,
    showImage: false,
    showLink: true,
    showDescription: true,
    showContent: false,
    itemLabel: '特性卡片',
    hint: '每个子项是一张特性卡片，包含图标、标题和描述。图标名请使用 Lucide 图标名（如 Shield、Zap、Globe）。',
  },
  carousel_banner: {
    showIcon: false,
    showImage: true,
    showLink: true,
    showDescription: true,
    showContent: false,
    itemLabel: '轮播幻灯片',
    hint: '每个子项是一张轮播图，包含图片、标题、描述和链接。',
  },
  two_column: {
    showIcon: false,
    showImage: true,
    showLink: false,
    showDescription: false,
    showContent: false,
    itemLabel: '侧栏图片',
    hint: '上传一张图片用于双栏布局的图片列。通常只需 1 项。',
  },
  timeline: {
    showIcon: false,
    showImage: false,
    showLink: false,
    showDescription: true,
    showContent: false,
    itemLabel: '里程碑',
    hint: '每个子项是一个时间线节点。标题格式建议：\"2020 — 事件名称\"。',
  },
  team: {
    showIcon: false,
    showImage: true,
    showLink: true,
    showDescription: true,
    showContent: false,
    itemLabel: '团队成员',
    hint: '每个子项是一位团队成员。标题 = 姓名，描述 = 职位/简介。',
  },
  partner_logos: {
    showIcon: false,
    showImage: true,
    showLink: true,
    showDescription: false,
    showContent: false,
    itemLabel: '合作伙伴 Logo',
    hint: '每个子项是一个合作伙伴的 Logo 图片。可选添加链接到合作方网站。',
  },
  image_gallery: {
    showIcon: false,
    showImage: true,
    showLink: false,
    showDescription: false,
    showContent: false,
    itemLabel: '图库图片',
    hint: '每个子项是一张图库图片。标题可选，在悬停时显示。',
  },
  stats: {
    showIcon: false,
    showImage: false,
    showLink: false,
    showDescription: true,
    showContent: false,
    itemLabel: '数据统计项',
    hint: '标题 = 数据标签（如 "客户数量"），描述 = 数值+后缀（如 "1000+"）。也可在子项的 config 中设置 value 和 suffix。',
  },
  testimonials: {
    showIcon: false,
    showImage: true,
    showLink: false,
    showDescription: true,
    showContent: false,
    itemLabel: '客户评价',
    hint: '标题 = 客户姓名，描述 = 评价内容。可上传头像。',
  },
  faq: {
    showIcon: false,
    showImage: false,
    showLink: false,
    showDescription: true,
    showContent: false,
    itemLabel: 'FAQ 条目',
    hint: '标题 = 问题，描述 = 答案。',
  },
};

const DEFAULT_FIELDS = {
  showIcon: true,
  showImage: true,
  showLink: true,
  showDescription: true,
  showContent: true,
  itemLabel: '子项',
  hint: '管理此区块的子项内容。',
};

/* ---- ImagePicker 组件 ---- */
function ImagePicker({
  label,
  currentUrl,
  mediaItems,
  onSelect,
  onClear,
}: {
  label: string;
  currentUrl: string | null;
  mediaItems: MediaItem[];
  onSelect: (id: string, url: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const images = mediaItems.filter((m) => m.mimeType.startsWith('image/'));

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3">
        {currentUrl ? (
          <div className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
            <img
              src={currentUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={onClear}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5"
            >
              <X className="h-3 w-3 text-white" />
            </button>
          </div>
        ) : (
          <div
            className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border-2 border-dashed transition-colors hover:bg-accent/50"
            onClick={() => setOpen(true)}
          >
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
        >
          {currentUrl ? '更换' : '选择图片'}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[70vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>选择{label}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                className="aspect-square overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary"
                onClick={() => {
                  onSelect(img.id, img.url);
                  setOpen(false);
                }}
              >
                <img
                  src={img.url}
                  alt={img.originalName}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            {images.length === 0 && (
              <p className="col-span-4 py-8 text-center text-muted-foreground">
                媒体库中没有图片，请先在「媒体管理」中上传
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ==================================================================
 * 主组件
 * ================================================================*/

export function SectionItemsManagement({
  sectionId,
  sectionType,
  initialItems,
  locales,
  mediaItems,
}: SectionItemsManagementProps) {
  const router = useRouter();
  const [items, setItems] = useState<SectionItemForUI[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SectionItemForUI | null>(null);

  // Form state
  const [iconName, setIconName] = useState('');
  const [imageId, setImageId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [translations, setTranslations] = useState<TranslationForm[]>(() =>
    buildTranslationForm(locales),
  );

  const fields = FIELDS_BY_TYPE[sectionType] ?? DEFAULT_FIELDS;

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );

  function openCreateDialog() {
    setEditing(null);
    setIconName('');
    setImageId(null);
    setImageUrl(null);
    setLinkUrl('');
    setTranslations(buildTranslationForm(locales));
    setDialogOpen(true);
  }

  function openEditDialog(item: SectionItemForUI) {
    setEditing(item);
    setIconName(item.iconName ?? '');
    setImageId(item.imageId);
    setImageUrl(item.imageUrl);
    setLinkUrl(item.linkUrl ?? '');
    setTranslations(
      locales.map((locale) => {
        const matched = item.translations.find(
          (tr) => tr.locale === locale.code,
        );
        return {
          locale: locale.code,
          title: matched?.title ?? '',
          description: matched?.description ?? '',
          content: matched?.content ?? '',
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
      prev.map((item) =>
        item.locale === locale ? { ...item, [key]: value } : item,
      ),
    );
  }

  async function saveItem() {
    const payload = {
      sectionId,
      iconName: iconName || null,
      imageId: imageId || null,
      linkUrl: linkUrl || null,
      translations: translations.map((item) => ({
        locale: item.locale,
        title: item.title || undefined,
        description: item.description || undefined,
        content: item.content || undefined,
      })),
    };

    setIsSubmitting(true);
    try {
      const result = editing
        ? await updateSectionItemAction(editing.id, payload)
        : await createSectionItemAction(payload);

      if (!result.success) {
        toast.error(
          typeof result.error === 'string' ? result.error : '保存失败',
        );
        return;
      }

      toast.success(editing ? '子项已更新' : '子项已创建');
      setDialogOpen(false);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: SectionItemForUI) {
    const confirmed = window.confirm(
      `确认删除子项"${item.displayTitle}"吗？`,
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      const result = await deleteSectionItemAction(item.id);
      if (!result.success) {
        toast.error(
          typeof result.error === 'string' ? result.error : '删除失败',
        );
        return;
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast.success('子项已删除');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function moveItem(id: string, direction: 'up' | 'down') {
    const current = [...sortedItems];
    const idx = current.findIndex((item) => item.id === id);
    if (idx === -1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= current.length) return;

    [current[idx], current[swapIdx]] = [current[swapIdx], current[idx]];
    const orderedIds = current.map((item) => item.id);

    setItems(
      current.map((item, i) => ({ ...item, sortOrder: i })),
    );

    const result = await reorderSectionItemsAction({
      sectionId,
      orderedItemIds: orderedIds,
    });

    if (!result.success) {
      toast.error('排序失败');
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Hint */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">{fields.hint}</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          新增{fields.itemLabel}
        </Button>
      </div>

      {sortedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          暂无{fields.itemLabel}，点击上方按钮添加
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">排序</TableHead>
              {fields.showImage && (
                <TableHead className="w-[80px]">图片</TableHead>
              )}
              <TableHead>名称</TableHead>
              {fields.showIcon && (
                <TableHead className="w-[100px]">图标</TableHead>
              )}
              {fields.showLink && (
                <TableHead className="w-[150px]">链接</TableHead>
              )}
              <TableHead className="w-[120px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map((item, idx) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={idx === 0 || isSubmitting}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={
                          idx === sortedItems.length - 1 || isSubmitting
                        }
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </TableCell>
                {fields.showImage && (
                  <TableCell>
                    {item.imageUrl ? (
                      <div className="h-12 w-12 overflow-hidden rounded-md border bg-muted">
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted/30">
                        <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <span className="font-medium">{item.displayTitle}</span>
                </TableCell>
                {fields.showIcon && (
                  <TableCell>
                    {item.iconName ? (
                      <Badge variant="outline">{item.iconName}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                )}
                {fields.showLink && (
                  <TableCell>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.linkUrl || '-'}
                    </span>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                      disabled={isSubmitting}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* ─── 创建/编辑 Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? '编辑' : '新增'}
              {fields.itemLabel}
            </DialogTitle>
            <DialogDescription>{fields.hint}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Image picker */}
            {fields.showImage && (
              <ImagePicker
                label="图片"
                currentUrl={imageUrl}
                mediaItems={mediaItems}
                onSelect={(id, url) => {
                  setImageId(id);
                  setImageUrl(url);
                }}
                onClear={() => {
                  setImageId(null);
                  setImageUrl(null);
                }}
              />
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Icon name */}
              {fields.showIcon && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    图标名称（Lucide）
                  </label>
                  <Input
                    placeholder="例如 Shield, Zap, Globe, Award"
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    使用{' '}
                    <a
                      href="https://lucide.dev/icons"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      Lucide 图标
                    </a>{' '}
                    名称，首字母大写
                  </p>
                </div>
              )}

              {/* Link URL */}
              {fields.showLink && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">链接 URL（可选）</label>
                  <Input
                    placeholder="例如 /products 或 https://example.com"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            {/* Translations */}
            <div className="space-y-3">
              <label className="text-sm font-medium">多语言内容</label>
              {translations.map((item) => (
                <div
                  key={item.locale}
                  className="rounded-md border border-border/50 p-3"
                >
                  <p className="mb-2 text-sm font-semibold">{item.locale}</p>
                  <div className="grid gap-3">
                    <Input
                      placeholder="标题"
                      value={item.title}
                      onChange={(e) =>
                        updateTranslation(item.locale, 'title', e.target.value)
                      }
                      disabled={isSubmitting}
                    />
                    {fields.showDescription && (
                      <textarea
                        rows={3}
                        className="min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="描述"
                        value={item.description}
                        onChange={(e) =>
                          updateTranslation(
                            item.locale,
                            'description',
                            e.target.value,
                          )
                        }
                        disabled={isSubmitting}
                      />
                    )}
                    {fields.showContent && (
                      <textarea
                        rows={4}
                        className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="富文本内容（可选，支持 HTML）"
                        value={item.content}
                        onChange={(e) =>
                          updateTranslation(
                            item.locale,
                            'content',
                            e.target.value,
                          )
                        }
                        disabled={isSubmitting}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button onClick={saveItem} disabled={isSubmitting}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
