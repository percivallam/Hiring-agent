import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronsLeft,
  ClipboardList,
  Command,
  DollarSign,
  ExternalLink,
  FileText,
  GitCompare,
  Maximize2,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { MessageList } from '@/components/chat/MessageList';
import { useChatStore, exportAllData } from '@/store/chatStore';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import { AIEngine } from '@/engine/AIEngine';
import { BrowserStorage, MemoryManager } from '@/memory';
import {
  getJobs,
  getMarketData,
  getMarketRoles,
  getPipelineData,
  getPipelineSummary,
  getResumeById,
  getSalaryBenchmark,
  getSalaryRoles,
  searchResumes,
} from '@/data';
import { cn } from '@/lib/utils';
import type { Message, UserRole } from '@/types';

type TaskKind =
  | 'search'
  | 'candidate'
  | 'jd'
  | 'pipeline'
  | 'diagnosis'
  | 'salary'
  | 'interview'
  | 'message'
  | 'comparison';
type DrawerMode = 'peek' | 'pinned' | 'popout';

interface DrawerState {
  kind: TaskKind;
  mode: DrawerMode;
  payload?: any;
  source?: 'auto' | 'manual';
}

interface TaskView {
  title: string;
  meta: string;
  mark: string;
  intent: string;
  body: React.ReactNode;
  actions: { label: string; message?: string; primary?: boolean }[];
}

