import { Skeleton } from '@/components/ui/skeleton';

const PARAGRAPH_1_WIDTHS = [95, 88, 92, 78, 100, 85, 73, 90];
const PARAGRAPH_2_WIDTHS = [82, 96, 70, 88, 76];

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
          {PARAGRAPH_1_WIDTHS.map((w, i) => (
            <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
          ))}
          <Skeleton className="my-6 h-48 w-full rounded-lg" />
          {PARAGRAPH_2_WIDTHS.map((w, i) => (
            <Skeleton key={`p2-${i}`} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      </article>
    </div>
  );
}
