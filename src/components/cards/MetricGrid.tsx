import { motion } from 'framer-motion';
import { Briefcase, Users, UserPlus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
  openPositions: number;
  activeCandidates: number;
  hiredThisMonth: number;
  avgTimeToHire: number;
}

interface MetricGridProps {
  data: MetricData;
  className?: string;
}

const metrics = [
  { key: 'openPositions', label: '开放岗位', icon: Briefcase, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { key: 'activeCandidates', label: '进行中', icon: Users, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { key: 'hiredThisMonth', label: '本月入职', icon: UserPlus, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  { key: 'avgTimeToHire', label: '平均周期', icon: Clock, color: 'text-violet-400', bgColor: 'bg-violet-500/10', suffix: '天' },
];

export function MetricGrid({ data, className }: MetricGridProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        const value = data[metric.key as keyof MetricData];

        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-neutral-900 rounded-xl border border-neutral-800 p-4"
          >
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', metric.bgColor)}>
              <Icon className={cn('w-5 h-5', metric.color)} />
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {value}{metric.suffix || ''}
            </div>
            <div className="text-sm text-neutral-500 mt-1">{metric.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
