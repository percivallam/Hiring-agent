import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorHintProps {
  hint: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorHint({ hint, onRetry, className }: ErrorHintProps) {
  return (
    <div
      className={cn(
        'border border-red-400/30 bg-red-400/5 rounded-lg p-4 flex flex-col items-center text-center',
        className,
      )}
    >
      <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
      <p className="text-sm text-red-300 max-w-xs leading-relaxed whitespace-pre-line mb-3">
        {hint}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-400/10 border border-red-400/20 text-sm text-red-300 hover:bg-red-400/20 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重试
        </button>
      )}
    </div>
  );
}
