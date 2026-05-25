import { motion } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComparisonMessage } from '@/types';
import { Avatar } from '@/components/shared/Avatar';

interface ComparisonCardProps {
  title: string;
  candidateA: { name: string; avatar?: string | null };
  candidateB: { name: string; avatar?: string | null };
  items: ComparisonMessage['items'];
  recommendation?: string;
  className?: string;
}

export function ComparisonCard({
  title,
  candidateA,
  candidateB,
  items,
  recommendation,
  className
}: ComparisonCardProps) {
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
        <h3 className="font-semibold text-neutral-100">{title}</h3>
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-800/30">
        <div className="text-center">
          <Avatar name={candidateA.name} src={candidateA.avatar || null} size="md" />
          <p className="text-sm font-medium text-neutral-200 mt-1">{candidateA.name}</p>
        </div>
        <div className="flex items-center justify-center">
          <span className="text-xs text-neutral-500">VS</span>
        </div>
        <div className="text-center">
          <Avatar name={candidateB.name} src={candidateB.avatar || null} size="md" />
          <p className="text-sm font-medium text-neutral-200 mt-1">{candidateB.name}</p>
        </div>
      </div>

      {/* Comparison Items */}
      <div className="divide-y divide-neutral-800">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="grid grid-cols-3 gap-2 px-4 py-2.5"
          >
            <div className={cn(
              'text-sm',
              item.advantage === 'A' ? 'text-emerald-400 font-medium' : 'text-neutral-400'
            )}>
              {item.candidateA}
            </div>
            <div className="text-xs text-neutral-500 text-center flex items-center justify-center">
              {item.label}
              {item.advantage === 'A' && <Check className="w-3 h-3 text-emerald-400 ml-1" />}
              {item.advantage === 'B' && <Check className="w-3 h-3 text-emerald-400 ml-1" />}
              {item.advantage === 'neutral' && <Minus className="w-3 h-3 text-neutral-600 ml-1" />}
            </div>
            <div className={cn(
              'text-sm',
              item.advantage === 'B' ? 'text-emerald-400 font-medium' : 'text-neutral-400'
            )}>
              {item.candidateB}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
          <p className="text-sm text-neutral-300">
            <span className="font-medium text-amber-400">建议：</span>{recommendation}
          </p>
        </div>
      )}
    </motion.div>
  );
}
