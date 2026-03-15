import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (!items.length) return null;

  return (
    <nav aria-label="breadcrumb" className="border-b border-border bg-background">
      <div className="vt-container flex items-center py-3 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={`${item.label}-${index}`} className="flex items-center">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground/70" />
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
