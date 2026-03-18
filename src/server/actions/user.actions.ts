'use server';

import { z } from 'zod';

import type { ActionResult } from '@/types';
import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';
import { createLogger } from '@/lib/logger';
import { ensureAuthWithUser } from '@/server/actions/lib/auth';
import {
  changeMyPassword,
  createUser,
  getAllUsers,
  resetUserPassword,
  setUserActive,
  updateUserProfile,
  type SafeUser,
} from '@/server/services/user.service';

const userIdSchema = z.string().uuid();

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(100),
});

const updateProfileSchema = z.object({
  id: userIdSchema,
  email: z.string().email(),
  username: z.string().min(1).max(100),
  password: z.string().min(8).max(100).optional(),
});

const setActiveSchema = z.object({
  id: userIdSchema,
  isActive: z.boolean(),
});

const resetPasswordSchema = z.object({
  id: userIdSchema,
  password: z.string().min(8).max(100),
});

const changeMyPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

function handleError(error: unknown): ActionResult<never> {
  if (
    error instanceof NotFoundError ||
    error instanceof DuplicateError ||
    error instanceof ValidationError
  ) {
    return { success: false, error: error.message };
  }

  createLogger('user.actions').error({ err: error }, 'Unexpected user action error');
  return { success: false, error: 'An unexpected error occurred' };
}

/** 获取用户列表 */
export async function getAllUsersAction(): Promise<ActionResult<SafeUser[]>> {
  const session = await ensureAuthWithUser();
  if ('success' in session) return session;

  try {
    const data = await getAllUsers();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

/** 创建用户 */
export async function createUserAction(
  input: z.input<typeof createUserSchema>,
): Promise<ActionResult<SafeUser>> {
  const session = await ensureAuthWithUser();
  if ('success' in session) return session;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const created = await createUser(parsed.data);
    const { passwordHash: removedPasswordHash, ...safeUser } = created;
    void removedPasswordHash;
    return { success: true, data: safeUser };
  } catch (error) {
    return handleError(error);
  }
}

/** 启用/停用用户 */
export async function setUserActiveAction(
  input: z.input<typeof setActiveSchema>,
): Promise<ActionResult<SafeUser>> {
  const session = await ensureAuthWithUser();
  if ('success' in session) return session;

  const parsed = setActiveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  if (parsed.data.id === session.userId && parsed.data.isActive === false) {
    return { success: false, error: '不能停用当前登录账号' };
  }

  try {
    const updated = await setUserActive(parsed.data.id, parsed.data.isActive);
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

/** 重置用户密码 */
export async function resetUserPasswordAction(
  input: z.input<typeof resetPasswordSchema>,
): Promise<ActionResult<void>> {
  const session = await ensureAuthWithUser();
  if ('success' in session) return session;

  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await resetUserPassword(parsed.data.id, parsed.data.password);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

/** 更新用户邮箱/用户名/密码 */
export async function updateUserProfileAction(
  input: z.input<typeof updateProfileSchema>,
): Promise<ActionResult<SafeUser>> {
  const session = await ensureAuthWithUser();
  if ('success' in session) return session;

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    const updated = await updateUserProfile(parsed.data.id, {
      email: parsed.data.email,
      username: parsed.data.username,
      password: parsed.data.password,
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

/** 修改当前登录用户的密码 */
export async function changeMyPasswordAction(
  input: z.input<typeof changeMyPasswordSchema>,
): Promise<ActionResult<void>> {
  const session = await ensureAuthWithUser();
  if ('success' in session) return session;

  const parsed = changeMyPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: formatZodErrors(parsed.error) };
  }

  try {
    await changeMyPassword(session.userId, parsed.data.currentPassword, parsed.data.newPassword);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
