'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';

import { Button } from '@/components/ui/button';

const COOKIE_KEY = 'vela_cookie_consent';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

interface CookieConsentBannerProps {
  title?: string;
  description?: string;
  acceptText?: string;
  rejectText?: string;
}

function setConsentCookie(value: 'accepted' | 'rejected') {
  document.cookie = `${COOKIE_KEY}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function getConsentCookie(): string | null {
  const target = `${COOKIE_KEY}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(target)) {
      return trimmed.slice(target.length);
    }
  }
  return null;
}

export function CookieConsentBanner({
  title,
  description,
  acceptText,
  rejectText,
}: CookieConsentBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const canRender = useMemo(() => {
    return Boolean(title?.trim() && description?.trim() && acceptText?.trim() && rejectText?.trim());
  }, [title, description, acceptText, rejectText]);

  const hasConsent = useSyncExternalStore(
    () => () => {},
    () => Boolean(getConsentCookie()),
    () => true,
  );

  if (!canRender || hasConsent || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 sm:bottom-6 sm:left-6">
      <div className="rounded-2xl border border-border/60 bg-background/95 p-5 shadow-2xl backdrop-blur-lg">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-4.5 w-4.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
              <path d="M8.5 8.5v.01" />
              <path d="M16 15.5v.01" />
              <path d="M12 12v.01" />
              <path d="M11 17v.01" />
              <path d="M7 14v.01" />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-tight">{title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              setConsentCookie('rejected');
              setDismissed(true);
            }}
          >
            {rejectText}
          </Button>
          <Button
            size="sm"
            className="flex-1 text-xs"
            onClick={() => {
              setConsentCookie('accepted');
              setDismissed(true);
            }}
          >
            {acceptText}
          </Button>
        </div>
      </div>
    </div>
  );
}
