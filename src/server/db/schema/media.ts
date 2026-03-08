// 媒体文件表 — 所有上传的图片和文件
import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(), // 存储路径/文件名
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(), // 字节
  width: integer('width'), // 图片宽度，非图片为 null
  height: integer('height'), // 图片高度
  alt: varchar('alt', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
