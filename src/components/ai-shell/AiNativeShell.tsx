import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  ChevronsLeft,
  Command,
  ExternalLink,
  FileText,
  Moon,
  PanelRight,
  Pin,
  Plus,
  Search,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { MessageList } from '@/components/chat/MessageList';
import { useChatStore, exportAllData } from '@/store/chatStore';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import { AIEngine } from '@/engine/AIEngine';
import { BrowserStorage, MemoryManager } from '@/memory';
import { getJobs, getPipelineData, getPipelineSummary, getResumeById } from '@/data';
import { cn } from '@/lib/utils';
import type { Message, UserRole } from '@/types';

type DrawerKind = 'candidate' | 'jd' | 'pipeline' | 'diagnosis';
type DrawerMode = 'peek' | 'pinned' | 'popout';

interface DrawerState {
  kind: DrawerKind;
  mode: DrawerMode;
  payload?: any;
}

const roleLabels: Record<UserRole, string> = {
  hm: '用人经理',
  hr: '招聘伙伴',
  candidate: '候选人',
};

const slashCommands = [
  { command: '/找人', label: '搜索候选人', prompt: '找推荐系统产品负责人，偏 AI 产品和增长，上海或远程' },
  { command: '/写职位', label: '优化 JD', prompt: '优化推荐系统产品负责人的职位描述，突出 AI 产品和增长实验' },
  { command: '/看漏斗', label: '打开招聘漏斗', prompt: '查看招聘漏斗，指出本周卡点和下一步动作' },
  { command: '/诊断', label: '诊断推荐原因', prompt: '诊断这个岗位为什么推荐少，给出可调整条件' },
  { command: '/面试', label: '生成面试题', prompt: '给林澄准备一面问题，关注推荐策略和增长实验' },
  { command: '/设置', label: '打开设置', prompt: '/设置' },
];

const settingsCategories = [
  '职位申请',
  '职位模板',
  '审批流',
  '推荐策略',
  '字段映射',
  '集成',
  '权限',
  '成员',
];

