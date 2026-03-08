import Link from 'next/link';
import { Home } from 'lucide-react';

import { getActiveLanguages, type Language } from '@/server/services/language.service';
import {
  getWebsiteNavigationTree,
  type WebsiteNavigationNode,
} from '@/server/services/navigation.service';
import { LanguageSwitcher } from './language-switcher';
import { MobileNav } from './mobile-nav';

interface HeaderProps {
  locale: string;
  defaultLocale: string;
}

function DesktopNavItem({ item }: { item: WebsiteNavigationNode }) {
  return (
    <div className="group relative">
      {item.href ? (
        <Link
          href={item.href}
          target={item.openNewTab ? '_blank' : undefined}
          rel={item.openNewTab ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent hover:text-accent-foreground"
        >
          {item.label}
        </Link>
      ) : (
        <span className="inline-flex items-center rounded-md px-3 py-2 text-sm text-muted-foreground">
          {item.label}
        </span>
      )}

      {item.children.length ? (
        <div className="invisible absolute left-0 top-full z-40 mt-1 min-w-44 rounded-md border border-border bg-popover p-1 opacity-0 shadow-sm transition-all group-hover:visible group-hover:opacity-100">
          {item.children.map((child) =>
            child.href ? (
              <Link
                key={child.id}
                href={child.href}
                target={child.openNewTab ? '_blank' : undefined}
                rel={child.openNewTab ? 'noopener noreferrer' : undefined}
                className="block rounded px-3 py-2 text-sm text-popover-foreground hover:bg-accent"
              >
                {child.label}
              </Link>
            ) : (
              <span
                key={child.id}
                className="block rounded px-3 py-2 text-sm text-muted-foreground"
              >
                {child.label}
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function mapLocaleOptions(languages: Language[]) {
  return languages.map((item) => ({
    code: item.code,
    nativeName: item.nativeName || item.code,
  }));
}

export async function Header({ locale, defaultLocale }: HeaderProps) {
  const [languages, navigationItems] = await Promise.all([
    getActiveLanguages(),
    getWebsiteNavigationTree(locale, defaultLocale),
  ]);

  const localeOptions = mapLocaleOptions(languages);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link
            href={locale === defaultLocale ? '/' : `/${locale}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent"
            aria-label="home"
          >
            <Home className="h-4 w-4" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => (
              <DesktopNavItem key={item.id} item={item} />
            ))}
          </nav>
        </div>

        <div className="hidden md:block">
          <LanguageSwitcher locales={localeOptions} defaultLocale={defaultLocale} />
        </div>

        <MobileNav items={navigationItems} />
      </div>
    </header>
  );
}
