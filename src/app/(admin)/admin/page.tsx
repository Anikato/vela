import Link from 'next/link';
import {
  Package,
  FolderTree,
  Newspaper,
  MessageSquare,
  Image,
  Eye,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { eq, sql, desc, and } from 'drizzle-orm';

import { db } from '@/server/db';
import { products, categories, news, media } from '@/server/db/schema';
import { getInquiryStats, getInquiryList } from '@/server/services/inquiry.service';

export default async function AdminDashboardPage() {
  const [
    productCount,
    categoryCount,
    newsCount,
    mediaCount,
    inquiryStats,
    recentInquiries,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(products).then((r) => Number(r[0].count)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(categories)
      .where(eq(categories.isActive, true))
      .then((r) => Number(r[0].count)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(news)
      .where(eq(news.status, 'published'))
      .then((r) => Number(r[0].count)),
    db.select({ count: sql<number>`count(*)` }).from(media).then((r) => Number(r[0].count)),
    getInquiryStats(),
    getInquiryList({ page: 1, pageSize: 5 }),
  ]);

  const stats = [
    { label: '产品总数', value: productCount, icon: Package, href: '/admin/products', color: 'text-blue-400' },
    { label: '活跃分类', value: categoryCount, icon: FolderTree, href: '/admin/categories', color: 'text-green-400' },
    { label: '已发布新闻', value: newsCount, icon: Newspaper, href: '/admin/news', color: 'text-purple-400' },
    { label: '媒体文件', value: mediaCount, icon: Image, href: '/admin/media', color: 'text-orange-400' },
    { label: '总询盘', value: inquiryStats.total, icon: MessageSquare, href: '/admin/inquiries', color: 'text-cyan-400' },
    { label: '新询盘', value: inquiryStats.new, icon: TrendingUp, href: '/admin/inquiries', color: 'text-red-400' },
    { label: '已回复', value: inquiryStats.replied, icon: Eye, href: '/admin/inquiries', color: 'text-emerald-400' },
  ];

  const STATUS_LABELS: Record<string, string> = {
    new: '新询盘',
    read: '已读',
    replied: '已回复',
    closed: '已关闭',
    spam: '垃圾',
  };

  const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    read: 'bg-yellow-500/20 text-yellow-400',
    replied: 'bg-green-500/20 text-green-400',
    closed: 'bg-gray-500/20 text-gray-400',
    spam: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">仪表盘</h1>
        <p className="mt-1 text-sm text-muted-foreground">欢迎使用 Vela 管理后台</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-lg border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-[0_0_20px_rgba(0,200,255,0.05)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 最近询盘 */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">最近询盘</h2>
          <Link
            href="/admin/inquiries"
            className="text-sm text-primary hover:underline"
          >
            查看全部
          </Link>
        </div>
        {recentInquiries.items.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            暂无询盘
          </div>
        ) : (
          <div className="divide-y">
            {recentInquiries.items.map((inq) => (
              <div key={inq.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{inq.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[inq.status] ?? ''}`}
                    >
                      {STATUS_LABELS[inq.status] ?? inq.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {inq.email} · {inq.productCount} 个产品
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" />
                  {inq.createdAt.toLocaleDateString('zh-CN')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
