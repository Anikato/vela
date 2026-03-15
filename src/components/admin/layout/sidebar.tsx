'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { dashboardItem, navGroups, type NavItem } from './nav-config';
import { ChevronLeft } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  siteName: string;
}

/**
 * 后台侧边栏 — 暗色科技感
 * 支持展开/折叠两种模式
 */
export function Sidebar({ collapsed, onToggle, siteName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link
          href="/admin"
          className={cn(
            'flex items-center gap-2.5 font-semibold text-sidebar-foreground',
            collapsed && 'justify-center'
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-[0_0_12px_rgba(0,200,255,0.2)]">
            {siteName.charAt(0).toUpperCase()}
          </span>
          {!collapsed && (
            <span className="text-lg tracking-wide">{siteName}</span>
          )}
        </Link>
      </div>

      {/* 导航 */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {/* 仪表盘 */}
        <div className="px-2">
          <NavLink item={dashboardItem} pathname={pathname} collapsed={collapsed} />
        </div>

        <div className="my-3 mx-3 h-px bg-sidebar-border" />

        {/* 分组 */}
        {navGroups.map((group, idx) => (
          <div key={group.label} className="px-2 py-1">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/60">
                {group.label}
              </p>
            )}
            {collapsed && idx > 0 && (
              <div className="my-1.5 mx-1 h-px bg-sidebar-border" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 折叠按钮 */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={onToggle}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
          {!collapsed && <span>收起</span>}
        </button>
      </div>
    </aside>
  );
}

/** 单个导航链接 */
function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    item.href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  const content = (
    <span
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all',
        collapsed && 'justify-center px-0',
        isActive
          ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(0,200,255,0.15)]'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        item.disabled && 'pointer-events-none opacity-30'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive && 'drop-shadow-[0_0_4px_rgba(0,200,255,0.4)]')} />
      {!collapsed && (
        <>
          <span className="truncate">{item.title}</span>
          {item.disabled && (
            <span className="ml-auto text-[10px] text-sidebar-foreground/30">
              待开发
            </span>
          )}
        </>
      )}
    </span>
  );

  if (item.disabled) {
    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{content}</div>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.title}
            <span className="text-xs text-muted-foreground">待开发</span>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div>{content}</div>;
  }

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={item.href}>{content}</Link>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return <Link href={item.href}>{content}</Link>;
}
