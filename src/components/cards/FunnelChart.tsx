import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FunnelData {
  stages: string[];
  values: number[];
  conversionRates: string[];
}

interface FunnelChartProps {
  data: FunnelData;
  className?: string;
}

export function FunnelChart({ data, className }: FunnelChartProps) {
  const maxValue = Math.max(...data.values);

  return (
    <div className={cn('space-y-3', className)}>
      {data.stages.map((stage, index) => {
        const value = data.values[index];
        const rate = data.conversionRates[index - 1];
        const width = (value / maxValue) * 100;

        return (
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex items-center gap-3">
              <span className="w-16 text-sm text-neutral-500 shrink-0">{stage}</span>
              <div className="flex-1">
                <div className="h-8 bg-neutral-800 rounded-lg overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={cn(
                      'h-full rounded-lg flex items-center px-3',
                      index === 0 ? 'bg-amber-600' :
                      index === 1 ? 'bg-amber-500' :
                      index === 2 ? 'bg-amber-400' :
                      index === 3 ? 'bg-amber-300' : 'bg-amber-200'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      index < 4 ? 'text-white' : 'text-neutral-900'
                    )}>
                      {value}
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>
            {rate && (
              <div className="ml-19 pl-16 mt-1">
                <span className="text-xs text-neutral-600">转化率 {rate}</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
