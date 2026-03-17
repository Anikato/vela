'use client';

import { useEffect } from 'react';

import { getLocaleCookie } from '@/lib/locale-cookie';

export function HtmlLangSync() {
  useEffect(() => {
    const locale = getLocaleCookie();
    if (locale && document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, []);

  return null;
}
