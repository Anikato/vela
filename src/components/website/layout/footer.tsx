import Link from 'next/link';

import { getWebsiteNavigationTree } from '@/server/services/navigation.service';

interface FooterProps {
  locale: string;
  defaultLocale: string;
}

export async function Footer({ locale, defaultLocale }: FooterProps) {
  const navigationItems = await getWebsiteNavigationTree(locale, defaultLocale);
  const flatLinks = navigationItems.filter((item) => Boolean(item.href)).slice(0, 8);

  if (!flatLinks.length) {
    return <footer className="border-t border-border bg-background" />;
  }

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {flatLinks.map((item) => (
            <Link
              key={item.id}
              href={item.href!}
              target={item.openNewTab ? '_blank' : undefined}
              rel={item.openNewTab ? 'noopener noreferrer' : undefined}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
