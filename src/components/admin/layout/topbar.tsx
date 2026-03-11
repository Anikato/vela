'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Breadcrumb } from './breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, LogOut, ExternalLink } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

const MobileSidebar = dynamic(
  () => import('./mobile-sidebar').then((m) => ({ default: m.MobileSidebar })),
  {
    ssr: false,
    loading: () => (
      <button
        className="flex h-10 w-10 items-center justify-center rounded-md border border-border/50 text-muted-foreground md:hidden"
        aria-label="打开菜单"
      >
        <Menu className="h-5 w-5" />
      </button>
    ),
  },
);

interface TopbarProps {
  collapsed: boolean;
}

/**
 * 后台顶栏 — 暗色科技感
 * 包含：移动端菜单触发器、面包屑、用户菜单
 */
export function Topbar({ collapsed }: TopbarProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? '管理员';
  const userEmail = session?.user?.email ?? '';
  const initials = userName.charAt(0).toUpperCase();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm transition-all duration-300',
      )}
    >
      {/* 左侧：移动端菜单 + 面包屑 */}
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div className="hidden md:block">
          <Breadcrumb />
        </div>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-3">
        {/* 访问前台链接 */}
        <Link
          href="/"
          target="_blank"
          className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
        >
          访问网站
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="sm:hidden">
              <Link href="/" target="_blank">
                访问网站
                <ExternalLink className="ml-auto h-3.5 w-3.5" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: '/admin/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
