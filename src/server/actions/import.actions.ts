'use server';

import type { ActionResult } from '@/types';
import { ensureAuth } from '@/server/actions/lib/auth';
import {
  parseProductCsv,
  importProducts,
  type ImportPreviewResult,
  type ImportResult,
  type ImportRow,
} from '@/server/services/product-import.service';

/** 后台：预览 CSV 导入（解析校验，不写库） */
export async function previewProductCsvAction(
  csvText: string,
): Promise<ActionResult<ImportPreviewResult>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const result = parseProductCsv(csvText);
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Failed to parse CSV' };
  }
}

/** 后台：确认执行导入 */
export async function executeProductImportAction(
  csvText: string,
  mode: 'skip' | 'update' = 'skip',
): Promise<ActionResult<ImportResult>> {
  const unauthed = await ensureAuth();
  if (unauthed) return unauthed;

  try {
    const preview = parseProductCsv(csvText);
    if (preview.validRows === 0) {
      return { success: false, error: 'No valid rows to import' };
    }
    const result = await importProducts(preview.rows, mode);
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Failed to import products' };
  }
}
