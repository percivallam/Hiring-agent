/**
 * SampleCollector — 从对话历史提取可分类的样本。
 *
 * 输入: ChatMessage[] 或 chat-history.jsonl
 * 输出: RawSample[]（用户-助手-工具 成对轮次）
 */

import type { ChatMessage } from '../model/types';

export interface RawTurn {
  user: string;
  agent: string;
  toolCalls?: string[];
  toolResults?: Array<{ name: string; ok: boolean; hint?: string }>;
}

export interface RawSample {
  sessionId: string;
  role: 'hm' | 'hr' | 'candidate';
  turns: RawTurn[];
  guardrailTrigger?: 'max_steps' | 'max_tool_calls' | 'timeout' | 'loop_detected';
}

export function collectFromMessages(
  messages: ChatMessage[],
  sessionId = 'unknown',
  role: 'hm' | 'hr' | 'candidate' = 'hm',
  guardrailTrigger?: RawSample['guardrailTrigger'],
): RawSample {
  const turns: RawTurn[] = [];
  let cur: Partial<RawTurn> = {};

  for (const msg of messages) {
    if (msg.role === 'system') continue;

    if (msg.role === 'user') {
      if (cur.user !== undefined) {
        turns.push({ user: cur.user, agent: cur.agent ?? '', toolCalls: cur.toolCalls, toolResults: cur.toolResults });
      }
      cur = { user: msg.content };
      continue;
    }

    if (msg.role === 'assistant') {
      if (msg.tool_calls?.length) {
        cur.toolCalls = msg.tool_calls.map((tc: any) => tc.function?.name ?? tc.name ?? 'unknown');
      } else {
        cur.agent = msg.content;
        if (cur.user !== undefined) {
          turns.push({ user: cur.user, agent: cur.agent ?? '', toolCalls: cur.toolCalls, toolResults: cur.toolResults });
          cur = {};
        }
      }
      continue;
    }

    if (msg.role === 'tool') {
      if (!cur.toolResults) cur.toolResults = [];
      try {
        const parsed = JSON.parse(msg.content);
        cur.toolResults.push({ name: msg.tool_call_id ?? 'unknown', ok: parsed.ok !== false, hint: parsed.hint });
      } catch {
        cur.toolResults.push({ name: msg.tool_call_id ?? 'unknown', ok: !msg.content.includes('error'), hint: msg.content.slice(0, 100) });
      }
    }
  }

  if (cur.user !== undefined && cur.agent !== undefined) {
    turns.push({ user: cur.user, agent: cur.agent, toolCalls: cur.toolCalls, toolResults: cur.toolResults });
  }

  return { sessionId, role, turns, guardrailTrigger };
}

export function collectFromJSONL(lines: string[]): RawSample[] {
  const samples: RawSample[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const data = JSON.parse(line);
      if (data.messages && Array.isArray(data.messages)) {
        samples.push(collectFromMessages(data.messages, data.sessionId ?? data.session_id ?? 'unknown', data.role ?? 'hm', data.guardrailTrigger));
      }
    } catch { /* skip */ }
  }
  return samples;
}
