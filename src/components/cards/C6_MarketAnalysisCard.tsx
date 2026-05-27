import { TrendingUp, BarChart3, PieChart, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketAnalysisCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C6Props extends MarketAnalysisCard {
  onActionClick?: (message: string) => void;
}

export function C6_MarketAnalysisCard(props: C6Props) {
  const { mode, title, position, analysis_type, data, insights, chart_type, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const values = showDemo && data.length === 0 ? DEMO_DATA : data;
  const notes = showDemo && insights.length === 0 ? DEMO_INSIGHTS : insights;

  if (mode === 'loading') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div className="h-5 w-48 bg-neutral-800 animate-pulse rounded mb-4" />
        <LoadingSkeleton rows={5} />
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

  const maxVal = Math.max(...(values ?? []).map(v => v.value), 1);

  return (
    <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors overflow-hidden">
      <DemoBadge visible={showDemo} />

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        </div>
        <p className="text-sm text-neutral-400">
          {position} · <span className="text-neutral-500">{analysisTypeLabel(analysis_type)}</span>
        </p>
      </div>

      {/* Data Bars */}
      <div className="px-4 pb-3 space-y-2">
        {values.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 w-28 flex-shrink-0 truncate">{d.label}</span>
            <div className="flex-1 h-5 bg-neutral-800 rounded overflow-hidden">
              <div
                className="h-full rounded bg-gradient-to-r from-blue-400/40 to-blue-400/80 transition-all flex items-center justify-end pr-2"
                style={{ width: `${(d.value / maxVal) * 100}%` }}
              >
                <span className="text-[10px] font-mono font-medium text-blue-200">{d.value}</span>
              </div>
            </div>
            {d.detail && <span className="text-[10px] text-neutral-600 w-20 flex-shrink-0 truncate">{d.detail}</span>}
          </div>
        ))}
      </div>

      {/* Chart Type Tag */}
      {chart_type && (
        <div className="px-4 pb-2">
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
            {chart_type === 'pie' && <PieChart className="w-3 h-3" />}
            {chart_type === 'trend' && <TrendingUp className="w-3 h-3" />}
            {chartTypeLabel(chart_type)}
          </span>
        </div>
      )}

      {/* Insights */}
      {notes.length > 0 && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-1.5">
            {notes.map((ins, i) => (
              <div key={i} className="flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-200/80 leading-relaxed">{ins}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {renderActions(actions, onActionClick)}
    </div>
  );
}

function analysisTypeLabel(type: string): string {
  const map: Record<string, string> = {
    distribution: '人才分布',
    supply_demand: '供需分析',
    trend: '趋势分析',
    competitor: '竞品分析',
  };
  return map[type] ?? type;
}

function chartTypeLabel(type: string): string {
  const map: Record<string, string> = {
    bar: '柱状图',
    pie: '饼图',
    trend: '趋势图',
    map: '分布图',
  };
  return map[type] ?? type;
}

function renderActions(actions: CardAction[], onClick?: (msg: string) => void) {
  if (!actions.length) return null;
  return (
    <div className="px-4 py-3 border-t border-neutral-800 flex gap-2">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => onClick?.(a.message)}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            a.variant === 'primary'
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700',
          )}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

const DEMO_DATA = [
  { label: '字节跳动', value: 145, detail: '相似岗位 32个' },
  { label: '阿里巴巴', value: 120, detail: '相似岗位 28个' },
  { label: '快手', value: 98, detail: '相似岗位 22个' },
  { label: '腾讯', value: 85, detail: '相似岗位 18个' },
  { label: '美团', value: 72, detail: '相似岗位 15个' },
  { label: '小红书', value: 56, detail: '相似岗位 12个' },
];

const DEMO_INSIGHTS = [
  '字节和阿里集中了该领域 42% 的人才，是主要目标池',
  '近 6 个月该岗位薪资中位数上涨 12%，供需偏紧',
  '建议优先挖掘被动求职者，活跃投递者仅占 35%',
];
