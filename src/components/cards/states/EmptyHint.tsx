import { SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyHintProps {
  hint: string;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyHint({ hint, icon, className }: EmptyHintProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-10 text-center', className)}>
      <div className="mb-3 text-neutral-700">
        {icon ?? <SearchX className="w-10 h-10" />}
      </div>
      <p className="text-sm text-neutral-400 max-w-xs leading-relaxed whitespace-pre-line">
        {hint}
      </p>
    </div>
  );
}
