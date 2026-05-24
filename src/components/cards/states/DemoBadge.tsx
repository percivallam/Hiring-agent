import { BeakerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DemoBadgeProps {
  visible?: boolean;
  className?: string;
}

export function DemoBadge({ visible = true, className }: DemoBadgeProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-amber-500/10 border border-amber-500/20 text-[10px] font-medium text-amber-400',
        className,
      )}
    >
      <BeakerIcon className="w-3 h-3" />
      演示数据
    </div>
  );
}
