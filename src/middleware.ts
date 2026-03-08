import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';

import { matchLocale } from '@/lib/i18n';
import { authConfig } from '@/server/auth.config';

const { auth } = NextAuth(authConfig);

const LOCALE_COOKIE_KEY = 'vela_locale';
const LOCALE_CACHE_TTL_MS = 5 * 60 * 1000;
const REDIRECT_CACHE_TTL_MS = 60 * 1000;
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const FALLBACK_DEFAULT_LOCALE = 'en-US';

const PUBLIC_FILE_REGEX = /\.[^/]+$/;

let redirectCache: {
  expiresAt: number;
  data: Record<string, { toPath: string; statusCode: number }>;
} | null = null;

async function getRedirectMap(
  request: NextRequest,
): Promise<Record<string, { toPath: string; statusCode: number }>> {
  if (redirectCache && redirectCache.expiresAt > Date.now()) {
    return redirectCache.data;
  }
  try {
    const url = new URL('/api/redirects', request.nextUrl.origin);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return {};
    const payload = (await res.json()) as {
      success?: boolean;
      data?: Record<string, { toPath: string; statusCode: number }>;
    };
    const data = payload.success && payload.data ? payload.data : {};
    redirectCache = { expiresAt: Date.now() + REDIRECT_CACHE_TTL_MS, data };
    return data;
  } catch {
    return {};
  }
}

let localeCache:
  | {
      expiresAt: number;
      data: {
        defaultLocale: string;
        activeLocales: string[];
      };
    }
  | null = null;

async function getLocaleConfig(request: NextRequest): Promise<{
  defaultLocale: string;
  activeLocales: string[];
}> {
  if (localeCache && localeCache.expiresAt > Date.now()) {
    return localeCache.data;
  }

  try {
    const url = new URL('/api/i18n/locales', request.nextUrl.origin);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Fetch locales failed: ${response.status}`);

    const payload = (await response.json()) as {
      success?: boolean;
      data?: { defaultLocale?: string; activeLocales?: string[] };
    };

    if (!payload.success || !payload.data?.defaultLocale || !payload.data.activeLocales?.length) {
      throw new Error('Invalid locales payload');
    }

    const data = {
      defaultLocale: payload.data.defaultLocale,
      activeLocales: payload.data.activeLocales,
    };
    localeCache = {
      expiresAt: Date.now() + LOCALE_CACHE_TTL_MS,
      data,
    };
    return data;
  } catch (error) {
    console.error('Load locale config failed in middleware, fallback to default locale:', error);
    return {
      defaultLocale: FALLBACK_DEFAULT_LOCALE,
      activeLocales: [FALLBACK_DEFAULT_LOCALE],
    };
  }
}

function setLocaleCookie(response: NextResponse, locale: string): void {
  response.cookies.set(LOCALE_COOKIE_KEY, locale, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: LOCALE_COOKIE_MAX_AGE,
  });
}

function isBypassedPath(pathname: string): boolean {
  if (pathname.startsWith('/api')) return true;
  if (pathname.startsWith('/_next')) return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname === '/robots.txt') return true;
  if (pathname === '/sitemap.xml') return true;
  if (PUBLIC_FILE_REGEX.test(pathname)) return true;
  return false;
}

export default auth(async (request) => {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const isLoggedIn = !!request.auth?.user;

    if (isLoginPage) {
      // 已登录用户访问登录页 → 重定向到后台首页
      if (isLoggedIn) {
        return NextResponse.redirect(new URL('/admin', request.nextUrl.origin));
      }
      return NextResponse.next();
    }

    // 未登录用户访问后台 → 重定向到登录页
    if (!isLoggedIn) {
      const loginUrl = new URL('/admin/login', request.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  if (isBypassedPath(pathname)) {
    return NextResponse.next();
  }

  const redirectMap = await getRedirectMap(request);
  const match = redirectMap[pathname.toLowerCase()];
  if (match) {
    const target = new URL(match.toPath, request.nextUrl.origin);
    return NextResponse.redirect(target, match.statusCode as 301 | 302 | 307 | 308);
  }

  const { defaultLocale, activeLocales } = await getLocaleConfig(request);
  const localeSet = new Set(activeLocales);
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];

  if (firstSegment && localeSet.has(firstSegment)) {
    // 默认语言不带前缀：/en-US/about -> /about
    if (firstSegment === defaultLocale) {
      const restPath = `/${pathSegments.slice(1).join('/')}`;
      const normalizedPath = restPath === '/' ? '/' : restPath;
      const redirectUrl = new URL(`${normalizedPath}${search}`, request.nextUrl.origin);
      const response = NextResponse.redirect(redirectUrl, 308);
      setLocaleCookie(response, defaultLocale);
      return response;
    }

    const response = NextResponse.next();
    setLocaleCookie(response, firstSegment);
    return response;
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE_KEY)?.value;
  const preferredLocale = cookieLocale && localeSet.has(cookieLocale)
    ? cookieLocale
    : matchLocale(request.headers.get('accept-language'), activeLocales, defaultLocale);

  // 默认语言保持无前缀；非默认语言重定向到带前缀 URL
  if (preferredLocale !== defaultLocale) {
    const redirectUrl = new URL(`/${preferredLocale}${pathname}${search}`, request.nextUrl.origin);
    const response = NextResponse.redirect(redirectUrl, 307);
    setLocaleCookie(response, preferredLocale);
    return response;
  }

  const response = NextResponse.next();
  setLocaleCookie(response, defaultLocale);
  return response;
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
