import { Skeleton } from '@/components/ui/skeleton';

function NewsCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-5 w-4/5" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
        <Skeleton className="mt-3 h-4 w-20" />
      </div>
    </div>
  );
}

export function NewsListSkeleton() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-muted/30 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
