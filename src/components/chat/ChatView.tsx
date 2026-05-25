import { useEffect, useCallback, useRef } from 'react';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { useChatStore, exportAllData } from '@/store/chatStore';
import { useSessionStore } from '@/store/sessionStore';
import { useUserStore } from '@/store/userStore';
import { AIEngine } from '@/engine/AIEngine';

export function ChatView() {
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
  const { role } = useUserStore();
  const { currentSessionId, createSession } = useSessionStore();

  const engineRef = useRef<AIEngine | null>(null);
  const prevSessionRef = useRef<string | null>(null);

  // ── 会话：无当前会话时自动创建，有则加载消息 ──
  useEffect(() => {
    if (!currentSessionId) {
      createSession(role);
    } else {
      switchSession(currentSessionId);
    }
  }, [currentSessionId]);

  // ── 引擎 + 欢迎语 ──
  useEffect(() => {
    const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
    const baseUrl = '/api/deepseek';
    const model = import.meta.env.VITE_DEEPSEEK_MODEL;

    engineRef.current = new AIEngine(role, apiKey, baseUrl, model);
    setEngine(engineRef.current as any);
  }, [role]);

  // ── 新会话欢迎语 ──
  useEffect(() => {
    if (!currentSessionId || currentSessionId === prevSessionRef.current) return;
    prevSessionRef.current = currentSessionId;

    const cur = useChatStore.getState().messages;
    if (cur.length === 0) {
      const welcome = engineRef.current?.getWelcomeMessage();
      if (welcome?.content) {
        setTimeout(() => addMessage({ type: 'text', role: 'agent', content: welcome.content } as any), 100);
      }
    }
  }, [currentSessionId, addMessage]);

  // ── 会话自动命名（第一条用户消息做标题） ──
  const autoNameSession = useCallback((content: string) => {
    const { currentSessionId: sid } = useSessionStore.getState();
    if (!sid) return;
    const sessions = useSessionStore.getState().sessions;
    const s = sessions.find((x) => x.id === sid);
    if (s && s.title === '新对话') {
      const title = content.slice(0, 20) + (content.length > 20 ? '...' : '');
      useSessionStore.getState().updateSessionTitle(sid, title);
    }
  }, []);

  // ── 自动保存到本地文件（每 30s + 页面退出时） ──
  useEffect(() => {
    const save = () => {
      const { messages, _sessionId } = useChatStore.getState();
      if (!_sessionId || messages.length === 0) return;
      fetch('/api/save-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: _sessionId,
          savedAt: new Date().toISOString(),
          messageCount: messages.length,
          messages,
        }),
        keepalive: true,
      }).catch(() => { /* silent */ });
    };

    const interval = setInterval(save, 30_000);
    window.addEventListener('beforeunload', save);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', save);
    };
  }, []);

  // ── window 全局工具 ──
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
      return `已导出 ${JSON.parse(json).sessionCount} 个会话`;
    };
  }, []);

  const handleSend = useCallback(async (input: string) => {
    if (!engineRef.current) return;
    addUserMessage(input);
    autoNameSession(input);

    try {
      const result = await engineRef.current.processInput(input);

      // 展示思考步骤
      if (result.thinkingSteps && result.thinkingSteps.length > 0) {
        startThinking(result.thinkingSteps);
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateThinkingStep(1);
        stopThinking();
      }

      // 渲染卡片
      if (result.responses && result.responses.length > 0) {
        result.responses.forEach((card, index) => {
          setTimeout(() => {
            addMessage(card as any);
          }, index * 200);
        });
      }
    } catch (error) {
      console.error('[ChatView] 处理消息失败:', error);
      addMessage({
        type: 'text',
        role: 'agent',
        content: `❌ 请求失败：${error instanceof Error ? error.message : '未知错误'}\n\n请检查 API Key 和网络连接。`,
      } as any);
    }
  }, [addUserMessage, addMessage, startThinking, updateThinkingStep, stopThinking]);

  const handleQuickAction = useCallback((message: string) => {
    handleSend(message);
  }, [handleSend]);

  // ── 响应侧边栏快捷操作 ──
  useEffect(() => {
    if (pendingTrigger) {
      handleSend(pendingTrigger);
      clearTrigger();
    }
  }, [pendingTrigger]);

  const handleCardClick = useCallback(async (_cardId: string, payload: any) => {
    // AI 引擎模式下，卡片点击转为发送消息
    if (payload?.message) {
      handleSend(payload.message);
    }
  }, [handleSend]);

  return (
    <div className="flex flex-col h-full relative">
      {/* Conversation Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          thinkingSteps={thinkingSteps}
          currentStep={currentStep}
          isTyping={isTyping}
          onQuickAction={handleQuickAction}
          onCardClick={handleCardClick}
        />
      </div>

      {/* Floating Input Area */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <InputArea
            onSend={handleSend}
            disabled={isTyping}
          />
        </div>
      </div>
    </div>
  );
}
