import { Target, Sparkles, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JobProfileCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C5Props extends JobProfileCard {
  onActionClick?: (message: string) => void;
}

export function C5_JobProfileCard(props: C5Props) {
  const { mode, title, requested_title, profile_suggestions, search_strategy, similar_jobs, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && profile_suggestions.length === 0 ? DEMO_PROFILE_SUGGESTIONS : profile_suggestions;
  const strategy = search_strategy || '定向搜索当前行业头部公司相关团队，优先看对标级别的候选人。';
  const jobs = showDemo && similar_jobs.length === 0 ? DEMO_SIMILAR_JOBS : similar_jobs;

  if (mode === 'loading') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div className="h-5 w-48 bg-neutral-800 animate-pulse rounded mb-4" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h3 className="text-base font-semibold text-neutral-100 mb-1">{title}</h3>
        <EmptyHint hint={empty_hint} icon={<Target className="w-10 h-10" />} />
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
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        </div>
        <p className="text-sm text-neutral-400">
          目标岗位：<span className="text-neutral-200 font-medium">{requested_title}</span>
        </p>
      </div>

      {/* Profile Suggestions */}
      <div className="px-4 pb-3">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">需求画像</h4>
        <div className="space-y-2">
          {data.map((d, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2.5 p-2.5 rounded-lg',
                d.importance === 'critical' ? 'bg-red-500/5 border border-red-500/10' :
                d.importance === 'important' ? 'bg-amber-500/5 border border-amber-500/10' :
                'bg-neutral-800/50',
              )}
            >
              <ImportanceDot level={d.importance} />
              <div className="min-w-0">
                <p className="text-sm text-neutral-200">{d.suggestion}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">{importanceLabel(d.importance)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Strategy */}
      <div className="px-4 pb-3">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">搜索策略</h4>
        <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-800">
          <p className="text-sm text-neutral-400 leading-relaxed italic">"{strategy}"</p>
        </div>
      </div>

      {/* Similar Jobs */}
      {jobs.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">相近岗位</h4>
          <div className="flex flex-wrap gap-1.5">
            {jobs.map((j, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-800 text-xs text-neutral-400 hover:bg-neutral-700 transition-colors cursor-pointer">
                <Search className="w-3 h-3" />
                {j.title}
                <span className="text-neutral-600">@{j.department}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {renderActions(actions, onActionClick)}
    </div>
  );
}

function ImportanceDot({ level }: { level: string }) {
  const map: Record<string, string> = {
    critical: 'bg-red-400',
    important: 'bg-amber-400',
    nice_to_have: 'bg-emerald-400',
  };
  return <span className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', map[level] ?? 'bg-neutral-600')} />;
}

function importanceLabel(level: string): string {
  const map: Record<string, string> = {
    critical: '关键要求',
    important: '重要加分',
    nice_to_have: '加分项',
  };
  return map[level] ?? level;
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

const DEMO_PROFILE_SUGGESTIONS = [
  { name: '推荐系统经验', importance: 'critical' as const, suggestion: '3年以上推荐/搜索/广告系统开发经验，有大规模在线服务背景' },
  { name: '工程能力', importance: 'critical' as const, suggestion: '精通 Go/C++/Java 至少一门，熟悉分布式系统，有 Flink/Kafka 实时计算经验' },
  { name: '算法理解', importance: 'important' as const, suggestion: '理解主流推荐算法（协同过滤、DNN、多臂老虎机），能与算法工程师高效协作' },
  { name: '业务理解', importance: 'important' as const, suggestion: '有信息流/短视频/电商等业务的推荐场景落地经验' },
  { name: '学历背景', importance: 'nice_to_have' as const, suggestion: '计算机相关硕士及以上，985/211 优先' },
];

const DEMO_SIMILAR_JOBS = [
  { id: 'job_005', title: '推荐算法工程师', department: '推荐架构部' },
  { id: 'job_008', title: '搜索算法工程师', department: '搜索事业部' },
];
