import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/server/db';
import { redirects } from '@/server/db/schema';

export type Redirect = typeof redirects.$inferSelect;

let redirectCache: { data: Redirect[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60 * 1000;

export async function getActiveRedirects(): Promise<Redirect[]> {
  if (redirectCache && redirectCache.expiresAt > Date.now()) {
    return redirectCache.data;
  }
  const rows = await db
    .select()
    .from(redirects)
    .where(eq(redirects.isActive, true))
    .orderBy(desc(redirects.createdAt));
  redirectCache = { data: rows, expiresAt: Date.now() + CACHE_TTL_MS };
  return rows;
}

export function invalidateRedirectCache(): void {
  redirectCache = null;
}

export async function findRedirect(path: string): Promise<Redirect | null> {
  const all = await getActiveRedirects();
  const normalizedPath = path.toLowerCase();
  return all.find((r) => r.fromPath.toLowerCase() === normalizedPath) ?? null;
}

export async function getRedirectList(): Promise<Redirect[]> {
  return db
    .select()
    .from(redirects)
    .orderBy(desc(redirects.createdAt));
}

export async function createRedirect(input: {
  fromPath: string;
  toPath: string;
  statusCode?: number;
  isActive?: boolean;
}): Promise<Redirect> {
  const normalized = input.fromPath.startsWith('/') ? input.fromPath : `/${input.fromPath}`;
  const [row] = await db
    .insert(redirects)
    .values({
      fromPath: normalized,
      toPath: input.toPath,
      statusCode: input.statusCode ?? 301,
      isActive: input.isActive ?? true,
    })
    .returning();
  invalidateRedirectCache();
  return row;
}

export async function updateRedirect(
  id: number,
  input: {
    fromPath?: string;
    toPath?: string;
    statusCode?: number;
    isActive?: boolean;
  },
): Promise<Redirect> {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (input.fromPath !== undefined) {
    values.fromPath = input.fromPath.startsWith('/') ? input.fromPath : `/${input.fromPath}`;
  }
  if (input.toPath !== undefined) values.toPath = input.toPath;
  if (input.statusCode !== undefined) values.statusCode = input.statusCode;
  if (input.isActive !== undefined) values.isActive = input.isActive;

  const [row] = await db
    .update(redirects)
    .set(values)
    .where(eq(redirects.id, id))
    .returning();
  invalidateRedirectCache();
  return row;
}

export async function deleteRedirect(id: number): Promise<void> {
  await db.delete(redirects).where(eq(redirects.id, id));
  invalidateRedirectCache();
}
