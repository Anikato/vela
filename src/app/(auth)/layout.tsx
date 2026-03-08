'use client';

import { useAdminTheme } from '@/hooks/use-admin-theme';

/**
 * 认证页面布局
 * 独立于后台管理布局（无侧边栏、顶栏）
 * 共享暗色科技感主题
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAdminTheme();

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
