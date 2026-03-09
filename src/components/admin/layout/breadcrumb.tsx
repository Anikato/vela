'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

/**
 * 路径段 → 中文标签映射
 * 覆盖后台所有已有路由
 */
const SEGMENT_LABELS: Record<string, string> = {
  admin: '后台',
  products: '产品管理',
  attributes: '产品参数',
  categories: '分类管理',
  tags: '标签管理',
  pages: '页面管理',
  sections: '区块管理',
  items: '子项管理',
  news: '新闻管理',
  inquiries: '询盘管理',
  form: '表单配置',
  stats: '数据统计',
  navigation: '导航菜单',
  themes: '主题管理',
  languages: '语言管理',
  translations: '翻译',
  ui: 'UI 翻译',
  content: '内容翻译',
  auto: '自动翻译',
  media: '媒体库',
  users: '用户管理',
  settings: '站点设置',
  email: '邮件配置',
  scripts: '脚本注入',
  redirects: '重定向',
  data: '导入导出',
};

/**
 * 检查路径段是否为 UUID（动态参数）
 */
function isUUID(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
}

export function Breadcrumb() {
  const pathname = usePathname();

  // 解析路径为面包屑项
  const segments = pathname.split('/').filter(Boolean);

  // 如果只是 /admin 仪表盘，不显示面包屑
  if (segments.length <= 1) return null;

  const crumbs: { label: string; href: string; isLast: boolean }[] = [];
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    const isLast = i === segments.length - 1;

    // 跳过 'admin' 段本身 — 用 Home 图标代替
    if (segment === 'admin') continue;

    // UUID → 显示为 "详情"
    const label = isUUID(segment) ? '详情' : (SEGMENT_LABELS[segment] ?? segment);

    crumbs.push({ label, href: currentPath, isLast });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="面包屑" className="flex items-center gap-1.5 text-sm">
      <Link
        href="/admin"
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb) => (
        <Fragment key={crumb.href}>
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {crumb.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
