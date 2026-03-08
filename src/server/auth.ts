/**
 * Auth.js v5 完整配置
 * 在 Edge 安全配置基础上添加 Credentials Provider（需要 DB 访问）。
 * Middleware 不应导入此文件，应使用 auth.config.ts。
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authenticateUser } from '@/server/services/user.service';
import { authConfig } from './auth.config';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: { label: '账号', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const user = await authenticateUser(
          credentials.identifier as string,
          credentials.password as string,
        );

        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
