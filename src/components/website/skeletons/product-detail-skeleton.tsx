import { Skeleton } from '@/components/ui/skeleton';

export function ProductDetailSkeleton() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="vt-container flex items-center gap-2 py-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="vt-container py-6">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-md" />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-8 w-3/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-18 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />

            {/* Commercial info table */}
            <div className="space-y-2 rounded-lg border border-border/60 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 flex-1 rounded-md" />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10 space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Related products */}
        <div className="mt-12 space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border/60 bg-card">
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="mt-2 h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
