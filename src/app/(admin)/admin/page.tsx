import Link from 'next/link';
import {
  Languages,
  Users,
  Image,
  Package,
  FileText,
  MessageSquare,
  FolderTree,
  Tags,
  SlidersHorizontal,
} from 'lucide-react';

/**
 * 后台首页 — 快捷入口卡片
 * P10 阶段替换为完整仪表盘（概览数据 + 最近询盘）
 */
const quickLinks = [
  {
    title: '语言管理',
    description: '管理网站支持的语言和区域设置',
    href: '/admin/languages',
    icon: Languages,
    available: true,
  },
  {
    title: '产品管理',
    description: '管理产品目录和参数',
    href: '/admin/products',
    icon: Package,
    available: true,
  },
  {
    title: '分类管理',
    description: '管理产品分类和层级结构',
    href: '/admin/categories',
    icon: FolderTree,
    available: true,
  },
  {
    title: '标签管理',
    description: '管理产品标签和多语言名称',
    href: '/admin/tags',
    icon: Tags,
    available: true,
  },
  {
    title: '产品参数',
    description: '管理每个产品的参数分组与参数项',
    href: '/admin/products/attributes',
    icon: SlidersHorizontal,
    available: true,
  },
  {
    title: '页面管理',
    description: '构建和管理网站页面',
    href: '/admin/pages',
    icon: FileText,
    available: false,
  },
  {
    title: '询盘管理',
    description: '查看和处理客户询盘',
    href: '/admin/inquiries',
    icon: MessageSquare,
    available: false,
  },
  {
    title: '媒体库',
    description: '上传和管理文件资源',
    href: '/admin/media',
    icon: Image,
    available: true,
  },
  {
    title: '用户管理',
    description: '管理后台账号',
    href: '/admin/users',
    icon: Users,
    available: true,
  },
];

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          欢迎使用 Vela 管理后台
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;

          if (!link.available) {
            return (
              <div
                key={link.href}
                className="rounded-lg border border-border/50 bg-card/50 p-6 opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{link.title}</h2>
                    <p className="text-xs text-muted-foreground">即将推出</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-lg border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(0,200,255,0.05)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">{link.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
