import { useEffect, useState } from 'react';
import { BarChart3, AlertTriangle, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PipelineReportCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C7Props extends PipelineReportCard {
  onActionClick?: (message: string) => void;
}

export function C7_PipelineReportCard(props: C7Props) {
  const { mode, title, report_type, period, metrics, funnel, insights, alerts, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const m = showDemo && !metrics.open_positions ? DEMO_METRICS : metrics;
  const f = showDemo && funnel.length === 0 ? DEMO_FUNNEL : funnel;
  const a = alerts ?? [];
  const ins = showDemo && insights.length === 0 ? DEMO_INSIGHTS : insights;

  if (mode === 'loading') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div className="h-5 w-48 bg-neutral-800 animate-pulse rounded mb-4" />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h3 className="text-base font-semibold text-neutral-100 mb-1">{title}</h3>
        <EmptyHint hint={empty_hint} icon={<BarChart3 className="w-10 h-10" />} />
        {renderActions(actions, onActionClick)}
      </div>
    );
  }

  if (mode === 'error') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h3 className="text-base font-semibold text-neutral-100 mb-3">{title}</h3>
        <ErrorHint hint={error_hint} />
        {renderActions(actions, onActionClick)}
      </div>
    );
  }

  return (
    <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors overflow-hidden">
      <DemoBadge visible={showDemo} />
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">{reportTypeLabel(report_type)}</span>
        </div>
        <p className="text-xs text-neutral-600">{period}</p>
      </div>
      <div className="px-4 pb-3">
        <div className="grid grid-cols-5 gap-2">
          <AnimatedMetric label="开放岗位" value={m.open_positions} unit="个" color="text-violet-400" />
          <AnimatedMetric label="活跃候选人" value={m.active_candidates} unit="人" color="text-blue-400" />
          <AnimatedMetric label="本期入职" value={m.hired_this_period} unit="人" color="text-emerald-400" />
          <AnimatedMetric label="平均周期" value={m.avg_time_to_hire_days} unit="天" color="text-amber-400" />
          <AnimatedMetric label="接受率" value={m.offer_accept_rate} unit="%" color="text-emerald-400" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">招聘漏斗</h4>
        <div className="space-y-1.5">
          {f.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 w-20 flex-shrink-0">{s.stage}</span>
              <div className="flex-1 h-4 bg-neutral-800 rounded overflow-hidden">
                <motion.div
                  className="h-full rounded bg-gradient-to-r from-violet-400/40 to-violet-400/70"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, s.conversion_rate * 100)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs text-neutral-500 font-mono w-12 text-right">{s.count}</span>
              <span className="text-[10px] text-neutral-600 w-10 text-right">{Math.round(s.conversion_rate * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      {a.length > 0 && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 space-y-1.5">
            <p className="text-xs font-medium text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />异常岗位
            </p>
            {a.map((alert, i) => (
              <motion.div
                key={i} className="flex items-start gap-2"
                animate={alert.status === 'stuck' ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                transition={alert.status === 'stuck' ? { duration: 1.5, repeat: Infinity } : {}}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', alert.status === 'stuck' ? 'bg-red-400' : 'bg-amber-400')} />
                <div><p className="text-xs text-neutral-300">{alert.title}</p><p className="text-[10px] text-neutral-500">{alert.reason}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {ins.length > 0 && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 space-y-1.5">
            {ins.map((insight, i) => (
              <p key={i} className="text-xs text-violet-200/80 leading-relaxed flex items-start gap-2">
                <TrendingDown className="w-3 h-3 mt-0.5 flex-shrink-0 text-violet-400" />{insight}
              </p>
            ))}
          </div>
        </div>
      )}
      {renderActions(actions, onActionClick)}
    </div>
  );
}

function AnimatedMetric({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 800, steps = 20, increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplay(value); clearInterval(interval); }
      else setDisplay(Math.round(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);
  return (
    <div className="text-center p-2 rounded-lg bg-neutral-800/50">
      <p className={cn('text-lg font-bold', color)}>{display}<span className="text-xs font-normal text-neutral-600 ml-0.5">{unit}</span></p>
      <p className="text-[10px] text-neutral-600 mt-0.5">{label}</p>
    </div>
  );
}

function reportTypeLabel(type: string): string {
  const map: Record<string, string> = { weekly: '周报', monthly: '月报', ad_hoc: '临时报告' };
  return map[type] ?? type;
}

function renderActions(actions: CardAction[], onClick?: (msg: string) => void) {
  if (!actions.length) return null;
  return (
    <div className="px-4 py-3 border-t border-neutral-800 flex gap-2">
      {actions.map((a, i) => (
        <button key={i} onClick={() => onClick?.(a.message)} className={cn('flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', a.variant === 'primary' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700')}>
          {a.label}
        </button>
      ))}
    </div>
  );
}

const DEMO_METRICS = { open_positions: 12, active_candidates: 89, hired_this_period: 3, avg_time_to_hire_days: 21, offer_accept_rate: 78 };
const DEMO_FUNNEL = [
  { stage: '简历筛选', count: 89, conversion_rate: 1.0 },
  { stage: '一面通过', count: 45, conversion_rate: 0.51 },
  { stage: '二面通过', count: 22, conversion_rate: 0.25 },
  { stage: 'Offer', count: 8, conversion_rate: 0.09 },
  { stage: '入职', count: 3, conversion_rate: 0.03 },
];
const DEMO_INSIGHTS = [
  '一面通过率 51% 处于行业中等水平，建议优化初筛标准',
  'Offer 接受率 78% 低于目标 85%，需关注薪资竞争力',
];
