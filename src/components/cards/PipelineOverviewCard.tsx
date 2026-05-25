import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineOverviewMessage } from '@/types';

interface PipelineOverviewCardProps {
  title: string;
  jobs: PipelineOverviewMessage['jobs'];
  summary: string;
  className?: string;
}

export function PipelineOverviewCard({
  title,
  jobs,
  summary,
  className
}: PipelineOverviewCardProps) {
  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: '健康' },
    at_risk: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: '风险' },
    stuck: { icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: '停滞' },
  };

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

      <div className="divide-y divide-neutral-800">
        {jobs.map((job, idx) => {
          const config = statusConfig[job.status];
          const Icon = config.icon;
          return (
            <motion.div
              key={job.jobId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-neutral-200">{job.title}</h4>
                  <p className="text-xs text-neutral-500">{job.department} · 已开放{job.openDays}天</p>
                </div>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1', config.bg, config.color, config.border)}>
                  <Icon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>

              {/* Pipeline mini visualization */}
              <div className="flex items-center gap-1">
                {job.pipeline.map((stage, sIdx) => (
                  <div key={sIdx} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-neutral-500">{stage.stage}</span>
                      <span className="text-[10px] text-neutral-400">{stage.count}</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((stage.count / stage.target) * 100, 100)}%` }}
                        transition={{ delay: sIdx * 0.1, duration: 0.5 }}
                        className={cn(
                          'h-full rounded-full',
                          stage.count >= stage.target ? 'bg-emerald-500' : stage.count >= stage.target * 0.5 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {job.bottlenecks && job.bottlenecks.length > 0 && (
                <div className="mt-2 space-y-1">
                  {job.bottlenecks.map((b, bIdx) => (
                    <p key={bIdx} className="text-xs text-amber-400">⚠️ {b}</p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
        <p className="text-sm text-neutral-300">{summary}</p>
      </div>
    </motion.div>
  );
}
