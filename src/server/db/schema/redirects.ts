import {
  boolean,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const redirects = pgTable('redirects', {
  id: serial('id').primaryKey(),
  fromPath: varchar('from_path', { length: 1000 }).notNull().unique(),
  toPath: varchar('to_path', { length: 1000 }).notNull(),
  statusCode: integer('status_code').default(301).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
