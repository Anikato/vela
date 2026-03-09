'use client';

import { useCallback, useState, useTransition } from 'react';
import {
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Inbox,
  Mail,
  Reply,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  batchUpdateInquiryStatusAction,
  getInquiryDetailAction,
  getInquiryListAction,
  updateInquiryNotesAction,
  updateInquiryStatusAction,
} from '@/server/actions/inquiry.actions';
import type { InquiryDetail, InquiryListItem, InquiryStatus } from '@/types/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface InquiryManagementProps {
  initialData: {
    items: InquiryListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  initialStats: {
    total: number;
    new: number;
    read: number;
    replied: number;
    closed: number;
    spam: number;
  };
}

const STATUS_CONFIG: Record<
  InquiryStatus,
  { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }
> = {
  new: { label: '新询盘', variant: 'default' },
  read: { label: '已读', variant: 'secondary' },
  replied: { label: '已回复', variant: 'secondary' },
  closed: { label: '已关闭', variant: 'outline' },
  spam: { label: '垃圾', variant: 'destructive' },
};

export function InquiryManagement({ initialData, initialStats }: InquiryManagementProps) {
  const [data, setData] = useState(initialData);
  const [stats, setStats] = useState(initialStats);
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);
  const [isPending, startTransition] = useTransition();

  const refresh = useCallback(
    (page = 1, status?: InquiryStatus | '', searchTerm?: string) => {
      const s = status ?? statusFilter;
      const q = searchTerm ?? search;
      startTransition(async () => {
        const result = await getInquiryListAction({
          page,
          pageSize: 20,
          status: s || undefined,
          search: q || undefined,
        });
        if (result.success) {
          setData(result.data);
          setSelectedIds(new Set());
        }
      });
    },
    [statusFilter, search],
  );

  const handleStatusFilter = useCallback(
    (status: InquiryStatus | '') => {
      setStatusFilter(status);
      refresh(1, status);
    },
    [refresh],
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      refresh(1, undefined, search);
    },
    [refresh, search],
  );

  const handleViewDetail = useCallback(
    (id: string) => {
      startTransition(async () => {
        const result = await getInquiryDetailAction(id);
        if (result.success) {
          setDetail(result.data);
          setDetailOpen(true);
        } else {
          toast.error(result.error as string);
        }
      });
    },
    [],
  );

  const handleStatusChange = useCallback(
    (id: string, status: InquiryStatus) => {
      startTransition(async () => {
        const result = await updateInquiryStatusAction(id, status);
        if (result.success) {
          toast.success('状态已更新');
          refresh(data.page);
          if (detail?.id === id) {
            setDetail((prev) => (prev ? { ...prev, status } : null));
          }
        } else {
          toast.error(result.error as string);
        }
      });
    },
    [refresh, data.page, detail],
  );

  const handleBatchStatus = useCallback(
    (status: InquiryStatus) => {
      if (selectedIds.size === 0) return;
      startTransition(async () => {
        const result = await batchUpdateInquiryStatusAction([...selectedIds], status);
        if (result.success) {
          toast.success(`已更新 ${result.data.count} 条询盘`);
          refresh(data.page);
        } else {
          toast.error(result.error as string);
        }
      });
    },
    [selectedIds, refresh, data.page],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === data.items.length ? new Set() : new Set(data.items.map((i) => i.id)),
    );
  }, [data.items]);

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="全部" count={stats.total} onClick={() => handleStatusFilter('')} active={statusFilter === ''} icon={<Mail className="h-4 w-4" />} />
        <StatCard label="新询盘" count={stats.new} onClick={() => handleStatusFilter('new')} active={statusFilter === 'new'} icon={<Inbox className="h-4 w-4" />} />
        <StatCard label="已读" count={stats.read} onClick={() => handleStatusFilter('read')} active={statusFilter === 'read'} icon={<Eye className="h-4 w-4" />} />
        <StatCard label="已回复" count={stats.replied} onClick={() => handleStatusFilter('replied')} active={statusFilter === 'replied'} icon={<Reply className="h-4 w-4" />} />
        <StatCard label="已关闭" count={stats.closed} onClick={() => handleStatusFilter('closed')} active={statusFilter === 'closed'} icon={<Archive className="h-4 w-4" />} />
        <StatCard label="垃圾" count={stats.spam} onClick={() => handleStatusFilter('spam')} active={statusFilter === 'spam'} icon={<ShieldAlert className="h-4 w-4" />} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索名称、邮箱、公司…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            搜索
          </Button>
        </form>

        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">已选 {selectedIds.size} 条</span>
            <Button size="sm" variant="secondary" onClick={() => handleBatchStatus('read')}>
              标记已读
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBatchStatus('replied')}>
              标记已回复
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleBatchStatus('closed')}>
              关闭
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBatchStatus('spam')}>
              标记垃圾
            </Button>
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={data.items.length > 0 && selectedIds.size === data.items.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>编号</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>公司</TableHead>
              <TableHead>产品数</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  暂无询盘
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((item) => (
                <TableRow key={item.id} className={item.status === 'new' ? 'bg-primary/5' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.inquiryNumber}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-sm">{item.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.company ?? '—'}</TableCell>
                  <TableCell>{item.productCount}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[item.status as InquiryStatus]?.variant ?? 'outline'}>
                      {STATUS_CONFIG[item.status as InquiryStatus]?.label ?? item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(item.id)}
                    >
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            共 {data.total} 条，第 {data.page}/{data.totalPages} 页
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || isPending}
              onClick={() => refresh(data.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages || isPending}
              onClick={() => refresh(data.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Detail dialog */}
      <InquiryDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        detail={detail}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}

// ─── Sub-components ───

function StatCard({
  label,
  count,
  active,
  icon,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
        active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'
      }`}
    >
      <div className={`${active ? 'text-primary' : 'text-muted-foreground'}`}>{icon}</div>
      <div>
        <p className="text-lg font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

function InquiryDetailDialog({
  open,
  onClose,
  detail,
  onStatusChange,
}: {
  open: boolean;
  onClose: () => void;
  detail: InquiryDetail | null;
  onStatusChange: (id: string, status: InquiryStatus) => void;
}) {
  const [notes, setNotes] = useState('');
  const [notesEditing, setNotesEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const saveNotes = useCallback(() => {
    if (!detail) return;
    startTransition(async () => {
      const result = await updateInquiryNotesAction(detail.id, notes);
      if (result.success) {
        toast.success('备注已保存');
        setNotesEditing(false);
      } else {
        toast.error(result.error as string);
      }
    });
  }, [detail, notes]);

  if (!detail) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            询盘详情
            <Badge variant={STATUS_CONFIG[detail.status as InquiryStatus]?.variant ?? 'outline'}>
              {STATUS_CONFIG[detail.status as InquiryStatus]?.label ?? detail.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            #{detail.inquiryNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoField label="姓名" value={detail.name} />
            <InfoField label="邮箱" value={detail.email} />
            <InfoField label="电话" value={detail.phone ?? '—'} />
            <InfoField label="公司" value={detail.company ?? '—'} />
            <InfoField label="国家" value={detail.country ?? '—'} />
            <InfoField label="来源页" value={detail.sourceUrl ?? '—'} />
            <InfoField label="设备" value={detail.deviceType ?? '—'} />
            <InfoField
              label="时间"
              value={new Date(detail.createdAt).toLocaleString('zh-CN')}
            />
          </div>

          {/* Message */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">留言内容</p>
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm">
              {detail.message}
            </div>
          </div>

          {/* Products */}
          {detail.products.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">询盘产品</p>
              <div className="space-y-2">
                {detail.products.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-2">
                    {p.snapshot.imageUrl ? (
                      <img
                        src={p.snapshot.imageUrl}
                        alt={p.snapshot.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">—</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{p.snapshot.name}</p>
                      <p className="text-xs text-muted-foreground">{p.snapshot.sku}</p>
                    </div>
                    <span className="shrink-0 text-sm text-muted-foreground">x{p.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Internal notes */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">内部备注</p>
              {!notesEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setNotes(detail.internalNotes ?? '');
                    setNotesEditing(true);
                  }}
                >
                  编辑
                </Button>
              ) : null}
            </div>
            {notesEditing ? (
              <div className="space-y-2">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveNotes} disabled={isPending}>
                    保存
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setNotesEditing(false)}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                {detail.internalNotes || <span className="text-muted-foreground">暂无备注</span>}
              </div>
            )}
          </div>

          {/* Status actions */}
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">变更状态：</span>
            {(['new', 'read', 'replied', 'closed', 'spam'] as InquiryStatus[]).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={detail.status === s ? 'default' : 'outline'}
                disabled={detail.status === s}
                onClick={() => onStatusChange(detail.id, s)}
              >
                {STATUS_CONFIG[s].label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-all">{value}</p>
    </div>
  );
}
