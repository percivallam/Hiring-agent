/**
 * MemoryManager — 三层记忆读写 + 冲突检测 + 过期清理。
 *
 * IStorage 注入（BrowserStorage | InMemoryStorage）。
 * 对应 contracts/memory.ts 三层 Schema。
 */

import type {
  SessionMemory,
  UserMemory,
  CandidateMemory,
  CandidateNote,
} from '../contracts/memory';
import type { MemoryItem, MemoryWriteData, ToolResult, ToolMeta } from '../contracts/tools';
import {
  IStorage,
  sessionKey,
  userKey,
  candidateKey,
  scanKeys,
  keywordMatch,
  noteToItem,
  turnToItem,
  makeWriteData,
} from './storage';

// ══════════════════════════════════════════
// MemoryAdapter 接口
// ══════════════════════════════════════════

export interface MemoryAdapter {
  recall(params: {
    layer: 'session' | 'user' | 'candidate';
    query: string;
    candidate_id?: string;
    limit?: number;
  }): Promise<ToolResult<MemoryItem[]>>;

  write(params: {
    layer: 'session' | 'user' | 'candidate';
    entity_id?: string;
    content: string;
    source: 'user' | 'llm' | 'system';
  }): Promise<ToolResult<MemoryWriteData>>;

  getConflicts(candidateId: string): CandidateNote[];
  resolveConflict(noteId: string, resolution: 'accept' | 'reject'): void;
  expireNotes(): number;
}

// ══════════════════════════════════════════
// MemoryManager
// ══════════════════════════════════════════

const EXPIRE_DAYS = 30;

export class MemoryManager implements MemoryAdapter {
  private storage: IStorage;
  private defaultUserId = 'default-user';

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  private meta(): ToolMeta {
    return { mode: 'real', latency_ms: 1 };
  }

  // ── 召回 ──

