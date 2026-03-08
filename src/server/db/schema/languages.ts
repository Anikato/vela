// 语言表 — 系统支持的所有语言，是多语言体系的基石
import { pgTable, varchar, boolean, integer, timestamp } from 'drizzle-orm/pg-core';

export const languages = pgTable('languages', {
  code: varchar('code', { length: 10 }).primaryKey(), // 如 en-US, zh-CN
  englishName: varchar('english_name', { length: 100 }).notNull(),
  nativeName: varchar('native_name', { length: 100 }).notNull(),
  chineseName: varchar('chinese_name', { length: 100 }).notNull().default(''),
  azureCode: varchar('azure_code', { length: 20 }),
  googleCode: varchar('google_code', { length: 20 }),
  isRtl: boolean('is_rtl').default(false).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
