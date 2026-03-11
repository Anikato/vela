// 产品表 — 产品主体、翻译、图集、附加分类、参数
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
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { media } from './media';
import { categories } from './categories';
import { languages } from './languages';
import { tags } from './tags';

// ─── 产品主表 ───
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  slug: varchar('slug', { length: 255 }).unique().notNull(),
  primaryCategoryId: uuid('primary_category_id')
    .references(() => categories.id)
    .notNull(),
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft | published | archived
  featuredImageId: uuid('featured_image_id').references(() => media.id),
  videoLinks: jsonb('video_links').$type<string[]>().default([]),
  sortOrder: integer('sort_order').default(0).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  inquiryCount: integer('inquiry_count').default(0).notNull(),
  moq: integer('moq'),
  leadTimeDays: integer('lead_time_days'),
  tradeTerms: varchar('trade_terms', { length: 50 }),
  paymentTerms: varchar('payment_terms', { length: 255 }),
  packagingDetails: text('packaging_details'),
  customizationSupport: boolean('customization_support').default(false).notNull(),
  templateConfig: jsonb('template_config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_products_status').on(table.status),
  index('idx_products_primary_category').on(table.primaryCategoryId),
]);

// ─── 产品翻译 ───
export const productTranslations = pgTable(
  'product_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 500 }),
    shortDescription: text('short_description'),
    description: text('description'), // 富文本 HTML
    seoTitle: varchar('seo_title', { length: 200 }),
    seoDescription: text('seo_description'),
  },
  (table) => [
    unique().on(table.productId, table.locale),
    index('idx_product_translations_product').on(table.productId),
  ],
);

// ─── 产品图集 ───
export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  mediaId: uuid('media_id')
    .references(() => media.id)
    .notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [
  index('idx_product_images_product').on(table.productId),
]);

// ─── 产品附件（如规格书、证书、手册） ───
export const productAttachments = pgTable('product_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  mediaId: uuid('media_id')
    .references(() => media.id)
    .notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [
  index('idx_product_attachments_product').on(table.productId),
]);

// ─── 附加分类（多对多） ───
export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: uuid('category_id')
      .references(() => categories.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.productId, table.categoryId] })],
);

// ─── 产品标签（多对多） ───
export const productTags = pgTable(
  'product_tags',
  {
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.productId, table.tagId] })],
);

// ─── 产品参数分组 ───
export const productAttributeGroups = pgTable('product_attribute_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => [
  index('idx_product_attr_groups_product').on(table.productId),
]);

export const productAttributeGroupTranslations = pgTable(
  'product_attribute_group_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .references(() => productAttributeGroups.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }),
  },
  (table) => [unique().on(table.groupId, table.locale)],
);

// ─── 产品参数 ───
export const productAttributes = pgTable('product_attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id')
    .references(() => productAttributeGroups.id, { onDelete: 'cascade' })
    .notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const productAttributeTranslations = pgTable(
  'product_attribute_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attributeId: uuid('attribute_id')
      .references(() => productAttributes.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }), // 参数名，如"功率"
    value: varchar('value', { length: 500 }), // 参数值，如"5.5 kW"
  },
  (table) => [unique().on(table.attributeId, table.locale)],
);

// ─── Relations ───
export const productsRelations = relations(products, ({ one, many }) => ({
  primaryCategory: one(categories, {
    fields: [products.primaryCategoryId],
    references: [categories.id],
  }),
  featuredImage: one(media, {
    fields: [products.featuredImageId],
    references: [media.id],
  }),
  translations: many(productTranslations),
  images: many(productImages),
  attachments: many(productAttachments),
  additionalCategories: many(productCategories),
  productTags: many(productTags),
  attributeGroups: many(productAttributeGroups),
}));

export const productTranslationsRelations = relations(productTranslations, ({ one }) => ({
  product: one(products, {
    fields: [productTranslations.productId],
    references: [products.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  media: one(media, { fields: [productImages.mediaId], references: [media.id] }),
}));

export const productAttachmentsRelations = relations(productAttachments, ({ one }) => ({
  product: one(products, { fields: [productAttachments.productId], references: [products.id] }),
  media: one(media, { fields: [productAttachments.mediaId], references: [media.id] }),
}));

export const productAttributeGroupsRelations = relations(
  productAttributeGroups,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productAttributeGroups.productId],
      references: [products.id],
    }),
    translations: many(productAttributeGroupTranslations),
    attributes: many(productAttributes),
  }),
);

export const productAttributeGroupTranslationsRelations = relations(
  productAttributeGroupTranslations,
  ({ one }) => ({
    group: one(productAttributeGroups, {
      fields: [productAttributeGroupTranslations.groupId],
      references: [productAttributeGroups.id],
    }),
  }),
);

export const productAttributesRelations = relations(productAttributes, ({ one, many }) => ({
  group: one(productAttributeGroups, {
    fields: [productAttributes.groupId],
    references: [productAttributeGroups.id],
  }),
  translations: many(productAttributeTranslations),
}));

export const productAttributeTranslationsRelations = relations(
  productAttributeTranslations,
  ({ one }) => ({
    attribute: one(productAttributes, {
      fields: [productAttributeTranslations.attributeId],
      references: [productAttributes.id],
    }),
  }),
);