  async recall(params: {
    layer: 'session' | 'user' | 'candidate';
    query: string;
    candidate_id?: string;
    limit?: number;
  }): Promise<ToolResult<MemoryItem[]>> {
    const limit = params.limit ?? 5;
    let items: MemoryItem[] = [];

    try {
      switch (params.layer) {
        case 'session':
          items = this.recallSession(params.query);
          break;
        case 'user':
          items = this.recallUser(params.query);
          break;
        case 'candidate':
          if (!params.candidate_id) {
            return { ok: false, meta: this.meta(), hint: 'candidate_id 必填' };
          }
          items = this.recallCandidate(params.candidate_id, params.query);
          break;
      }
    } catch (err) {
      return {
        ok: false,
        meta: this.meta(),
        hint: `召回异常: ${err instanceof Error ? err.message : ''}`,
      };
    }

    // candidate 层：返回全部非归档记忆
    if (params.layer === 'candidate' && params.candidate_id) {
      const all = items.filter((item) => !item.summary.includes('[archived]'));
      const trimmed = all.slice(0, limit);
      if (trimmed.length === 0) {
        return { ok: true, data: [], meta: this.meta(), hint: '暂无该候选人的记忆' };
      }
      return { ok: true, data: trimmed, meta: this.meta() };
    }

    // session / user 层：关键词匹配
    const scored = items
      .map((item) => ({ item, score: keywordMatch(item.summary, params.query) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.item);

    if (scored.length === 0) {
      return { ok: true, data: [], meta: this.meta(), hint: '暂无相关记忆' };
    }
    return { ok: true, data: scored, meta: this.meta() };
  }

  // ── 写入 ──

  async write(params: {
    layer: 'session' | 'user' | 'candidate';
    entity_id?: string;
    content: string;
    source: 'user' | 'llm' | 'system';
  }): Promise<ToolResult<MemoryWriteData>> {
    const now = Date.now();
    try {
      switch (params.layer) {
        case 'session': {
          const sid = params.entity_id || 'default-session';
          const mem = this.loadSession(sid);
          mem.turns.push({
            role: 'agent',
            content: params.content,
            timestamp: now,
          });
          if (mem.turns.length > 20) mem.turns = mem.turns.slice(-20);
          this.storage.set(sessionKey(sid), mem);
          return {
            ok: true,
            data: makeWriteData('session', sid, params.content),
            meta: this.meta(),
          };
        }
        case 'user': {
          const uid = params.entity_id || this.defaultUserId;
          const mem = this.loadUser(uid);
          mem.recent_activity.push({
            action: 'memory_write',
            summary: params.content.slice(0, 100),
            timestamp: now,
          });
          if (mem.recent_activity.length > 30) mem.recent_activity = mem.recent_activity.slice(-30);
          mem.updated_at = now;
          this.storage.set(userKey(uid), mem);
          return {
            ok: true,
            data: makeWriteData('user', uid, params.content),
            meta: this.meta(),
          };
        }
        case 'candidate': {
          if (!params.entity_id) {
            return { ok: false, meta: this.meta(), hint: 'entity_id 必填' };
          }
          const cid = params.entity_id;
          const mem = this.loadCandidate(cid);
          const note: CandidateNote = {
            content: params.content,
            source: params.source,
            created_at: now,
            status: 'confirmed',
          };
          const conflicts = this.detectConflicts(note, mem.key_notes);
          if (conflicts.length > 0) {
            note.status = 'conflict';
            for (const c of conflicts) c.status = 'conflict';
          }
          mem.key_notes.push(note);
          mem.updated_at = now;
          this.storage.set(candidateKey(cid), mem);
          return {
            ok: true,
            data: makeWriteData('candidate', cid, params.content),
            meta: this.meta(),
            hint:
              conflicts.length > 0
                ? `检测到 ${conflicts.length} 条冲突，已标记待确认`
                : undefined,
          };
        }
      }
    } catch (err) {
      return {
        ok: false,
        meta: this.meta(),
        hint: `写入异常: ${err instanceof Error ? err.message : ''}`,
      };
    }
  }

  // ── 冲突 ──

  getConflicts(candidateId: string): CandidateNote[] {
    const mem = this.storage.get<CandidateMemory>(candidateKey(candidateId));
    if (!mem) return [];
    return mem.key_notes.filter((n) => n.status === 'conflict');
  }

  resolveConflict(noteId: string, resolution: 'accept' | 'reject'): void {
    const keys = scanKeys(this.storage, candidateKey(''));
    for (const key of keys) {
      const mem = this.storage.get<CandidateMemory>(key);
      if (!mem) continue;
      const idx = mem.key_notes.findIndex(
        (n) => `${mem.candidate_id}-note-${n.created_at}` === noteId,
      );
      if (idx === -1) continue;
      if (resolution === 'accept') {
        mem.key_notes[idx].status = 'confirmed';
        for (const n of mem.key_notes) {
          if (n.status === 'conflict' && n.created_at !== mem.key_notes[idx].created_at) {
            n.status = 'archived';
          }
        }
      } else {
        mem.key_notes[idx].status = 'archived';
      }
      mem.updated_at = Date.now();
      this.storage.set(key, mem);
      return;
    }
  }

  // ── 过期 ──

  expireNotes(): number {
    const now = Date.now();
    const expireMs = EXPIRE_DAYS * 24 * 60 * 60 * 1000;
    let cleaned = 0;
    const keys = scanKeys(this.storage, candidateKey(''));
    for (const key of keys) {
      const mem = this.storage.get<CandidateMemory>(key);
      if (!mem) continue;
      for (const note of mem.key_notes) {
        if (
          note.status !== 'archived' &&
          note.created_at &&
          now - note.created_at > expireMs
        ) {
          note.status = 'archived';
          cleaned++;
        }
      }
      if (cleaned > 0) {
        mem.updated_at = now;
        this.storage.set(key, mem);
      }
    }
    return cleaned;
  }

  // ── 私有 ──

  private loadSession(sid: string): SessionMemory {
    const cached = this.storage.get<SessionMemory>(sessionKey(sid));
    return cached ?? { session_id: sid, role: 'hm', turns: [], pending_confirmations: [], created_at: Date.now() };
  }

  private loadUser(uid: string): UserMemory {
    const cached = this.storage.get<UserMemory>(userKey(uid));
    return (
      cached ?? {
        user_id: uid,
        role: 'hm',
        preferred_directions: [],
        preferred_departments: [],
        preferences: {},
        recent_activity: [],
        updated_at: Date.now(),
      }
    );
  }

  private loadCandidate(cid: string): CandidateMemory {
    const cached = this.storage.get<CandidateMemory>(candidateKey(cid));
    return (
      cached ?? {
        candidate_id: cid,
        profile: {
          name: '',
          current_company: '',
          current_title: '',
          experience_years: 0,
          education: '',
          skills: [],
        },
        key_tags: [],
        key_notes: [],
        interaction_summary: [],
        updated_at: Date.now(),
      }
    );
  }

  private recallSession(_query: string): MemoryItem[] {
    const keys = scanKeys(this.storage, sessionKey(''));
    const items: MemoryItem[] = [];
    for (const key of keys) {
      const mem = this.storage.get<SessionMemory>(key);
      if (!mem) continue;
      for (const turn of mem.turns) {
        items.push(turnToItem(turn, mem.session_id));
      }
    }
    return items;
  }

  private recallUser(_query: string): MemoryItem[] {
    const keys = scanKeys(this.storage, userKey(''));
    const items: MemoryItem[] = [];
    for (const key of keys) {
      const mem = this.storage.get<UserMemory>(key);
      if (!mem) continue;
      for (const act of mem.recent_activity) {
        items.push({
          id: `${mem.user_id}-act-${act.timestamp}`,
          layer: 'user',
          entity_id: mem.user_id,
          summary: act.summary,
          raw: act.summary,
          created_at: act.timestamp,
          updated_at: act.timestamp,
        });
      }
      if (mem.preferred_directions.length > 0) {
        items.push({
          id: `${mem.user_id}-pref`,
          layer: 'user',
          entity_id: mem.user_id,
          summary: `偏好方向: ${mem.preferred_directions.join(', ')}`,
          raw: JSON.stringify(mem.preferences),
          created_at: mem.updated_at,
          updated_at: mem.updated_at,
        });
      }
    }
    return items;
  }

  private recallCandidate(cid: string, _query: string): MemoryItem[] {
    const mem = this.storage.get<CandidateMemory>(candidateKey(cid));
    if (!mem) return [];
    const items: MemoryItem[] = [];
    if (mem.profile.name) {
      items.push({
        id: `${cid}-profile`,
        layer: 'candidate',
        entity_id: cid,
        summary: `${mem.profile.name} — ${mem.profile.current_title} @ ${mem.profile.current_company}`,
        raw: JSON.stringify(mem.profile),
        created_at: mem.updated_at,
        updated_at: mem.updated_at,
      });
    }
    for (const note of mem.key_notes) {
      if (note.status !== 'archived') items.push(noteToItem(note, cid));
    }
    for (const inter of mem.interaction_summary) {
      items.push({
        id: `${cid}-inter-${inter.timestamp}`,
        layer: 'candidate',
        entity_id: cid,
        summary: `[${inter.type}] ${inter.summary}`,
        raw: inter.summary,
        created_at: inter.timestamp,
        updated_at: inter.timestamp,
      });
    }
    return items;
  }

  private detectConflicts(
    newNote: CandidateNote,
    existingNotes: CandidateNote[],
  ): CandidateNote[] {
    const conflicts: CandidateNote[] = [];
    const content = newNote.content;

    for (const existing of existingNotes) {
      if (existing.status === 'archived') continue;
      const ec = existing.content;

      // 按字符级 n-gram 相似度判断（中文友好）
      const commonChars = [...content].filter((c) => ec.includes(c) && c !== ' ').length;
      const similarity =
        commonChars / Math.max(content.length, ec.length);

      // 关键词重叠度
      const words1 = new Set(content.split(/[\s,，。、]+/));
      const words2 = new Set(ec.split(/[\s,，。、]+/));
      const shared = [...words1].filter((w) => words2.has(w) && w.length > 1);

      // 数值比较
      const nums1 = content.match(/\d+/g) ?? [];
      const nums2: string[] = ec.match(/\d+/g) ?? [];
      const sharedNums = nums1.filter((n) => nums2.includes(n));

      // 判定冲突：高字符相似度 + 高词重叠 + 不同数值
      if (
        similarity > 0.4 &&
        shared.length >= 2 &&
        nums1.length > 0 &&
        nums2.length > 0 &&
        sharedNums.length < Math.min(nums1.length, nums2.length)
      ) {
        conflicts.push(existing);
      } else if (similarity > 0.5 && shared.length >= 3) {
        // 纯文本高度相似但来源不同 → 可能冲突
        conflicts.push(existing);
      }
    }
    return conflicts;
  }
}
