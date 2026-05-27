/**
 * Memory 存储抽象层 + 工具函数。
 *
 * 浏览器用 localStorage，测试/Node 用 InMemoryStorage。
 * 对应 ADR-003: JSON + 关键词匹配，不上向量 DB。
 */

import type {
  SessionTurn,
  CandidateNote,
} from '../contracts/memory';
import type { MemoryItem, MemoryWriteData } from '../contracts/tools';

// ══════════════════════════════════════════
// 接口
// ══════════════════════════════════════════

export interface IStorage {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  keys(): string[];
}

// ══════════════════════════════════════════
// 实现
// ══════════════════════════════════════════

export class BrowserStorage implements IStorage {
  get<T>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : undefined;
    } catch {
      return undefined;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded — silently skip
    }
  }

  remove(key: string): void {
    try { localStorage.removeItem(key); } catch { /* private mode */ }
  }

  keys(): string[] {
    try {
      const out: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) out.push(k);
      }
      return out;
    } catch { return []; }
  }
}

export class InMemoryStorage implements IStorage {
  private store = new Map<string, string>();

  get<T>(key: string): T | undefined {
    const raw = this.store.get(key);
    return raw ? JSON.parse(raw) : undefined;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  keys(): string[] {
    return [...this.store.keys()];
  }

  clear(): void {
    this.store.clear();
  }
}

// ══════════════════════════════════════════
// key 约定
// ══════════════════════════════════════════

const PREFIX = 'hireagent-memory';

export const sessionKey = (sessionId: string) => `${PREFIX}-session-${sessionId}`;
export const userKey = (userId: string) => `${PREFIX}-user-${userId}`;
export const candidateKey = (candidateId: string) => `${PREFIX}-candidate-${candidateId}`;

export function scanKeys(storage: IStorage, prefix: string): string[] {
  return storage.keys().filter((k) => k.startsWith(prefix));
}

// ══════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════

export function keywordMatch(text: string, query: string): number {
  const t = text.toLowerCase();
  const words = query.toLowerCase().split(/\s+/);
  let score = 0;
  for (const w of words) {
    if (t.includes(w)) score += 1;
    const idx = t.indexOf(w);
    if (idx !== -1) score += Math.max(0, 0.5 - idx / t.length);
  }
  return words.length > 0 ? score / words.length : 0;
}

export function noteToItem(note: CandidateNote, candidateId: string): MemoryItem {
  return {
    id: `${candidateId}-note-${note.created_at}`,
    layer: 'candidate',
    entity_id: candidateId,
    summary: note.content,
    raw: note.content,
    created_at: note.created_at,
    updated_at: note.created_at,
  };
}

export function turnToItem(turn: SessionTurn, sessionId: string): MemoryItem {
  return {
    id: `${sessionId}-turn-${turn.timestamp}`,
    layer: 'session',
    entity_id: sessionId,
    summary: `[${turn.role}] ${turn.content.slice(0, 100)}`,
    raw: turn.content,
    created_at: turn.timestamp,
    updated_at: turn.timestamp,
  };
}

export function makeWriteData(
  layer: 'session' | 'user' | 'candidate',
  entityId: string | undefined,
  summary: string,
): MemoryWriteData {
  const now = Date.now();
  return {
    id: `${layer}-${entityId ?? 'unknown'}-${now}`,
    layer,
    entity_id: entityId,
    summary: summary.slice(0, 200),
    created_at: now,
  };
}
