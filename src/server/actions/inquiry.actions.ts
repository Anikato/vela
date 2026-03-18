'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { NotFoundError, ValidationError } from '@/lib/errors';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { ActionResult } from '@/types';
import { ensureAuth } from '@/server/actions/lib/auth';
import {
  batchUpdateInquiryStatus,
  createInquiry,
  getInquiryById,
  getInquiryList,
  getInquiryStats,
  INQUIRY_STATUSES,
  updateInquiryNotes,
  updateInquiryStatus,
  type InquiryDetail,
  type InquiryListItem,
  type InquiryStatus,
} from '@/server/services/inquiry.service';

// ─── Schemas ───

const inquiryProductSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  snapshot: z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    imageUrl: z.string().optional(),
  }),
  quantity: z.number().int().min(1).default(1),
});

const submitInquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  sourceUrl: z.string().max(500).optional(),
  locale: z.string().max(10).optional(),
  deviceType: z.string().max(20).optional(),
  captchaToken: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  products: z.array(inquiryProductSchema).default([]),
});

const inquiryStatusSchema = z.enum(INQUIRY_STATUSES);

// ─── Public Actions (前台) ───

/** 前台：提交询盘 */
export async function submitInquiryAction(
  input: z.infer<typeof submitInquirySchema>,
): Promise<ActionResult<{ inquiryNumber: string }>> {
  const parsed = submitInquirySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  try {
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const rl = checkRateLimit(`inquiry:${ip}`, RATE_LIMITS.INQUIRY);
    if (!rl.allowed) {
      return { success: false, error: 'Too many requests, please try again later' };
    }

    const { verifyCaptchaToken } = await import('@/server/services/captcha.service');
    const captchaValid = await verifyCaptchaToken(parsed.data.captchaToken ?? '');
    if (!captchaValid) {
      return { success: false, error: 'Captcha verification failed' };
    }

    const products = parsed.data.products.map((p) => ({
      productId: p.productId ?? null,
      snapshot: p.snapshot,
      quantity: p.quantity,
    }));
    const result = await createInquiry({ ...parsed.data, products });

    // 异步发送邮件通知，不阻塞响应
    import('@/server/services/email.service').then(async ({ sendInquiryNotification, sendInquiryConfirmation }) => {
      const { getPublicSiteInfo } = await import('@/server/services/settings-public.service');
      const siteInfo = await getPublicSiteInfo('en-US', 'en-US');
      const emailPayload = {
        inquiryNumber: result.inquiryNumber,
        customerName: parsed.data.name,
        customerEmail: parsed.data.email,
        phone: parsed.data.phone ?? null,
        company: parsed.data.company ?? null,
        country: parsed.data.country ?? null,
        message: parsed.data.message,
        sourceUrl: parsed.data.sourceUrl ?? null,
        locale: parsed.data.locale ?? null,
        products,
        siteName: siteInfo.siteName,
      };
      await Promise.allSettled([
        sendInquiryNotification(emailPayload),
        sendInquiryConfirmation(emailPayload),
      ]);
    }).catch(() => {});

    return { success: true, data: { inquiryNumber: result.inquiryNumber } };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to submit inquiry' };
  }
}

// ─── Admin Actions (后台) ───

/** 后台：询盘列表 */
export async function getInquiryListAction(params: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResult<{
    items: InquiryListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const status = INQUIRY_STATUSES.includes(params.status as InquiryStatus)
      ? (params.status as InquiryStatus)
      : undefined;
    const result = await getInquiryList({ ...params, status });
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Failed to load inquiries' };
  }
}

/** 后台：询盘详情 */
export async function getInquiryDetailAction(id: string): Promise<ActionResult<InquiryDetail>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const detail = await getInquiryById(id);
    return { success: true, data: detail };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: 'Inquiry not found' };
    }
    return { success: false, error: 'Failed to load inquiry' };
  }
}

/** 后台：更新询盘状态 */
export async function updateInquiryStatusAction(
  id: string,
  status: string,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsed = inquiryStatusSchema.safeParse(status);
  if (!parsed.success) return { success: false, error: 'Invalid status' };

  try {
    await updateInquiryStatus(id, parsed.data);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: 'Inquiry not found' };
    }
    return { success: false, error: 'Failed to update status' };
  }
}

/** 后台：更新内部备注 */
export async function updateInquiryNotesAction(
  id: string,
  notes: string,
): Promise<ActionResult<void>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    await updateInquiryNotes(id, notes);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { success: false, error: 'Inquiry not found' };
    }
    return { success: false, error: 'Failed to update notes' };
  }
}

/** 后台：批量更新状态 */
export async function batchUpdateInquiryStatusAction(
  ids: string[],
  status: string,
): Promise<ActionResult<{ count: number }>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  const parsedIds = z.array(z.string().uuid()).safeParse(ids);
  if (!parsedIds.success) return { success: false, error: 'Invalid inquiry ids' };

  const parsedStatus = inquiryStatusSchema.safeParse(status);
  if (!parsedStatus.success) return { success: false, error: 'Invalid status' };

  try {
    const affected = await batchUpdateInquiryStatus(parsedIds.data, parsedStatus.data);
    return { success: true, data: { count: affected } };
  } catch {
    return { success: false, error: 'Failed to update inquiries' };
  }
}

/** 后台：询盘统计 */
export async function getInquiryStatsAction(): Promise<
  ActionResult<{ total: number; new: number; read: number; replied: number; closed: number; spam: number }>
> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const stats = await getInquiryStats();
    return { success: true, data: stats };
  } catch {
    return { success: false, error: 'Failed to load stats' };
  }
}
