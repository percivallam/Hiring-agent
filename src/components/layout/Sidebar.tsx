import { useState } from 'react';
import {
  Plus,
  Pin,
  Search,
  BarChart3,
  FileText,
  Calendar,
  Lightbulb,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import type { UserRole } from '@/types';

const shortcuts: Record<UserRole, { label: string; icon: typeof Search; message: string }[]> = {
  hm: [
    { label: '找人', icon: Search, message: '帮我找人' },
    { label: '看报告', icon: BarChart3, message: '查看招聘进度' },
    { label: '写JD', icon: FileText, message: '帮我写JD' },
    { label: '面试', icon: Calendar, message: '安排面试' },
    { label: '市场洞察', icon: Lightbulb, message: '人才市场洞察' },
  ],
  hr: [
    { label: '安排面试', icon: Calendar, message: '帮我安排面试' },
    { label: '看进度', icon: BarChart3, message: '查看招聘进度' },
    { label: '写JD', icon: FileText, message: '帮我写JD' },
    { label: '候选人', icon: Search, message: '搜索候选人' },
  ],
  candidate: [
    { label: '搜索职位', icon: Search, message: '有什么适合我的岗位' },
    { label: '我的申请', icon: FileText, message: '我的申请进度' },
    { label: '面试准备', icon: Calendar, message: '帮我准备面试' },
    { label: '了解公司', icon: Lightbulb, message: '介绍一下公司' },
  ],
};

export function Sidebar() {
  const { sessions, currentSessionId, createSession, setCurrentSession } = useSessionStore();
  const { role } = useUserStore();
  const { addUserMessage } = useChatStore();
  const [collapsed, setCollapsed] = useState(false);

  const handleNewChat = () => {
    createSession(role);
  };

  const handleShortcutClick = (message: string) => {
    addUserMessage(message);
  };

  const pinnedSessions = sessions.filter(s => s.pinned && s.role === role);
  const todaySessions = sessions.filter(s => {
    if (s.pinned || s.role !== role) return false;
    const date = new Date(s.timestamp);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  });
  const olderSessions = sessions.filter(s => {
    if (s.pinned || s.role !== role) return false;
    const date = new Date(s.timestamp);
    const today = new Date();
    return date < today && date.toDateString() !== today.toDateString();
  });

  const roleShortcuts = shortcuts[role];

  return (
    <>
      <AnimatePresence>
        {!collapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 bg-neutral-900 border-r border-neutral-800/60 flex flex-col overflow-hidden"
          >
            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50 rounded-lg text-sm font-medium text-neutral-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                新对话
              </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-3">
              {pinnedSessions.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-2 mb-1.5">
                    <Pin className="w-3 h-3 text-neutral-600" />
                    <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-wider">置顶</span>
                  </div>
                  {pinnedSessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onClick={() => setCurrentSession(session.id)}
                    />
                  ))}
                </div>
              )}

              {todaySessions.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-wider px-2">今天</span>
                  {todaySessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onClick={() => setCurrentSession(session.id)}
                    />
                  ))}
                </div>
              )}

              {olderSessions.length > 0 && (
                <div>
                  <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-wider px-2">历史</span>
                  {olderSessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onClick={() => setCurrentSession(session.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Shortcuts */}
            <div className="p-3 border-t border-neutral-800/60">
              <div className="flex items-center gap-1.5 px-2 mb-2">
                <Lightbulb className="w-3 h-3 text-neutral-600" />
                <span className="text-[11px] font-medium text-neutral-600 uppercase tracking-wider">快捷入口</span>
              </div>
              <div className="space-y-0.5">
                {roleShortcuts.map(shortcut => {
                  const Icon = shortcut.icon;
                  return (
                    <button
                      key={shortcut.label}
                      onClick={() => handleShortcutClick(shortcut.message)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-neutral-600" />
                      {shortcut.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collapse Button */}
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-10 bg-neutral-800 border border-neutral-700 rounded-r-md items-center justify-center hover:bg-neutral-700"
            >
              <ChevronLeft className="w-3 h-3 text-neutral-500" />
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Expand Button */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden lg:flex shrink-0 w-8 h-full items-center justify-center border-r border-neutral-800/60 hover:bg-neutral-900 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-neutral-600" />
        </button>
      )}
    </>
  );
}

interface SessionItemProps {
  session: { id: string; title: string; timestamp: number };
  isActive: boolean;
  onClick: () => void;
}

function SessionItem({ session, isActive, onClick }: SessionItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors group',
        isActive
          ? 'bg-neutral-800 text-neutral-100'
          : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-300'
      )}
    >
      <MessageSquare className="w-3.5 h-3.5 shrink-0 text-neutral-600" />
      <span className="flex-1 truncate">{session.title}</span>
      <div className="opacity-0 group-hover:opacity-100 flex items-center">
        <button className="p-1 text-neutral-600 hover:text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </button>
  );
}
