// 区块表 — 页面/分类的内容区块，注册制设计
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pages } from './pages';
import { categories } from './categories';
import { media } from './media';
import { languages } from './languages';

// ─── 区块主表 ───
export const sections = pgTable('sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').references(() => pages.id, { onDelete: 'cascade' }), // 所属页面（与 categoryId 二选一）
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }), // 所属分类
  placement: varchar('placement', { length: 20 }).default('main').notNull(), // main | top | bottom
  type: varchar('type', { length: 50 }).notNull(), // 区块类型标识，如 hero, rich_text, cta
  config: jsonb('config').$type<Record<string, unknown>>().default({}), // 通用配置 + 区块特定配置
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  anchorId: varchar('anchor_id', { length: 100 }),
  cssClass: varchar('css_class', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_sections_page').on(table.pageId),
  index('idx_sections_category').on(table.categoryId),
]);

// ─── 区块翻译 ───
export const sectionTranslations = pgTable(
  'section_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sectionId: uuid('section_id')
      .references(() => sections.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code)
      .notNull(),
    title: varchar('title', { length: 500 }),
    subtitle: varchar('subtitle', { length: 500 }),
    content: text('content'), // 富文本 HTML
    buttonText: varchar('button_text', { length: 200 }),
    buttonLink: varchar('button_link', { length: 500 }),
    secondaryButtonText: varchar('secondary_button_text', { length: 200 }),
    secondaryButtonLink: varchar('secondary_button_link', { length: 500 }),
  },
  (table) => [
    unique().on(table.sectionId, table.locale),
    index('idx_section_translations_section').on(table.sectionId),
  ],
);

// ─── 区块子项 ───
export const sectionItems = pgTable('section_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sectionId: uuid('section_id')
    .references(() => sections.id, { onDelete: 'cascade' })
    .notNull(),
  iconName: varchar('icon_name', { length: 100 }),
  imageId: uuid('image_id').references(() => media.id),
  linkUrl: varchar('link_url', { length: 500 }),
  config: jsonb('config').$type<Record<string, unknown>>().default({}),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_section_items_section').on(table.sectionId),
]);

// ─── 区块子项翻译 ───
export const sectionItemTranslations = pgTable(
  'section_item_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => sectionItems.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code)
      .notNull(),
    title: varchar('title', { length: 500 }),
    description: text('description'),
    content: text('content'), // 富文本
  },
  (table) => [unique().on(table.itemId, table.locale)],
);

// ─── Relations ───
export const sectionsRelations = relations(sections, ({ one, many }) => ({
  page: one(pages, { fields: [sections.pageId], references: [pages.id] }),
  category: one(categories, { fields: [sections.categoryId], references: [categories.id] }),
  translations: many(sectionTranslations),
  items: many(sectionItems),
}));

export const sectionTranslationsRelations = relations(sectionTranslations, ({ one }) => ({
  section: one(sections, {
    fields: [sectionTranslations.sectionId],
    references: [sections.id],
  }),
}));

export const sectionItemsRelations = relations(sectionItems, ({ one, many }) => ({
  section: one(sections, { fields: [sectionItems.sectionId], references: [sections.id] }),
  image: one(media, { fields: [sectionItems.imageId], references: [media.id] }),
  translations: many(sectionItemTranslations),
}));

export const sectionItemTranslationsRelations = relations(
  sectionItemTranslations,
  ({ one }) => ({
    item: one(sectionItems, {
      fields: [sectionItemTranslations.itemId],
      references: [sectionItems.id],
    }),
  }),
);
