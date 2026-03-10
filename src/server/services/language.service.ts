/**
 * 语言管理 Service
 * 处理语言的 CRUD、默认语言设置、排序等业务逻辑
 */

import { eq, asc, and, ne } from 'drizzle-orm';
import { db } from '@/server/db';
import { languages } from '@/server/db/schema';
import { NotFoundError, DuplicateError, ValidationError } from '@/lib/errors';
import { getLanguagePresetByCode, normalizeLanguageCode } from '@/lib/language-standards';

/** 从 Drizzle Schema 推导类型 */
export type Language = typeof languages.$inferSelect;
export type LanguageInsert = typeof languages.$inferInsert;

/** 创建语言的输入类型（不含自动生成字段） */
export type CreateLanguageInput = {
  code: string;
  englishName: string;
  nativeName: string;
  chineseName?: string;
  azureCode?: string;
  googleCode?: string;
  isRtl?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

/** 更新语言的输入类型（所有字段可选） */
export type UpdateLanguageInput = Partial<Omit<CreateLanguageInput, 'code'>>;

/**
 * 获取所有语言，按 sortOrder 排序
 */
export async function getAllLanguages(): Promise<Language[]> {
  return db
    .select()
    .from(languages)
    .orderBy(asc(languages.sortOrder), asc(languages.code));
}

/**
 * 获取所有启用的语言（前端使用），按 sortOrder 排序
 */
export async function getActiveLanguages(): Promise<Language[]> {
  return db
    .select()
    .from(languages)
    .where(eq(languages.isActive, true))
    .orderBy(asc(languages.sortOrder), asc(languages.code));
}

/**
 * 根据语言代码获取语言
 * @throws NotFoundError 如果语言不存在
 */
export async function getLanguageByCode(code: string): Promise<Language> {
  const normalizedCode = normalizeLanguageCode(code);
  const [lang] = await db
    .select()
    .from(languages)
    .where(eq(languages.code, normalizedCode));

  if (!lang) {
    throw new NotFoundError('Language', normalizedCode);
  }

  return lang;
}

/**
 * 获取默认语言
 * @throws NotFoundError 如果没有设置默认语言
 */
export async function getDefaultLanguage(): Promise<Language> {
  const [lang] = await db
    .select()
    .from(languages)
    .where(eq(languages.isDefault, true));

  if (!lang) {
    throw new NotFoundError('Language', 'default');
  }

  return lang;
}

/**
 * 创建新语言
 * @throws DuplicateError 如果语言代码已存在
 */
export async function createLanguage(input: CreateLanguageInput): Promise<Language> {
  const normalizedCode = normalizeLanguageCode(input.code);
  const preset = getLanguagePresetByCode(normalizedCode);
  const englishName = (input.englishName || preset?.englishName || '').trim();
  const nativeName = (input.nativeName || preset?.nativeName || '').trim();
  const chineseName = (input.chineseName || preset?.chineseName || '').trim();

  if (!englishName || !nativeName || !chineseName) {
    throw new ValidationError(
      'Language names are required. Use a preset language or fill in english/native/chinese names.',
    );
  }

  // 检查语言代码是否已存在
  const existing = await db
    .select()
    .from(languages)
    .where(eq(languages.code, normalizedCode));

  if (existing.length > 0) {
    throw new DuplicateError('Language', 'code', input.code);
  }

  // 如果设置为默认语言，先取消其他默认
  if (input.isDefault) {
    await db
      .update(languages)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(languages.isDefault, true));
  }

  // 如果没有指定排序，放到最后
  if (input.sortOrder === undefined) {
    const allLangs = await db.select().from(languages);
    input.sortOrder = allLangs.length;
  }

  const [created] = await db
    .insert(languages)
    .values({
      code: normalizedCode,
      englishName,
      nativeName,
      chineseName,
      azureCode: input.azureCode || preset?.azureCode || normalizedCode,
      googleCode: input.googleCode || preset?.googleCode || normalizedCode,
      isRtl: input.isRtl ?? preset?.isRtl ?? false,
      isDefault: input.isDefault ?? false,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder,
    })
    .returning();

  return created;
}

