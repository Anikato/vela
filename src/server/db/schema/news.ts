// 新闻表 — 新闻/博客文章
import { pgTable, uuid, varchar, text, integer, timestamp, unique, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { media } from './media';
import { languages } from './languages';
import { tags } from './tags';

export const news = pgTable('news', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  coverImageId: uuid('cover_image_id').references(() => media.id),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft | published
  publishedAt: timestamp('published_at'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_news_status').on(table.status),
]);

export const newsTranslations = pgTable(
  'news_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    newsId: uuid('news_id')
      .references(() => news.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code)
      .notNull(),
    title: varchar('title', { length: 500 }),
    summary: text('summary'),
    content: text('content'), // 富文本 HTML
    seoTitle: varchar('seo_title', { length: 200 }),
    seoDescription: text('seo_description'),
  },
  (table) => [unique().on(table.newsId, table.locale)],
);

// ─── 新闻标签（多对多） ───
export const newsTags = pgTable(
  'news_tags',
  {
    newsId: uuid('news_id')
      .references(() => news.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.newsId, table.tagId] })],
);

export const newsTagsRelations = relations(newsTags, ({ one }) => ({
  news: one(news, { fields: [newsTags.newsId], references: [news.id] }),
  tag: one(tags, { fields: [newsTags.tagId], references: [tags.id] }),
}));

// Relations
export const newsRelations = relations(news, ({ one, many }) => ({
  coverImage: one(media, { fields: [news.coverImageId], references: [media.id] }),
  translations: many(newsTranslations),
  newsTags: many(newsTags),
}));

export const newsTranslationsRelations = relations(newsTranslations, ({ one }) => ({
  news: one(news, { fields: [newsTranslations.newsId], references: [news.id] }),
}));
