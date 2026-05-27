import { create } from 'zustand';
import type { Session, UserRole } from '@/types';
import { generateId } from '@/lib/utils';

const SESSIONS_KEY = 'hireagent-sessions';
const CURRENT_KEY = 'hireagent-current-session';

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(sessions: Session[]) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)); } catch { /* quota */ }
}

function loadCurrentId(): string | null {
  try { return localStorage.getItem(CURRENT_KEY) || null; } catch { return null; }
}

function saveCurrentId(id: string | null) {
  try {
    if (id) localStorage.setItem(CURRENT_KEY, id);
    else localStorage.removeItem(CURRENT_KEY);
  } catch { /* quota or private mode */ }
}

interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  createSession: (role: UserRole) => string;
  setCurrentSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  pinSession: (id: string) => void;
  unpinSession: (id: string) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: loadSessions(),
  currentSessionId: loadCurrentId(),

  createSession: (role) => {
    const s: Session = {
      id: generateId(), title: '新对话', timestamp: Date.now(), pinned: false, role,
    };
    const sessions = [s, ...get().sessions];
    saveSessions(sessions);
    saveCurrentId(s.id);
    set({ sessions, currentSessionId: s.id });
    return s.id;
  },

  setCurrentSession: (id) => {
    saveCurrentId(id);
    set({ currentSessionId: id });
  },

  updateSessionTitle: (id, title) => {
    set((state) => {
      const sessions = state.sessions.map((s) => (s.id === id ? { ...s, title } : s));
      saveSessions(sessions);
      return { sessions };
    });
  },

  deleteSession: (id) => {
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id);
      saveSessions(sessions);
      // 删除对应消息
      try { localStorage.removeItem('hireagent-msgs-' + id); } catch { /* */ }
      const nextId = state.currentSessionId === id
        ? (sessions[0]?.id || null)
        : state.currentSessionId;
      saveCurrentId(nextId);
      return { sessions, currentSessionId: nextId };
    });
  },

  pinSession: (id) => {
    set((state) => {
      const sessions = state.sessions.map((s) => (s.id === id ? { ...s, pinned: true } : s));
      saveSessions(sessions);
      return { sessions };
    });
  },

  unpinSession: (id) => {
    set((state) => {
      const sessions = state.sessions.map((s) => (s.id === id ? { ...s, pinned: false } : s));
      saveSessions(sessions);
      return { sessions };
    });
  },
}));
