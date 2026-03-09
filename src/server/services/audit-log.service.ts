import { count, desc, eq, and, gte, ilike, or } from 'drizzle-orm';

import { db } from '@/server/db';
import { auditLogs } from '@/server/db/schema';

export interface CreateAuditLogInput {
  userId?: string | null;
  userName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityLabel?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

export interface AuditLogListItem {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface AuditLogListParams {
  page?: number;
  pageSize?: number;
  entityType?: string;
  search?: string;
}

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

export { ACTION_LABELS, ENTITY_LABELS };

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: input.userId ?? null,
      userName: input.userName ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null,
      details: input.details ?? null,
      ipAddress: input.ipAddress ?? null,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export async function getAuditLogList(params: AuditLogListParams = {}): Promise<{
  items: AuditLogListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, Math.min(50, params.pageSize ?? 30));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.entityType) {
    conditions.push(eq(auditLogs.entityType, params.entityType));
  }
  if (params.search?.trim()) {
    const pattern = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(auditLogs.userName, pattern),
        ilike(auditLogs.entityLabel, pattern),
        ilike(auditLogs.action, pattern),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total: totalCount }] = await db
    .select({ total: count() })
    .from(auditLogs)
    .where(whereClause);

  const total = Number(totalCount);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  const rows = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows,
    total,
    page,
    pageSize,
    totalPages,
  };
}
