// 主题表 — 存储网站视觉主题配置
import { pgTable, uuid, varchar, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  isPreset: boolean('is_preset').default(false).notNull(), // 系统预设，不可删除
  config: jsonb('config').$type<Record<string, unknown>>().default({}), // 全部主题配置
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
