'use client';

import { CheckCircle2, AlertCircle, TrendingUp, FileText } from 'lucide-react';
import type { SeoOverviewData } from '@/server/services/seo-overview.service';

interface Props {
  data: SeoOverviewData;
}

function getGradeColor(pct: number): string {
  if (pct >= 80) return 'text-green-500';
  if (pct >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

function getBarColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function SeoOverviewPage({ data }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SEO 完成度</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          检查产品、新闻、页面和分类的 SEO 标题及描述填写情况
        </p>
      </div>

      {/* 总体评分 */}
      <div className="flex items-center gap-6 rounded-lg border bg-card p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-current">
          <span className={`text-2xl font-bold ${getGradeColor(data.overallPercent)}`}>
            {data.overallPercent}%
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold">整体 SEO 完成度</p>
          <p className="text-sm text-muted-foreground">
            共 {data.totalFields} 个 SEO 字段，已填写 {data.filledFields} 个
          </p>
          {data.overallPercent < 80 && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-yellow-500">
              <AlertCircle className="h-4 w-4" />
              建议将所有内容的 SEO 标题和描述填写完整以获得更好的搜索引擎排名
            </div>
          )}
          {data.overallPercent >= 80 && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              SEO 覆盖度良好
            </div>
          )}
        </div>
      </div>

      {/* 各实体分项 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {data.entities.map((entity) => (
          <div key={entity.entity} className="rounded-lg border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{entity.label}</span>
              </div>
              <span className={`text-lg font-bold ${getGradeColor(entity.completionPercent)}`}>
                {entity.completionPercent}%
              </span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(entity.completionPercent)}`}
                style={{ width: `${entity.completionPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-lg font-bold">{entity.totalItems}</p>
                <p className="text-muted-foreground">总数</p>
              </div>
              <div>
                <p className="text-lg font-bold">{entity.withSeoTitle}</p>
                <p className="text-muted-foreground">有标题</p>
              </div>
              <div>
                <p className="text-lg font-bold">{entity.withSeoDescription}</p>
                <p className="text-muted-foreground">有描述</p>
              </div>
            </div>
            {entity.totalItems > 0 && entity.completionPercent < 100 && (
              <p className="mt-3 text-xs text-muted-foreground">
                还需补充 {entity.totalItems - entity.withSeoTitle} 个标题和{' '}
                {entity.totalItems - entity.withSeoDescription} 个描述
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
