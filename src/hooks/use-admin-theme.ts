'use client';

import { useEffect } from 'react';

const ADMIN_CLASSES = ['dark', 'admin-dark'] as const;

/**
 * 将 dark + admin-dark 类挂载到 <html>，确保 Radix Portal
 * 弹出内容也能继承后台暗色主题的 CSS 变量。
 *
 * 组件卸载时自动移除，不影响网站前台。
 */
export function useAdminTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(...ADMIN_CLASSES);

    return () => {
      root.classList.remove(...ADMIN_CLASSES);
    };
  }, []);
}
