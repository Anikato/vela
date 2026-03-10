'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Check,
  FileText,
  Loader2,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import type { Media } from '@/types/admin';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type MediaWithUrl = Media & { url: string };

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaItems: MediaWithUrl[];
  onMediaUploaded: (items: MediaWithUrl[]) => void;
  onConfirm: (selectedIds: string[]) => void;
  multiple?: boolean;
  accept?: 'image' | 'document' | 'all';
  initialSelectedIds?: string[];
  title?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  mediaItems,
  onMediaUploaded,
  onConfirm,
  multiple = false,
  accept = 'all',
  initialSelectedIds = [],
  title = '选择媒体',
}: MediaPickerDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelectedIds),
  );
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredMedia = mediaItems.filter((item) => {
    if (accept === 'image' && !item.mimeType.startsWith('image/')) return false;
    if (accept === 'document' && item.mimeType.startsWith('image/')) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.originalName.toLowerCase().includes(q) ||
        (item.alt?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  }

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setIsUploading(true);
    const uploaded: MediaWithUrl[] = [];
    let failedCount = 0;

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = (await response.json()) as
          | { success: true; data: MediaWithUrl }
          | { success: false; error: string };

        if (!response.ok || !result.success) {
          failedCount++;
          continue;
        }
        uploaded.push(result.data);
      }

      if (uploaded.length > 0) {
        onMediaUploaded(uploaded);
        const newSelected = new Set(selected);
        for (const item of uploaded) {
          if (multiple) {
            newSelected.add(item.id);
          } else if (uploaded.length === 1) {
            newSelected.clear();
            newSelected.add(item.id);
          }
        }
        setSelected(newSelected);
      }

      if (failedCount > 0 && uploaded.length > 0) {
        toast.warning(`成功 ${uploaded.length} 个，失败 ${failedCount} 个`);
      } else if (failedCount > 0) {
        toast.error('上传失败');
      } else {
        toast.success(`已上传 ${uploaded.length} 个文件`);
      }
    } catch {
      toast.error('上传失败');
    } finally {
      setIsUploading(false);
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        void uploadFiles(e.dataTransfer.files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [multiple, selected],
  );

  const fileAccept =
    accept === 'image'
      ? 'image/*'
      : accept === 'document'
        ? '.pdf,.doc,.docx,.xls,.xlsx,.txt'
        : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* 上传区域 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-border'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={fileAccept}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {isUploading
              ? '上传中…'
              : '拖拽文件到此处，或'}
          </span>
          {!isUploading && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件
            </Button>
          )}
        </div>

        {/* 搜索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索文件名或 ALT 文本…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 网格 */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredMedia.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {search ? '没有匹配的文件' : '暂无可用文件'}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {filteredMedia.map((item) => {
                const isSelected = selected.has(item.id);
                const isImage = item.mimeType.startsWith('image/');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <div className="relative aspect-square bg-muted/30">
                      {isImage ? (
                        <Image
                          src={item.url}
                          alt={item.alt ?? item.originalName}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-1.5 py-1">
                      <p className="truncate text-[10px] leading-tight text-muted-foreground">
                        {item.originalName}
                      </p>
                      <p className="text-[9px] text-muted-foreground/60">
                        {formatBytes(item.size)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            已选 {selected.size} 项
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelected(new Set());
                onOpenChange(false);
              }}
            >
              取消
            </Button>
            {selected.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                <X className="mr-1 h-3 w-3" />
                清除
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                onConfirm(Array.from(selected));
                onOpenChange(false);
              }}
            >
              确认选择
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
