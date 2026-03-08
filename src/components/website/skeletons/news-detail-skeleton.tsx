import { Skeleton } from '@/components/ui/skeleton';

export function NewsDetailSkeleton() {
  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-muted/30 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-3" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-9 w-full" />
          <Skeleton className="mt-2 h-9 w-3/4" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-1 h-5 w-2/3" />
        </header>

        {/* Cover image */}
        <Skeleton className="mb-8 aspect-[16/9] w-full rounded-xl" />

        {/* Content */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: `${70 + Math.random() * 30}%` }}
            />
          ))}
          <Skeleton className="my-6 h-48 w-full rounded-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={`p2-${i}`}
              className="h-4"
              style={{ width: `${65 + Math.random() * 35}%` }}
            />
          ))}
        </div>
      </article>
    </div>
  );
}
