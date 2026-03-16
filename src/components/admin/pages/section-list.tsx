'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  cloneSectionAction,
  deleteSectionAction,
  reorderCategorySectionsAction,
  reorderPageSectionsAction,
} from '@/server/actions/section.actions';
import type { SectionListItem } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/admin/common/confirm-delete-dialog';

interface SectionListProps {
  pageId?: string;
  categoryId?: string;
  sections: SectionListItem[];
  editBasePath: string;
  previewUrl?: string;
}

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
};

const TYPE_ICONS: Record<string, string> = {
  hero: '🖼️',
  two_column: '◫',
  carousel_banner: '🎠',
  rich_text: '📝',
  feature_grid: '⊞',
  stats: '📊',
  faq: '❓',
  testimonials: '💬',
  timeline: '📅',
  team: '👥',
  partner_logos: '🤝',
  image_gallery: '🖼',
  video_embed: '🎬',
  product_showcase: '🛍️',
  category_nav: '📂',
  news_showcase: '📰',
  cta: '🎯',
  contact_form: '✉️',
  custom_html: '⟨/⟩',
};

export function SectionList({
  pageId,
  categoryId,
  sections: initialSections,
  editBasePath,
  previewUrl,
}: SectionListProps) {
  const router = useRouter();
  const [sections, setSections] = useState(initialSections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SectionListItem | null>(null);

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.sortOrder - b.sortOrder),
    [sections],
  );

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
      const result = categoryId
        ? await reorderCategorySectionsAction({
            categoryId,
            orderedSectionIds: next.map((item) => item.id),
          })
        : await reorderPageSectionsAction({
            pageId: pageId!,
            orderedSectionIds: next.map((item) => item.id),
          });
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '排序失败');
        return;
      }
      setSections(next.map((item, idx) => ({ ...item, sortOrder: idx })));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleClone(id: string) {
    setIsSubmitting(true);
    try {
      const result = await cloneSectionAction(id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '克隆失败');
        return;
      }
      toast.success('区块已克隆（默认停用状态）');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      const result = await deleteSectionAction(deleteTarget.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }
      setSections((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      toast.success('区块已删除');
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {previewUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-1.5 h-4 w-4" />
                预览页面
              </a>
            </Button>
          )}
        </div>
        <Button asChild>
          <Link href={`${editBasePath}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            新增区块
          </Link>
        </Button>
      </div>

      {sortedSections.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-lg font-medium text-muted-foreground">暂无区块</p>
          <p className="mt-1 text-sm text-muted-foreground">
            点击「新增区块」开始搭建页面
          </p>
          <Button asChild className="mt-4">
            <Link href={`${editBasePath}/new`}>
              <Plus className="mr-2 h-4 w-4" />
              新增区块
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSections.map((item, index) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:border-border"
            >
              {/* Sort controls */}
              <div className="flex flex-col items-center gap-0.5">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => moveItem(item.id, 'up')}
                  disabled={isSubmitting || index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveItem(item.id, 'down')}
                  disabled={isSubmitting || index === sortedSections.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Type icon preview */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-xl">
                {TYPE_ICONS[item.type] ?? '📦'}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">
                    {item.displayTitle}
                  </p>
                  {!item.isActive && (
                    <Badge variant="secondary" className="text-xs">停用</Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {SECTION_TYPE_LABELS[item.type] ?? item.type}
                  </Badge>
                  {item.anchorId && (
                    <span className="text-xs text-muted-foreground">#{item.anchorId}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8"
                >
                  <Link href={`${editBasePath}/${item.id}/edit`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    编辑
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  disabled={isSubmitting}
                  onClick={() => handleClone(item.id)}
                  title="克隆此区块"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-destructive hover:text-destructive"
                  disabled={isSubmitting}
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        description={
          <>确定删除区块 <strong>{deleteTarget?.displayTitle}</strong> 吗？所有子项和翻译将一并删除，此操作不可撤销。</>
        }
        onConfirm={handleDelete}
        loading={isSubmitting}
      />
    </div>
  );
}
