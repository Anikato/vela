'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface NavNode {
  id: string;
  label: string;
  href: string | null;
  openNewTab: boolean;
  children: NavNode[];
}

interface MobileNavProps {
  items: NavNode[];
}

export function MobileNav({ items }: MobileNavProps) {
  const [open, setOpen] = useState(false);

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
        </div>
      ) : null}
    </div>
  );
}
