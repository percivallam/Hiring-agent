/**
 * 事件构建辅助函数 — 每个函数返回 contracts/events.ts 定义的标准事件对象。
 *
 * Engine 在 Function Calling Loop 的各关键节点调用这些函数，
 * 生成的 TrackedEvent 存入 ChatOutput.events[] 供 S7 Self-Improve 消费。
 *
 * 对应 S1 spec 第 4.2 节事件 emit 顺序。
 */

import type {
  EventBase,
  UserMessageEvent,
  AgentMessageEvent,
  ToolCallEvent,
  ToolResultEvent,
  LLMRoundEvent,
  ErrorEvent,
} from '../contracts/events';

// ---- 内部工具 ----

let _eventSeq = 0;
function nextId(): string {
  return `evt_${Date.now()}_${++_eventSeq}`;
}

function base(
  sessionId: string,
  role: 'hm' | 'hr' | 'candidate',
): Omit<EventBase, 'event_type'> {
  return {
    event_id: nextId(),
    session_id: sessionId,
    role,
    timestamp: Date.now(),
  };
}

/**
 * Map Engine 外部角色中文 → contracts 英文枚举
 */
export function roleToEnum(role: '用人经理' | '招聘HR' | '候选人'): 'hm' | 'hr' | 'candidate' {
  switch (role) {
    case '用人经理': return 'hm';
    case '招聘HR': return 'hr';
    case '候选人': return 'candidate';
  }
}

// ---- 事件构建函数 ----

/**
 * E1: 收到用户消息。
 */
export function emitUserMessage(
  sessionId: string,
  role: 'hm' | 'hr' | 'candidate',
  content: string,
  intent?: string,
  intentConfidence?: number,
): UserMessageEvent {
  return {
    ...base(sessionId, role),
    event_type: 'user_message',
    content,
    intent,
    intent_confidence: intentConfidence,
  };
}

/**
 * E2: Agent 最终回复消息。
 */
export function emitAgentMessage(
  sessionId: string,
  role: 'hm' | 'hr' | 'candidate',
  content: string,
  cardsRendered: string[],
  thinkingTokens?: number,
): AgentMessageEvent {
  return {
    ...base(sessionId, role),
    event_type: 'agent_message',
    content,
    cards_rendered: cardsRendered,
    thinking_tokens: thinkingTokens,
  };
}

/**
 * E3: 工具调用事件（LLM 决定调 tool 时触发）。
 */
export function emitToolCall(
  sessionId: string,
  role: 'hm' | 'hr' | 'candidate',
  toolName: string,
  params: Record<string, unknown>,
  callIndex: number,
): ToolCallEvent {
  return {
    ...base(sessionId, role),
    event_type: 'tool_call',
    tool_name: toolName,
    params,
    call_index: callIndex,
  };
}

/**
 * E4: 工具返回事件（tool 执行完触发）。
 */
export function emitToolResult(
  sessionId: string,
  role: 'hm' | 'hr' | 'candidate',
  toolName: string,
  ok: boolean,
  mode: 'real' | 'demo',
  latencyMs: number,
  hint?: string,
  resultCount?: number,
): ToolResultEvent {
  return {
    ...base(sessionId, role),
    event_type: 'tool_result',
    tool_name: toolName,
    ok,
    mode,
    latency_ms: latencyMs,
    hint,
    result_count: resultCount,
  };
}

/**
 * E5: LLM 轮次事件（每次 LLM 调用后触发，含 token usage）。
 */
export function emitLLMRound(
  sessionId: string,
  role: 'hm' | 'hr' | 'candidate',
  roundIndex: number,
  inputTokens: number,
  outputTokens: number,
  thinkingTokens: number,
  model: string,
  toolCallsCount: number,
  durationMs: number,
): LLMRoundEvent {
  return {
    ...base(sessionId, role),
    event_type: 'llm_round',
    round_index: roundIndex,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    thinking_tokens: thinkingTokens,
    model,
    tool_calls_count: toolCallsCount,
    duration_ms: durationMs,
  };
}

/**
 * E6: 错误事件（止损触发 / tool 报错 / engine 异常）。
 */
export function emitError(
  sessionId: string,
  role: 'hm' | 'hr' | 'candidate',
  source: 'tool' | 'llm' | 'engine' | 'ui',
  errorCode: string,
  message: string,
  gracefullyHandled: boolean,
  fallbackMessage?: string,
): ErrorEvent {
  return {
    ...base(sessionId, role),
    event_type: 'error',
    source,
    error_code: errorCode,
    message,
    gracefully_handled: gracefullyHandled,
    fallback_message: fallbackMessage,
  };
}
