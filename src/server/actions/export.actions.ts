'use server';

import type { ActionResult } from '@/types';
import { ensureAuth } from '@/server/actions/lib/auth';
import { exportProductsCsv, generateProductCsvTemplate } from '@/server/services/product-export.service';
import { exportInquiriesCsv } from '@/server/services/inquiry-export.service';
import { exportNewsCsv } from '@/server/services/news-export.service';

/** 后台：导出产品 CSV */
export async function exportProductsCsvAction(
  defaultLocale: string,
): Promise<ActionResult<string>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const csv = await exportProductsCsv(defaultLocale);
    return { success: true, data: csv };
  } catch {
    return { success: false, error: 'Failed to export products' };
  }
}

/** 后台：下载产品导入模板 */
export async function getProductCsvTemplateAction(
  defaultLocale: string,
): Promise<ActionResult<string>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const csv = await generateProductCsvTemplate(defaultLocale);
    return { success: true, data: csv };
  } catch {
    return { success: false, error: 'Failed to generate template' };
  }
}

/** 后台：导出询盘 CSV */
export async function exportInquiriesCsvAction(): Promise<ActionResult<string>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const csv = await exportInquiriesCsv();
    return { success: true, data: csv };
  } catch {
    return { success: false, error: 'Failed to export inquiries' };
  }
}

/** 后台：导出新闻 CSV */
export async function exportNewsCsvAction(
  defaultLocale: string,
): Promise<ActionResult<string>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const csv = await exportNewsCsv(defaultLocale);
    return { success: true, data: csv };
  } catch {
    return { success: false, error: 'Failed to export news' };
  }
}
