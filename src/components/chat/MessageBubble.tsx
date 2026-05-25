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
  const [displayContent, setDisplayContent] = useState(isUser ? message.content : '');
  const [isTyping, setIsTyping] = useState(!isUser);

  // Typewriter effect for agent messages
  useEffect(() => {
    if (isUser) return;

    let index = 0;
    const content = message.content;
    setIsTyping(true);

    const timer = setInterval(() => {
      if (index < content.length) {
        setDisplayContent(content.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 18);

    return () => clearInterval(timer);
  }, [message.content, isUser]);

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
