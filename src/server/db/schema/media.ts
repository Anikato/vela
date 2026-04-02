// 媒体文件表 — 所有上传的图片和文件
import { pgTable, uuid, varchar, integer, smallint, timestamp } from 'drizzle-orm/pg-core';

export const media = pgTable('media', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: varchar('alt', { length: 500 }),
  focalX: smallint('focal_x').notNull().default(50),
  focalY: smallint('focal_y').notNull().default(50),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
