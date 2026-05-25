import { motion } from 'framer-motion';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ThinkingIndicator({ steps, currentStep, className }: ThinkingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'bg-neutral-900/80 rounded-xl border border-neutral-800/80 p-4 max-w-md backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-amber-500" />
          </div>
          <div className="absolute inset-0 rounded-full bg-amber-500/20 pulse-ring" />
        </div>
        <span className="text-sm font-medium text-neutral-400">AI 正在思考...</span>
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-2 text-sm',
                isCompleted && 'text-neutral-500',
                isCurrent && 'text-neutral-200',
                !isCompleted && !isCurrent && 'text-neutral-600'
              )}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : isCurrent ? (
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-neutral-800" />
              )}
              <span>{step}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
