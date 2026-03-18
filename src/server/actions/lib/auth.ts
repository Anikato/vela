import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';

/**
 * Check auth and return null if OK, or an unauthorized ActionResult.
 * Usage: `const unauthed = await ensureAuth(); if (unauthed) return unauthed;`
 */
export async function ensureAuth(): Promise<ActionResult<never> | null> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return null;
}

/**
 * Throw if not authenticated. Use inside try/catch blocks.
 */
export async function requireAuth(): Promise<void> {
  const session = await auth();
  if (!session?.user) throw new Error('未授权');
}

/**
 * Check auth and return user info, or an unauthorized ActionResult.
 */
export async function ensureAuthWithUser(): Promise<
  ActionResult<never> | { userId: string; role: string }
> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };
  return { userId: session.user.id, role: session.user.role };
}
