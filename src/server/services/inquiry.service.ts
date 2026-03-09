import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { db } from '@/server/db';
import { inquiries, inquiryProducts } from '@/server/db/schema';

// ─── Types ───

export const INQUIRY_STATUSES = ['new', 'read', 'replied', 'closed', 'spam'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export interface InquiryProductSnapshot {
  name: string;
  sku: string;
  imageUrl?: string;
}

export interface CreateInquiryProductInput {
  productId?: string | null;
  snapshot: InquiryProductSnapshot;
  quantity: number;
}

export interface CreateInquiryInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  country?: string;
  message: string;
  sourceUrl?: string;
  ipAddress?: string;
  userAgent?: string;
  locale?: string;
  deviceType?: string;
  customFields?: Record<string, unknown>;
  products: CreateInquiryProductInput[];
}

export interface InquiryListItem {
  id: string;
  inquiryNumber: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  status: string;
  productCount: number;
  createdAt: Date;
}

export interface InquiryDetail {
  id: string;
  inquiryNumber: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  message: string;
  status: string;
  sourceUrl: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  locale: string | null;
  deviceType: string | null;
  internalNotes: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  products: Array<{
    id: string;
    productId: string | null;
    snapshot: InquiryProductSnapshot;
    quantity: number;
  }>;
}

export interface InquiryListParams {
  status?: InquiryStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Helpers ───

function generateInquiryNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INQ-${datePart}-${randomPart}`;
}

// ─── Service Functions ───

/** 创建询盘（前台提交） */
export async function createInquiry(input: CreateInquiryInput): Promise<{ id: string; inquiryNumber: string }> {
  if (!input.name.trim()) throw new ValidationError('Name is required');
  if (!input.email.trim()) throw new ValidationError('Email is required');
  if (!input.message.trim()) throw new ValidationError('Message is required');

  const inquiryNumber = generateInquiryNumber();

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(inquiries)
      .values({
        inquiryNumber,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim() || null,
        company: input.company?.trim() || null,
        country: input.country?.trim() || null,
        message: input.message.trim(),
        status: 'new',
        sourceUrl: input.sourceUrl || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        locale: input.locale || null,
        deviceType: input.deviceType || null,
        customFields: input.customFields ?? null,
      })
      .returning({ id: inquiries.id, inquiryNumber: inquiries.inquiryNumber });

    if (input.products.length > 0) {
      await tx.insert(inquiryProducts).values(
        input.products.map((p) => ({
          inquiryId: created.id,
          productId: p.productId ?? null,
          productSnapshot: p.snapshot,
          quantity: Math.max(1, p.quantity),
        })),
      );
    }

    return { id: created.id, inquiryNumber: created.inquiryNumber };
  });
}

/** 后台：询盘列表（分页 + 筛选 + 搜索） */
export async function getInquiryList(params: InquiryListParams = {}): Promise<{
  items: InquiryListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const pageSize = Math.max(1, Math.min(50, Math.floor(params.pageSize ?? 20)));

  const conditions = [];
  if (params.status) {
    conditions.push(eq(inquiries.status, params.status));
  }
  if (params.search?.trim()) {
    const pattern = `%${params.search.trim()}%`;
    conditions.push(
      or(
        ilike(inquiries.name, pattern),
        ilike(inquiries.email, pattern),
        ilike(inquiries.company, pattern),
        ilike(inquiries.inquiryNumber, pattern),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(inquiries)
    .where(whereClause);

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  if (total === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const offset = (page - 1) * pageSize;

  const rows = await db.query.inquiries.findMany({
    where: whereClause,
    with: { products: true },
    orderBy: [desc(inquiries.createdAt)],
    limit: pageSize,
    offset,
  });

  const items: InquiryListItem[] = rows.map((row) => ({
    id: row.id,
    inquiryNumber: row.inquiryNumber,
    name: row.name,
    email: row.email,
    company: row.company,
    country: row.country,
    status: row.status,
    productCount: row.products.length,
    createdAt: row.createdAt,
  }));

  return { items, total, page, pageSize, totalPages };
}

/** 后台：询盘详情 */
export async function getInquiryById(id: string): Promise<InquiryDetail> {
  const row = await db.query.inquiries.findFirst({
    where: eq(inquiries.id, id),
    with: { products: true },
  });

  if (!row) throw new NotFoundError('Inquiry', id);

  return {
    id: row.id,
    inquiryNumber: row.inquiryNumber,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    country: row.country,
    message: row.message,
    status: row.status,
    sourceUrl: row.sourceUrl,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    locale: row.locale,
    deviceType: row.deviceType,
    internalNotes: row.internalNotes,
    customFields: row.customFields,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    products: row.products.map((p) => ({
      id: p.id,
      productId: p.productId,
      snapshot: p.productSnapshot,
      quantity: p.quantity,
    })),
  };
}

/** 后台：更新询盘状态 */
export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const existing = await db.query.inquiries.findFirst({ where: eq(inquiries.id, id) });
  if (!existing) throw new NotFoundError('Inquiry', id);

  await db
    .update(inquiries)
    .set({ status, updatedAt: new Date() })
    .where(eq(inquiries.id, id));
}

/** 后台：更新内部备注 */
export async function updateInquiryNotes(id: string, notes: string): Promise<void> {
  const existing = await db.query.inquiries.findFirst({ where: eq(inquiries.id, id) });
  if (!existing) throw new NotFoundError('Inquiry', id);

  await db
    .update(inquiries)
    .set({ internalNotes: notes.trim() || null, updatedAt: new Date() })
    .where(eq(inquiries.id, id));
}

/** 后台：批量更新状态 */
export async function batchUpdateInquiryStatus(ids: string[], status: InquiryStatus): Promise<number> {
  if (ids.length === 0) return 0;

  const result = await db
    .update(inquiries)
    .set({ status, updatedAt: new Date() })
    .where(inArray(inquiries.id, ids));

  return ids.length;
}

/** 后台：询盘统计概要 */
export async function getInquiryStats(): Promise<{
  total: number;
  new: number;
  read: number;
  replied: number;
  closed: number;
  spam: number;
}> {
  const rows = await db
    .select({ status: inquiries.status, cnt: count() })
    .from(inquiries)
    .groupBy(inquiries.status);

  const statsMap = new Map(rows.map((r) => [r.status, r.cnt]));

  return {
    total: rows.reduce((sum, r) => sum + r.cnt, 0),
    new: statsMap.get('new') ?? 0,
    read: statsMap.get('read') ?? 0,
    replied: statsMap.get('replied') ?? 0,
    closed: statsMap.get('closed') ?? 0,
    spam: statsMap.get('spam') ?? 0,
  };
}
