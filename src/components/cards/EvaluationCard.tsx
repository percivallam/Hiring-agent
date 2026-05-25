import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn, getRatingText, getRatingColorClass } from '@/lib/utils';
import type { EvaluationDimension, Rating } from '@/types';

interface EvaluationCardProps {
  candidateName: string;
  dimensions: EvaluationDimension[];
  overallRating: Rating;
  summary: string;
  className?: string;
}

export function EvaluationCard({
  candidateName,
  dimensions,
  overallRating,
  summary,
  className
}: EvaluationCardProps) {
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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-100">{candidateName} - 面试评估</h3>
          <span className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            getRatingColorClass(overallRating)
          )}>
            {getRatingText(overallRating)}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {dimensions.map((dim, index) => (
          <motion.div
            key={dim.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-neutral-300">{dim.name}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-4 h-4',
                      star <= dim.score
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-700'
                    )}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-neutral-500">{dim.comment}</p>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
        <h4 className="text-sm font-medium text-neutral-300 mb-2">综合评价</h4>
        <p className="text-sm text-neutral-400">{summary}</p>
      </div>
    </motion.div>
  );
}
