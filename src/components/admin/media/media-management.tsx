'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Copy, FileText, ImageIcon, Loader2, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { deleteMediaAction, updateMediaAltAction } from '@/server/actions/media.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
  url: string;
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MediaManagementProps {
  initialItems: MediaItem[];
  initialTotal: number;
  initialPage: number;
  initialTotalPages: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function MediaManagement({ initialItems, initialTotal, initialPage, initialTotalPages }: MediaManagementProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [altText, setAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'document'>('all');
  const [editAltTarget, setEditAltTarget] = useState<MediaItem | null>(null);
  const [editAltValue, setEditAltValue] = useState('');
  const [isSavingAlt, setIsSavingAlt] = useState(false);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) {
      toast.error('请先选择要上传的文件');
      return;
    }

    setIsUploading(true);
    const uploaded: MediaItem[] = [];
    let failedCount = 0;
    let lastError = '';

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (altText.trim()) {
          formData.append('alt', altText.trim());
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = (await response.json()) as {
          success: boolean;
          error?: string;
          data?: MediaItem;
        };

        if (!result.success || !result.data) {
          failedCount += 1;
          console.error(`Upload failed for "${file.name}":`, result.error ?? `HTTP ${response.status}`);
          lastError = result.error ?? `HTTP ${response.status}`;
          continue;
        }

        uploaded.push({
          ...result.data,
          createdAt: new Date(result.data.createdAt).toISOString(),
        });
      }

      if (uploaded.length > 0) {
        setItems((prev) => [...uploaded, ...prev]);
      }

      if (failedCount === 0) {
        toast.success(`上传成功，共 ${uploaded.length} 个文件`);
      } else if (uploaded.length > 0) {
        toast.warning(`成功 ${uploaded.length} 个，失败 ${failedCount} 个`);
      } else {
        toast.error(lastError ? `上传失败：${lastError}` : '上传失败，请检查文件格式和大小');
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setAltText('');
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传失败，请稍后重试');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteMediaAction(deleteTarget.id);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '删除失败');
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      toast.success('媒体文件已删除');
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
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

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        uploadFiles(droppedFiles);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [altText],
  );

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('链接已复制');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('复制失败，请手动复制');
    }
  }

  async function handleSaveAlt() {
    if (!editAltTarget) return;
    setIsSavingAlt(true);
    try {
      const result = await updateMediaAltAction(editAltTarget.id, editAltValue);
      if (!result.success) {
        toast.error(typeof result.error === 'string' ? result.error : '保存失败');
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === editAltTarget.id ? { ...item, alt: editAltValue.trim() || null } : item,
        ),
      );
      toast.success('ALT 文本已更新');
      setEditAltTarget(null);
    } finally {
      setIsSavingAlt(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ─── 拖拽上传区域 ─── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-lg border-2 border-dashed bg-card p-6 transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border/50 hover:border-border'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
          multiple
          disabled={isUploading}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) uploadFiles(e.target.files);
          }}
        />

        <div className="flex flex-col items-center gap-3 text-center">
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          ) : (
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">
              {isUploading ? '上传中…' : isDragging ? '松开即可上传' : '拖拽文件到此处，或'}
            </p>
            {!isUploading && !isDragging && (
              <Button
                variant="link"
                size="sm"
                className="mt-0.5 h-auto p-0 text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                点击选择文件
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            支持 jpg / png / webp / gif / svg / pdf / doc / xls / txt，单文件最大 10MB
          </p>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Input
            placeholder="统一 ALT 文本（可选）"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            disabled={isUploading}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* ─── 搜索和筛选 ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索文件名 / ALT 文本…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const params = new URLSearchParams();
                  if (searchQuery.trim()) params.set('search', searchQuery.trim());
                  if (typeFilter !== 'all') params.set('type', typeFilter);
                  const qs = params.toString();
                  router.push(`/admin/media${qs ? `?${qs}` : ''}`);
                }
              }}
              className="pl-9"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as 'all' | 'image' | 'document');
              const params = new URLSearchParams();
              if (searchQuery.trim()) params.set('search', searchQuery.trim());
              if (v !== 'all') params.set('type', v);
              const qs = params.toString();
              router.push(`/admin/media${qs ? `?${qs}` : ''}`);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="image">图片</SelectItem>
              <SelectItem value="document">文档</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">共 {total} 个文件</p>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-24">预览</TableHead>
              <TableHead>文件名</TableHead>
              <TableHead>MIME</TableHead>
              <TableHead>尺寸</TableHead>
              <TableHead>大小</TableHead>
              <TableHead>上传时间</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  暂无媒体文件，请先上传。
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell>
                    <div className="relative h-14 w-14 overflow-hidden rounded-md border border-border/60 bg-muted/20">
                      {item.mimeType.startsWith('image/') ? (
                        <Image
                          src={item.url}
                          alt={item.alt || item.originalName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate" title={item.originalName}>
                    {item.originalName}
                  </TableCell>
                  <TableCell>{item.mimeType}</TableCell>
                  <TableCell>
                    {item.width && item.height ? `${item.width} × ${item.height}` : '-'}
                  </TableCell>
                  <TableCell>{formatBytes(item.size)}</TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditAltTarget(item);
                          setEditAltValue(item.alt ?? '');
                        }}
                        aria-label="编辑 ALT"
                        title="编辑 ALT"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(item.url)}
                        aria-label="复制链接"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                        aria-label="删除媒体"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── 分页 ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            第 {currentPage} / {totalPages} 页
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('page', String(currentPage - 1));
                if (searchQuery.trim()) params.set('search', searchQuery.trim());
                if (typeFilter !== 'all') params.set('type', typeFilter);
                router.push(`/admin/media?${params.toString()}`);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => {
                const params = new URLSearchParams();
                params.set('page', String(currentPage + 1));
                if (searchQuery.trim()) params.set('search', searchQuery.trim());
                if (typeFilter !== 'all') params.set('type', typeFilter);
                router.push(`/admin/media?${params.toString()}`);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── ALT 编辑对话框 ─── */}
      <Dialog open={!!editAltTarget} onOpenChange={(open) => !open && setEditAltTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑 ALT 文本</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{editAltTarget?.originalName}</p>
            <Input
              placeholder="输入 ALT 文本（描述图片内容，用于 SEO 和无障碍访问）"
              value={editAltValue}
              onChange={(e) => setEditAltValue(e.target.value)}
              disabled={isSavingAlt}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAltTarget(null)} disabled={isSavingAlt}>
              取消
            </Button>
            <Button onClick={handleSaveAlt} disabled={isSavingAlt}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除媒体文件</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除 <strong>{deleteTarget?.originalName}</strong> 吗？删除后将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
