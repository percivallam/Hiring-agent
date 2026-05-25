import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineStage } from '@/types';

interface TimelineCardProps {
  candidateName: string;
  stages: TimelineStage[];
  className?: string;
}

export function TimelineCard({
  candidateName,
  stages,
  className
}: TimelineCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden',
        className
      )}
    >
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold text-neutral-100">{candidateName}的申请进度</h3>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-neutral-800" />

          <div className="space-y-4">
            {stages.map((stage, index) => {
              const isCompleted = stage.status === 'completed';
              const isCurrent = stage.status === 'current';

              return (
                <motion.div
                  key={stage.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start gap-4"
                >
                  <div className={cn(
                    'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    isCompleted && 'bg-emerald-500/15',
                    isCurrent && 'bg-amber-500/15',
                    !isCompleted && !isCurrent && 'bg-neutral-800'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-neutral-600" />
                    )}
                  </div>

                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'font-medium',
                        isCompleted && 'text-neutral-100',
                        isCurrent && 'text-amber-400',
                        !isCompleted && !isCurrent && 'text-neutral-600'
                      )}>
                        {stage.name}
                      </span>
                      {isCurrent && (
                        <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                          当前
                        </span>
                      )}
                    </div>
                    {stage.date && (
                      <p className="text-sm text-neutral-500 mt-0.5">{stage.date}</p>
                    )}
                    {stage.note && (
                      <p className="text-sm text-neutral-400 mt-1">{stage.note}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
