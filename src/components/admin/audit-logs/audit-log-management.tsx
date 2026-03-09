'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import type { AuditLogListItem } from '@/server/services/audit-log.service';

const ACTION_LABELS: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  clone: '克隆',
  batch_update: '批量更新',
  batch_delete: '批量删除',
  login: '登录',
  export: '导出',
  import: '导入',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-500/20 text-green-400',
  update: 'bg-blue-500/20 text-blue-400',
  delete: 'bg-red-500/20 text-red-400',
  clone: 'bg-purple-500/20 text-purple-400',
  batch_update: 'bg-blue-500/20 text-blue-400',
  batch_delete: 'bg-red-500/20 text-red-400',
  login: 'bg-yellow-500/20 text-yellow-400',
  export: 'bg-cyan-500/20 text-cyan-400',
  import: 'bg-cyan-500/20 text-cyan-400',
};

const ENTITY_LABELS: Record<string, string> = {
  product: '产品',
  news: '新闻',
  category: '分类',
  page: '页面',
  inquiry: '询盘',
  media: '媒体',
  user: '用户',
  settings: '设置',
  navigation: '导航',
  theme: '主题',
  redirect: '重定向',
};

interface Props {
  initialData: {
    items: AuditLogListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentEntityType: string;
  currentSearch: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(date));
}

export function AuditLogManagement({ initialData, currentEntityType, currentSearch }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);

  function navigate(overrides: { page?: number; entityType?: string; search?: string }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? initialData.page;
    if (p > 1) params.set('page', String(p));
    const et = overrides.entityType ?? currentEntityType;
    if (et) params.set('entityType', et);
    const s = overrides.search ?? search;
    if (s.trim()) params.set('search', s.trim());
    const qs = params.toString();
    router.push(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">操作日志</h1>
        <p className="mt-1 text-sm text-muted-foreground">记录后台所有管理操作，便于追溯审计</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索操作人 / 内容…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && navigate({ page: 1, search: search })}
            className="pl-9"
          />
        </div>
        <Select
          value={currentEntityType || '__all__'}
          onValueChange={(v) => navigate({ page: 1, entityType: v === '__all__' ? '' : v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="全部类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部类型</SelectItem>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">共 {initialData.total} 条记录</p>
      </div>

      <div className="rounded-lg border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>时间</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>操作</TableHead>
              <TableHead>对象类型</TableHead>
              <TableHead>对象</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  暂无操作日志
                </TableCell>
              </TableRow>
            ) : (
              initialData.items.map((item) => (
                <TableRow key={item.id} className="border-border/50">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">{item.userName ?? '系统'}</TableCell>
                  <TableCell>
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${ACTION_COLORS[item.action] ?? 'bg-muted text-muted-foreground'}`}>
                      {ACTION_LABELS[item.action] ?? item.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {ENTITY_LABELS[item.entityType] ?? item.entityType}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {item.entityLabel ?? item.entityId ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.ipAddress ?? '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {initialData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            第 {initialData.page} / {initialData.totalPages} 页
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={initialData.page <= 1}
              onClick={() => navigate({ page: initialData.page - 1 })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={initialData.page >= initialData.totalPages}
              onClick={() => navigate({ page: initialData.page + 1 })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
