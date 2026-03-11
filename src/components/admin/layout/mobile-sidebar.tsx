'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { dashboardItem, navGroups, type NavItem } from './nav-config';
import { useState } from 'react';

/**
 * 移动端后台侧边栏 — 暗色科技感
 * 使用 Sheet 组件实现滑出抽屉
 *
 * 通过 next/dynamic ssr:false 导入（见 topbar.tsx），
 * 确保 Radix Sheet 仅在客户端渲染，避免 hydration mismatch。
 */
export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-accent md:hidden"
          aria-label="打开菜单"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-r-border/50 bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border px-4 py-3">
          <SheetTitle className="flex items-center gap-2.5 text-sidebar-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-[0_0_12px_rgba(0,200,255,0.2)]">
              V
            </span>
            Vela 管理后台
          </SheetTitle>
        </SheetHeader>

        <nav className="overflow-y-auto py-3">
          {/* 仪表盘 */}
          <div className="px-2">
            <MobileNavLink
              item={dashboardItem}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>

          <div className="my-3 mx-3 h-px bg-sidebar-border" />

          {/* 分组 */}
          {navGroups.map((group) => (
            <div key={group.label} className="px-2 py-1">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

/** 移动端导航链接 */
function MobileNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive =
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  const content = (
    <span
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
        isActive
          ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(0,200,255,0.15)]'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        item.disabled && 'pointer-events-none opacity-30'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive && 'drop-shadow-[0_0_4px_rgba(0,200,255,0.4)]')} />
      <span className="truncate">{item.title}</span>
      {item.disabled && (
        <span className="ml-auto text-[10px] text-sidebar-foreground/30">
          待开发
        </span>
      )}
    </span>
  );

  if (item.disabled) {
    return <div>{content}</div>;
  }

  return (
    <Link href={item.href} onClick={onNavigate}>
      {content}
    </Link>
  );
}
