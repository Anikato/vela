import { Skeleton } from '@/components/ui/skeleton';

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3">
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-3 h-8 w-full" />
      </div>
    </div>
  );
}

export function ProductListSkeleton() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="vt-container flex items-center gap-2 py-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      <div className="vt-container py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-60">
            <div className="space-y-3">
              <Skeleton className="h-3 w-20" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-16 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-8 w-28" />
            </div>

            {/* Product grid */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
