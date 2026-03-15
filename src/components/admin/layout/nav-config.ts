/**
 * 后台侧边栏导航配置
 * 按功能域分 5 组：内容、营销、外观、多语言、系统
 * 后台 UI 使用中文
 */

import {
  LayoutDashboard,
  Package,
  SlidersHorizontal,
  FolderTree,
  Tags,
  FileText,
  Newspaper,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Reply,
  Navigation,
  Palette,
  Languages,
  Globe,
  BookOpen,
  Wand2,
  Image,
  Users,
  Settings,
  Mail,
  Code,
  Database,
  ArrowRightLeft,
  ScrollText,
  Search as SearchIcon,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** 仪表盘（不属于任何分组，始终在顶部） */
export const dashboardItem: NavItem = {
  title: '仪表盘',
  href: '/admin',
  icon: LayoutDashboard,
};

/** 按功能域分组的导航菜单 */
export const navGroups: NavGroup[] = [
  {
    label: '内容',
    items: [
      { title: '产品管理', href: '/admin/products', icon: Package },
      { title: '产品参数', href: '/admin/products/attributes', icon: SlidersHorizontal },
      { title: '分类管理', href: '/admin/categories', icon: FolderTree },
      { title: '标签管理', href: '/admin/tags', icon: Tags },
      { title: '页面管理', href: '/admin/pages', icon: FileText },
      { title: '新闻管理', href: '/admin/news', icon: Newspaper },
    ],
  },
  {
    label: '营销',
    items: [
      { title: '询盘管理', href: '/admin/inquiries', icon: MessageSquare },
      { title: '表单配置', href: '/admin/inquiries/form', icon: ClipboardList },
      { title: '自动回复', href: '/admin/inquiries/auto-reply', icon: Reply },
      { title: '数据统计', href: '/admin/inquiries/stats', icon: BarChart3 },
    ],
  },
  {
    label: '外观',
    items: [
      { title: '导航菜单', href: '/admin/navigation', icon: Navigation },
      { title: '主题管理', href: '/admin/themes', icon: Palette },
    ],
  },
  {
    label: '多语言',
    items: [
      { title: '语言管理', href: '/admin/languages', icon: Languages },
      { title: 'UI 翻译', href: '/admin/translations/ui', icon: Globe },
      { title: '内容翻译', href: '/admin/translations/content', icon: BookOpen },
      { title: '自动翻译', href: '/admin/translations/auto', icon: Wand2 },
    ],
  },
  {
    label: '系统',
    items: [
      { title: '媒体库', href: '/admin/media', icon: Image },
      { title: '用户管理', href: '/admin/users', icon: Users },
      { title: '站点设置', href: '/admin/settings', icon: Settings },
      { title: '邮件配置', href: '/admin/settings/email', icon: Mail },
      { title: 'SEO 总览', href: '/admin/settings/seo', icon: SearchIcon },
      { title: '脚本注入', href: '/admin/settings/scripts', icon: Code },
      { title: '重定向', href: '/admin/redirects', icon: ArrowRightLeft },
      { title: '导入导出', href: '/admin/settings/data', icon: Database },
      { title: '操作日志', href: '/admin/audit-logs', icon: ScrollText },
    ],
  },
];
