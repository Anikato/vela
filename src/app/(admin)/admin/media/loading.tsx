import { Skeleton } from '@/components/ui/skeleton';

export default function MediaLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      {/* 网格骨架 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
