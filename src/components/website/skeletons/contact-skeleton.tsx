import { Skeleton } from '@/components/ui/skeleton';

export function ContactSkeleton() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="vt-container flex items-center gap-2 py-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-56" />
        </div>

        <div className="grid gap-8 md:grid-cols-5">
          {/* Form */}
          <div className="space-y-5 md:col-span-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-28 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>

          {/* Info */}
          <div className="space-y-4 md:col-span-2">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
