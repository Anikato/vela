'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { FileText, GripVertical, Trash2, ZoomIn } from 'lucide-react';

import type { Media } from '@/types/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

type MediaWithUrl = Media & { url: string };

interface SortableImageGridProps {
  items: MediaWithUrl[];
  onRemove: (id: string) => void;
  onReorder: (ids: string[]) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function SortableImageGrid({
  items,
  onRemove,
  onReorder,
}: SortableImageGridProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaWithUrl | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        setOverIndex(null);
        return;
      }
      const newIds = items.map((item) => item.id);
      const [moved] = newIds.splice(dragIndex, 1);
      newIds.splice(dropIndex, 0, moved);
      onReorder(newIds);
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, items, onReorder],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground">
        暂无内容
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {items.map((item, index) => {
          const isImage = item.mimeType.startsWith('image/');
          const isDragging = dragIndex === index;
          const isOver = overIndex === index && dragIndex !== index;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                isDragging
                  ? 'scale-95 opacity-50'
                  : isOver
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border/50'
              }`}
            >
              <div className="relative aspect-square bg-muted/30">
                {isImage ? (
                  <Image
                    src={item.url}
                    alt={item.alt ?? item.originalName}
                    fill
                    sizes="160px"
                    className="object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <span className="truncate text-[10px] text-muted-foreground">
                      {item.originalName}
                    </span>
                  </div>
                )}

                {/* 悬浮操作 */}
                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7"
                    title="拖拽排序"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </Button>
                  {isImage && (
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPreviewItem(item)}
                      title="预览"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRemove(item.id)}
                    title="移除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* 信息栏 */}
              <div className="flex items-center justify-between border-t border-border/30 bg-card px-2 py-1">
                <span className="max-w-[80%] truncate text-[10px] text-muted-foreground">
                  {item.originalName}
                </span>
                <span className="text-[9px] text-muted-foreground/60">
                  {formatBytes(item.size)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 大图预览 */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl items-center justify-center p-2">
          {previewItem && (
            <div className="relative h-full w-full">
              <Image
                src={previewItem.url}
                alt={previewItem.alt ?? previewItem.originalName}
                width={previewItem.width ?? 800}
                height={previewItem.height ?? 600}
                className="mx-auto max-h-[80vh] w-auto rounded object-contain"
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {previewItem.originalName}
                {previewItem.width && previewItem.height
                  ? ` — ${previewItem.width} × ${previewItem.height}`
                  : ''}{' '}
                — {formatBytes(previewItem.size)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
