// UI 翻译表 — 存储所有界面文本的翻译键值对
import { pgTable, uuid, varchar, text, unique } from 'drizzle-orm/pg-core';
import { languages } from './languages';

export const uiTranslations = pgTable(
  'ui_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 255 }).notNull(), // 如 common.submit, product.addToInquiry
    category: varchar('category', { length: 50 }).notNull(), // 如 common, product, inquiry
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code)
      .notNull(),
    value: text('value'),
  },
  (table) => [unique().on(table.key, table.locale)],
);
