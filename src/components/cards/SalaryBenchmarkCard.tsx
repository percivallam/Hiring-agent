import { motion } from 'framer-motion';
import { TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SalaryBenchmarkMessage } from '@/types';

interface SalaryBenchmarkCardProps {
  title: string;
  position: string;
  benchmarks: SalaryBenchmarkMessage['benchmarks'];
  marketMedian: number;
  recommendation: string;
  className?: string;
}

export function SalaryBenchmarkCard({
  title,
  position,
  benchmarks,
  marketMedian,
  recommendation,
  className
}: SalaryBenchmarkCardProps) {
  const maxSalary = Math.max(...benchmarks.map(b => b.median));

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
        <p className="text-xs text-neutral-500 mt-1">{position}</p>
      </div>

      <div className="p-4 space-y-4">
        {benchmarks.map((b, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-300">{b.company}</span>
                <span className="text-xs text-neutral-500">{b.level}</span>
              </div>
              <span className="text-sm text-neutral-400">{b.salaryRange}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(b.median / maxSalary) * 100}%` }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  b.median >= marketMedian ? 'bg-emerald-500' : 'bg-amber-500'
                )}
              />
            </div>
          </motion.div>
        ))}

        <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
          <TrendingUp className="w-4 h-4 text-neutral-500" />
          <span className="text-xs text-neutral-500">市场中位：<span className="text-neutral-300 font-medium">{marketMedian}K</span></span>
        </div>
      </div>

      <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
        <div className="flex items-start gap-2">
          <DollarSign className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-300">{recommendation}</p>
        </div>
      </div>
    </motion.div>
  );
}
