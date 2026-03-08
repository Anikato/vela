import { AdminShell } from '@/components/admin/layout';

/**
 * 后台布局
 * 使用 AdminShell 提供侧边栏 + 顶栏 + 内容区结构
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
