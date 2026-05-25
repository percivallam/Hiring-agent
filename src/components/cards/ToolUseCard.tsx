import { motion } from 'framer-motion';
import { Search, BarChart3, FileText, Calendar, UserCheck, Globe, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToolType = 'search_candidates' | 'generate_report' | 'write_jd' | 'schedule_interview' | 'evaluate' | 'market_research';

interface ToolUseCardProps {
  tool: ToolType;
  status: 'running' | 'completed' | 'error';
  detail?: string;
  className?: string;
}

const toolConfig: Record<ToolType, { label: string; icon: typeof Search; color: string }> = {
  search_candidates: { label: '搜索候选人库', icon: Search, color: 'text-blue-400' },
  generate_report: { label: '生成招聘报告', icon: BarChart3, color: 'text-emerald-400' },
  write_jd: { label: '撰写职位描述', icon: FileText, color: 'text-amber-400' },
  schedule_interview: { label: '安排面试', icon: Calendar, color: 'text-violet-400' },
  evaluate: { label: '评估候选人', icon: UserCheck, color: 'text-rose-400' },
  market_research: { label: '人才市场调研', icon: Globe, color: 'text-cyan-400' },
};

export function ToolUseCard({ tool, status, detail, className }: ToolUseCardProps) {
  const config = toolConfig[tool];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border',
        status === 'running'
          ? 'bg-neutral-900/80 border-neutral-800/80'
          : status === 'completed'
          ? 'bg-emerald-500/5 border-emerald-500/15'
          : 'bg-red-500/5 border-red-500/15',
        className
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        status === 'running' ? 'bg-neutral-800' : status === 'completed' ? 'bg-emerald-500/10' : 'bg-red-500/10'
      )}>
        {status === 'running' ? (
          <Loader2 className={cn('w-4 h-4 animate-spin', config.color)} />
        ) : status === 'completed' ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Icon className="w-4 h-4 text-red-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-medium', status === 'running' ? 'text-neutral-300' : 'text-neutral-200')}>
            {config.label}
          </span>
          {status === 'running' && (
            <span className="text-[11px] text-neutral-600 tool-pulse">执行中</span>
          )}
        </div>
        {detail && (
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{detail}</p>
        )}
      </div>
    </motion.div>
  );
}
