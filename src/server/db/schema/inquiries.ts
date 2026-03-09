// 询盘表 — 客户提交的询盘和相关产品
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
import { products } from './products';
import { languages } from './languages';

// ─── 询盘主表 ───
export const inquiries = pgTable('inquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  inquiryNumber: varchar('inquiry_number', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 200 }),
  country: varchar('country', { length: 100 }),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('new').notNull(), // new | read | replied | closed | spam
  sourceUrl: varchar('source_url', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  locale: varchar('locale', { length: 10 }),
  deviceType: varchar('device_type', { length: 20 }), // mobile | tablet | desktop
  internalNotes: text('internal_notes'),
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_inquiries_status').on(table.status),
  index('idx_inquiries_created').on(table.createdAt),
]);

// ─── 询盘产品 ───
export const inquiryProducts = pgTable('inquiry_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  inquiryId: uuid('inquiry_id')
    .references(() => inquiries.id, { onDelete: 'cascade' })
    .notNull(),
  productId: uuid('product_id').references(() => products.id), // 可为 null（产品已删除）
  productSnapshot: jsonb('product_snapshot')
    .$type<{ name: string; sku: string; imageUrl?: string }>()
    .notNull(),
  quantity: integer('quantity').default(1).notNull(),
}, (table) => [
  index('idx_inquiry_products_inquiry').on(table.inquiryId),
]);

// ─── 询盘自定义字段定义 ───
export const inquiryFormFields = pgTable('inquiry_form_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  fieldType: varchar('field_type', { length: 20 }).notNull(), // text | number | select | multiselect | file
  isRequired: boolean('is_required').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  options: jsonb('options').$type<string[]>(), // 下拉/多选选项
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const inquiryFormFieldTranslations = pgTable(
  'inquiry_form_field_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fieldId: uuid('field_id')
      .references(() => inquiryFormFields.id, { onDelete: 'cascade' })
      .notNull(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code)
      .notNull(),
    label: varchar('label', { length: 200 }),
    placeholder: varchar('placeholder', { length: 200 }),
    helpText: varchar('help_text', { length: 500 }),
  },
  (table) => [unique().on(table.fieldId, table.locale)],
);

// ─── Relations ───
export const inquiriesRelations = relations(inquiries, ({ many }) => ({
  products: many(inquiryProducts),
}));

export const inquiryProductsRelations = relations(inquiryProducts, ({ one }) => ({
  inquiry: one(inquiries, {
    fields: [inquiryProducts.inquiryId],
    references: [inquiries.id],
  }),
  product: one(products, {
    fields: [inquiryProducts.productId],
    references: [products.id],
  }),
}));

export const inquiryFormFieldsRelations = relations(inquiryFormFields, ({ many }) => ({
  translations: many(inquiryFormFieldTranslations),
}));

export const inquiryFormFieldTranslationsRelations = relations(
  inquiryFormFieldTranslations,
  ({ one }) => ({
    field: one(inquiryFormFields, {
      fields: [inquiryFormFieldTranslations.fieldId],
      references: [inquiryFormFields.id],
    }),
  }),
);
