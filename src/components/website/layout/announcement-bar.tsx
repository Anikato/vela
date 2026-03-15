'use client';

import { useState, useSyncExternalStore, useCallback } from 'react';
import { X } from 'lucide-react';

interface AnnouncementBarProps {
  text: string;
  bgColor: string;
  textColor: string;
  dismissible: boolean;
  linkUrl?: string;
}

const COOKIE_NAME = 'vt-announcement-dismissed';

function getSnapshot() {
  return document.cookie.includes(`${COOKIE_NAME}=1`);
}

function getServerSnapshot() {
  return true;
}

const subscribe = () => () => {};

export function AnnouncementBar({ text, bgColor, textColor, dismissible, linkUrl }: AnnouncementBarProps) {
  const cookieDismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [manualDismissed, setManualDismissed] = useState(false);
  const dismissed = cookieDismissed || manualDismissed;

  if (dismissed) return null;

  function handleDismiss() {
    document.cookie = `${COOKIE_NAME}=1;path=/;max-age=86400`;
    setManualDismissed(true);
  }

  const bg = /^(hsl|oklch|rgb|#)/.test(bgColor.trim()) ? bgColor : `hsl(${bgColor})`;
  const fg = /^(hsl|oklch|rgb|#)/.test(textColor.trim()) ? textColor : `hsl(${textColor})`;

  const content = (
    <span className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: text }} />
  );

  return (
    <div
      className="relative flex items-center justify-center px-10 py-2 text-center"
      style={{ backgroundColor: bg, color: fg }}
    >
      {linkUrl ? (
        <a href={linkUrl} className="hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
