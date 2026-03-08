/**
 * Auth.js v5 配置
 * 使用 Credentials Provider（用户名/邮箱 + 密码登录）
 * Session 存储在 JWT 中（无需 Session 表）
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authenticateUser } from '@/server/services/user.service';

export const { handlers, signIn, signOut, auth } = NextAuth({
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

        // 返回给 Auth.js 的用户对象
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  pages: {
    signIn: '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 天
  },

  callbacks: {
    /** 将自定义字段写入 JWT */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
      }
      return token;
    },

    /** 将 JWT 中的字段暴露到 session */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    /** 控制受保护路由的访问 */
    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
      const isLoginPage = request.nextUrl.pathname === '/admin/login';

      // 登录页面：已登录用户重定向到后台首页
      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/admin', request.nextUrl.origin));
        }
        return true;
      }

      // 后台路由：未登录用户重定向到登录页
      if (isAdminRoute) {
        return isLoggedIn;
      }

      // 其他路由（前台网站）：完全公开
      return true;
    },
  },
});
