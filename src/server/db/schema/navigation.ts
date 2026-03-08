// 导航菜单表 — 树形结构，支持多级子菜单
import { pgTable, uuid, varchar, boolean, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';
import { pages } from './pages';
import { languages } from './languages';

export const navigationItems = pgTable('navigation_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'), // 自引用，null 为顶级菜单
  type: varchar('type', { length: 20 }).notNull(), // internal | external | category | page
  url: varchar('url', { length: 500 }), // 内部/外部链接
  categoryId: uuid('category_id').references(() => categories.id),
  pageId: uuid('page_id').references(() => pages.id),
  showChildren: boolean('show_children').default(false).notNull(), // 是否显示子分类下拉
  icon: varchar('icon', { length: 100 }),
  openNewTab: boolean('open_new_tab').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const navigationItemTranslations = pgTable(
  'navigation_item_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: uuid('item_id')
      .references(() => navigationItems.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code)
      .notNull(),
    label: varchar('label', { length: 200 }),
  },
  (table) => [unique().on(table.itemId, table.locale)],
);

// Relations
export const navigationItemsRelations = relations(navigationItems, ({ one, many }) => ({
  parent: one(navigationItems, {
    fields: [navigationItems.parentId],
    references: [navigationItems.id],
    relationName: 'navParent',
  }),
  children: many(navigationItems, { relationName: 'navParent' }),
  category: one(categories, {
    fields: [navigationItems.categoryId],
    references: [categories.id],
  }),
  page: one(pages, { fields: [navigationItems.pageId], references: [pages.id] }),
  translations: many(navigationItemTranslations),
}));

export const navigationItemTranslationsRelations = relations(
  navigationItemTranslations,
  ({ one }) => ({
    item: one(navigationItems, {
      fields: [navigationItemTranslations.itemId],
      references: [navigationItems.id],
    }),
  }),
);
