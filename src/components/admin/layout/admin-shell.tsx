'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionProvider } from 'next-auth/react';
import { useAdminTheme } from '@/hooks/use-admin-theme';

interface AdminShellProps {
  children: React.ReactNode;
}

/**
 * 后台管理壳组件
 * 整合侧边栏 + 顶栏 + 内容区
 *
 * 桌面端：侧边栏固定在左侧，可折叠
 * 移动端：侧边栏隐藏，通过汉堡菜单触发 Sheet 抽屉
 */
export function AdminShell({ children }: AdminShellProps) {
  useAdminTheme();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SessionProvider>
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background">
        {/* 桌面端侧边栏 */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((prev) => !prev)}
          />
        </div>

        {/* 主内容区域 */}
        <div
          className={cn(
            'flex flex-col transition-all duration-300',
            collapsed ? 'md:ml-16' : 'md:ml-60'
          )}
        >
          <Topbar collapsed={collapsed} />

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
    </SessionProvider>
  );
}
