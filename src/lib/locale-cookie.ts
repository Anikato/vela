const LOCALE_COOKIE_KEY = 'vela_locale';
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * 客户端设置 locale cookie，确保在导航前 cookie 已更新，
 * 这样 middleware 读取到的是用户主动选择的语言而非旧值。
 */
export function setLocaleCookie(locale: string): void {
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=${MAX_AGE}; samesite=lax`;
}

export function getLocaleCookie(): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_KEY}=([^;]*)`));
  return match?.[1] || undefined;
}
