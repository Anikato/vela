/**
 * 通用数据规范化与校验工具
 * 供 Service 层复用，保持纯函数可测试
 */

import { ValidationError } from './errors';

/** 规范化可空文本：trim 后空字符串转 null，undefined 保持 undefined */
export function normalizeNullableText(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** 规范化 SKU：trim + 大写 */
export function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase();
}

/** 规范化 Slug：trim + 小写 */
export function normalizeSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

/** 规范化 ID 列表：去重、trim、过滤空值 */
export function normalizeIds(ids?: string[]): string[] {
  if (!ids) return [];
  const set = new Set(ids.map((item) => item.trim()).filter(Boolean));
  return Array.from(set);
}

/** 校验状态值是否在允许列表内 */
export function ensureValidStatus<T extends string>(
  status: string | undefined,
  allowed: readonly T[],
  entityName = 'Entity',
): void {
  if (!status) return;
  if (!allowed.includes(status as T)) {
    throw new ValidationError(`Invalid ${entityName} status: ${status}`);
  }
}

/** 校验翻译数组至少有一条包含非空的指定字段 */
export function ensureTranslationHasField(
  translations: Array<Record<string, unknown>>,
  fieldName: string,
  errorMessage: string,
): void {
  const hasValue = translations.some((item) => {
    const val = item[fieldName];
    return typeof val === 'string' && val.trim().length > 0;
  });
  if (!hasValue) {
    throw new ValidationError(errorMessage);
  }
}
