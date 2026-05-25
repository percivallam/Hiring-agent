import { cn } from '@/lib/utils';

interface TagGroupProps {
  tags: string[];
  size?: 'sm' | 'md';
  maxTags?: number;
  className?: string;
}

export function TagGroup({
  tags,
  size = 'sm',
  maxTags = 5,
  className
}: TagGroupProps) {
  const displayTags = tags.slice(0, maxTags);
  const remaining = tags.length - maxTags;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayTags.map((tag) => (
        <span
          key={tag}
          className={cn(
            'rounded-full bg-neutral-800 text-neutral-400 font-medium border border-neutral-800',
            sizeClasses[size]
          )}
        >
          {tag}
        </span>
      ))}
      {remaining > 0 && (
        <span className={cn(
          'rounded-full bg-neutral-800/50 text-neutral-600 border border-neutral-800/50',
          sizeClasses[size]
        )}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
