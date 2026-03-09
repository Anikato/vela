import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* 表格骨架 */}
      <div className="rounded-lg border border-border/50 bg-card">
        {/* 表头 */}
        <div className="flex items-center gap-4 border-b border-border/50 px-4 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {/* 行 */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/30 px-4 py-3 last:border-b-0">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
