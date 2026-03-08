'use server';

import { z } from 'zod';

import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import { translateSingle, translateTexts } from '@/server/services/translation.service';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error('未授权');
}

const translateSingleSchema = z.object({
  text: z.string().min(1).max(50000),
  from: z.string().min(1).max(10),
  to: z.array(z.string().min(1).max(10)).min(1),
});

/** 翻译单段文本到多个目标语言 */
export async function translateSingleAction(
  input: z.infer<typeof translateSingleSchema>,
): Promise<ActionResult<Record<string, string>>> {
  try {
    await requireAuth();
    const parsed = translateSingleSchema.parse(input);
    const result = await translateSingle(parsed.text, parsed.from, parsed.to);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '翻译失败' };
  }
}

const translateBatchSchema = z.object({
  texts: z.array(z.string().max(50000)).min(1).max(100),
  from: z.string().min(1).max(10),
  to: z.array(z.string().min(1).max(10)).min(1),
});

/** 批量翻译多段文本到多个目标语言 */
export async function translateBatchAction(
  input: z.infer<typeof translateBatchSchema>,
): Promise<ActionResult<Record<string, string[]>>> {
  try {
    await requireAuth();
    const parsed = translateBatchSchema.parse(input);
    const result = await translateTexts(parsed);
    return { success: true, data: result.translations };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '批量翻译失败' };
  }
}
