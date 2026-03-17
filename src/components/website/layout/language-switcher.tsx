'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Globe } from 'lucide-react';

import { cn } from '@/lib/utils';
import { setLocaleCookie } from '@/lib/locale-cookie';

interface LocaleOption {
  code: string;
  nativeName: string;
}

interface LanguageSwitcherProps {
  locales: LocaleOption[];
  defaultLocale: string;
}

function switchLocalePath(
  pathname: string,
  targetLocale: string,
  defaultLocale: string,
  localeCodes: string[],
): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const hasLocalePrefix = first ? localeCodes.includes(first) : false;

  const baseSegments = hasLocalePrefix ? segments.slice(1) : segments;
  const basePath = `/${baseSegments.join('/')}`.replace(/\/+$/, '') || '/';

  if (targetLocale === defaultLocale) {
    return basePath;
  }

  if (basePath === '/') {
    return `/${targetLocale}`;
  }

  return `/${targetLocale}${basePath}`;
}

export function LanguageSwitcher({ locales, defaultLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const localeCodes = locales.map((item) => item.code);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const currentLocale = first && localeCodes.includes(first) ? first : defaultLocale;
  const currentOption = locales.find((l) => l.code === currentLocale);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  if (locales.length <= 1) return null;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Switch language"
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="max-w-20 truncate">{currentOption?.nativeName ?? currentLocale}</span>
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 max-h-64 w-44 overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-lg">
          {locales.map((item) => {
            const isActive = item.code === currentLocale;
            return (
              <Link
                key={item.code}
                href={switchLocalePath(pathname, item.code, defaultLocale, localeCodes)}
                prefetch={false}
                onClick={() => {
                  setLocaleCookie(item.code);
                  setOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-popover-foreground hover:bg-accent',
                )}
              >
                <span className="flex-1 truncate">{item.nativeName}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
