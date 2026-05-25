import { motion } from 'framer-motion';
import { Mail, Edit, Send, Heart, FileText, Bell, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MessageTemplateMessage } from '@/types';

interface MessageTemplateCardProps {
  templateType: MessageTemplateMessage['templateType'];
  subject?: string;
  content: string;
  recipient: string;
  tone: MessageTemplateMessage['tone'];
  editable?: boolean;
  className?: string;
}

export function MessageTemplateCard({
  templateType,
  subject,
  content,
  recipient,
  tone,
  editable = true,
  className
}: MessageTemplateCardProps) {
  const typeConfig = {
    rejection: { icon: Mail, label: '拒信', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    sell: { icon: Heart, label: 'Sell方案', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    reach_out: { icon: UserCheck, label: '触达消息', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    reminder: { icon: Bell, label: '催办提醒', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    offer: { icon: FileText, label: 'Offer通知', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  };

  const config = typeConfig[templateType];
  const Icon = config.icon;

  const toneLabel = {
    warm: '温暖',
    professional: '专业',
    formal: '正式',
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('p-1.5 rounded-lg', config.bg)}>
              <Icon className={cn('w-4 h-4', config.color)} />
            </span>
            <div>
              <h3 className="font-semibold text-neutral-100 text-sm">{config.label}</h3>
              {subject && <p className="text-xs text-neutral-500">{subject}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500">收件人：{recipient}</span>
            <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium border', config.bg, config.color, config.border)}>
              {toneLabel[tone]}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-800">
          <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
            {content}
          </pre>
        </div>
      </div>

      {editable && (
        <div className="px-4 py-3 bg-neutral-900 border-t border-neutral-800 flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors">
            <Edit className="w-4 h-4" /> 编辑
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-500 transition-colors">
            <Send className="w-4 h-4" /> 发送
          </button>
        </div>
      )}
    </motion.div>
  );
}
