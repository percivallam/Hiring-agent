import { create } from 'zustand';
import type { Message, TextMessage, CandidateCardMessage, CandidateListMessage,
  AnalyticsMessage, JDCardMessage, EvaluationMessage, QuickActionsMessage,
  TimelineMessage, ProfileCardMessage, ComparisonMessage, RiskAnalysisMessage,
  InterviewQuestionsMessage, MarketAnalysisMessage, SalaryBenchmarkMessage,
  PipelineOverviewMessage, ScheduleCardMessage, OfferPackageMessage,
  TeamDiagnosisMessage, OnboardingPlanMessage, NetworkGraphMessage,
  MessageTemplateMessage } from '@/types';
import { generateId } from '@/lib/utils';

// 通用引擎接口
interface IConversationEngine {
  processInput(input: string): Promise<any>;
  handleCardClick(cardId: string, payload: any): any;
  getWelcomeMessage(): any;
  isUsingModel?(): boolean;
}

type MessageWithoutIdAndTimestamp =
  | Omit<TextMessage, 'id' | 'timestamp'>
  | Omit<CandidateCardMessage, 'id' | 'timestamp'>
  | Omit<CandidateListMessage, 'id' | 'timestamp'>
  | Omit<AnalyticsMessage, 'id' | 'timestamp'>
  | Omit<JDCardMessage, 'id' | 'timestamp'>
  | Omit<EvaluationMessage, 'id' | 'timestamp'>
  | Omit<QuickActionsMessage, 'id' | 'timestamp'>
  | Omit<TimelineMessage, 'id' | 'timestamp'>
  | Omit<ProfileCardMessage, 'id' | 'timestamp'>
  | Omit<ComparisonMessage, 'id' | 'timestamp'>
  | Omit<RiskAnalysisMessage, 'id' | 'timestamp'>
  | Omit<InterviewQuestionsMessage, 'id' | 'timestamp'>
  | Omit<MarketAnalysisMessage, 'id' | 'timestamp'>
  | Omit<SalaryBenchmarkMessage, 'id' | 'timestamp'>
  | Omit<PipelineOverviewMessage, 'id' | 'timestamp'>
  | Omit<ScheduleCardMessage, 'id' | 'timestamp'>
  | Omit<OfferPackageMessage, 'id' | 'timestamp'>
  | Omit<TeamDiagnosisMessage, 'id' | 'timestamp'>
  | Omit<OnboardingPlanMessage, 'id' | 'timestamp'>
  | Omit<NetworkGraphMessage, 'id' | 'timestamp'>
  | Omit<MessageTemplateMessage, 'id' | 'timestamp'>;

const MSG_PREFIX = 'hireagent-msgs-';

function persist(sid: string, msgs: Message[]) {
  try { localStorage.setItem(MSG_PREFIX + sid, JSON.stringify(msgs)); } catch { /* quota */ }
}
function load(sid: string): Message[] {
  try { const r = localStorage.getItem(MSG_PREFIX + sid); return r ? JSON.parse(r) : []; } catch { return []; }
}
function storedIds(): string[] {
  try {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(MSG_PREFIX)) ids.push(k.slice(MSG_PREFIX.length));
    }
    return ids;
  } catch { return []; }
}

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  thinkingSteps: string[];
  currentStep: number;
  engine: IConversationEngine | null;
  _sessionId: string | null;
  pendingTrigger: string | null;
  addMessage: (msg: MessageWithoutIdAndTimestamp) => void;
  addUserMessage: (content: string) => void;
  triggerSend: (content: string) => void;
  clearTrigger: () => void;
  startThinking: (steps: string[]) => void;
  updateThinkingStep: (step: number) => void;
  stopThinking: () => void;
  clearMessages: () => void;
  setEngine: (e: IConversationEngine) => void;
  switchSession: (newId: string) => void;
  exportCurrentSession: () => Record<string, any>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isTyping: false,
  thinkingSteps: [],
  currentStep: -1,
  engine: null,
  _sessionId: null,
  pendingTrigger: null,

  triggerSend: (content) => set({ pendingTrigger: content }),
  clearTrigger: () => set({ pendingTrigger: null }),

  addMessage: (msg) => {
    const m = { ...msg, id: generateId(), timestamp: Date.now() } as Message;
    set((s) => {
      const upd = [...s.messages, m];
      if (s._sessionId) persist(s._sessionId, upd);
      return { messages: upd };
    });
  },

  addUserMessage: (content) => {
    const m: Message = { id: generateId(), type: 'text', role: 'user', content, timestamp: Date.now() };
    set((s) => {
      const upd = [...s.messages, m];
      if (s._sessionId) persist(s._sessionId, upd);
      return { messages: upd };
    });
  },

  startThinking: (steps) => set({ isTyping: true, thinkingSteps: steps, currentStep: 0 }),
  updateThinkingStep: (step) => set({ currentStep: step }),
  stopThinking: () => set({ isTyping: false, thinkingSteps: [], currentStep: -1 }),

  clearMessages: () => {
    const sid = get()._sessionId;
    set({ messages: [], isTyping: false });
    if (sid) persist(sid, []);
  },

  setEngine: (e) => set({ engine: e }),

  switchSession: (newId) => {
    const { _sessionId: old, messages } = get();
    if (old && old !== newId) persist(old, messages);
    const loaded = load(newId);
    set({ messages: loaded, _sessionId: newId, isTyping: false });
  },

  exportCurrentSession: () => {
    const { _sessionId, messages } = get();
    return { sessionId: _sessionId, exportedAt: new Date().toISOString(), messageCount: messages.length, messages };
  },
}));

export function getAllStoredSessions(): Record<string, Message[]> {
  const result: Record<string, Message[]> = {};
  for (const id of storedIds()) result[id] = load(id);
  return result;
}

export function exportAllData(): string {
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    sessionCount: storedIds().length,
    sessions: getAllStoredSessions(),
  }, null, 2);
}
