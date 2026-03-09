'use client';

import {
  BarChart3,
  Globe,
  Monitor,
  Package,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import type { InquiryStatsDetail } from '@/server/services/inquiry-stats.service';

const STATUS_LABELS: Record<string, string> = {
  new: '新询盘',
  read: '已读',
  replied: '已回复',
  closed: '已关闭',
  spam: '垃圾',
};

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  read: 'bg-yellow-500',
  replied: 'bg-green-500',
  closed: 'bg-gray-500',
  spam: 'bg-red-500',
};

interface Props {
  stats: InquiryStatsDetail;
}

export function InquiryStatsPage({ stats }: Props) {
  const maxDaily = Math.max(...stats.dailyTrend.map((d) => d.count), 1);
  const maxCountry = Math.max(...stats.countryDistribution.map((d) => d.count), 1);
  const totalStatus = stats.statusDistribution.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">数据统计</h1>
        <p className="mt-1 text-sm text-muted-foreground">询盘趋势、来源分析与产品热度</p>
      </div>

      {/* 汇总卡片 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="近 7 天"
          value={stats.totals.last7Days}
          color="text-blue-400"
        />
        <SummaryCard
          icon={<Calendar className="h-5 w-5" />}
          label="近 30 天"
          value={stats.totals.last30Days}
          color="text-purple-400"
        />
        <SummaryCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="全部"
          value={stats.totals.allTime}
          color="text-cyan-400"
        />
      </div>

      {/* 30天趋势 */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">近 30 天询盘趋势</h2>
        {stats.dailyTrend.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">暂无数据</p>
        ) : (
          <div className="flex items-end gap-[2px]" style={{ height: 160 }}>
            {stats.dailyTrend.map((d) => {
              const h = Math.max((d.count / maxDaily) * 140, 2);
              return (
                <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
                  <div
                    className="mx-auto w-full max-w-[18px] rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                    style={{ height: `${h}px` }}
                  />
                  <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow group-hover:opacity-100">
                    {d.count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {stats.dailyTrend.length > 0 && (
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>{stats.dailyTrend[0].date.slice(5)}</span>
            <span>{stats.dailyTrend[stats.dailyTrend.length - 1].date.slice(5)}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 状态分布 */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">状态分布</h2>
          <div className="space-y-3">
            {stats.statusDistribution.map((d) => {
              const pct = Math.round((d.count / totalStatus) * 100);
              return (
                <div key={d.status}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{STATUS_LABELS[d.status] ?? d.status}</span>
                    <span className="font-mono text-muted-foreground">
                      {d.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${STATUS_COLORS[d.status] ?? 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 国家/地区 TOP 10 */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-4 w-4 text-muted-foreground" />
            客户来源 TOP 10
          </h2>
          {stats.countryDistribution.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.countryDistribution.map((d, i) => (
                <div key={d.country} className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs text-muted-foreground">{i + 1}</span>
                  <div className="flex-1">
                    <div className="mb-0.5 flex items-center justify-between text-sm">
                      <span>{d.country}</span>
                      <span className="font-mono text-muted-foreground">{d.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/60"
                        style={{ width: `${(d.count / maxCountry) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 设备类型 */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            设备类型
          </h2>
          {stats.deviceDistribution.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">暂无数据</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {stats.deviceDistribution.map((d) => {
                const pct = Math.round((d.count / (stats.totals.allTime || 1)) * 100);
                return (
                  <div
                    key={d.device}
                    className="flex-1 min-w-[120px] rounded-lg border p-3 text-center"
                  >
                    <p className="text-2xl font-bold">{pct}%</p>
                    <p className="text-xs text-muted-foreground capitalize">{d.device}</p>
                    <p className="text-xs text-muted-foreground">{d.count} 条</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 热门产品 */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Package className="h-4 w-4 text-muted-foreground" />
            热门询盘产品 TOP 10
          </h2>
          {stats.topProducts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <div
                  key={p.productId}
                  className="flex items-center gap-3 rounded-md border border-border/50 p-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <span className="shrink-0 text-sm font-mono text-muted-foreground">
                    {p.inquiryCount} 次
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold">{value}</p>
        </div>
        <div className={`rounded-lg bg-muted/50 p-3 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
