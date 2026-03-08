'use server';

/**
 * 语言管理 Server Actions
 * Zod 校验 → 调 Service → 返回 ActionResult
 */

import { z } from 'zod';
import type { ActionResult } from '@/types';
import type { Language } from '@/server/services/language.service';
import {
  getAllLanguages,
  getActiveLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage,
  setDefaultLanguage,
  reorderLanguages,
  toggleLanguageActive,
} from '@/server/services/language.service';
import { NotFoundError, DuplicateError, ValidationError } from '@/lib/errors';
import { normalizeLanguageCode } from '@/lib/language-standards';

// ─── Zod Schemas ───────────────────────────────────────────────

/** 语言代码格式：尽量兼容常见 BCP 47 写法，如 en-US / zh-CN / zh-Hans / ar */
const languageCodeSchema = z.string().min(2).max(10).regex(
  /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8}){0,2}$/,
  'Invalid language code format. Expected: en, en-US, zh-CN, zh-Hans, etc.',
);

const createLanguageSchema = z.object({
  code: languageCodeSchema,
  englishName: z.string().min(1).max(100),
  nativeName: z.string().min(1).max(100),
  chineseName: z.string().min(1).max(100),
  azureCode: z.string().min(1).max(20).optional(),
  googleCode: z.string().min(1).max(20).optional(),
  isRtl: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateLanguageSchema = z.object({
  englishName: z.string().min(1).max(100).optional(),
  nativeName: z.string().min(1).max(100).optional(),
  chineseName: z.string().min(1).max(100).optional(),
  azureCode: z.string().min(1).max(20).optional(),
  googleCode: z.string().min(1).max(20).optional(),
  isRtl: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const reorderSchema = z.object({
  orderedCodes: z.array(languageCodeSchema).min(1),
});

// ─── 错误处理辅助函数 ──────────────────────────────────────────

function handleError(error: unknown): ActionResult<never> {
  if (error instanceof NotFoundError) {
    return { success: false, error: error.message };
  }
  if (error instanceof DuplicateError) {
    return { success: false, error: error.message };
  }
  if (error instanceof ValidationError) {
    return { success: false, error: error.message };
  }

  console.error('Unexpected error:', error);
  return { success: false, error: 'An unexpected error occurred' };
}

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

// ─── Actions ───────────────────────────────────────────────────

/** 获取所有语言 */
export async function getAllLanguagesAction(): Promise<ActionResult<Language[]>> {
  try {
    const data = await getAllLanguages();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 获取所有启用的语言 */
export async function getActiveLanguagesAction(): Promise<ActionResult<Language[]>> {
  try {
    const data = await getActiveLanguages();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 创建新语言 */
export async function createLanguageAction(
  input: z.input<typeof createLanguageSchema>,
): Promise<ActionResult<Language>> {
  const parsed = createLanguageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await createLanguage({
      ...parsed.data,
      code: normalizeLanguageCode(parsed.data.code),
    });
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 更新语言 */
export async function updateLanguageAction(
  code: string,
  input: z.input<typeof updateLanguageSchema>,
): Promise<ActionResult<Language>> {
  const normalizedCode = normalizeLanguageCode(code);
  const codeResult = languageCodeSchema.safeParse(normalizedCode);
  if (!codeResult.success) {
    return { success: false, error: 'Invalid language code' };
  }

  const parsed = updateLanguageSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const data = await updateLanguage(normalizedCode, parsed.data);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 删除语言 */
export async function deleteLanguageAction(code: string): Promise<ActionResult<void>> {
  const normalizedCode = normalizeLanguageCode(code);
  const codeResult = languageCodeSchema.safeParse(normalizedCode);
  if (!codeResult.success) {
    return { success: false, error: 'Invalid language code' };
  }

  try {
    await deleteLanguage(normalizedCode);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/** 设置默认语言 */
export async function setDefaultLanguageAction(code: string): Promise<ActionResult<Language>> {
  const normalizedCode = normalizeLanguageCode(code);
  const codeResult = languageCodeSchema.safeParse(normalizedCode);
  if (!codeResult.success) {
    return { success: false, error: 'Invalid language code' };
  }

  try {
    const data = await setDefaultLanguage(normalizedCode);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 批量更新语言排序 */
export async function reorderLanguagesAction(
  orderedCodes: string[],
): Promise<ActionResult<void>> {
  const parsed = reorderSchema.safeParse({ orderedCodes });
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await reorderLanguages(parsed.data.orderedCodes);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/** 切换语言启用/停用 */
export async function toggleLanguageActiveAction(code: string): Promise<ActionResult<Language>> {
  const normalizedCode = normalizeLanguageCode(code);
  const codeResult = languageCodeSchema.safeParse(normalizedCode);
  if (!codeResult.success) {
    return { success: false, error: 'Invalid language code' };
  }

  try {
    const data = await toggleLanguageActive(normalizedCode);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}
