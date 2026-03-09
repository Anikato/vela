// 操作日志表 — 记录后台管理操作
import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id'),
  userName: varchar('user_name', { length: 100 }),
  action: varchar('action', { length: 50 }).notNull(), // create | update | delete | clone | batch_update | batch_delete | login | export | import
  entityType: varchar('entity_type', { length: 50 }).notNull(), // product | news | category | page | inquiry | media | user | settings | navigation | theme | redirect
  entityId: varchar('entity_id', { length: 255 }),
  entityLabel: varchar('entity_label', { length: 500 }),
  details: jsonb('details').$type<Record<string, unknown>>(),
  ipAddress: varchar('ip_address', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_audit_logs_created').on(table.createdAt),
  index('idx_audit_logs_entity').on(table.entityType, table.entityId),
  index('idx_audit_logs_user').on(table.userId),
]);
