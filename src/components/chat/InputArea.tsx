import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Command,
  Search,
  FileText,
  Calendar,
  BarChart3,
  GitCompare,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InputAreaProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

const quickCommands = [
  { label: '找人', icon: Search, description: '搜索候选人', command: '/找人' },
  { label: '写JD', icon: FileText, description: '生成职位描述', command: '/写JD' },
  { label: '面试', icon: Calendar, description: '安排或进行面试', command: '/面试' },
  { label: '报告', icon: BarChart3, description: '生成招聘报告', command: '/报告' },
  { label: '对比', icon: GitCompare, description: '候选人对比分析', command: '/对比' },
  { label: '市场', icon: Globe, description: '人才市场洞察', command: '/市场' },
];

export function InputArea({ onSend, disabled, className }: InputAreaProps) {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
    setShowCommands(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowCommands(value === '/');
  };

  const handleCommandSelect = (command: string) => {
    setInput(command.replace('/', ''));
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Quick Commands Menu */}
      <AnimatePresence>
        {showCommands && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-0 right-0 mb-3 bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden"
          >
            <div className="p-2 text-xs font-medium text-neutral-500 border-b border-neutral-800">
              快捷指令
            </div>
            {quickCommands.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.command}
                  onClick={() => handleCommandSelect(cmd.command)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-neutral-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-neutral-200">{cmd.command}</span>
                      <span className="text-sm text-neutral-500">- {cmd.description}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="input-glow bg-neutral-900 border border-neutral-800 rounded-2xl">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'AI 思考中...' : '给 HireAgent 发送消息... (按 / 查看快捷指令)'}
          disabled={disabled}
          rows={1}
          className={cn(
            'w-full px-4 py-3 bg-transparent resize-none outline-none text-sm',
            'text-neutral-200 placeholder:text-neutral-600',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              disabled={disabled}
              className="p-2 text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCommands(!showCommands)}
              disabled={disabled}
              className={cn(
                'p-2 rounded-lg transition-colors disabled:opacity-50',
                showCommands
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800'
              )}
            >
              <Command className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-sm transition-colors',
              input.trim() && !disabled
                ? 'bg-amber-600 text-white hover:bg-amber-500'
                : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-center text-[11px] text-neutral-700 mt-2">
        HireAgent 可能会生成不准确的信息，请人工核实重要决策。
      </p>
    </div>
  );
}
