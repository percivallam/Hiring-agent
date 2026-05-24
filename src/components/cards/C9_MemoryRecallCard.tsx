import { Sparkles, MessageCircle, UserCheck, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MemoryRecallCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C9Props extends MemoryRecallCard {
  onActionClick?: (message: string) => void;
}

export function C9_MemoryRecallCard(props: C9Props) {
  const { mode, title, recall_context, items, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && items.length === 0 ? DEMO_ITEMS : items;
  const ctx = recall_context || '系统检测到您之前与此候选人有交互记录。';

  if (mode === 'loading') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <div className="h-5 w-48 bg-neutral-800 animate-pulse rounded mb-4" />
        <LoadingSkeleton rows={3} />
      </div>
    );
  }

  if (mode === 'empty') {
    return (
      <div className="relative bg-neutral-900 rounded-xl border border-neutral-800 p-4">
        <h3 className="text-base font-semibold text-neutral-100 mb-1">{title}</h3>
        <EmptyHint hint={empty_hint} icon={<Sparkles className="w-10 h-10" />} />
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

      {/* Hero Memory Block — 呼吸金边 */}
      <motion.div
        className="mx-4 mt-4 p-4 rounded-xl bg-amber-500/5 relative"
        animate={{ boxShadow: ['0 0 0 0 rgba(245, 158, 11, 0.15)', '0 0 0 2px rgba(245, 158, 11, 0.25)', '0 0 0 0 rgba(245, 158, 11, 0.15)'] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">AI 记忆唤醒</span>
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed">{ctx}</p>
      </motion.div>

      {/* Memory Items Timeline */}
      {data.length > 0 && (
        <div className="px-4 pt-3 pb-3">
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">相关记忆</h4>
          <div className="relative pl-4 border-l border-neutral-800 space-y-3">
            {data.map((item, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-0.5">
                  <LayerIcon layer={item.layer} />
                </span>
                <p className="text-sm text-neutral-400">{item.summary}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">
                  {formatTime(item.updated_at)}
                  {item.layer === 'candidate' && ' · 候选人记忆'}
                  {item.layer === 'user' && ' · 跨会话记忆'}
                  {item.layer === 'session' && ' · 当前会话'}
                </p>
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

function LayerIcon({ layer }: { layer: string }) {
  const cls = 'w-3.5 h-3.5';
  switch (layer) {
    case 'session': return <MessageCircle className={cls + ' text-blue-400'} />;
    case 'user': return <User className={cls + ' text-violet-400'} />;
    case 'candidate': return <UserCheck className={cls + ' text-emerald-400'} />;
    default: return <MessageCircle className={cls + ' text-neutral-600'} />;
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

const DEMO_ITEMS = [
  { id: 'mem_001', layer: 'candidate' as const, summary: '2025-11-20 二面后因薪酬未对齐暂停流程', created_at: 1732089600000, updated_at: 1732089600000 },
  { id: 'mem_002', layer: 'candidate' as const, summary: '2025-10-15 一面通过，技术基础扎实，推荐进入二面', created_at: 1728979200000, updated_at: 1728979200000 },
  { id: 'mem_003', layer: 'user' as const, summary: '您上次搜索推荐系统工程师时对行业经验要求较高', created_at: 1731561600000, updated_at: 1731561600000 },
];
