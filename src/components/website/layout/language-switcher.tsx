'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  return (
    <div className="flex items-center gap-1">
      {locales.map((item) => (
        <Link
          key={item.code}
          href={switchLocalePath(pathname, item.code, defaultLocale, localeCodes)}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          prefetch={false}
        >
          {item.nativeName}
        </Link>
      ))}
    </div>
  );
}
