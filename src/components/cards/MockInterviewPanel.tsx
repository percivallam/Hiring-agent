import { useState } from 'react';
import { PlayCircle, ChevronRight, CheckCircle2, Bot, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InterviewRound {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  purpose: string;
  /** 预制候选人回答 */
  candidateAnswer: string;
  /** AI 面试官点评 */
  aiComment: string;
  /** 评分 (1-5) */
  score: number;
}

interface MockInterviewPanelProps {
  candidateName: string;
  position: string;
  rounds: InterviewRound[];
  onClose?: () => void;
  className?: string;
}

/**
 * 模拟面试 2 轮预制对话 — OQ-04 / S6 DSP-4 壳层
 *
 * AI 扮演面试官问问题 → 预制候选人回答 → AI 点评打分。
 */
export function MockInterviewPanel({ candidateName, position, rounds, onClose, className }: MockInterviewPanelProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const round = rounds[currentRound];

  if (!round) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden', className)}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-neutral-100">模拟面试</h3>
          </div>
          <p className="text-xs text-neutral-500">{candidateName} · {position}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
            第 {currentRound + 1}/{rounds.length} 题
          </span>
          {onClose && (
            <button onClick={onClose} className="p-1 rounded text-neutral-600 hover:text-neutral-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dialog Area */}
      <div className="p-4 space-y-4">
        {/* AI Question */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-500 mb-1">面试官</p>
            <div className="bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <p className="text-sm text-neutral-200 leading-relaxed">{round.question}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded', diffColor(round.difficulty))}>
                  {diffLabel(round.difficulty)}
                </span>
                <span className="text-[10px] text-neutral-600">{round.purpose}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Candidate Answer (reveal on click) */}
        {!revealed ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setRevealed(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors"
          >
            <PlayCircle className="w-4 h-4" />查看候选人回答
          </motion.button>
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3 justify-end"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-500 mb-1 text-right">候选人 ({candidateName})</p>
                <div className="bg-neutral-800 rounded-2xl rounded-tr-sm px-4 py-2.5">
                  <p className="text-sm text-neutral-300 leading-relaxed">{round.candidateAnswer}</p>
                </div>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-amber-400" />
              </div>
            </motion.div>

            {/* AI Score & Comment */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">AI 点评</span>
                <span className="text-[10px] text-emerald-500 ml-auto">
                  {'★'.repeat(round.score)}{'☆'.repeat(5 - round.score)}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 leading-relaxed">{round.aiComment}</p>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Next Button */}
      <div className="px-4 py-3 border-t border-neutral-800">
        {currentRound < rounds.length - 1 ? (
          <button
            onClick={() => { setCurrentRound(currentRound + 1); setRevealed(false); }}
            disabled={!revealed}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              revealed
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed',
            )}
          >
            下一题 <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <p className="text-center text-xs text-neutral-500 py-2">
            模拟面试完成 — 共 {rounds.length} 题
          </p>
        )}
      </div>
    </motion.div>
  );
}

function diffColor(d: string): string {
  const m: Record<string, string> = { easy: 'bg-neutral-700 text-neutral-400', medium: 'bg-amber-500/10 text-amber-400', hard: 'bg-red-500/10 text-red-400' };
  return m[d] ?? m.medium;
}
function diffLabel(d: string): string {
  const m: Record<string, string> = { easy: '简单', medium: '中等', hard: '困难' };
  return m[d] ?? d;
}
