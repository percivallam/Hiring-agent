import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Edit, Send, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

interface JDCardProps {
  title: string;
  content: string;
  status: 'draft' | 'published';
  actions?: ('edit' | 'publish' | 'copy')[];
  className?: string;
}

export function JDCard({ title, content, status, actions = [], className }: JDCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-neutral-100">{title}</h3>
          <span className={cn(
            'px-2 py-0.5 text-xs rounded-full font-medium',
            status === 'published'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
          )}>
            {status === 'published' ? '已发布' : '草稿'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {actions.includes('edit') && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                isEditing
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
              )}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {actions.includes('copy') && (
            <button
              onClick={handleCopy}
              className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}
          {actions.includes('publish') && status === 'draft' && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-500 transition-colors">
              <Send className="w-3.5 h-3.5" />
              发布
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', !expanded && '-rotate-90')} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 max-h-96 overflow-y-auto">
              {isEditing ? (
                <textarea
                  defaultValue={content}
                  className="w-full h-64 p-3 bg-neutral-800 border border-neutral-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 text-sm text-neutral-200"
                />
              ) : (
                <MarkdownRenderer content={content} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
