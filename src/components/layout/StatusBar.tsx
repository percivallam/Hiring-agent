import { Wifi, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';

export function StatusBar() {
  const { role } = useUserStore();
  const { isTyping } = useChatStore();

  const roleLabels: Record<string, string> = {
    hm: '用人经理模式',
    hr: '招聘HR模式',
    candidate: '候选人模式',
  };

  return (
    <footer className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        {/* Agent Status */}
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'w-2 h-2 rounded-full',
            isTyping ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
          )} />
          <span className="text-xs text-gray-500">
            {isTyping ? 'AI 思考中...' : 'AI 就绪'}
          </span>
        </div>

        {/* Mode */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">{roleLabels[role]}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Wifi className="w-3 h-3 text-green-500" />
        <span className="text-xs text-gray-500">已连接</span>
      </div>
    </footer>
  );
}
