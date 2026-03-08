import { Skeleton } from '@/components/ui/skeleton';

export function HomeSkeleton() {
  return (
    <main>
      {/* Hero section */}
      <div className="relative">
        <Skeleton className="h-[60vh] w-full rounded-none" />
      </div>

      {/* Content sections */}
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* Feature grid */}
        <div className="space-y-6 text-center">
          <Skeleton className="mx-auto h-7 w-48" />
          <Skeleton className="mx-auto h-5 w-80" />
          <div className="grid gap-6 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border/60 p-6">
                <Skeleton className="mx-auto h-12 w-12 rounded-lg" />
                <Skeleton className="mx-auto h-5 w-28" />
                <Skeleton className="mx-auto h-4 w-full" />
                <Skeleton className="mx-auto h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Product showcase */}
        <div className="space-y-6 text-center">
          <Skeleton className="mx-auto h-7 w-40" />
          <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border/60">
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
    </main>
  );
}
