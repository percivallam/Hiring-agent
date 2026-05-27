import { Briefcase, Clock, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JDCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C4Props extends JDCard {
  onActionClick?: (message: string) => void;
}

export function C4_JDCard(props: C4Props) {
  const { mode, title, job, is_published, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && !job.id ? DEMO_JOB : job;

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
        <EmptyHint hint={empty_hint} icon={<Briefcase className="w-10 h-10" />} />
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
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-neutral-100">{data.title}</h3>
              <StatusBadge status={data.status} />
            </div>
            <p className="text-sm text-neutral-400">{data.department} · {data.level}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{data.open_days}天</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(data.pipeline ?? []).reduce((s, p) => s + p.count, 0)}人</span>
          </div>
        </div>
        {data.salary_range && (
          <p className="text-sm text-amber-400 font-medium mt-1">{data.salary_range}</p>
        )}
        {!is_published && (
          <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">未发布</span>
        )}
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        <p className="text-sm text-neutral-400 leading-relaxed">{data.description}</p>
      </div>

      {/* Requirements */}
      {data.requirements.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">必须要求</h4>
          <ul className="space-y-1">
            {data.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Nice to Have */}
      {data.nice_to_have.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">加分项</h4>
          <ul className="space-y-1">
            {data.nice_to_have.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-neutral-400">
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pipeline */}
      {data.pipeline.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">招聘漏斗</h4>
          <div className="space-y-1.5">
            {data.pipeline.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-neutral-400 w-20 flex-shrink-0">{s.stage}</span>
                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500/60 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (s.count / (s.target || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-500 font-mono w-16 text-right">
                  {s.count}<span className="text-neutral-700">/{s.target}</span>
                </span>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    open: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: '开放中' },
    urgent: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: '紧急' },
    closed: { cls: 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20', label: '已关闭' },
  };
  const m = map[status] ?? map.open;
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', m.cls)}>{m.label}</span>
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

const DEMO_JOB = {
  id: 'job_001',
  title: '推荐系统工程师',
  department: '推荐架构部',
  level: 'P6-P7',
  description: '负责公司核心推荐系统的架构设计、开发与优化，支持信息流、短视频等多个业务线的个性化推荐需求。',
  requirements: ['3年以上推荐/搜索/广告系统经验', '精通 C++/Go/Java 至少一门语言，熟悉分布式系统', '有大规模在线服务架构经验'],
  nice_to_have: ['有 Flink/Spark 实时计算经验', '有模型上线和 AB 实验平台建设经验', '开源项目贡献或技术博客'],
  salary_range: '50-80K · 15薪',
  pipeline: [
    { stage: '简历筛选', count: 45, target: 60 },
    { stage: '一面通过', count: 18, target: 30 },
    { stage: '二面通过', count: 8, target: 15 },
    { stage: 'Offer', count: 2, target: 5 },
  ],
  open_days: 15,
  status: 'open' as const,
};