export function AiNativeShell() {
  const {
    messages,
    isTyping,
    thinkingSteps,
    currentStep,
    addMessage,
    addUserMessage,
    startThinking,
    updateThinkingStep,
    stopThinking,
    setEngine,
    switchSession,
    pendingTrigger,
    clearTrigger,
  } = useChatStore();
  const { sessions, currentSessionId, createSession, setCurrentSession } = useSessionStore();
  const { role } = useUserStore();

  const [railCollapsed, setRailCollapsed] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(560);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState(settingsCategories[0]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [localHistory, setLocalHistory] = useState<string[]>([]);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const engineRef = useRef<AIEngine | null>(null);
  const memoryRef = useRef<MemoryManager | null>(null);
  const prevSessionRef = useRef<string | null>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!currentSessionId) {
      createSession(role);
      return;
    }
    switchSession(currentSessionId);
  }, [currentSessionId, createSession, role, switchSession]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    const baseUrl = '/api/deepseek';
    const model = import.meta.env.VITE_DEEPSEEK_MODEL;

    if (!memoryRef.current) {
      memoryRef.current = new MemoryManager(new BrowserStorage());
      seedDemoMemory(memoryRef.current);
    }

    engineRef.current = new AIEngine(role, apiKey, baseUrl, model);
    engineRef.current.setMemoryAdapter(memoryRef.current);
    setEngine(engineRef.current as any);
  }, [role, setEngine]);

  useEffect(() => {
    if (!currentSessionId || currentSessionId === prevSessionRef.current) return;
    prevSessionRef.current = currentSessionId;

    const cur = useChatStore.getState().messages;
    if (cur.length === 0) {
      const welcome = engineRef.current?.getWelcomeMessage();
      if (welcome?.content) {
        window.setTimeout(() => addMessage({ type: 'text', role: 'agent', content: welcome.content } as any), 80);
      }
    }
  }, [currentSessionId, addMessage]);

  useEffect(() => {
    const save = () => {
      const state = useChatStore.getState();
      if (!state._sessionId || state.messages.length === 0) return;
      fetch('/api/save-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state._sessionId,
          savedAt: new Date().toISOString(),
          messageCount: state.messages.length,
          messages: state.messages,
        }),
        keepalive: true,
      }).catch(() => {
        // Disk persistence is best-effort; localStorage remains source of truth.
      });
    };

    const interval = window.setInterval(save, 30_000);
    window.addEventListener('beforeunload', save);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', save);
    };
  }, []);

  useEffect(() => {
    (window as any).__isUsingModel = () => engineRef.current?.isConfigured() || false;
    (window as any).__getModelConfig = () => ({
      provider: 'deepseek',
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
      model: import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat',
    });
    (window as any).__exportChatData = () => {
      const json = exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hireagent-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      try { return `已导出 ${JSON.parse(json).sessionCount} 个会话`; } catch { return '已导出'; }
    };
  }, []);

  const activeSession = sessions.find((session) => session.id === currentSessionId);
  const groupedSessions = useMemo(() => groupSessions(sessions.filter((session) => session.role === role)), [sessions, role]);
  const topMeta = `会话:${currentSessionId?.slice(-6) ?? '新建'} · 抽屉:${drawer ? drawerModeLabel(drawer.mode) : '关闭'}`;

  const autoNameSession = useCallback((content: string) => {
    const { currentSessionId: sid } = useSessionStore.getState();
    if (!sid) return;
    const state = useSessionStore.getState();
    const session = state.sessions.find((item) => item.id === sid);
    if (session && session.title === '新对话') {
      state.updateSessionTitle(sid, content.slice(0, 20) + (content.length > 20 ? '...' : ''));
    }
  }, []);

  const openDrawer = useCallback((kind: DrawerKind, payload?: any, mode: DrawerMode = drawer?.mode ?? 'peek') => {
    setDrawer({ kind, payload, mode });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [drawer?.mode]);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleSend = useCallback(async (raw: string) => {
    const value = raw.trim();
    if (!value || isTyping) return;

    if (value === '/设置') {
      setSettingsOpen(true);
      setInput('');
      inputRef.current?.focus();
      return;
    }

    if (!engineRef.current) return;

    addUserMessage(value);
    autoNameSession(value);
    setLocalHistory((items) => [value, ...items.filter((item) => item !== value)].slice(0, 20));
    setHistoryIndex(-1);
    setInput('');

    const pendingSteps = getPendingThinkingSteps(value);
    const stepTimers = pendingSteps.slice(1).map((_, index) =>
      window.setTimeout(() => {
        updateThinkingStep(Math.min(index + 1, pendingSteps.length - 1));
      }, [700, 1800, 3600, 6500][index] ?? 6500)
    );

    startThinking(pendingSteps);

    try {
      const result = await engineRef.current.processInput(value);
      stopThinking();
      if (result.responses?.length) {
        result.responses.forEach((card, index) => {
          window.setTimeout(() => {
            addMessage(card as any);
          }, index * 180);
        });
      }
    } catch (error) {
      console.error('[AiNativeShell] 处理消息失败:', error);
      stopThinking();
      addMessage({
        type: 'text',
        role: 'agent',
        content: '这轮响应暂时没跑顺。可以换候选人、岗位或范围继续问，我会基于已有数据继续判断。',
      } as any);
    } finally {
      stepTimers.forEach(window.clearTimeout);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [addMessage, addUserMessage, autoNameSession, isTyping, startThinking, stopThinking, updateThinkingStep]);

  const handleQuickAction = useCallback((message: string) => {
    handleSend(message);
  }, [handleSend]);

  useEffect(() => {
    if (!pendingTrigger) return;
    handleSend(pendingTrigger);
    clearTrigger();
  }, [clearTrigger, handleSend, pendingTrigger]);

  const handleCandidateOpen = useCallback((candidate: any) => {
    openDrawer('candidate', candidate);
  }, [openDrawer]);

  const handleCardClick = useCallback((cardId: string, payload: any) => {
    if (payload?.action === 'view_resume' || payload?.candidateId) {
      openDrawer('candidate', { id: payload.candidateId || cardId });
      return;
    }
    if (payload?.message) handleSend(payload.message);
  }, [handleSend, openDrawer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (mod && event.key === '\\') {
        event.preventDefault();
        if (drawer) closeDrawer();
        else openDrawer('pipeline');
      }
      if (mod && event.key === ',') {
        event.preventDefault();
        setSettingsOpen(true);
      }
      if (mod && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setRailCollapsed((value) => !value);
      }
      if (event.key === 'Escape') {
        setSettingsOpen(false);
        setCommandOpen(false);
        closeDrawer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeDrawer, drawer, openDrawer]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const next = Math.max(480, Math.min(720, resizeRef.current.startWidth + resizeRef.current.startX - event.clientX));
      setDrawerWidth(next);
    };
    const onUp = () => {
      resizeRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const slashOpen = input.startsWith('/');
  const streamHasConversation = messages.length > 0 || isTyping;

  return (
    <div className={cn('ai-native-shell h-screen overflow-hidden bg-[var(--hai-bg)] text-[var(--hai-text)]', darkTheme && 'hai-dark')}>
      <div
        className="grid h-full overflow-hidden"
        style={{ gridTemplateColumns: `${railCollapsed ? 56 : 240}px minmax(560px, 1fr)` }}
      >
        <aside className="hai-rail min-w-0 flex flex-col border-r border-[var(--hai-border)]">
          <div className="h-12 flex items-center gap-2.5 px-3 border-b border-[var(--hai-border)]">
            <div className="hai-rail-brand h-7 w-7 min-w-7 rounded-[var(--hai-radius-sm)] border border-[var(--hai-border)] text-[var(--hai-accent)] hai-mono grid place-items-center">▍</div>
            {!railCollapsed && <div className="flex-1 truncate font-semibold">招聘智能体</div>}
            <button className="hai-button w-7 px-0" onClick={() => setRailCollapsed((value) => !value)} title="收起侧栏">
              <ChevronsLeft className={cn('h-3.5 w-3.5 transition-transform', railCollapsed && 'rotate-180')} />
            </button>
          </div>

          <div className="p-3">
            <button
              className="hai-button w-full"
              onClick={() => {
                createSession(role);
                inputRef.current?.focus();
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {!railCollapsed && <span>新对话</span>}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {groupedSessions.map((group) => (
              <div key={group.label} className="mb-4">
                {!railCollapsed && <div className="px-2 pb-1 text-[11px] text-[var(--hai-text-3)]">{group.label}</div>}
                <div className="space-y-1">
                  {group.items.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSession(session.id)}
                      className={cn(
                        'relative w-full text-left rounded-[var(--hai-radius)] border px-2 py-2 transition-colors',
                        session.id === currentSessionId
                          ? 'hai-session-active border-[var(--hai-accent)] bg-[var(--hai-accent-bg)] text-[var(--hai-text)]'
                          : 'border-transparent text-[var(--hai-text-2)] hover:border-[var(--hai-border)] hover:bg-[var(--hai-surface-2)]'
                      )}
                      title={session.title}
                    >
                      {railCollapsed ? (
                        <span className="hai-mono text-[var(--hai-text-3)]">{session.title.slice(0, 1)}</span>
                      ) : (
                        <>
                          <div className="truncate">{session.title}</div>
                          <div className="hai-mono mt-0.5 truncate text-[11px] text-[var(--hai-text-3)]">{formatSessionMeta(session.timestamp)}</div>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--hai-border)] p-2">
            <button
              className="hai-button mb-1 w-full justify-start"
              onClick={() => setDarkTheme((value) => !value)}
              title={darkTheme ? '切换浅色' : '切换深色'}
            >
              {darkTheme ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              {!railCollapsed && <span>{darkTheme ? '深色模式' : '浅色模式'}</span>}
            </button>
            <button className="hai-button w-full justify-start" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-3.5 w-3.5" />
              {!railCollapsed && <span>设置</span>}
            </button>
          </div>
        </aside>

        <main className="relative min-w-0 flex flex-col bg-[var(--hai-bg)]">
          <header className="hai-shell-header h-12 shrink-0 flex items-center justify-between border-b border-[var(--hai-border)] px-4">
            <div className="min-w-0">
              <div className="font-semibold">对话</div>
              <div className="hai-mono truncate text-[11px] text-[var(--hai-text-3)]">{topMeta}</div>
            </div>
            <div className="hidden items-center gap-3 hai-mono text-[11px] text-[var(--hai-text-3)] md:flex">
              <span>⌘K</span>
              <span>⌘\</span>
              <span>⌘,</span>
              <span>⌘B</span>
              <a className="hover:text-[var(--hai-text)]" href="/classic">老版本</a>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-hidden">
            {streamHasConversation ? (
              <MessageList
                messages={messages}
                thinkingSteps={thinkingSteps}
                currentStep={currentStep}
                isTyping={isTyping}
                onQuickAction={handleQuickAction}
                onCardClick={handleCardClick}
                onCandidateOpen={handleCandidateOpen}
                onDrawerOpen={openDrawer}
                className="ai-native-message-list"
              />
            ) : (
              <EmptyState onPick={(prompt) => setInput(prompt)} />
            )}
          </section>

          <section className="shrink-0 border-t border-[var(--hai-border)] bg-[var(--hai-bg)] px-4 pb-4 pt-3">
            <div className="relative mx-auto max-w-3xl">
              <AnimatePresence>
                {slashOpen && (
                  <SlashMenu
                    onPick={(item) => {
                      if (item.command === '/设置') {
                        setSettingsOpen(true);
                        setInput('');
                      } else {
                        setInput(item.prompt);
                      }
                      window.setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                  />
                )}
              </AnimatePresence>

              <div className="hai-composer flex min-h-[46px] items-end gap-2 px-3 py-2">
                <span className="hai-mono pt-2 text-[var(--hai-accent)]">▍</span>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend(input);
                    }
                    if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      const next = Math.min(historyIndex + 1, localHistory.length - 1);
                      setHistoryIndex(next);
                      if (next >= 0) setInput(localHistory[next]);
                    }
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      const next = Math.max(historyIndex - 1, -1);
                      setHistoryIndex(next);
                      setInput(next >= 0 ? localHistory[next] : '');
                    }
                  }}
                  rows={1}
                  disabled={isTyping}
                  placeholder={isTyping ? '智能体处理中' : '输入招聘问题，或按 / 查看指令'}
                  className="max-h-32 min-h-[30px] flex-1 resize-none bg-transparent py-1 text-sm text-[var(--hai-text)] outline-none placeholder:text-[var(--hai-text-3)] disabled:opacity-50"
                />
                <button className={cn('hai-button', input.trim() && !isTyping && 'hai-button-primary')} disabled={isTyping || !input.trim()} onClick={() => handleSend(input)}>
                  运行
                </button>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--hai-text-3)]">
                <span>输入 / 查看指令，或直接提问</span>
                <span className="hai-mono">↑/↓ 历史 · ⌘K 命令面板</span>
              </div>
            </div>
          </section>

          <SettingsOverlay
            open={settingsOpen}
            activeTab={settingsTab}
            onTabChange={setSettingsTab}
            onClose={() => {
              setSettingsOpen(false);
              inputRef.current?.focus();
            }}
          />

          <CommandOverlay
            open={commandOpen}
            onClose={() => setCommandOpen(false)}
            onCommand={(kind) => {
              setCommandOpen(false);
              if (kind === 'settings') setSettingsOpen(true);
              else openDrawer(kind);
            }}
          />
        </main>
      </div>

      <Drawer
        state={drawer}
        width={drawerWidth}
        onClose={closeDrawer}
        onResizeStart={(event) => {
          resizeRef.current = { startX: event.clientX, startWidth: drawerWidth };
        }}
        onModeChange={(mode) => {
          if (!drawer) return;
          setDrawer({ ...drawer, mode });
        }}
        onSend={handleSend}
      />
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="hai-panel max-w-xl p-6 text-[var(--hai-text-2)] shadow-[var(--hai-shadow-soft)]">
        <div className="hai-mono mb-3 text-[var(--hai-accent)]">输入 / 查看指令，或直接提问</div>
        <p className="mb-4">主任务从对话开始。找人、写职位、看漏斗先在中间完成，需要深看和编辑时再打开右侧画布。</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {slashCommands.slice(0, 4).map((item) => (
            <button key={item.command} className="hai-button justify-start" onClick={() => onPick(item.prompt)}>
              <span className="hai-mono text-[var(--hai-accent)]">{item.command}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlashMenu({ onPick }: { onPick: (item: typeof slashCommands[number]) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.16 }}
      className="absolute bottom-full left-0 z-30 mb-2 w-[320px] overflow-hidden rounded-[var(--hai-radius-lg)] border border-[var(--hai-border)] bg-[var(--hai-surface)] shadow-[var(--hai-shadow-soft)]"
    >
      {slashCommands.map((item) => (
        <button
          key={item.command}
          onClick={() => onPick(item)}
          className="flex w-full items-center justify-between border-b border-[var(--hai-border)] px-3 py-2.5 text-left text-[var(--hai-text-2)] last:border-b-0 hover:bg-[var(--hai-surface-2)] hover:text-[var(--hai-text)]"
        >
          <span className="hai-mono text-[var(--hai-accent)]">{item.command}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
}

function SettingsOverlay({
  open,
  activeTab,
  onTabChange,
  onClose,
}: {
  open: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="absolute inset-x-0 bottom-0 top-12 z-50 border-l border-[var(--hai-border)] bg-[var(--hai-bg)] shadow-[var(--hai-shadow-soft)]"
        >
          <div className="grid h-full grid-cols-[220px_minmax(0,1fr)]">
            <nav className="border-r border-[var(--hai-border)] bg-[var(--hai-surface)] p-3">
              {settingsCategories.map((item) => (
                <button
                  key={item}
                  onClick={() => onTabChange(item)}
                  className={cn(
                    'mb-1 w-full rounded-[var(--hai-radius-sm)] border border-transparent px-3 py-2 text-left text-[var(--hai-text-2)] hover:bg-[var(--hai-surface-2)] hover:text-[var(--hai-text)]',
                    item === activeTab && 'border-[var(--hai-accent)] bg-[var(--hai-accent-bg)] text-[var(--hai-text)]'
                  )}
                >
                  {item}
                </button>
              ))}
            </nav>
            <div className="overflow-y-auto p-7">
              <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">设置:req-2208</div>
              <div className="mt-2 flex items-center justify-between gap-4">
                <h1 className="text-xl font-semibold">{activeTab}</h1>
                <button className="hai-button" onClick={onClose}>返回对话</button>
              </div>
              <p className="mt-2 max-w-2xl text-[var(--hai-text-2)]">
                这里承载低频、重配置的传统 ATS 能力。它们不进入主导航，只在需要调整规则、字段、集成或权限时进入。
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {settingsCards(activeTab).map((card) => (
                  <div key={card.title} className="hai-panel p-4">
                    <div className="font-medium">{card.title}</div>
                    <div className="hai-mono mt-1 text-[11px] text-[var(--hai-text-3)]">{card.meta}</div>
                    <p className="mt-3 text-[var(--hai-text-2)]">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function CommandOverlay({
  open,
  onClose,
  onCommand,
}: {
  open: boolean;
  onClose: () => void;
  onCommand: (kind: DrawerKind | 'settings') => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="absolute inset-x-0 bottom-0 top-12 z-[60] bg-[var(--hai-overlay)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8 }}
            animate={{ y: 0 }}
            exit={{ y: -8 }}
            className="mx-auto mt-20 w-[min(620px,calc(100%-32px))] overflow-hidden rounded-[var(--hai-radius-lg)] border border-[var(--hai-border)] bg-[var(--hai-surface)] shadow-[var(--hai-shadow-soft)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-12 items-center gap-2 border-b border-[var(--hai-border)] px-4">
              <span className="hai-mono text-[var(--hai-accent)]">▍</span>
              <span className="text-[var(--hai-text-3)]">搜索命令、候选人、职位</span>
            </div>
            {[
              { label: '打开候选人简历', meta: '简历', icon: Users, kind: 'candidate' as const },
              { label: '查看招聘漏斗', meta: '漏斗', icon: BarChart3, kind: 'pipeline' as const },
              { label: '优化职位描述', meta: '职位', icon: FileText, kind: 'jd' as const },
              { label: '诊断推荐原因', meta: '诊断', icon: Search, kind: 'diagnosis' as const },
              { label: '打开设置', meta: '⌘,', icon: Settings, kind: 'settings' as const },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onCommand(item.kind)}
                  className="flex w-full items-center justify-between border-b border-[var(--hai-border)] px-4 py-3 text-left text-[var(--hai-text-2)] last:border-b-0 hover:bg-[var(--hai-surface-2)] hover:text-[var(--hai-text)]"
                >
                  <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{item.label}</span>
                  <span className="hai-mono text-[11px] text-[var(--hai-text-3)]">{item.meta}</span>
                </button>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Drawer({
  state,
  width,
  onClose,
  onResizeStart,
  onModeChange,
  onSend,
}: {
  state: DrawerState | null;
  width: number;
  onClose: () => void;
  onResizeStart: (event: React.MouseEvent) => void;
  onModeChange: (mode: DrawerMode) => void;
  onSend: (message: string) => void;
}) {
  const view = state ? getDrawerView(state.kind, state.payload) : null;
  return (
    <AnimatePresence>
      {state && view && (
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className={cn(
            'fixed bottom-0 right-0 top-0 z-[70] flex border-l border-[var(--hai-border)] bg-[var(--hai-surface)] text-[var(--hai-text)] shadow-[var(--hai-shadow-drawer)]',
            state.mode === 'popout' && 'bottom-6 right-6 top-6 overflow-hidden rounded-[var(--hai-radius-lg)] border'
          )}
          style={{ width }}
        >
          <div
            className="grid w-2 cursor-col-resize place-items-center border-r border-[var(--hai-border)] bg-[var(--hai-surface)] text-[var(--hai-text-3)]"
            onMouseDown={onResizeStart}
          >
            ⋮
          </div>
          <div className="min-w-0 flex-1">
            <header className="flex h-12 items-center gap-2 border-b border-[var(--hai-border)] bg-[var(--hai-surface)] px-3">
              <div className="grid h-6 w-6 place-items-center rounded-[var(--hai-radius-sm)] border border-[var(--hai-border)] bg-[var(--hai-accent-bg)] text-[var(--hai-accent)] hai-mono">{view.mark}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{view.title}</div>
                <div className="hai-mono truncate text-[11px] text-[var(--hai-text-3)]">{drawerModeLabel(state.mode)} · {view.meta}</div>
              </div>
              <button className="hai-button w-7 px-0" title="固定" onClick={() => onModeChange(state.mode === 'pinned' ? 'peek' : 'pinned')}>
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button className="hai-button w-7 px-0" title="弹出" onClick={() => onModeChange(state.mode === 'popout' ? 'peek' : 'popout')}>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
              <button className="hai-button w-7 px-0" title="关闭" onClick={onClose}>
                <X className="h-3.5 w-3.5" />
              </button>
            </header>
            <div className="h-[calc(100%-48px)] overflow-y-auto bg-[var(--hai-bg)] p-4">
              {view.body}
              <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 flex flex-wrap gap-2 border-t border-[var(--hai-border)] bg-[var(--hai-surface)] px-4 py-3">
                {view.actions.map((action) => (
                  <button
                    key={action.label}
                    className={cn('hai-button', action.primary && 'hai-button-primary')}
                    onClick={() => action.message ? onSend(action.message) : undefined}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function getDrawerView(kind: DrawerKind, payload: any) {
  if (kind === 'candidate') return candidateDrawer(payload);
  if (kind === 'jd') return jdDrawer(payload);
  if (kind === 'pipeline') return pipelineDrawer(payload);
  return diagnosisDrawer(payload);
}

function candidateDrawer(payload: any) {
  const id = payload?.id ?? payload?.candidateId;
  const profile = id ? getResumeById(id) : undefined;
  const data = profile ?? normalizeCandidatePayload(payload);
  const skills = data.skills?.length ? data.skills : ['推荐系统', '增长实验', 'AI 产品', '组织协同'];
  const career = data.careerHistory?.length ? data.careerHistory : [
    { company: data.currentCompany || '候选人当前公司', title: data.currentTitle || '当前职位', period: '最近阶段', highlights: ['核心经历待从简历继续补齐'] },
  ];

  return {
    title: '候选人简历',
    meta: data.id ?? '候选人',
    mark: '简',
    actions: [
      { label: '加入候选池', primary: true, message: `${data.name} 加入候选池，并生成下一步推进建议` },
      { label: '生成触达话术', message: `给${data.name}生成触达话术` },
      { label: '安排面试', message: `安排${data.name}的一面` },
    ],
    body: (
      <div className="space-y-4">
        <div className="hai-panel p-4">
          <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">{data.id ?? 'candidate'}</div>
          <h2 className="mt-1 text-lg font-semibold">{data.name || '候选人'}</h2>
          <div className="text-[var(--hai-text-2)]">{data.currentTitle} · {data.currentCompany}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="匹配分" value={formatScore(payload?.match_score ?? payload?.matchScore ?? 0.86)} />
          <Field label="地点" value={data.location ?? '待确认'} />
          <Field label="学历" value={data.education ?? '待确认'} />
          <Field label="最近活动" value={data.lastActive ?? '待确认'} />
        </div>
        <Section title="智能评估">
          强匹配。当前卡片信号显示经历与岗位方向接近，真实负责范围、薪酬风险和到岗窗口建议在一面前确认。
        </Section>
        <div>
          <div className="mb-2 text-[11px] text-[var(--hai-text-3)]">经历时间线</div>
          <div className="space-y-3 border-l border-[var(--hai-border)] pl-3">
            {career.map((item: any, index: number) => (
              <div key={`${item.company}-${index}`} className="relative">
                <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-[var(--hai-accent)]" />
                <div className="font-medium">{item.company} · {item.title}</div>
                <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">{item.period}</div>
                {(item.highlights ?? []).slice(0, 2).map((item: string) => (
                  <p key={item} className="mt-1 text-[var(--hai-text-2)]">{item}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[11px] text-[var(--hai-text-3)]">技能图谱</div>
          <div className="space-y-2">
            {skills.slice(0, 6).map((skill: string, index: number) => (
              <SkillBar key={skill} label={skill} value={Math.max(62, 94 - index * 7)} />
            ))}
          </div>
        </div>
      </div>
    ),
  };
}

function jdDrawer(payload: any) {
  const job = payload?.job ?? getJobs()[0];
  const title = job?.title ?? payload?.title ?? '职位描述';
  return {
    title: '职位描述对比',
    meta: job?.id ?? 'jd',
    mark: '职',
    actions: [
      { label: '接受全部', primary: true, message: `接受${title}的职位描述优化建议` },
      { label: '逐段确认', message: `逐段确认${title}的职位描述改写` },
      { label: '继续改写', message: `继续改写${title}，让推荐策略更清晰` },
    ],
    body: (
      <div className="space-y-3">
        <div className="hai-panel p-4">
          <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">{job?.id ?? 'req'}</div>
          <h2 className="mt-1 text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-[var(--hai-text-2)]">把传统职位描述改成能驱动智能体推荐的画像。</p>
        </div>
        <DiffChunk label="职责范围" before={job?.description ?? '负责岗位相关工作，推动业务增长。'} after="负责候选人画像、推荐策略、增长实验和跨团队决策闭环。" />
        <DiffChunk label="必备能力" before={(job?.requirements ?? ['熟悉相关业务，有产品或技术经验，沟通能力强。']).slice(0, 2).join('；')} after="能把业务目标拆成指标、实验和候选人评估规则，并解释每条推荐理由。" />
        <DiffChunk label="成功标准" before="提升招聘效率和候选人质量。" after="两周内产出高信号候选池，提升初筛到面试转化，并让推荐理由可解释。" />
      </div>
    ),
  };
}

function pipelineDrawer(payload: any) {
  const pipeline = payload?.funnel?.length ? payload.funnel : getPipelineData()[0]?.pipeline ?? [];
  const jobs = getPipelineData().slice(0, 5);
  return {
    title: '招聘漏斗',
    meta: payload?.period ?? 'pipeline',
    mark: '漏',
    actions: [
      { label: '展开风险岗位', primary: true, message: '展开风险岗位的详细分析' },
      { label: '生成下周动作', message: '基于这份漏斗生成下周招聘动作' },
    ],
    body: (
      <div className="space-y-4">
        <Section title="判断">{getPipelineSummary() || '候选池足够，但初筛到面试转化需要重点关注。'}</Section>
        <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-5 gap-2">
          {['已搜寻', '已初筛', '面试', '录用', '入职'].map((stage, index) => (
            <div key={stage} className="hai-panel min-h-[320px]">
              <div className="flex justify-between border-b border-[var(--hai-border)] px-3 py-2 text-[var(--hai-text-2)]">
                <span>{stage}</span>
                <span className="hai-mono text-[var(--hai-text-3)]">{pipeline[index]?.count ?? Math.max(1, 12 - index * 3)}</span>
              </div>
              {jobs.slice(0, Math.max(1, 4 - index)).map((job) => (
                <div key={`${stage}-${job.jobId}`} className="m-2 rounded-[var(--hai-radius)] border border-[var(--hai-border)] bg-[var(--hai-bg)] p-2 text-[var(--hai-text-2)]">
                  <div className="truncate">{job.title}</div>
                  <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">{job.status}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
        </div>
      </div>
    ),
  };
}

function diagnosisDrawer(payload: any) {
  const funnel = payload?.funnel ?? [
    { stage: '搜寻', count: 420, conversion_rate: 1 },
    { stage: '初筛', count: 188, conversion_rate: 0.45 },
    { stage: '面试', count: 76, conversion_rate: 0.18 },
    { stage: '录用', count: 18, conversion_rate: 0.04 },
  ];
  return {
    title: '推荐诊断',
    meta: 'charts',
    mark: '诊',
    actions: [
      { label: '放宽地域', primary: true, message: '把地域从上海扩到华东和远程亚洲后重新搜索' },
      { label: '调整画像', message: '把岗位画像从 HR SaaS 调整为复杂 B 端或协同系统经验' },
    ],
    body: (
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <ChartPanel title="漏斗转化" rows={funnel.map((item: any) => ({ label: item.stage, value: Math.round((item.conversion_rate ?? 0.5) * 100), count: item.count }))} />
          <ChartPanel title="零推荐归因" rows={[
            { label: '地域过窄', value: 72, count: 38 },
            { label: '工具栈', value: 48, count: 24 },
            { label: '薪酬错位', value: 38, count: 19 },
            { label: 'JD 过旧', value: 22, count: 11 },
          ]} />
        </div>
        <Section title="建议">把地域从上海扩到华东和远程亚洲；把“必须 HR SaaS”改成“复杂 B 端或协同系统经验”。</Section>
      </div>
    ),
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="hai-panel p-3">
      <div className="text-[11px] text-[var(--hai-text-3)]">{label}</div>
      <div className="hai-mono mt-1 truncate">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] text-[var(--hai-text-3)]">{title}</div>
      <div className="hai-panel p-3 text-[var(--hai-text-2)]">{children}</div>
    </div>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between hai-mono text-[11px] text-[var(--hai-text-2)]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hai-surface-2)]">
        <div className="h-full bg-[var(--hai-accent)]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DiffChunk({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <div className="grid overflow-hidden rounded-[var(--hai-radius)] border border-[var(--hai-border)] md:grid-cols-2">
      <div className="border-b border-[var(--hai-border)] bg-[var(--hai-surface)] p-3 text-[var(--hai-text-3)] md:border-b-0 md:border-r">
        <div className="hai-mono mb-2 text-[11px]">当前 · {label}</div>
        {before}
      </div>
      <div className="bg-[var(--hai-surface)] p-3">
        <div className="hai-mono mb-2 text-[11px] text-[var(--hai-text-3)]">建议 · {label}</div>
        <p className="text-[var(--hai-text-2)]">{after}</p>
        <div className="mt-3 flex gap-2">
          <button className="hai-button">拒绝</button>
          <button className="hai-button">接受</button>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ title, rows }: { title: string; rows: { label: string; value: number; count: number }[] }) {
  return (
    <div className="hai-panel p-3">
      <div className="font-medium">{title}</div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[72px_1fr_42px] items-center gap-2 text-[11px] text-[var(--hai-text-2)]">
            <span>{row.label}</span>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--hai-surface-2)]">
              <div className="h-full bg-[var(--hai-accent)]" style={{ width: `${Math.min(100, row.value)}%` }} />
            </div>
            <span className="hai-mono text-right text-[var(--hai-text-3)]">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeCandidatePayload(payload: any) {
  return {
    id: payload?.id,
    name: payload?.name,
    currentCompany: payload?.currentCompany ?? payload?.current_company,
    currentTitle: payload?.currentTitle ?? payload?.current_title,
    education: payload?.education,
    location: payload?.location,
    skills: payload?.skills ?? payload?.tags ?? [],
    careerHistory: payload?.careerHistory ?? payload?.career ?? [],
    projects: payload?.projects ?? [],
    lastActive: payload?.lastActive ?? payload?.last_active,
  };
}

function formatScore(value: number) {
  if (!value) return '86%';
  return `${Math.round(value > 1 ? value : value * 100)}%`;
}

function drawerModeLabel(mode: DrawerMode) {
  if (mode === 'pinned') return '固定';
  if (mode === 'popout') return '弹出';
  return '预览';
}

function groupSessions(sessions: { id: string; title: string; timestamp: number }[]) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const groups = [
    { label: '今天', items: [] as typeof sessions },
    { label: '昨天', items: [] as typeof sessions },
    { label: '最近 7 天', items: [] as typeof sessions },
  ];

  sessions.forEach((session) => {
    const date = new Date(session.timestamp);
    if (date.toDateString() === today.toDateString()) groups[0].items.push(session);
    else if (date.toDateString() === yesterday.toDateString()) groups[1].items.push(session);
    else groups[2].items.push(session);
  });

  return groups.filter((group) => group.items.length > 0);
}

function formatSessionMeta(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()} · ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function settingsCards(tab: string) {
  const base = [
    { title: '当前规则', meta: '规则:生效', body: '规则以结构化方式影响智能体推荐、解释和下一步动作，而不是要求用户填写长表单。' },
    { title: '最近变更', meta: '审计:7天', body: '保留配置变更记录，方便招聘、HRBP 和业务负责人回看决策依据。' },
    { title: '默认策略', meta: '策略:默认', body: '低频设置只服务高频对话，默认不干扰主流程。' },
    { title: '同步状态', meta: '同步:正常', body: '职位、候选人、日历、审批系统保持后台连接。' },
  ];
  if (tab === '推荐策略') {
    return [
      { title: '高信号优先', meta: '权重:0.42', body: '优先推荐有推荐系统、增长实验、跨团队负责人经验的人。' },
      { title: '风险解释', meta: '必须', body: '每个推荐必须带匹配理由、缺口和下一步验证问题。' },
      ...base.slice(2),
    ];
  }
  return base;
}

function getPendingThinkingSteps(input: string): string[] {
  const text = input.toLowerCase();
  if (/薪酬|salary|offer|package|预算|年包|对标/.test(input)) {
    return ['理解薪酬诉求', '读取候选人与市场数据', '对齐预算和风险', '整理谈判建议'];
  }
  if (/pipeline|周报|月报|进度|漏斗|卡住|招聘数据/.test(text + input)) {
    return ['理解报告范围', '汇总招聘进度', '定位卡点和风险', '生成行动建议'];
  }
  if (/面试|题|interview|模拟|评分/.test(text + input)) {
    return ['理解面试目标', '读取候选人和岗位信息', '组织面试问题', '整理评分关注点'];
  }
  if (/对比|比较|compare|谁更|哪个更/.test(text + input)) {
    return ['识别对比对象', '读取候选人档案', '比较关键维度', '形成推进建议'];
  }
  if (/岗位|jd|hc|职位|团队|在招/.test(text + input)) {
    return ['理解岗位需求', '读取岗位和团队数据', '匹配候选人线索', '整理下一步动作'];
  }
  return ['理解你的需求', '检索候选人与招聘数据', '整理卡片和建议', '收束成可执行结论'];
}

function seedDemoMemory(memory: MemoryManager) {
  const key = 'hireagent-memory-seeded-s8';
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
  } catch {
    // localStorage unavailable; in-memory adapter still works.
  }

  const notes = [
    '二面后流程暂停（2025-11-20），当时薪资期望 130 万超出预算。',
    '已知正在比较 OPPO 推荐架构组的 offer（OPPO 给到 140 万+期权）。',
    '技术面评分很高（4.5/5），工程落地能力突出。薪资是唯一卡点。',
    '内推人周经理反馈：如果能争取到更好 package，张三可以再谈。',
  ];

  for (const content of notes) {
    memory.write({
      layer: 'candidate',
      entity_id: 'res_007',
      content,
      source: 'system',
    }).catch(() => {
      // Demo seed failure must not block the chat surface.
    });
  }
}
