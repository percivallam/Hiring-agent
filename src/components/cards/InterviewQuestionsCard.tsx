import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InterviewQuestionsMessage } from '@/types';

interface InterviewQuestionsCardProps {
  candidateName: string;
  position: string;
  categories: InterviewQuestionsMessage['categories'];
  className?: string;
}

export function InterviewQuestionsCard({
  candidateName,
  position,
  categories,
  className
}: InterviewQuestionsCardProps) {
  const difficultyConfig = {
    easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    hard: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden',
        className
      )}
    >
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-semibold text-neutral-100">面试题库</h3>
        <p className="text-xs text-neutral-500 mt-1">{position} · 针对{candidateName}定制</p>
      </div>

      <div className="divide-y divide-neutral-800">
        {categories.map((cat, catIdx) => (
          <div key={catIdx} className="p-4">
            <h4 className="text-sm font-medium text-neutral-300 mb-3">{cat.category}</h4>
            <div className="space-y-3">
              {cat.questions.map((q, qIdx) => (
                <motion.div
                  key={qIdx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: qIdx * 0.05 }}
                  className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-800"
                >
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200">{q.question}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', difficultyConfig[q.difficulty])}>
                          {q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}
                        </span>
                        <span className="text-xs text-neutral-500">{q.purpose}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
