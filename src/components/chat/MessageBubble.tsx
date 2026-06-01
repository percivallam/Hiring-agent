import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn, formatTime } from '@/lib/utils';
import type { TextMessage } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

interface MessageBubbleProps {
  message: TextMessage;
  className?: string;
}

export function MessageBubble({ message, className }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  // 历史消息（超过 3 秒的）直接显示全文，不重放打字机
  const isFresh = message.timestamp ? Date.now() - message.timestamp < 3000 : false;
  const shouldType = !isUser && isFresh && shouldUseTypewriter(message.content);
  const [displayContent, setDisplayContent] = useState(
    shouldType ? '' : message.content,
  );
  const [isTyping, setIsTyping] = useState(shouldType);

  // Typewriter effect for agent messages — 仅对新消息生效
  useEffect(() => {
    if (!shouldType) {
      setDisplayContent(message.content);
      setIsTyping(false);
      return;
    }

    let index = 0;
    const content = message.content;
    const step = getTypewriterStep(content);
    setDisplayContent('');
    setIsTyping(true);

    const timer = setInterval(() => {
      if (index < content.length) {
        index = Math.min(index + step, content.length);
        setDisplayContent(content.slice(0, index));
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 12);

    return () => clearInterval(timer);
  }, [message.content, shouldType]);

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex justify-end', className)}
      >
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="bg-amber-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <span className="text-[11px] text-neutral-600 mt-1 block text-right">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', className)}
    >
      <Avatar isAgent name="AI" size="sm" />

      <div className="flex-1 min-w-0">
        <div className="text-neutral-200 text-sm leading-relaxed">
          <MarkdownRenderer content={displayContent} />
          {isTyping && (
            <span className="inline-flex gap-1 ml-1 align-middle">
              <span className="typing-dot w-1.5 h-1.5 bg-neutral-500 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-neutral-500 rounded-full" />
              <span className="typing-dot w-1.5 h-1.5 bg-neutral-500 rounded-full" />
            </span>
          )}
        </div>
        <span className="text-[11px] text-neutral-600 mt-1 block">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}

function shouldUseTypewriter(content: string): boolean {
  if (content.length > 900) return false;
  if (hasMarkdownTableSeparator(content)) return false;
  if (/```|<table|<\/table>/i.test(content)) return false;
  return true;
}

function hasMarkdownTableSeparator(content: string): boolean {
  const lines = content.split('\n');
  for (let index = 1; index < lines.length; index += 1) {
    const previous = lines[index - 1];
    const current = lines[index].trim();
    if (!previous.includes('|') || !current.includes('|')) continue;

    const body = current.replaceAll('|', '').trim();
    if (!body) continue;
    if ([...body].every((char) => char === '-' || char === ':' || char.trim() === '')) {
      return true;
    }
  }
  return false;
}

function getTypewriterStep(content: string): number {
  if (content.length > 600) return 12;
  if (content.length > 240) return 8;
  return 4;
}
