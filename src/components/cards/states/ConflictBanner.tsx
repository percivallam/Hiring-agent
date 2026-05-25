import { AlertTriangle, Check, X, GitMerge } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConflictItem {
  field: string;
  stored: string;
  detected: string;
  source: string;
}

interface ConflictBannerProps {
  title?: string;
  description?: string;
  conflicts: ConflictItem[];
  onResolve?: (field: string, action: 'keep' | 'update' | 'merge') => void;
  className?: string;
}

export function ConflictBanner({ title = '检测到记忆冲突', description, conflicts, onResolve, className }: ConflictBannerProps) {
  if (!conflicts.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden', className)}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </motion.span>
          <h4 className="text-sm font-semibold text-amber-300">{title}</h4>
        </div>
        {description && <p className="text-xs text-amber-400/70 leading-relaxed">{description}</p>}
      </div>
      <div className="px-4 pb-4 space-y-3">
        {conflicts.map((c, i) => <ConflictRow key={i} item={c} onResolve={onResolve} />)}
      </div>
    </motion.div>
  );
}

function ConflictRow({ item, onResolve }: { item: ConflictItem; onResolve?: ConflictBannerProps['onResolve'] }) {
  return (
    <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 overflow-hidden">
      <div className="px-3 pt-2 pb-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-400">{item.field}</span>
          <span className="text-[10px] text-amber-500/60">{item.source}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-amber-500/10">
        <div className="p-3 bg-neutral-900">
          <p className="text-[10px] text-neutral-600 mb-0.5">已有记忆</p>
          <p className="text-xs text-neutral-400 leading-relaxed">{item.stored}</p>
        </div>
        <div className="p-3 bg-neutral-900">
          <p className="text-[10px] text-neutral-600 mb-0.5">新检测到</p>
          <p className="text-xs text-amber-300 leading-relaxed">{item.detected}</p>
        </div>
      </div>
      <div className="flex gap-2 px-3 py-2">
        <button onClick={() => onResolve?.(item.field, 'keep')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-neutral-800 border border-neutral-700 text-xs text-neutral-400 hover:bg-neutral-700 transition-colors">
          <X className="w-3 h-3" />保留旧版
        </button>
        <button onClick={() => onResolve?.(item.field, 'update')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-amber-600/20 border border-amber-500/30 text-xs text-amber-300 hover:bg-amber-600/30 transition-colors">
          <Check className="w-3 h-3" />更新记忆
        </button>
        <button onClick={() => onResolve?.(item.field, 'merge')} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-neutral-800 border border-neutral-700 text-xs text-neutral-400 hover:bg-neutral-700 transition-colors">
          <GitMerge className="w-3 h-3" />合并
        </button>
      </div>
    </div>
  );
}
