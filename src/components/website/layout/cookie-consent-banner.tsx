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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConsentCookie('rejected');
              setDismissed(true);
            }}
          >
            {rejectText}
          </Button>
          <Button
            size="sm"
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
