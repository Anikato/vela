import { Skeleton } from '@/components/ui/skeleton';

export default function ProductsLoading() {
  return (
    <div className="space-y-4">
      {/* 搜索栏 + 筛选 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Skeleton className="h-10 flex-1 sm:max-w-xs" />
          <Skeleton className="h-10 w-[130px]" />
          <Skeleton className="h-10 w-[160px]" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <Skeleton className="h-4 w-24" />

      {/* 表格骨架 */}
      <div className="rounded-lg border border-border/50 bg-card">
        <div className="flex items-center gap-4 border-b border-border/50 px-4 py-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/30 px-4 py-4 last:border-b-0">
            <Skeleton className="h-5 flex-[2]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
