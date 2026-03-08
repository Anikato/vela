'use client';

import { useEffect } from 'react';

const COOKIE_KEY = 'vela_locale';

function getLocaleCookie(): string | null {
  const target = `${COOKIE_KEY}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) return trimmed.slice(target.length);
  }
  return null;
}

export function HtmlLangSync() {
  useEffect(() => {
    const locale = getLocaleCookie();
    if (locale && document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, []);

  return null;
}
