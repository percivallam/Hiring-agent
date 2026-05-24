import { GitCompare, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComparisonCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C3Props extends ComparisonCard {
  onActionClick?: (message: string) => void;
}

export function C3_ComparisonCard(props: C3Props) {
  const { mode, title, candidate_a, candidate_b, dimensions, recommendation, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && dimensions.length === 0 ? DEMO_DIMENSIONS : dimensions;
  const rec = recommendation ?? '综合来看，候选人 A 在核心技能匹配上更具优势。';

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
        <EmptyHint hint={empty_hint} icon={<GitCompare className="w-10 h-10" />} />
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

      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare className="w-4 h-4 text-neutral-500" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        </div>

        {/* Candidate Headers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2.5 rounded-lg bg-neutral-800/50 text-center">
            <span className="text-sm font-medium text-neutral-200">{candidate_a.name}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-neutral-800/50 text-center">
            <span className="text-sm font-medium text-neutral-200">{candidate_b.name}</span>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="px-4 pb-3 space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 py-2 border-b border-neutral-800/50 last:border-b-0">
            <span className={cn(
              'text-xs text-right',
              d.advantage === 'a' ? 'text-emerald-400 font-medium' : 'text-neutral-400',
            )}>
              {d.candidate_a}
            </span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-neutral-600">{d.label}</span>
              <AdvantageIcon advantage={d.advantage} />
            </div>
            <span className={cn(
              'text-xs',
              d.advantage === 'b' ? 'text-emerald-400 font-medium' : 'text-neutral-400',
            )}>
              {d.candidate_b}
            </span>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      <div className="px-4 pb-3">
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <p className="text-xs text-amber-300/80 leading-relaxed">{rec}</p>
        </div>
      </div>

      {/* Actions */}
      {renderActions(actions, onActionClick)}
    </div>
  );
}

function AdvantageIcon({ advantage }: { advantage?: 'a' | 'b' | 'neutral' }) {
  if (advantage === 'a') return <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 rotate-[-90deg]" />;
  if (advantage === 'b') return <TrendingUp className="w-3 h-3 text-emerald-400 mt-0.5 rotate-90" />;
  return <Minus className="w-3 h-3 text-neutral-600 mt-0.5" />;
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

const DEMO_DIMENSIONS = [
  { label: '推荐系统经验', candidate_a: '6年，主导信息流推荐', candidate_b: '5年，搜索算法为主', advantage: 'a' as const },
  { label: '工程能力', candidate_a: 'Flink/Kafka 实时平台', candidate_b: 'Java/Spring 后端', advantage: 'a' as const },
  { label: '学历背景', candidate_a: '清华硕士', candidate_b: '浙大硕士', advantage: 'neutral' as const },
  { label: '团队管理', candidate_a: '带过 3 人小组', candidate_b: '无管理经验', advantage: 'a' as const },
  { label: '薪资期望', candidate_a: '60-80K', candidate_b: '45-60K', advantage: 'b' as const },
];