/**
 * 更新语言
 * @throws NotFoundError 如果语言不存在
 * @throws ValidationError 如果试图停用默认语言
 */
export async function updateLanguage(
  code: string,
  input: UpdateLanguageInput,
): Promise<Language> {
  const normalizedCode = normalizeLanguageCode(code);
  const existing = await getLanguageByCode(normalizedCode);
  const preset = getLanguagePresetByCode(normalizedCode);

  // 不允许停用默认语言
  if (existing.isDefault && input.isActive === false) {
    throw new ValidationError('Cannot deactivate the default language. Set another language as default first.');
  }

  // 如果设置为默认语言，先取消其他默认
  if (input.isDefault === true && !existing.isDefault) {
    await db
      .update(languages)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(languages.isDefault, true));
  }

  // 不允许取消默认语言标记（必须通过设置其他语言为默认来间接取消）
  if (input.isDefault === false && existing.isDefault) {
    throw new ValidationError('Cannot unset default language directly. Set another language as default instead.');
  }

  const [updated] = await db
    .update(languages)
    .set({
      ...input,
      chineseName: input.chineseName ?? existing.chineseName ?? preset?.chineseName ?? '',
      azureCode: input.azureCode ?? existing.azureCode ?? preset?.azureCode ?? normalizedCode,
      googleCode: input.googleCode ?? existing.googleCode ?? preset?.googleCode ?? normalizedCode,
      updatedAt: new Date(),
    })
    .where(eq(languages.code, normalizedCode))
    .returning();

  return updated;
}

/**
 * 删除语言及其所有关联翻译数据
 * @throws NotFoundError 如果语言不存在
 * @throws ValidationError 如果试图删除默认语言或系统仅剩一种语言
 */
export async function deleteLanguage(code: string): Promise<void> {
  const normalizedCode = normalizeLanguageCode(code);
  const lang = await getLanguageByCode(normalizedCode);

  if (lang.isDefault) {
    throw new ValidationError('Cannot delete the default language. Set another language as default first.');
  }

  const allLangs = await db.select().from(languages);
  if (allLangs.length <= 1) {
    throw new ValidationError('Cannot delete the last remaining language. The system requires at least one language.');
  }

  await db.delete(languages).where(eq(languages.code, normalizedCode));
}

/**
 * 设置默认语言
 * 会自动取消当前默认语言，并确保新默认语言为启用状态
 * @throws NotFoundError 如果语言不存在
 */
export async function setDefaultLanguage(code: string): Promise<Language> {
  const normalizedCode = normalizeLanguageCode(code);
  const lang = await getLanguageByCode(normalizedCode);

  if (lang.isDefault) {
    return lang; // 已经是默认语言
  }

  // 取消当前默认
  await db
    .update(languages)
    .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(languages.isDefault, true), ne(languages.code, normalizedCode)));

  // 设置新默认（同时确保启用）
  const [updated] = await db
    .update(languages)
    .set({ isDefault: true, isActive: true, updatedAt: new Date() })
    .where(eq(languages.code, normalizedCode))
    .returning();

  return updated;
}

/**
 * 批量更新语言排序
 * @param orderedCodes 按顺序排列的语言代码数组
 */
export async function reorderLanguages(orderedCodes: string[]): Promise<void> {
  // 使用事务确保原子性
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedCodes.length; i++) {
      await tx
        .update(languages)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(languages.code, orderedCodes[i]));
    }
  });
}

/**
 * 切换语言启用状态
 * @throws NotFoundError 如果语言不存在
 * @throws ValidationError 如果试图停用默认语言
 */
export async function toggleLanguageActive(code: string): Promise<Language> {
  const normalizedCode = normalizeLanguageCode(code);
  const lang = await getLanguageByCode(normalizedCode);

  if (lang.isDefault && lang.isActive) {
    throw new ValidationError('Cannot deactivate the default language. Set another language as default first.');
  }

  const [updated] = await db
    .update(languages)
    .set({ isActive: !lang.isActive, updatedAt: new Date() })
    .where(eq(languages.code, normalizedCode))
    .returning();

  return updated;
}
