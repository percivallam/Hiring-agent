import { cn, getRatingColor } from '@/lib/utils';

interface MatchScoreBarProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function MatchScoreBar({
  score,
  size = 'md',
  showLabel = true,
  className
}: MatchScoreBarProps) {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const colorClass = getRatingColor(score);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-neutral-800 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('font-semibold text-neutral-300', textSizes[size])}>
          {score}%
        </span>
      )}
    </div>
  );
}
