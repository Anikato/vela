import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  db: DbInstance | undefined;
  conn: postgres.Sql | undefined;
};

function initDb(): DbInstance {
  if (!globalForDb.db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL environment variable is required');
    const conn = globalForDb.conn ?? postgres(url);
    if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn;
    globalForDb.db = drizzle(conn, { schema });
  }
  return globalForDb.db;
}

/**
 * Lazy-initialized database instance.
 * Uses a Proxy so that the actual postgres connection is only created
 * when the db is first used (not at module import time).
 * This allows `next build` to succeed without DATABASE_URL.
 */
export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_target, prop, receiver) {
    const real = initDb();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
