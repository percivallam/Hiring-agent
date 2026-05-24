import { ClipboardList, ChevronDown, ChevronUp, MessageSquare, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { InterviewKitCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C8Props extends InterviewKitCard {
  onActionClick?: (message: string) => void;
}

export function C8_InterviewKitCard(props: C8Props) {
  const { mode, title, candidate_name, position, categories, interviewer_notes, has_mock_interview, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && categories.length === 0 ? DEMO_CATEGORIES : categories;
  const notes = interviewer_notes || '请根据候选人简历重点关注其项目经验和问题解决能力。';

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
        <EmptyHint hint={empty_hint} icon={<ClipboardList className="w-10 h-10" />} />
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
          <ClipboardList className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        </div>
        <p className="text-sm text-neutral-400">
          {candidate_name} · {position}
        </p>
      </div>

      {/* Interviewer Notes */}
      <div className="px-4 pb-3">
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <p className="text-xs text-amber-300/80 flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            {notes}
          </p>
        </div>
      </div>

      {/* Question Categories */}
      <div className="px-4 pb-3 space-y-2">
        {data.map((cat, i) => (
          <CategoryBlock key={i} category={cat} defaultOpen={i < 2} />
        ))}
      </div>

      {/* Mock Interview */}
      {has_mock_interview && (
        <div className="px-4 pb-3">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors">
            <PlayCircle className="w-4 h-4" />
            开始模拟面试
          </button>
        </div>
      )}

      {/* Actions */}
      {renderActions(actions, onActionClick)}
    </div>
  );
}

function CategoryBlock({ category, defaultOpen }: { category: { category: string; questions: { question: string; difficulty: string; purpose: string }[] }; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg bg-neutral-800/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-neutral-800 transition-colors"
      >
        <span className="text-sm font-medium text-neutral-300">
          {category.category}
          <span className="text-xs text-neutral-600 ml-2">({category.questions.length}题)</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-neutral-600" /> : <ChevronDown className="w-4 h-4 text-neutral-600" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {category.questions.map((q, j) => (
            <div key={j} className="pl-3 border-l-2 border-neutral-700">
              <div className="flex items-center gap-2">
                <p className="text-sm text-neutral-300">{q.question}</p>
                <DifficultyBadge level={q.difficulty} />
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">{q.purpose}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    easy: 'bg-neutral-700 text-neutral-400',
    medium: 'bg-amber-500/10 text-amber-400',
    hard: 'bg-red-500/10 text-red-400',
  };
  const label: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
  return (
    <span className={cn('text-[10px] px-1 py-0.5 rounded flex-shrink-0', map[level] ?? map.medium)}>
      {label[level] ?? level}
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

const DEMO_CATEGORIES = [
  {
    category: '技术基础',
    questions: [
      { question: '推荐系统冷启动问题如何设计解决方案？', difficulty: 'medium' as const, purpose: '考察系统设计能力和问题分解思路' },
      { question: '实时特征工程的数据一致性如何保证？', difficulty: 'hard' as const, purpose: '考察分布式系统经验和对数据流的理解' },
      { question: '解释一下协同过滤和深度推荐模型的优缺点', difficulty: 'easy' as const, purpose: '考察基础算法理解' },
      { question: '大规模推荐系统中如何处理特征穿越问题？', difficulty: 'hard' as const, purpose: '考察工程实战经验' },
    ],
  },
  {
    category: '行为面试',
    questions: [
      { question: '请描述一次你推动跨团队技术方案落地的经历', difficulty: 'medium' as const, purpose: '考察跨团队协作和推动能力' },
      { question: '遇到团队成员技术方案分歧时你是如何处理的？', difficulty: 'easy' as const, purpose: '考察沟通和冲突解决能力' },
    ],
  },
  {
    category: '系统设计',
    questions: [
      { question: '设计一个支持百亿级特征的实时推荐系统', difficulty: 'hard' as const, purpose: '考察架构设计和大规模系统经验' },
      { question: 'AB 实验平台的分流和效果评估如何设计？', difficulty: 'medium' as const, purpose: '考察实验平台设计和统计学基础' },
    ],
  },
];
