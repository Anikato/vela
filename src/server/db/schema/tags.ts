// 产品标签表 — 用于产品筛选和展示
import { pgTable, uuid, varchar, timestamp, unique, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { languages } from './languages';

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tagTranslations = pgTable(
  'tag_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code)
      .notNull(),
    name: varchar('name', { length: 100 }),
  },
  (table) => [unique().on(table.tagId, table.locale)],
);

// Relations
export const tagsRelations = relations(tags, ({ many }) => ({
  translations: many(tagTranslations),
}));

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, { fields: [tagTranslations.tagId], references: [tags.id] }),
}));
