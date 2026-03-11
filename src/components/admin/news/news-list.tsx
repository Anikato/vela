'use client';

import Image from 'next/image';
import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  cloneNewsAction,
  deleteNewsAction,
  getNewsListAction,
} from '@/server/actions/news.actions';
import type { AdminNewsListResult, NewsListItem } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

interface NewsListProps {
  initialData: AdminNewsListResult;
  locale: string;
  defaultLocale: string;
}

function statusText(status: string): string {
  return status === 'published' ? '已发布' : '草稿';
}

function statusVariant(status: string): 'default' | 'secondary' {
  return status === 'published' ? 'default' : 'secondary';
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

export function NewsList({ initialData, locale, defaultLocale }: NewsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(initialData.page);

  const [deleteTarget, setDeleteTarget] = useState<NewsListItem | null>(null);
  const [cloneTarget, setCloneTarget] = useState<NewsListItem | null>(null);
  const [cloneSlug, setCloneSlug] = useState('');

  const fetchList = useCallback(
    (params: { page?: number; search?: string; status?: string }) => {
      const p = params.page ?? currentPage;
      const s = params.search ?? search;
      const st = params.status ?? statusFilter;

      startTransition(async () => {
        const result = await getNewsListAction({
          locale,
          defaultLocale,
          page: p,
          pageSize: 20,
          search: s || undefined,
          status: st === 'all' ? 'all' : (st as 'draft' | 'published'),
        });
        if (result.success) {
          setData(result.data);
          setCurrentPage(result.data.page);
        } else {
          toast.error(typeof result.error === 'string' ? result.error : '加载失败');
        }
      });
    },
    [locale, defaultLocale, currentPage, search, statusFilter],
  );

  function handleSearch() {
    fetchList({ page: 1, search });
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val);
    fetchList({ page: 1, status: val });
  }

  function handlePageChange(page: number) {
    fetchList({ page });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await deleteNewsAction(deleteTarget.id);
    if (result.success) {
      toast.success(`已删除「${deleteTarget.title}」`);
      setDeleteTarget(null);
      fetchList({ page: currentPage });
    } else {
      toast.error(typeof result.error === 'string' ? result.error : '删除失败');
    }
  }

  async function handleClone() {
    if (!cloneTarget || !cloneSlug.trim()) return;
    const result = await cloneNewsAction(cloneTarget.id, cloneSlug.trim());
    if (result.success) {
      toast.success('克隆成功');
      setCloneTarget(null);
      setCloneSlug('');
      router.push(`/admin/news/${result.data.id}/edit`);
    } else {
      toast.error(typeof result.error === 'string' ? result.error : '克隆失败');
    }
  }

  const { items, total, totalPages } = data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索标题、Slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="published">已发布</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => router.push('/admin/news/new')}>
          <Plus className="mr-1 h-4 w-4" />
          新建新闻
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">封面</TableHead>
              <TableHead>标题</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[160px]">发布时间</TableHead>
              <TableHead className="w-[160px]">创建时间</TableHead>
              <TableHead className="w-[140px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {search || statusFilter !== 'all'
                    ? '没有匹配的新闻，试试调整筛选条件'
                    : '还没有新闻，点击「新建新闻」开始创作'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id} className={isPending ? 'opacity-50' : ''}>
                  <TableCell>
                    {item.coverImage ? (
                      <Image
                        src={item.coverImage.url}
                        alt={item.coverImage.alt ?? item.title}
                        width={60}
                        height={40}
                        className="rounded object-cover"
                        style={{ width: 60, height: 40 }}
                      />
                    ) : (
                      <div className="flex h-[40px] w-[60px] items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        无图
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <div className="truncate font-medium">{item.title}</div>
                      <div className="truncate text-xs text-muted-foreground">/{item.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(item.status)}>{statusText(item.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.publishedAt ? formatDate(item.publishedAt) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="编辑"
                        onClick={() => router.push(`/admin/news/${item.id}/edit`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="克隆"
                        onClick={() => {
                          setCloneTarget(item);
                          setCloneSlug(`${item.slug}-copy`);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="前台预览"
                        onClick={() => window.open(`/news/${item.slug}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="删除"
                        onClick={() => setDeleteTarget(item)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">
            共 {total} 条，第 {currentPage}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((p, idx, arr) => {
                const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                return (
                  <span key={p} className="flex items-center">
                    {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
                    <Button
                      variant={p === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-[32px]"
                      disabled={isPending}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  </span>
                );
              })}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || isPending}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除新闻「{deleteTarget?.title}」吗？此操作将同时删除所有翻译内容，且不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clone Dialog */}
      <Dialog open={!!cloneTarget} onOpenChange={() => setCloneTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>克隆新闻</DialogTitle>
            <DialogDescription>
              将「{cloneTarget?.title}」的内容复制到一篇新文章，请设置新的 Slug。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="新文章的 Slug"
              value={cloneSlug}
              onChange={(e) => setCloneSlug(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleClone()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneTarget(null)}>
              取消
            </Button>
            <Button onClick={handleClone} disabled={!cloneSlug.trim()}>
              克隆
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
