/**
 * Auth.js v5 Edge 安全配置
 * 此文件不含任何 Node.js / DB 依赖，可在 Middleware（Edge Runtime）中使用。
 * 完整的 Credentials Provider 在 auth.ts 中配置。
 */

import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 天
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as { role: string }).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },

    async authorized({ auth: session, request }) {
      const isLoggedIn = !!session?.user;
      const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
      const isLoginPage = request.nextUrl.pathname === '/admin/login';

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/admin', request.nextUrl.origin));
        }
        return true;
      }

      if (isAdminRoute) {
        return isLoggedIn;
      }

      return true;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
