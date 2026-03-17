'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Globe } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavNode {
  id: string;
  label: string;
  href: string | null;
  openNewTab: boolean;
  children: NavNode[];
}

interface LocaleOption {
  code: string;
  nativeName: string;
}

interface MobileNavProps {
  items: NavNode[];
  locales?: LocaleOption[];
  defaultLocale?: string;
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
  if (targetLocale === defaultLocale) return basePath;
  if (basePath === '/') return `/${targetLocale}`;
  return `/${targetLocale}${basePath}`;
}

export function MobileNav({ items, locales, defaultLocale }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const localeCodes = locales?.map((l) => l.code) ?? [];
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const currentLocale = first && localeCodes.includes(first) ? first : (defaultLocale ?? '');
  const showLangSwitcher = locales && locales.length > 1 && defaultLocale;

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-border bg-background px-4 py-3 shadow-sm">
          <nav className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="space-y-1">
                {item.href ? (
                  <Link
                    href={item.href}
                    target={item.openNewTab ? '_blank' : undefined}
                    rel={item.openNewTab ? 'noopener noreferrer' : undefined}
                    className="block rounded-md px-2 py-2 text-sm hover:bg-accent"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <div className="rounded-md px-2 py-2 text-sm text-muted-foreground">
                    {item.label}
                  </div>
                )}

                {item.children.length ? (
                  <div className="space-y-1 pl-4">
                    {item.children.map((child) =>
                      child.href ? (
                        <Link
                          key={child.id}
                          href={child.href}
                          target={child.openNewTab ? '_blank' : undefined}
                          rel={child.openNewTab ? 'noopener noreferrer' : undefined}
                          className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ) : (
                        <div
                          key={child.id}
                          className="rounded-md px-2 py-1.5 text-sm text-muted-foreground"
                        >
                          {child.label}
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          {showLangSwitcher && (
            <>
              <div className="my-3 border-t border-border/60" />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Language</span>
                </div>
                {locales!.map((locale) => {
                  const isActive = locale.code === currentLocale;
                  return (
                    <Link
                      key={locale.code}
                      href={switchLocalePath(pathname, locale.code, defaultLocale!, localeCodes)}
                      prefetch={false}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 font-medium text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <span>{locale.nativeName}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
