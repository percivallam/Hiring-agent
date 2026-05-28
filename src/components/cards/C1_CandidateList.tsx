import { Users, ChevronRight, ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CandidateListCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C1Props extends CandidateListCard {
  onActionClick?: (message: string) => void;
  onCandidateOpen?: (candidate: CandidateListCard['candidates'][number]) => void;
}

export function C1_CandidateList(props: C1Props) {
  const { mode, title, candidates, sortable, filterable, is_demo, empty_hint, error_hint, actions, onActionClick, onCandidateOpen } = props;

  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && candidates.length === 0
    ? DEMO_CANDIDATES
    : candidates;

  if (mode === 'loading') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div className="h-5 w-40 bg-neutral-800 animate-pulse rounded mb-4" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h3 className="text-base font-semibold text-neutral-100 mb-1">{title}</h3>
        <EmptyHint hint={empty_hint} icon={<Users className="w-10 h-10" />} />
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
      <div className="p-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neutral-500" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
          <span className="text-xs text-neutral-500">({data.length})</span>
        </div>
        <div className="flex gap-1">
          {sortable && (
            <button className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors" title="排序">
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          )}
          {filterable && (
            <button className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors" title="筛选">
              <Filter className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Candidate List */}
      <div className="px-4 pb-3 space-y-2">
        {data.map((c) => (
          <div
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => onCandidateOpen?.(c)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onCandidateOpen?.(c);
              }
            }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors cursor-pointer group',
              c.status === 'rejected' && 'opacity-50',
            )}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-300">
              {c.name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-200">{c.name}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-neutral-500 truncate">
                {c.current_company} · {c.current_title} · {c.experience_years}年
              </p>
            </div>
            <div className="flex items-center gap-2">
              <MatchBadge score={c.match_score} />
              <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      {renderActions(actions, onActionClick)}
    </div>
  );
}

/* ---- Helpers ---- */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    interview: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hired: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    rejected: 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20',
  };
  const label: Record<string, string> = {
    active: '活跃',
    interview: '面试中',
    hired: '已入职',
    rejected: '已淘汰',
  };
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', map[status] ?? map.active)}>
      {label[status] ?? status}
    </span>
  );
}

function MatchBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <span className={cn('text-xs font-mono font-medium', color)}>
      {pct}%
    </span>
  );
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

const DEMO_CANDIDATES = [
  { id: 'res_001', name: '李雷', current_company: '字节跳动', current_title: '推荐系统工程师', experience_years: 6, match_score: 0.92, match_highlights: ['大规模推荐系统经验'], gap_points: [], tags: ['推荐', 'Flink'], status: 'active' as const },
  { id: 'res_002', name: '韩梅梅', current_company: '阿里巴巴', current_title: '搜索算法工程师', experience_years: 5, match_score: 0.88, match_highlights: ['向量检索经验'], gap_points: ['无推荐业务经验'], tags: ['搜索', '向量'], status: 'active' as const },
  { id: 'res_003', name: '王五', current_company: '快手', current_title: '高级推荐算法工程师', experience_years: 7, match_score: 0.85, match_highlights: ['实时推荐经验'], gap_points: [], tags: ['推荐', '实时'], status: 'interview' as const },
  { id: 'res_004', name: '赵六', current_company: '腾讯', current_title: '机器学习工程师', experience_years: 4, match_score: 0.72, match_highlights: [], gap_points: ['经验不足'], tags: ['ML', 'Python'], status: 'active' as const },
];
