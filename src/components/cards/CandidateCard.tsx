import { useState } from 'react';
import { Check, X, Calendar, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { MatchScoreBar } from '@/components/shared/MatchScoreBar';
import { TagGroup } from '@/components/shared/TagGroup';

interface CandidateCardProps {
  data: Candidate;
  actions?: ('view_resume' | 'shortlist' | 'reject' | 'schedule_interview')[];
  onActionClick?: (action: string) => void;
  className?: string;
}

export function CandidateCard({ data, actions = [], onActionClick, className }: CandidateCardProps) {
  const [actionStates, setActionStates] = useState<Record<string, boolean>>({});

  const handleAction = (action: string) => {
    setActionStates(prev => ({ ...prev, [action]: true }));
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden',
        'hover:border-neutral-700 transition-colors duration-200',
        className
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <Avatar name={data.name} src={data.avatar} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-100">{data.name}</h3>
            {data.salary && (
              <span className="text-xs text-neutral-500">{data.salary}</span>
            )}
          </div>
          <p className="text-sm text-neutral-400 mt-0.5">
            {data.currentCompany} · {data.currentTitle}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {data.experience}年经验 · {data.education}
          </p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-500">匹配度</span>
          <MatchScoreBar score={data.matchScore} size="sm" />
        </div>
      </div>

      <div className="px-4 pb-3 space-y-2">
        {data.matchHighlights.length > 0 && (
          <div className="flex gap-2">
            <span className="text-xs text-emerald-400 font-medium shrink-0">亮点</span>
            <div className="flex flex-wrap gap-1">
              {data.matchHighlights.map((highlight, idx) => (
                <span key={idx} className="text-xs text-neutral-400">
                  {highlight}{idx < data.matchHighlights.length - 1 ? ' ·' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.gapPoints.length > 0 && (
          <div className="flex gap-2">
            <span className="text-xs text-amber-400 font-medium shrink-0">差距</span>
            <div className="flex flex-wrap gap-1">
              {data.gapPoints.map((gap, idx) => (
                <span key={idx} className="text-xs text-neutral-500">
                  {gap}{idx < data.gapPoints.length - 1 ? ' ·' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        <TagGroup tags={data.tags} size="sm" />
      </div>

      {actions.length > 0 && (
        <div className="px-4 py-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
          {actions.includes('view_resume') && (
            <button
              onClick={() => handleAction('view_resume')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                actionStates['view_resume']
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              )}
            >
              {actionStates['view_resume'] ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {actionStates['view_resume'] ? '已查看' : '查看简历'}
            </button>
          )}
          {actions.includes('shortlist') && (
            <button
              onClick={() => handleAction('shortlist')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                actionStates['shortlist']
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-600 text-white hover:bg-amber-500'
              )}
            >
              {actionStates['shortlist'] ? <Check className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {actionStates['shortlist'] ? '已添加' : '加入面试'}
            </button>
          )}
          {actions.includes('schedule_interview') && (
            <button
              onClick={() => handleAction('schedule_interview')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                actionStates['schedule_interview']
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700'
              )}
            >
              {actionStates['schedule_interview'] ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              {actionStates['schedule_interview'] ? '已安排' : '安排面试'}
            </button>
          )}
          {actions.includes('reject') && (
            <button
              onClick={() => handleAction('reject')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                actionStates['reject']
                  ? 'bg-neutral-800 text-neutral-600'
                  : 'bg-neutral-800 border border-neutral-700 text-neutral-500 hover:bg-neutral-700 hover:text-neutral-400'
              )}
            >
              {actionStates['reject'] ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
