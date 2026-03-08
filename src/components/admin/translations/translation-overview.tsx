'use client';

import { Globe, CheckCircle2 } from 'lucide-react';
import type { TranslationOverview } from '@/types/admin';

interface Props {
  overview: TranslationOverview;
  langNames: Record<string, string>;
}

function ProgressBar({ percent }: { percent: number }) {
  const color =
    percent >= 90 ? 'bg-green-500' : percent >= 60 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="h-2 w-full rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(100, percent)}%` }}
      />
    </div>
  );
}

export function TranslationOverviewDashboard({ overview, langNames }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">内容翻译概览</h1>
        <p className="text-sm text-muted-foreground mt-1">
          各实体在 {overview.activeLanguages} 种活跃语言下的翻译完成情况
        </p>
      </div>

      {/* Overall */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">整体完成度</span>
          </div>
          <span className="text-2xl font-bold">{overview.overallPercent}%</span>
        </div>
        <ProgressBar percent={overview.overallPercent} />
      </div>

      {/* Per entity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {overview.entities.map((entity) => (
          <div key={entity.entity} className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{entity.label}</h3>
              <span className="text-sm font-medium">
                {entity.completionPercent}%
              </span>
            </div>
            <ProgressBar percent={entity.completionPercent} />
            <p className="text-xs text-muted-foreground">
              {entity.totalItems} 项 × {entity.activeLanguages} 种语言 = {entity.totalSlots} 个翻译位，已完成 {entity.translatedSlots}
            </p>

            {/* By language */}
            <div className="space-y-1.5">
              {entity.byLanguage.map((lang) => (
                <div key={lang.locale} className="flex items-center gap-2 text-sm">
                  <span className="w-20 truncate text-muted-foreground">
                    {langNames[lang.locale] ?? lang.locale}
                  </span>
                  <div className="flex-1">
                    <ProgressBar percent={lang.percent} />
                  </div>
                  <span className="w-16 text-right text-xs text-muted-foreground">
                    {lang.translated}/{lang.total}
                  </span>
                  {lang.percent === 100 && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
