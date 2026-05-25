import { useState } from 'react';
import { ClipboardList, ChevronDown, MessageSquare, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { InterviewKitCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';
import { MockInterviewPanel } from './MockInterviewPanel';

interface C8Props extends InterviewKitCard {
  onActionClick?: (message: string) => void;
}

export function C8_InterviewKitCard(props: C8Props) {
  const { mode, title, candidate_name, position, categories, interviewer_notes, has_mock_interview, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && categories.length === 0 ? DEMO_CATEGORIES : categories;
  const notes = interviewer_notes || '请根据候选人简历重点关注其项目经验和问题解决能力。';
  const [showMockInterview, setShowMockInterview] = useState(false);

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
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        </div>
        <p className="text-sm text-neutral-400">{candidate_name} · {position}</p>
      </div>
      <div className="px-4 pb-3">
        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <p className="text-xs text-amber-300/80 flex items-start gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />{notes}
          </p>
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        {data.map((cat, i) => <CategoryBlock key={i} category={cat} defaultOpen={i < 2} />)}
      </div>
      {has_mock_interview && !showMockInterview && (
        <div className="px-4 pb-3">
          <motion.button
            onClick={() => setShowMockInterview(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
            animate={{ boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.15)', '0 0 0 3px rgba(59, 130, 246, 0.25)', '0 0 0 0 rgba(59, 130, 246, 0.15)'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PlayCircle className="w-4 h-4" />开始模拟面试
          </motion.button>
        </div>
      )}
      <AnimatePresence>
        {showMockInterview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-3 overflow-hidden"
          >
            <MockInterviewPanel
              candidateName={candidate_name}
              position={position}
              rounds={DEMO_ROUNDS}
              onClose={() => setShowMockInterview(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {renderActions(actions, onActionClick)}
    </div>
  );
}

function CategoryBlock({ category, defaultOpen }: { category: { category: string; questions: { question: string; difficulty: string; purpose: string }[] }; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg bg-neutral-800/50 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 hover:bg-neutral-800 transition-colors">
        <span className="text-sm font-medium text-neutral-300">{category.category}<span className="text-xs text-neutral-600 ml-2">({category.questions.length}题)</span></span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 text-neutral-600" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-2">
              {category.questions.map((q, j) => (
                <motion.div key={j} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: j * 0.06 }} className="pl-3 border-l-2 border-neutral-700">
                  <div className="flex items-center gap-2"><p className="text-sm text-neutral-300">{q.question}</p><DifficultyBadge level={q.difficulty} /></div>
                  <p className="text-xs text-neutral-600 mt-0.5">{q.purpose}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DifficultyBadge({ level }: { level: string }) {
  const m: Record<string, string> = { easy: 'bg-neutral-700 text-neutral-400', medium: 'bg-amber-500/10 text-amber-400', hard: 'bg-red-500/10 text-red-400' };
  const l: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
  return <span className={cn('text-[10px] px-1 py-0.5 rounded flex-shrink-0', m[level] ?? m.medium)}>{l[level] ?? level}</span>;
}

function renderActions(actions: CardAction[], onClick?: (msg: string) => void) {
  if (!actions.length) return null;
  return (
    <div className="px-4 py-3 border-t border-neutral-800 flex gap-2">
      {actions.map((a, i) => (
        <button key={i} onClick={() => onClick?.(a.message)} className={cn('flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', a.variant === 'primary' ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700')}>{a.label}</button>
      ))}
    </div>
  );
}

const DEMO_CATEGORIES = [
  { category: '技术基础', questions: [
    { question: '推荐系统冷启动问题如何设计解决方案？', difficulty: 'medium' as const, purpose: '考察系统设计能力和问题分解思路' },
    { question: '实时特征工程的数据一致性如何保证？', difficulty: 'hard' as const, purpose: '考察分布式系统经验和对数据流的理解' },
    { question: '解释一下协同过滤和深度推荐模型的优缺点', difficulty: 'easy' as const, purpose: '考察基础算法理解' },
    { question: '大规模推荐系统中如何处理特征穿越问题？', difficulty: 'hard' as const, purpose: '考察工程实战经验' },
  ]},
  { category: '行为面试', questions: [
    { question: '请描述一次你推动跨团队技术方案落地的经历', difficulty: 'medium' as const, purpose: '考察跨团队协作和推动能力' },
    { question: '遇到团队成员技术方案分歧时你是如何处理的？', difficulty: 'easy' as const, purpose: '考察沟通和冲突解决能力' },
  ]},
  { category: '系统设计', questions: [
    { question: '设计一个支持百亿级特征的实时推荐系统', difficulty: 'hard' as const, purpose: '考察架构设计和大规模系统经验' },
    { question: 'AB 实验平台的分流和效果评估如何设计？', difficulty: 'medium' as const, purpose: '考察实验平台设计和统计学基础' },
  ]},
];

const DEMO_ROUNDS = [
  {
    question: '推荐系统冷启动问题如何设计解决方案？',
    difficulty: 'medium' as const,
    purpose: '考察系统设计能力和问题分解思路',
    candidateAnswer: '对于冷启动问题，我会从三个方面入手。首先，利用用户注册信息和设备特征做基础画像，结合热门内容做初期推荐。其次，设计一套快速反馈机制，在用户前 10 次交互中通过探索-利用平衡快速收敛偏好。最后，建立冷启动效果监控看板，实时跟踪新用户的前 3 天留存率和点击率。之前我在字节做信息流推荐时，通过这套方法把新用户次日留存率提升了 8 个百分点。',
    aiComment: '回答结构清晰，三层递进。亮点是提到了监控闭环，说明有数据驱动思维。建议在面试中追问：如果冷启动阶段用户标签质量差，如何过滤低质量标签？',
    score: 4,
  },
  {
    question: '描述一次你推动跨团队技术方案落地的经历',
    difficulty: 'medium' as const,
    purpose: '考察跨团队协作和推动能力',
    candidateAnswer: '在字节做实时特征平台时，需要推动算法团队、数据平台和业务线三方协作。我首先花了一周时间分别和每个团队负责人沟通痛点，然后把三方需求整合成一份 RFC，明确接口协议和 SLA。最关键的是，我没等所有人达成共识才开始，而是先做了一个 demo 让业务线看到效果，用业务价值倒推技术决策。最终 3 个月完成上线，延迟从 2s 降到 200ms。',
    aiComment: '典型的工程推动案例。\"先 demo 再推动\"的策略很务实。注意考察他在推进过程中遇到了哪些反对意见以及如何处理，这是区分高级和中级工程师的关键。',
    score: 5,
  },
];
