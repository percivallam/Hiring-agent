import { motion } from 'framer-motion';
import { CheckCircle, User, Users, Wrench, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingPlanMessage } from '@/types';

interface OnboardingPlanCardProps {
  candidateName: string;
  position: string;
  startDate: string;
  plan: OnboardingPlanMessage['plan'];
  milestones: string[];
  className?: string;
}

export function OnboardingPlanCard({
  candidateName,
  position,
  startDate,
  plan,
  milestones,
  className
}: OnboardingPlanCardProps) {
  const typeConfig = {
    hr: { icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'HR' },
    manager: { icon: UserCheck, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Manager' },
    buddy: { icon: User, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Buddy' },
    self: { icon: Wrench, color: 'text-neutral-400', bg: 'bg-neutral-700', label: '自己' },
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
        <h3 className="font-semibold text-neutral-100">30天融入计划</h3>
        <p className="text-xs text-neutral-500 mt-1">{candidateName} · {position} · 预计入职：{startDate}</p>
      </div>

      <div className="divide-y divide-neutral-800">
        {plan.map((week, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="p-4"
          >
            <h4 className="text-sm font-medium text-neutral-300 mb-3">{week.day}</h4>
            <div className="space-y-2">
              {week.tasks.map((task, tIdx) => {
                const config = typeConfig[task.type];
                const Icon = config.icon;
                return (
                  <div key={tIdx} className="flex items-center gap-3">
                    <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1', config.bg, config.color)}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <span className="text-sm text-neutral-400">{task.title}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-neutral-800/30 border-t border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-neutral-300">关键里程碑</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {milestones.map((m, idx) => (
            <span key={idx} className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
              {m}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
