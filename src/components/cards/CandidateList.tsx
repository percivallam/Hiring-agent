import { useState } from 'react';
import { ChevronDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/types';
import { CandidateCard } from './CandidateCard';

interface CandidateListProps {
  title: string;
  candidates: Candidate[];
  sortable?: boolean;
  onCandidateAction?: (candidateId: string, action: string) => void;
  className?: string;
}

export function CandidateList({
  title,
  candidates,
  sortable = true,
  onCandidateAction,
  className
}: CandidateListProps) {
  const [sortBy, setSortBy] = useState<'match' | 'experience'>('match');
  const [expanded, setExpanded] = useState(true);

  const sortedCandidates = [...candidates].sort((a, b) => {
    if (sortBy === 'match') return b.matchScore - a.matchScore;
    return b.experience - a.experience;
  });

  return (
    <div className={cn('bg-neutral-900 rounded-xl border border-neutral-800 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-neutral-100">{title}</h3>
          <span className="text-sm text-neutral-500">({candidates.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {sortable && (
            <button
              onClick={() => setSortBy(sortBy === 'match' ? 'experience' : 'match')}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortBy === 'match' ? '按匹配度' : '按经验'}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-neutral-500 hover:text-neutral-300"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', !expanded && '-rotate-90')} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="grid gap-3">
          {sortedCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              data={candidate}
              actions={['view_resume', 'shortlist', 'reject']}
              onActionClick={(action) => {
                if (onCandidateAction) {
                  onCandidateAction(candidate.id, action);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