const slashCommands = [
  { command: '/找人', label: '搜索候选人', icon: Search, prompt: '找推荐算法负责人，偏推荐系统、增长实验和团队协作，上海或远程' },
  { command: '/看简历', label: '调取简历', icon: UserRound, prompt: '看看匹配度最高候选人的详细简历，并指出风险' },
  { command: '/对比', label: '候选人对比', icon: GitCompare, prompt: '对比最匹配的两位候选人，给出推进建议' },
  { command: '/薪酬', label: '薪酬对标', icon: DollarSign, prompt: '推荐算法工程师薪资对标，给出 offer 区间建议' },
  { command: '/看漏斗', label: '招聘漏斗', icon: BarChart3, prompt: '查看招聘 pipeline，指出本周卡点和下一步动作' },
  { command: '/写职位', label: '优化 JD', icon: FileText, prompt: '优化推荐算法负责人的职位描述，让候选人画像更清晰' },
  { command: '/面试', label: '面试包', icon: ClipboardList, prompt: '给推荐算法岗准备一面问题，关注业务理解和工程落地' },
  { command: '/设置', label: '设置', icon: Settings, prompt: '/设置' },
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
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [drawerWidth, setDrawerWidth] = useState(424);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState(settingsCategories[0]);
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [localHistory, setLocalHistory] = useState<string[]>([]);
  const [autoDrawerDismissedAt, setAutoDrawerDismissedAt] = useState(-1);

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
    setDrawer(null);
    setAutoDrawerDismissedAt(-1);
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

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
  }, [input]);

  const activeSession = sessions.find((session) => session.id === currentSessionId);
  const groupedSessions = useMemo(() => groupSessions(sessions.filter((session) => session.role === role)), [sessions, role]);
  const inferredDrawer = useMemo(() => inferDrawerFromMessages(messages, drawer?.mode ?? 'peek'), [messages, drawer?.mode]);
  const activeDrawer = drawer ?? (messages.length > autoDrawerDismissedAt ? inferredDrawer : null);
  const taskOpen = Boolean(activeDrawer);
  const streamHasConversation = messages.length > 0 || isTyping;
  const slashOpen = input.startsWith('/');
  const topMeta = `会话:${currentSessionId?.slice(-6) ?? '新建'} · 任务:${activeDrawer ? taskKindLabel(activeDrawer.kind) : '待触发'}`;

  const autoNameSession = useCallback((content: string) => {
    const { currentSessionId: sid } = useSessionStore.getState();
    if (!sid) return;
    const state = useSessionStore.getState();
    const session = state.sessions.find((item) => item.id === sid);
    if (session && session.title === '新对话') {
      state.updateSessionTitle(sid, content.slice(0, 20) + (content.length > 20 ? '...' : ''));
    }
  }, []);

  const openDrawer = useCallback((kind: TaskKind, payload?: any, mode: DrawerMode = drawer?.mode ?? 'peek', source: DrawerState['source'] = 'manual') => {
    setAutoDrawerDismissedAt(-1);
    setDrawer({ kind, payload, mode, source });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [drawer?.mode]);

  const closeDrawer = useCallback(() => {
    setAutoDrawerDismissedAt(useChatStore.getState().messages.length);
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
    const requestedKind = inferTaskKindFromInput(value);
    openDrawer(requestedKind, { input: value, pending: true }, drawer?.mode ?? 'peek', 'auto');

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
        const nextDrawer = inferDrawerFromMessages(result.responses as any, drawer?.mode ?? 'peek', requestedKind);
        if (nextDrawer && shouldReplaceDrawerForResponse(requestedKind, nextDrawer.kind)) {
          setDrawer({ ...nextDrawer, source: 'auto' });
        }
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
      openDrawer('diagnosis', { input: value, error: true }, drawer?.mode ?? 'peek', 'auto');
    } finally {
      stepTimers.forEach(window.clearTimeout);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [addMessage, addUserMessage, autoNameSession, drawer?.mode, isTyping, openDrawer, startThinking, stopThinking, updateThinkingStep]);

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
        if (activeDrawer) closeDrawer();
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
        if (drawer) closeDrawer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDrawer, closeDrawer, drawer, openDrawer]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const next = Math.max(360, Math.min(620, resizeRef.current.startWidth + resizeRef.current.startX - event.clientX));
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

  return (
    <div className="ai-native-shell h-screen overflow-hidden bg-[var(--hai-bg)] text-[var(--hai-text)]">
      <div
        className={cn('hai-shell-grid h-full overflow-hidden', taskOpen && 'hai-shell-grid-task-open')}
        style={{
          ['--hai-rail-width' as any]: `${railCollapsed ? 64 : 280}px`,
          ['--hai-task-width' as any]: taskOpen ? `${drawerWidth}px` : '0px',
        }}
      >
        <aside className="hai-left-rail min-w-0 flex flex-col border-r border-[var(--hai-border)] bg-[var(--hai-rail-bg)]">
          <div className="hai-rail-head flex h-14 items-center gap-2.5 border-b border-[var(--hai-border)] px-3">
            <div className="hai-brand-mark">
              <Bot className="h-4 w-4" />
            </div>
            {!railCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">HireAgent</div>
                <div className="hai-mono truncate text-[11px] text-[var(--hai-text-3)]">AI native recruiting OS</div>
              </div>
            )}
            <button className="hai-icon-button" onClick={() => setRailCollapsed((value) => !value)} title="收起侧栏">
              <ChevronsLeft className={cn('h-4 w-4 transition-transform', railCollapsed && 'rotate-180')} />
            </button>
          </div>

          <div className="p-3">
            <button
              className="hai-button hai-button-primary w-full"
              onClick={() => {
                createSession(role);
                inputRef.current?.focus();
              }}
            >
              <Plus className="h-4 w-4" />
              {!railCollapsed && <span>新对话</span>}
            </button>
          </div>

          {!railCollapsed && (
            <div className="px-3 pb-2">
              <div className="hai-project-chip">
                <BriefcaseBusiness className="h-3.5 w-3.5 text-[var(--hai-accent)]" />
                <span className="min-w-0 flex-1 truncate">推荐算法招聘项目</span>
                <span className="hai-mono text-[10px] text-[var(--hai-text-3)]">Live</span>
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {groupedSessions.length === 0 && (
              <div className="mx-2 rounded-[var(--hai-radius)] border border-dashed border-[var(--hai-border)] p-3 text-xs text-[var(--hai-text-3)]">
                {!railCollapsed ? '暂无历史会话。开始一次招聘任务后会自动保存在这里。' : '空'}
              </div>
            )}
            {groupedSessions.map((group) => (
              <div key={group.label} className="mb-4">
                {!railCollapsed && <div className="px-2 pb-1 text-[11px] text-[var(--hai-text-3)]">{group.label}</div>}
                <div className="space-y-1">
                  {group.items.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSession(session.id)}
                      className={cn(
                        'hai-session-item relative w-full rounded-[var(--hai-radius)] border px-2 py-2 text-left transition-colors',
                        session.id === currentSessionId
                          ? 'hai-session-active border-[var(--hai-accent-border)] bg-[var(--hai-accent-bg)] text-[var(--hai-text)]'
                          : 'border-transparent text-[var(--hai-text-2)] hover:border-[var(--hai-border)] hover:bg-[var(--hai-surface)]'
                      )}
                      title={session.title}
                    >
                      {railCollapsed ? (
                        <span className="hai-mono text-[var(--hai-text-3)]">{session.title.slice(0, 1)}</span>
                      ) : (
                        <>
                          <div className="truncate text-sm">{session.title}</div>
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
              onClick={() => setCommandOpen(true)}
              title="命令面板"
              aria-label="打开命令面板"
              data-testid="hai-command-button"
            >
              <Command className="h-4 w-4" />
              {!railCollapsed && <span>命令面板</span>}
            </button>
            <button
              className="hai-button mb-1 w-full justify-start"
              onClick={() => setSettingsOpen(true)}
              title="设置"
              aria-label="打开设置"
              data-testid="hai-settings-button"
            >
              <Settings className="h-4 w-4" />
              {!railCollapsed && <span>设置</span>}
            </button>
            <a className="hai-button w-full justify-start" href="/classic" title="老版本">
              <ExternalLink className="h-4 w-4" />
              {!railCollapsed && <span>老版本</span>}
            </a>
          </div>
        </aside>

        <main className="relative min-w-0 flex flex-col bg-[var(--hai-bg)]">
          <header className="hai-shell-header flex h-14 shrink-0 items-center justify-between border-b border-[var(--hai-border)] px-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{activeSession?.title && activeSession.title !== '新对话' ? activeSession.title : '招聘对话'}</span>
                <span className="hai-status-pill"><Sparkles className="h-3 w-3" /> LLM loop</span>
              </div>
              <div className="hai-mono mt-0.5 truncate text-[11px] text-[var(--hai-text-3)]">{topMeta}</div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <span className="hai-shortcut">⌘K</span>
              <span className="hai-shortcut">⌘\</span>
              <span className="hai-shortcut">⌘,</span>
              <button className="hai-icon-button" onClick={() => activeDrawer ? closeDrawer() : openDrawer('pipeline')} title={activeDrawer ? '关闭任务窗' : '打开任务窗'}>
                {activeDrawer ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              </button>
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
                onDrawerOpen={(kind, payload) => openDrawer(kind, payload)}
                className="ai-native-message-list"
              />
            ) : (
              <EmptyState
                onPick={(prompt) => {
                  setInput(prompt);
                  openDrawer(inferTaskKindFromInput(prompt), { input: prompt, pending: true }, activeDrawer?.mode ?? 'peek', 'auto');
                }}
              />
            )}
          </section>

          <section className="hai-composer-wrap shrink-0 border-t border-[var(--hai-border)] px-4 pb-4 pt-3">
            <div className="relative mx-auto max-w-[860px]">
              <AnimatePresence>
                {slashOpen && (
                  <SlashMenu
                    onPick={(item) => {
                      if (item.command === '/设置') {
                        setSettingsOpen(true);
                        setInput('');
                      } else {
                        setInput(item.prompt);
                        openDrawer(inferTaskKindFromInput(item.prompt), { input: item.prompt, pending: true }, activeDrawer?.mode ?? 'peek', 'auto');
                      }
                      window.setTimeout(() => inputRef.current?.focus(), 0);
                    }}
                  />
                )}
              </AnimatePresence>

              <div className="hai-composer">
                <div className="flex items-start gap-2 px-3 pt-3">
                  <span className="hai-caret"><Sparkles className="h-4 w-4" /></span>
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
                    aria-label="招聘任务输入"
                    data-testid="hai-composer-input"
                    placeholder={isTyping ? '智能体正在处理招聘任务...' : '直接描述招聘目标，或输入 / 调用任务'}
                    className="max-h-32 min-h-[30px] flex-1 resize-none bg-transparent py-0.5 text-sm leading-6 text-[var(--hai-text)] outline-none placeholder:text-[var(--hai-text-3)] disabled:opacity-50"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                  <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                    {slashCommands.slice(0, 5).map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.command}
                          className="hai-composer-chip"
                          onClick={() => {
                            setInput(item.prompt);
                            openDrawer(inferTaskKindFromInput(item.prompt), { input: item.prompt, pending: true }, activeDrawer?.mode ?? 'peek', 'auto');
                            window.setTimeout(() => inputRef.current?.focus(), 0);
                          }}
                          title={item.label}
                          disabled={isTyping}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{item.command.replace('/', '')}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className={cn('hai-send-button', input.trim() && !isTyping && 'hai-send-button-ready')}
                    disabled={isTyping || !input.trim()}
                    onClick={() => handleSend(input)}
                    title="发送"
                    aria-label="运行招聘任务"
                    data-testid="hai-run-button"
                  >
                    <Send className="h-4 w-4" />
                    <span>运行</span>
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--hai-text-3)]">
                <span>推荐算法招聘项目</span>
                <span className="hai-mono">LLM loop · tools ready</span>
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

        <TaskPanel
          state={activeDrawer}
          isTyping={isTyping}
          thinkingSteps={thinkingSteps}
          currentStep={currentStep}
          onClose={closeDrawer}
          onResizeStart={(event) => {
            resizeRef.current = { startX: event.clientX, startWidth: drawerWidth };
          }}
          onModeChange={(mode) => {
            if (!activeDrawer) return;
            setDrawer({ ...activeDrawer, mode, source: 'manual' });
          }}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  const starters = [
    '找推荐算法负责人，偏推荐系统和增长实验',
    '同时帮我找人、看 pipeline、做薪资对标',
    '诊断推荐算法岗为什么初筛转化低',
    '给候选人准备一面问题和评分关注点',
  ];

  return (
    <div className="flex h-full items-center justify-center px-5">
      <div className="hai-empty max-w-3xl">
        <div className="hai-empty-mark"><Sparkles className="h-5 w-5" /></div>
        <h1>从一句招聘目标开始</h1>
        <p>找人、看简历、对比候选人、诊断漏斗和准备面试，都可以从这里开始。</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {starters.map((prompt) => (
            <button key={prompt} className="hai-starter" onClick={() => onPick(prompt)}>
              <span>{prompt}</span>
              <Send className="h-3.5 w-3.5" />
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
      className="hai-slash-menu absolute bottom-full left-0 z-30 mb-2 w-[360px] overflow-hidden rounded-[var(--hai-radius-lg)] border border-[var(--hai-border)] bg-[var(--hai-surface)] shadow-[var(--hai-shadow-soft)]"
    >
      {slashCommands.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.command}
            onClick={() => onPick(item)}
            className="flex w-full items-center justify-between gap-3 border-b border-[var(--hai-border)] px-3 py-2.5 text-left text-[var(--hai-text-2)] last:border-b-0 hover:bg-[var(--hai-surface-2)] hover:text-[var(--hai-text)]"
          >
            <span className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-[var(--hai-accent)]" />
              <span className="hai-mono text-[var(--hai-accent)]">{item.command}</span>
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

function TaskPanel({
  state,
  isTyping,
  thinkingSteps,
  currentStep,
  onClose,
  onResizeStart,
  onModeChange,
  onSend,
}: {
  state: DrawerState | null;
  isTyping: boolean;
  thinkingSteps: string[];
  currentStep: number;
  onClose: () => void;
  onResizeStart: (event: React.MouseEvent) => void;
  onModeChange: (mode: DrawerMode) => void;
  onSend: (message: string) => void;
}) {
  const view = state ? getTaskView(state.kind, state.payload) : null;

  return (
    <AnimatePresence>
      {state && view && (
        <motion.aside
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className={cn('hai-task-panel min-w-0 border-l border-[var(--hai-border)] bg-[var(--hai-surface)] text-[var(--hai-text)]', state.mode === 'popout' && 'hai-task-popout')}
          data-testid="hai-task-panel"
        >
          <div className="hai-task-resize" onMouseDown={onResizeStart}>⋮</div>
          <div className="min-w-0 flex h-full flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--hai-border)] px-3">
              <div className="hai-task-mark">{view.mark}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{view.title}</div>
                <div className="hai-mono truncate text-[11px] text-[var(--hai-text-3)]">{drawerModeLabel(state.mode)} · {view.meta}</div>
              </div>
              <button className="hai-icon-button" title="固定" onClick={() => onModeChange(state.mode === 'pinned' ? 'peek' : 'pinned')}>
                <Pin className="h-4 w-4" />
              </button>
              <button className="hai-icon-button" title="弹出" onClick={() => onModeChange(state.mode === 'popout' ? 'peek' : 'popout')}>
                {state.mode === 'popout' ? <Maximize2 className="h-4 w-4 rotate-180" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button className="hai-icon-button" title="关闭" onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--hai-bg)] p-3">
              <TaskStatus kind={state.kind} intent={view.intent} isTyping={isTyping} steps={thinkingSteps} currentStep={currentStep} />
              <div className="mt-3">{view.body}</div>
            </div>

            <div className="shrink-0 border-t border-[var(--hai-border)] bg-[var(--hai-surface)] px-3 py-3">
              <div className="flex flex-wrap gap-2">
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

function TaskStatus({
  kind,
  intent,
  isTyping,
  steps,
  currentStep,
}: {
  kind: TaskKind;
  intent: string;
  isTyping: boolean;
  steps: string[];
  currentStep: number;
}) {
  const base = steps.length ? steps : defaultSteps(kind);
  return (
    <div className="hai-task-card">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">任务状态</div>
          <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">{intent}</div>
        </div>
        <span className={cn('hai-status-pill', isTyping ? 'hai-status-running' : 'hai-status-done')}>
          {isTyping ? <Sparkles className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {isTyping ? '运行中' : '可查看'}
        </span>
      </div>
      <div className="space-y-1.5">
        {base.slice(0, 4).map((step, index) => {
          const done = !isTyping || index < currentStep;
          const current = isTyping && index === currentStep;
          return (
            <div key={`${step}-${index}`} className={cn('hai-task-step', done && 'hai-task-step-done', current && 'hai-task-step-current')}>
              <span />
              <p>{step}</p>
            </div>
          );
        })}
      </div>
    </div>
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
          className="absolute inset-x-0 bottom-0 top-14 z-50 border-l border-[var(--hai-border)] bg-[var(--hai-bg)] shadow-[var(--hai-shadow-soft)]"
        >
          <div className="grid h-full grid-cols-[220px_minmax(0,1fr)]">
            <nav className="border-r border-[var(--hai-border)] bg-[var(--hai-surface)] p-3">
              {settingsCategories.map((item) => (
                <button
                  key={item}
                  onClick={() => onTabChange(item)}
                  className={cn(
                    'mb-1 w-full rounded-[var(--hai-radius-sm)] border border-transparent px-3 py-2 text-left text-[var(--hai-text-2)] hover:bg-[var(--hai-surface-2)] hover:text-[var(--hai-text)]',
                    item === activeTab && 'border-[var(--hai-accent-border)] bg-[var(--hai-accent-bg)] text-[var(--hai-text)]'
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
                <button className="hai-button" onClick={onClose} aria-label="返回对话" data-testid="hai-settings-return">返回对话</button>
              </div>
              <p className="mt-2 max-w-2xl text-[var(--hai-text-2)]">
                低频 ATS 能力放在这里：规则、字段、集成和权限服务对话主流程，但不抢主界面。
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
  onCommand: (kind: TaskKind | 'settings') => void;
}) {
  const items = [
    { label: '搜索候选人', meta: '找人', icon: Search, kind: 'search' as const },
    { label: '打开候选人简历', meta: '简历', icon: UserRound, kind: 'candidate' as const },
    { label: '候选人对比', meta: '对比', icon: GitCompare, kind: 'comparison' as const },
    { label: '查看招聘漏斗', meta: '漏斗', icon: BarChart3, kind: 'pipeline' as const },
    { label: '薪酬对标', meta: '薪酬', icon: DollarSign, kind: 'salary' as const },
    { label: '优化职位描述', meta: '职位', icon: FileText, kind: 'jd' as const },
    { label: '打开设置', meta: '⌘,', icon: Settings, kind: 'settings' as const },
  ];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="absolute inset-x-0 bottom-0 top-14 z-[60] bg-[var(--hai-overlay)]"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -8 }}
            animate={{ y: 0 }}
            exit={{ y: -8 }}
            className="mx-auto mt-20 w-[min(640px,calc(100%-32px))] overflow-hidden rounded-[var(--hai-radius-lg)] border border-[var(--hai-border)] bg-[var(--hai-surface)] shadow-[var(--hai-shadow-soft)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-12 items-center gap-2 border-b border-[var(--hai-border)] px-4">
              <Command className="h-4 w-4 text-[var(--hai-accent)]" />
              <span className="text-[var(--hai-text-3)]">搜索命令、候选人、职位或任务组件</span>
            </div>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onCommand(item.kind)}
                  data-testid={`hai-command-${item.kind}`}
                  className="flex w-full items-center justify-between border-b border-[var(--hai-border)] px-4 py-3 text-left text-[var(--hai-text-2)] last:border-b-0 hover:bg-[var(--hai-surface-2)] hover:text-[var(--hai-text)]"
                >
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{item.label}</span>
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

function getTaskView(kind: TaskKind, payload: any): TaskView {
  switch (kind) {
    case 'search':
      return searchTask(payload);
    case 'candidate':
      return candidateTask(payload);
    case 'jd':
      return jdTask(payload);
    case 'pipeline':
      return pipelineTask(payload);
    case 'diagnosis':
      return diagnosisTask(payload);
    case 'salary':
      return salaryTask(payload);
    case 'interview':
      return interviewTask(payload);
    case 'message':
      return messageTask(payload);
    case 'comparison':
      return comparisonTask(payload);
    default:
      return searchTask(payload);
  }
}

function searchTask(payload: any): TaskView {
  const candidates = normalizeCandidates(payload?.candidates ?? payload?.data?.candidates).length
    ? normalizeCandidates(payload?.candidates ?? payload?.data?.candidates)
    : searchResumes('推荐算法').slice(0, 6).map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      title: candidate.currentTitle,
      company: candidate.currentCompany,
      score: candidate.matchScore,
      tags: candidate.tags,
    }));

  return {
    title: '候选人搜索',
    meta: `${candidates.length || 0} profiles`,
    mark: '搜',
    intent: '找人 / 筛选 / 推荐',
    actions: [
      { label: '对比前两位', primary: true, message: candidates.length >= 2 ? `对比 ${candidates[0].name} 和 ${candidates[1].name}` : '对比最匹配的两位候选人' },
      { label: '继续收窄', message: '按大厂背景、增长实验和到岗风险继续筛选' },
    ],
    body: (
      <div className="space-y-3">
        <Section title="候选池">
          <div className="space-y-2">
            {candidates.map((candidate, index) => (
              <div key={`${candidate.id}-${index}`} className="hai-row-card">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{candidate.name}</span>
                    <span className="hai-score">{formatScore(candidate.score)}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-[var(--hai-text-3)]">{candidate.company} · {candidate.title}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(candidate.tags ?? []).slice(0, 3).map((tag: string) => <span key={tag} className="hai-chip">{tag}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="判断">
          优先看匹配分高且最近活跃的人，再用对话继续验证真实负责范围、薪酬窗口和到岗意愿。
        </Section>
      </div>
    ),
  };
}

function candidateTask(payload: any): TaskView {
  const id = payload?.id ?? payload?.candidateId;
  const profile = id ? getResumeById(id) : undefined;
  const data = profile ?? normalizeCandidatePayload(payload);
  const skills = data.skills?.length ? data.skills : ['推荐系统', '增长实验', 'AI 产品', '组织协同'];
  const career = data.careerHistory?.length ? data.careerHistory : [
    { company: data.currentCompany || '候选人当前公司', title: data.currentTitle || '当前职位', period: '最近阶段', highlights: ['核心经历待从简历继续补齐'] },
  ];

  return {
    title: '候选人简历',
    meta: data.id ?? 'candidate',
    mark: '简',
    intent: '简历深看 / 风险判断 / 推进动作',
    actions: [
      { label: '加入候选池', primary: true, message: `${data.name || '该候选人'} 加入候选池，并生成下一步推进建议` },
      { label: '生成触达话术', message: `给${data.name || '该候选人'}生成触达话术` },
      { label: '安排面试', message: `安排${data.name || '该候选人'}的一面` },
    ],
    body: (
      <div className="space-y-3">
        <div className="hai-task-card">
          <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">{data.id ?? 'candidate'}</div>
          <h2 className="mt-1 text-lg font-semibold">{data.name || '候选人'}</h2>
          <div className="text-[var(--hai-text-2)]">{data.currentTitle || '职位待确认'} · {data.currentCompany || '公司待确认'}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="匹配分" value={formatScore(payload?.match_score ?? payload?.matchScore ?? 0.86)} />
          <Field label="地点" value={data.location ?? '待确认'} />
          <Field label="学历" value={data.education ?? '待确认'} />
          <Field label="最近活动" value={data.lastActive ?? '待确认'} />
        </div>
        <Section title="智能评估">
          强匹配。建议一面前确认真实负责范围、薪酬风险、离职窗口和是否具备跨团队推进能力。
        </Section>
        <Section title="经历时间线">
          <div className="space-y-3 border-l border-[var(--hai-border)] pl-3">
            {career.map((item: any, index: number) => (
              <div key={`${item.company}-${index}`} className="relative">
                <div className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-[var(--hai-accent)]" />
                <div className="font-medium">{item.company} · {item.title}</div>
                <div className="hai-mono text-[11px] text-[var(--hai-text-3)]">{item.period}</div>
                {(item.highlights ?? []).slice(0, 2).map((highlight: string) => (
                  <p key={highlight} className="mt-1 text-[var(--hai-text-2)]">{highlight}</p>
                ))}
              </div>
            ))}
          </div>
        </Section>
        <Section title="技能图谱">
          <div className="space-y-2">
            {skills.slice(0, 6).map((skill: string, index: number) => (
              <SkillBar key={skill} label={skill} value={Math.max(62, 94 - index * 7)} />
            ))}
          </div>
        </Section>
      </div>
    ),
  };
}

function jdTask(payload: any): TaskView {
  const job = payload?.job ?? getJobs()[0];
  const title = job?.title ?? payload?.title ?? '职位描述';
  return {
    title: '职位描述',
    meta: job?.id ?? 'jd',
    mark: '职',
    intent: '岗位画像 / JD 改写 / 规则确认',
    actions: [
      { label: '接受全部', primary: true, message: `接受${title}的职位描述优化建议` },
      { label: '逐段确认', message: `逐段确认${title}的职位描述改写` },
      { label: '继续改写', message: `继续改写${title}，让推荐策略更清晰` },
    ],
    body: (
      <div className="space-y-3">
        <div className="hai-task-card">
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

function pipelineTask(payload: any): TaskView {
  const source = unwrapPayload(payload);
  const pipeline = source?.funnel?.length ? source.funnel : getPipelineData()[0]?.pipeline ?? [];
  const jobs = getPipelineData().slice(0, 5);
  const stages = ['已搜寻', '已初筛', '面试', '录用', '入职'];
  return {
    title: '招聘漏斗',
    meta: source?.period ?? 'pipeline',
    mark: '漏',
    intent: 'Pipeline / 周报 / 卡点定位',
    actions: [
      { label: '展开风险岗位', primary: true, message: '展开风险岗位的详细分析' },
      { label: '生成下周动作', message: '基于这份漏斗生成下周招聘动作' },
    ],
    body: (
      <div className="space-y-3">
        <Section title="判断">{getPipelineSummary() || '候选池足够，但初筛到面试转化需要重点关注。'}</Section>
        <div className="overflow-x-auto">
          <div className="grid min-w-[620px] grid-cols-5 gap-2">
            {stages.map((stage, index) => (
              <div key={stage} className="hai-kanban-lane">
                <div className="flex justify-between border-b border-[var(--hai-border)] px-3 py-2 text-[var(--hai-text-2)]">
                  <span>{stage}</span>
                  <span className="hai-mono text-[var(--hai-text-3)]">{pipeline[index]?.count ?? Math.max(1, 12 - index * 3)}</span>
                </div>
                {jobs.slice(0, Math.max(1, 4 - index)).map((job) => (
                  <div key={`${stage}-${job.jobId}`} className="hai-kanban-card">
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

function diagnosisTask(payload: any): TaskView {
  const roles = getMarketRoles();
  const market = getMarketData(roles.find((role) => role.includes('推荐')) || roles[0]);
  const funnel = payload?.funnel ?? [
    { stage: '搜寻', count: 420, conversion_rate: 1 },
    { stage: '初筛', count: 188, conversion_rate: 0.45 },
    { stage: '面试', count: 76, conversion_rate: 0.18 },
    { stage: '录用', count: 18, conversion_rate: 0.04 },
  ];
  return {
    title: '推荐诊断',
    meta: 'analysis',
    mark: '诊',
    intent: '市场分析 / 风险归因 / 条件修正',
    actions: [
      { label: '放宽地域', primary: true, message: '把地域从上海扩到华东和远程亚洲后重新搜索' },
      { label: '调整画像', message: '把岗位画像从 HR SaaS 调整为复杂 B 端或协同系统经验' },
    ],
    body: (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <ChartPanel title="漏斗转化" rows={funnel.map((item: any) => ({ label: item.stage, value: Math.round((item.conversion_rate ?? 0.5) * 100), count: item.count }))} />
          <ChartPanel title="零推荐归因" rows={[
            { label: '地域过窄', value: 72, count: 38 },
            { label: '工具栈', value: 48, count: 24 },
            { label: '薪酬错位', value: 38, count: 19 },
            { label: 'JD 过旧', value: 22, count: 11 },
          ]} />
        </div>
        <Section title="市场信号">
          {market?.insights?.slice(0, 2).join('；') || '供给偏紧，建议把硬性条件拆成必要项与可训练项。'}
        </Section>
        <Section title="建议">
          把地域从上海扩到华东和远程亚洲；把“必须同类行业经验”改成“复杂 B 端或推荐/搜索/广告策略经验”。
        </Section>
      </div>
    ),
  };
}

function salaryTask(payload: any): TaskView {
  const source = unwrapPayload(payload);
  const roles = getSalaryRoles();
  const data = source?.benchmarks?.length
    ? {
      position: source.position ?? '目标岗位',
      benchmarks: source.benchmarks,
      marketMedian: source.marketMedian ?? source.market_median ?? 110,
      recommendation: source.recommendation,
    }
    : getSalaryBenchmark(roles.find((role) => role.includes('推荐')) || roles[0]);
  const benchmarks = (data?.benchmarks ?? []).map(normalizeSalaryBenchmark);
  const max = Math.max(...benchmarks.map((item: any) => item.median ?? 0), 1);
  return {
    title: '薪酬对标',
    meta: data?.position ?? 'salary',
    mark: '薪',
    intent: '薪酬带 / Offer 策略 / 风险控制',
    actions: [
      { label: '生成 Offer 方案', primary: true, message: `基于${data?.position ?? '目标岗位'}薪酬对标生成 offer 方案` },
      { label: '看候选人风险', message: '分析候选人的薪酬风险和谈判空间' },
    ],
    body: (
      <div className="space-y-3">
        <Section title="市场区间">
          <div className="space-y-3">
            {benchmarks.map((item: any) => (
              <div key={`${item.company}-${item.level}`}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span>{item.company} · {item.level}</span>
                  <span className="hai-mono text-[var(--hai-text-3)]">{item.salaryRange}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--hai-surface-2)]">
                  <div className="h-full rounded-full bg-[var(--hai-accent)]" style={{ width: `${Math.min(100, ((item.median ?? 0) / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="建议">{data?.recommendation || '按候选人级别和竞争强度给出分层 offer，避免只按预算下限出价。'}</Section>
      </div>
    ),
  };
}

function interviewTask(payload: any): TaskView {
  const categories = payload?.categories?.length ? payload.categories : [
    { category: '业务理解', questions: [{ question: '你如何定义推荐系统产品成功？', purpose: '判断指标拆解能力' }] },
    { category: '工程协同', questions: [{ question: '讲一次推荐策略从发现问题到上线的完整过程。', purpose: '判断落地和协同能力' }] },
    { category: '风险验证', questions: [{ question: '如果模型效果好但体验指标下降，你会怎么决策？', purpose: '判断权衡能力' }] },
  ];
  return {
    title: '面试包',
    meta: payload?.candidate_name ?? payload?.candidateName ?? 'interview',
    mark: '面',
    intent: '面试题 / 评分关注点 / 面试官协同',
    actions: [
      { label: '生成评分表', primary: true, message: '生成这场面试的评分表' },
      { label: '开始模拟面试', message: '开始模拟面试' },
    ],
    body: (
      <div className="space-y-3">
        {categories.map((category: any) => (
          <Section key={category.category} title={category.category}>
            <div className="space-y-2">
              {(category.questions ?? []).map((item: any, index: number) => (
                <div key={`${item.question}-${index}`} className="hai-row-card">
                  <div className="font-medium">{item.question}</div>
                  <div className="mt-1 text-xs text-[var(--hai-text-3)]">{item.purpose}</div>
                </div>
              ))}
            </div>
          </Section>
        ))}
      </div>
    ),
  };
}

function messageTask(payload: any): TaskView {
  const source = unwrapPayload(payload);
  const candidate = source?.candidate;
  const recipient = source?.recipient ?? candidate?.name ?? payload?.recipient;
  const content = (source?.content
    ?? (candidate?.name ? `你好 ${candidate.name}，我看到你在${candidate.title || '当前方向'}上有比较完整的经历。我们当前有一个与你背景相关的机会，想和你约 20 分钟聊聊是否匹配。` : '')
  ) || '你好，我看到你在推荐系统和增长实验上有比较完整的经历。我们当前有一个偏 AI 产品和推荐策略的机会，想和你约 20 分钟聊聊是否匹配。';
  return {
    title: '沟通模板',
    meta: recipient ?? 'message',
    mark: '信',
    intent: '触达 / 催办 / Offer 沟通',
    actions: [
      { label: '改得更像猎头', primary: true, message: '把这段触达话术改得更自然、更像成熟猎头' },
      { label: '生成候选人版', message: '生成候选人可直接收到的版本' },
    ],
    body: (
      <div className="space-y-3">
        <Section title="草稿">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-[var(--hai-text-2)]">{content}</pre>
        </Section>
      </div>
    ),
  };
}

function comparisonTask(payload: any): TaskView {
  const source = unwrapPayload(payload);
  const rows = source?.dimensions ?? source?.items ?? [
    { label: '业务匹配', candidate_a: '推荐系统更强', candidate_b: '增长经验更强', advantage: 'a' },
    { label: '到岗风险', candidate_a: '薪资偏高', candidate_b: '窗口更清晰', advantage: 'b' },
    { label: '组织协同', candidate_a: '跨团队经验明确', candidate_b: '需要继续验证', advantage: 'a' },
  ];
  const a = source?.candidate_a?.name ?? source?.candidateA?.name ?? '候选人 A';
  const b = source?.candidate_b?.name ?? source?.candidateB?.name ?? '候选人 B';
  return {
    title: '候选人对比',
    meta: `${a} vs ${b}`,
    mark: '比',
    intent: '横向比较 / 取舍建议',
    actions: [
      { label: `推进 ${a}`, primary: true, message: `推进${a}进入下一轮，并生成验证问题` },
      { label: '看薪酬差异', message: `对比${a}和${b}的薪酬风险` },
    ],
    body: (
      <div className="space-y-3">
        <Section title="对比维度">
          <div className="space-y-2">
            {rows.map((row: any) => (
              <div key={row.label} className="grid grid-cols-[88px_1fr_1fr] gap-2 rounded-[var(--hai-radius)] border border-[var(--hai-border)] bg-[var(--hai-surface)] p-2 text-xs">
                <span className="text-[var(--hai-text-3)]">{row.label}</span>
                <span>{row.candidate_a ?? row.candidateA}</span>
                <span>{row.candidate_b ?? row.candidateB}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="建议">{source?.recommendation || `${a} 确定性更高，${b} 可以作为备选池继续养。`}</Section>
      </div>
    ),
  };
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="hai-task-card p-3">
      <div className="text-[11px] text-[var(--hai-text-3)]">{label}</div>
      <div className="hai-mono mt-1 truncate">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] text-[var(--hai-text-3)]">{title}</div>
      <div className="hai-task-card p-3 text-[var(--hai-text-2)]">{children}</div>
    </div>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="hai-mono mb-1 flex justify-between text-[11px] text-[var(--hai-text-2)]">
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
      </div>
    </div>
  );
}

function ChartPanel({ title, rows }: { title: string; rows: { label: string; value: number; count: number }[] }) {
  return (
    <div className="hai-task-card p-3">
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

function unwrapPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return {};
  const data = payload.data && typeof payload.data === 'object' ? payload.data : {};
  return { ...data, ...payload };
}

function inferDrawerFromMessages(messages: Array<Message | Record<string, any>>, mode: DrawerMode, preferredKind?: TaskKind): DrawerState | null {
  if (preferredKind) {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index] as any;
      const cardType = message.card_type ?? normalizeLegacyType(message.type);
      if (!cardType || message.role === 'user') continue;
      const kind = kindFromCardType(cardType, message.type);
      if (kind === preferredKind) return { kind, payload: message, mode, source: 'auto' };
    }
  }

  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index] as any;
    const cardType = message.card_type ?? normalizeLegacyType(message.type);
    if (!cardType || message.role === 'user') continue;
    const kind = kindFromCardType(cardType, message.type);
    if (kind) return { kind, payload: message, mode, source: 'auto' };
  }
  return null;
}

function shouldReplaceDrawerForResponse(requestedKind: TaskKind, nextKind: TaskKind): boolean {
  if (nextKind === requestedKind) return true;
  if (requestedKind === 'search' || requestedKind === 'candidate') return true;
  return nextKind !== 'search' && nextKind !== 'candidate';
}

function kindFromCardType(cardType: string, type?: string): TaskKind | null {
  if (cardType === 'candidate_list') return 'search';
  if (cardType === 'candidate_profile' || type === 'profile_card' || type === 'candidate_card') return 'candidate';
  if (cardType === 'job_detail' || cardType === 'job_profile' || type === 'jd_card') return 'jd';
  if (cardType === 'pipeline_report' || type === 'pipeline_overview') return 'pipeline';
  if (cardType === 'market_analysis' || type === 'risk_analysis' || type === 'team_diagnosis' || cardType === 'clarification') return 'diagnosis';
  if (type === 'salary_benchmark' || cardType === 'salary_benchmark') return 'salary';
  if (cardType === 'interview_kit' || type === 'interview_questions') return 'interview';
  if (type === 'message_template') return 'message';
  if (cardType === 'comparison' || type === 'comparison') return 'comparison';
  return null;
}

function normalizeLegacyType(type?: string) {
  const map: Record<string, string> = {
    profile_card: 'candidate_profile',
    jd_card: 'job_detail',
    pipeline_overview: 'pipeline_report',
    market_analysis: 'market_analysis',
    comparison: 'comparison',
  };
  return type ? map[type] ?? type : '';
}

function inferTaskKindFromInput(input: string): TaskKind {
  const text = input.toLowerCase();
  if (/薪酬|salary|offer|package|预算|年包|对标|谈薪/.test(input)) return 'salary';
  if (/pipeline|周报|月报|进度|漏斗|卡住|招聘数据|report/.test(text + input)) return 'pipeline';
  if (/面试|题|interview|模拟|评分|面试包/.test(text + input)) return 'interview';
  if (/对比|比较|compare|谁更|哪个更/.test(text + input)) return 'comparison';
  if (/话术|邮件|触达|沟通|催办|拒信|message|mail/.test(text + input)) return 'message';
  if (/岗位|jd|hc|职位|团队|在招|job/.test(text + input)) return 'jd';
  if (/市场|供给|人才地图|稀缺|诊断|为什么|原因|归因|bsp/.test(text + input)) return 'diagnosis';
  if (/简历|档案|候选人|candidate|resume|张|李|王|刘|陈/.test(text + input)) return 'candidate';
  return 'search';
}

function normalizeCandidates(value: any): { id: string; name: string; title: string; company: string; score: number; tags: string[] }[] {
  const list = Array.isArray(value) ? value : [];
  return list.map((item) => ({
    id: item.id ?? item.candidate_id ?? item.name ?? 'candidate',
    name: item.name ?? '候选人',
    title: item.current_title ?? item.currentTitle ?? item.title ?? '职位待确认',
    company: item.current_company ?? item.currentCompany ?? item.company ?? '公司待确认',
    score: normalizeScoreValue(item.match_score ?? item.matchScore ?? 0.82),
    tags: item.tags ?? item.skills ?? [],
  }));
}

function normalizeCandidatePayload(payload: any) {
  const source = unwrapPayload(payload);
  return {
    id: source?.id,
    name: source?.name,
    currentCompany: source?.currentCompany ?? source?.current_company ?? source?.company,
    currentTitle: source?.currentTitle ?? source?.current_title ?? source?.title,
    education: source?.education,
    location: source?.location,
    skills: source?.skills ?? source?.tags ?? [],
    careerHistory: source?.careerHistory ?? source?.career ?? [],
    projects: source?.projects ?? [],
    lastActive: source?.lastActive ?? source?.last_active,
  };
}

function normalizeSalaryBenchmark(item: any) {
  return {
    ...item,
    salaryRange: item.salaryRange ?? item.salary_range ?? '',
    median: typeof item.median === 'number' ? item.median : 0,
  };
}

function normalizeScoreValue(value: number) {
  if (!Number.isFinite(value)) return 0.82;
  return value > 1 ? value / 100 : value;
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

function taskKindLabel(kind: TaskKind) {
  const labels: Record<TaskKind, string> = {
    search: '候选人搜索',
    candidate: '候选人简历',
    jd: '职位描述',
    pipeline: '招聘漏斗',
    diagnosis: '推荐诊断',
    salary: '薪酬对标',
    interview: '面试包',
    message: '沟通模板',
    comparison: '候选人对比',
  };
  return labels[kind];
}

function defaultSteps(kind: TaskKind): string[] {
  const map: Record<TaskKind, string[]> = {
    search: ['理解候选人画像', '检索人才库', '重排匹配信号', '生成候选池'],
    candidate: ['定位候选人', '读取简历和记忆', '识别风险和亮点', '形成推进建议'],
    jd: ['理解岗位目标', '拆解画像条件', '改写 JD 片段', '等待确认'],
    pipeline: ['读取招聘漏斗', '识别异常岗位', '定位卡点原因', '生成动作'],
    diagnosis: ['收集市场信号', '分析限制条件', '归因卡点', '给出修正建议'],
    salary: ['定位岗位级别', '读取市场薪酬', '比较预算风险', '生成 offer 建议'],
    interview: ['读取岗位和候选人', '生成结构化问题', '标注评分目的', '等待面试官确认'],
    message: ['理解沟通对象', '选择话术策略', '生成草稿', '等待编辑确认'],
    comparison: ['读取候选人资料', '对齐比较维度', '判断优劣', '形成取舍建议'],
  };
  return map[kind];
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
