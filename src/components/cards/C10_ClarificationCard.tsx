import { HelpCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClarificationCard, CardAction } from '@/contracts/cards';
import { LoadingSkeleton } from './states/LoadingSkeleton';
import { EmptyHint } from './states/EmptyHint';
import { ErrorHint } from './states/ErrorHint';
import { DemoBadge } from './states/DemoBadge';

interface C10Props extends ClarificationCard {
  onActionClick?: (message: string) => void;
}

export function C10_ClarificationCard(props: C10Props) {
  const { mode, title, prompt, options, is_demo, empty_hint, error_hint, actions, onActionClick } = props;
  const showDemo = mode === 'demo' || is_demo;
  const data = showDemo && options.length === 0 ? DEMO_OPTIONS : options;

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
        <EmptyHint hint={empty_hint} icon={<HelpCircle className="w-10 h-10" />} />
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
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <h3 className="text-base font-semibold text-neutral-100">{title}</h3>
        </div>
        <p className="text-sm text-neutral-400 leading-relaxed">{prompt}</p>
      </div>

      {/* Options */}
      <div className="px-4 pb-3 space-y-1.5">
        {data.map((opt, i) => (
          <button
            key={i}
            onClick={() => onActionClick?.(opt.message)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors group text-left"
          >
            <span className="text-sm text-neutral-300 group-hover:text-neutral-200">{opt.label}</span>
            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
          </button>
        ))}
      </div>

      {/* Actions */}
      {renderActions(actions, onActionClick)}
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

const DEMO_OPTIONS = [
  { label: '帮我在简历库中搜索候选人', message: '请帮我在简历库中搜索候选人' },
  { label: '查看当前招聘进度报告', message: '请查看当前招聘进度报告' },
  { label: '为某个岗位准备面试题', message: '请为岗位准备面试题' },
  { label: '分析招聘市场行情', message: '请分析招聘市场行情' },
];
