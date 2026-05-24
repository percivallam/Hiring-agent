import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="h-5 w-2/3 bg-neutral-800 animate-pulse rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-neutral-800 animate-pulse rounded"
          style={{ width: `${85 - i * 12}%` }}
        />
      ))}
    </div>
  );
}
