/**
 * 用户 Service
 * 处理用户相关的数据库操作和业务逻辑
 */

import { db } from '@/server/db';
import { users } from '@/server/db/schema/users';
import { eq } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { DuplicateError, NotFoundError, ValidationError } from '@/lib/errors';

/** 用户类型（从 Drizzle Schema 推导） */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SafeUser = Omit<User, 'passwordHash'>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string): string {
  return username.trim();
}

/** 根据邮箱查找用户 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = normalizeEmail(email);
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  return result[0] ?? null;
}

/** 根据用户名查找用户 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const normalizedUsername = normalizeUsername(username);
  const result = await db
    .select()
    .from(users)
    .where(eq(users.name, normalizedUsername))
    .limit(1);

  return result[0] ?? null;
}

/** 根据 ID 查找用户 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null;
}

/** 验证用户密码 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}

/** 哈希密码 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/** 创建用户 */
export async function createUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<User> {
  const normalizedEmail = normalizeEmail(data.email);
  const normalizedUsername = normalizeUsername(data.username);

  if (!normalizedEmail || !normalizedUsername) {
    throw new ValidationError('Email and username are required');
  }

  if (data.password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const existing = await getUserByEmail(normalizedEmail);
  if (existing) {
    throw new DuplicateError('User', 'email', normalizedEmail);
  }

  const existingUsername = await getUserByUsername(normalizedUsername);
  if (existingUsername) {
    throw new DuplicateError('User', 'username', normalizedUsername);
  }

  const passwordHash = await hashPassword(data.password);

  const result = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
      name: normalizedUsername,
      role: 'admin',
    })
    .returning();

  return result[0];
}

/** 更新用户基础信息（邮箱 / 用户名 / 密码） */
export async function updateUserProfile(
  id: string,
  data: {
    email: string;
    username: string;
    password?: string;
  },
): Promise<SafeUser> {
  const existing = await getUserById(id);
  if (!existing) {
    throw new NotFoundError('User', id);
  }

  const normalizedEmail = normalizeEmail(data.email);
  const normalizedUsername = normalizeUsername(data.username);

  if (!normalizedEmail || !normalizedUsername) {
    throw new ValidationError('Email and username are required');
  }

  const emailOwner = await getUserByEmail(normalizedEmail);
  if (emailOwner && emailOwner.id !== id) {
    throw new DuplicateError('User', 'email', normalizedEmail);
  }

  const usernameOwner = await getUserByUsername(normalizedUsername);
  if (usernameOwner && usernameOwner.id !== id) {
    throw new DuplicateError('User', 'username', normalizedUsername);
  }

  let passwordHash: string | undefined;
  if (data.password !== undefined) {
    if (data.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    passwordHash = await hashPassword(data.password);
  }

  const [updated] = await db
    .update(users)
    .set({
      email: normalizedEmail,
      name: normalizedUsername,
      ...(passwordHash ? { passwordHash } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  const { passwordHash: removedPasswordHash, ...safeUser } = updated;
  void removedPasswordHash;
  return safeUser;
}

/** 获取所有用户（不包含密码哈希） */
export async function getAllUsers(): Promise<SafeUser[]> {
  const result = await db.select().from(users);
  return result.map(({ passwordHash, ...safeUser }) => {
    void passwordHash;
    return safeUser;
  });
}

/** 设置用户启用状态 */
export async function setUserActive(id: string, isActive: boolean): Promise<SafeUser> {
  const existing = await getUserById(id);
  if (!existing) {
    throw new NotFoundError('User', id);
  }

  const [updated] = await db
    .update(users)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();

  const { passwordHash: removedPasswordHash, ...safeUser } = updated;
  void removedPasswordHash;
  return safeUser;
}

/** 重置用户密码 */
export async function resetUserPassword(id: string, password: string): Promise<void> {
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  const existing = await getUserById(id);
  if (!existing) {
    throw new NotFoundError('User', id);
  }

  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));
}

/** 修改当前用户密码（需验证旧密码） */
export async function changeMyPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 8) {
    throw new ValidationError('新密码至少 8 个字符');
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) throw new NotFoundError('User', userId);

  const isValid = await verifyPassword(currentPassword, user[0].passwordHash);
  if (!isValid) {
    throw new ValidationError('当前密码不正确');
  }

  const newHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * 验证登录凭证
 * 返回用户对象（不含密码哈希）或 null
 */
export async function authenticateUser(
  identifier: string,
  password: string,
): Promise<SafeUser | null> {
  const normalizedIdentifier = identifier.trim();
  const userByEmail = await getUserByEmail(normalizedIdentifier);
  const user = userByEmail ?? (await getUserByUsername(normalizedIdentifier));

  if (!user) return null;
  if (!user.isActive) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  // 返回不含密码哈希的用户对象
  const { passwordHash: removedPasswordHash, ...safeUser } = user;
  void removedPasswordHash;
  return safeUser;
}
