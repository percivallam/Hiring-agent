import { User, Building2, MapPin, Briefcase, GraduationCap, DollarSign, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProfileCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C2Props extends ProfileCard {
  onActionClick?: (message: string) => void;
}

export function C2_ProfileCard(props: C2Props) {
  const { mode, title, name, current_company, current_title, experience_years, education, location, skills, career, projects, match_score, tags, active_status, expected_salary, interview_history, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;

  if (mode === 'loading') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-neutral-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-neutral-800 animate-pulse rounded" />
            <div className="h-4 w-48 bg-neutral-800 animate-pulse rounded" />
          </div>
        </div>
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h3 className="text-base font-semibold text-neutral-100 mb-1">{title}</h3>
        <EmptyHint hint={empty_hint} icon={<User className="w-10 h-10" />} />
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

  const data = showDemo && !name ? DEMO_PROFILE : { name, current_company, current_title, experience_years, education, location, skills: skills ?? [], career: career ?? [], projects: projects ?? [], match_score: match_score ?? 0, tags: tags ?? [], active_status: active_status ?? 'active', expected_salary, interview_history: interview_history ?? [] };

  return (
    <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors overflow-hidden">
      <DemoBadge visible={showDemo} />

      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/80 to-orange-500/80 flex items-center justify-center text-lg font-semibold text-white">
          {data.name?.[0] ?? '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-100">{data.name}</h3>
            <ActiveStatusBadge status={data.active_status} />
          </div>
          <p className="text-sm text-neutral-400">
            {data.current_company} · {data.current_title}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> {data.experience_years}年经验
            </span>
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> {data.education}
            </span>
            {data.location && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {data.location}
              </span>
            )}
            {data.expected_salary && (
              <span className="text-xs text-neutral-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> {data.expected_salary}
              </span>
            )}
          </div>
        </div>
        <MatchScoreRing score={data.match_score} />
      </div>

      {/* Skills */}
      {data.skills.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-neutral-800 text-neutral-400">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Career */}
      {data.career.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">工作经历</h4>
          <div className="space-y-2">
            {data.career.map((c, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-neutral-300">{c.title} <span className="text-neutral-500">@ {c.company}</span></p>
                  <p className="text-xs text-neutral-600">{c.period}</p>
                  {(c.highlights ?? []).length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {(c.highlights ?? []).map((h, j) => (
                        <li key={j} className="text-xs text-neutral-500 pl-2 border-l border-neutral-800">{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {data.projects.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">项目经历</h4>
          <div className="space-y-2">
            {data.projects.map((p, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-neutral-800/50">
                <p className="text-sm font-medium text-neutral-300">{p.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{p.description}</p>
                {(p.tech_stack ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(p.tech_stack ?? []).map((t, j) => (
                      <span key={j} className="px-1.5 py-0.5 text-[10px] rounded bg-neutral-700 text-neutral-400">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview History */}
      {data.interview_history && data.interview_history.length > 0 && (
        <div className="px-4 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">面试记录</h4>
          <div className="space-y-1.5">
            {data.interview_history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Clock className="w-3 h-3 text-neutral-600" />
                <span className="text-neutral-500">{h.date}</span>
                <span className="text-neutral-400">{h.feedback}</span>
                <span className="text-amber-400 font-mono">{'★'.repeat(h.rating)}{'☆'.repeat(5 - h.rating)}</span>
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

function ActiveStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    active: { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: '活跃' },
    passive: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: '被动观望' },
    not_interested: { cls: 'bg-red-500/10 text-red-400 border-red-500/20', label: '无意向' },
  };
  const m = map[status] ?? map.active;
  return (
    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border', m.cls)}>{m.label}</span>
  );
}

function MatchScoreRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'text-emerald-400 border-emerald-400/30' : pct >= 60 ? 'text-amber-400 border-amber-400/30' : 'text-red-400 border-red-400/30';
  return (
    <div className={cn('flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold font-mono', color)}>
      {pct}
    </div>
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

const DEMO_PROFILE = {
  name: '李雷',
  current_company: '字节跳动',
  current_title: '推荐系统工程师',
  experience_years: 6,
  education: '清华大学 · 计算机硕士',
  location: '北京',
  skills: ['推荐系统', 'Flink', 'TensorFlow', 'Go', 'Python'],
  career: [
    { company: '字节跳动', title: '推荐系统工程师', period: '2022.06 - 至今', highlights: ['主导信息流推荐引擎优化，CTR 提升 12%', '设计实时特征平台，延迟从 2s 降至 200ms'] },
    { company: '美团', title: '后端开发工程师', period: '2020.07 - 2022.05', highlights: ['搜索推荐团队，负责排序模型迭代'] },
  ],
  projects: [
    { name: '实时推荐引擎', description: '基于 Flink 的实时召回排序系统，支持百亿级特征', tech_stack: ['Flink', 'Kafka', 'Redis', 'Go'] },
    { name: 'AB 实验平台', description: '多臂老虎机 + 分层实验框架', tech_stack: ['Python', 'PostgreSQL', 'React'] },
  ],
  match_score: 0.92,
  tags: ['推荐', '实时计算', '工程'],
  active_status: 'active' as const,
  expected_salary: '60-80K · 15薪',
  interview_history: [
    { date: '2026-05-20', feedback: '一面通过，技术基础扎实', rating: 4 },
    { date: '2026-05-15', feedback: 'HR 初步沟通，意向积极', rating: 5 },
  ],
};
