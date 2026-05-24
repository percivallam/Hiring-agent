/**
 * HireAgent 埋点事件契约层 — events.ts
 *
 * 定义所有可追踪事件 schema，给 Eval Agent（三层评测）
 * 和 Self-Improve 闭环（样本收集 → Optimizer）消费。
 *
 * Owner: 林品臣(Spec Agent)
 * Consumers: Eval Agent, Self-Improve(Engine Agent)
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 事件基础字段 */
export interface EventBase {
  /** 事件唯一 ID */
  event_id: string;
  /** 会话 ID */
  session_id: string;
  /** 事件类型 */
  event_type: string;
  /** 用户角色 */
  role: 'hm' | 'hr' | 'candidate';
  /** 事件发生时间戳 */
  timestamp: number;
}

// ============================================================================
// E1: 用户消息事件
// ============================================================================

export interface UserMessageEvent extends EventBase {
  event_type: 'user_message';
  /** 用户输入原文 */
  content: string;
  /** Engine 识别出的意图标签 */
  intent?: string;
  /** 意图置信度 */
  intent_confidence?: number;
}

// ============================================================================
// E2: Agent 消息事件
// ============================================================================

export interface AgentMessageEvent extends EventBase {
  event_type: 'agent_message';
  /** Agent 回复文本 */
  content: string;
  /** 渲染的卡片类型列表 */
  cards_rendered: string[];
  /** 本轮 LLM 调用的 thinking token 数 */
  thinking_tokens?: number;
}

// ============================================================================
// E3: 工具调用事件
// ============================================================================

export interface ToolCallEvent extends EventBase {
  event_type: 'tool_call';
  /** 工具名 */
  tool_name: string;
  /** 调用参数 */
  params: Record<string, unknown>;
  /** 当前是第几个 tool call（本次会话） */
  call_index: number;
}

// ============================================================================
// E4: 工具返回事件
// ============================================================================

export interface ToolResultEvent extends EventBase {
  event_type: 'tool_result';
  /** 工具名 */
  tool_name: string;
  /** 是否成功 */
  ok: boolean;
  /** 返回模式 */
  mode: 'real' | 'demo';
  /** 耗时（毫秒） */
  latency_ms: number;
  /** 失败时的 hint（成功时为空） */
  hint?: string;
  /** 返回数据量（候选人数 / 条数等） */
  result_count?: number;
}

// ============================================================================
// E5: LLM 轮次事件
// ============================================================================

export interface LLMRoundEvent extends EventBase {
  event_type: 'llm_round';
  /** 当前轮次编号（本次会话中） */
  round_index: number;
  /** 输入 token 数 */
  input_tokens: number;
  /** 输出 token 数 */
  output_tokens: number;
  /** thinking token 数 */
  thinking_tokens: number;
  /** 模型名 */
  model: string;
  /** LLM 返回的 tool_calls 数量 */
  tool_calls_count: number;
  /** 本轮回合耗时（毫秒） */
  duration_ms: number;
}

// ============================================================================
// E6: 错误事件
// ============================================================================

export interface ErrorEvent extends EventBase {
  event_type: 'error';
  /** 错误来源 */
  source: 'tool' | 'llm' | 'engine' | 'ui';
  /** 错误码 */
  error_code: string;
  /** 错误简述 */
  message: string;
  /** 是否被优雅接管（LLM 兜底话术生成） */
  gracefully_handled: boolean;
  /** 兜底话术（若已优雅接管） */
  fallback_message?: string;
}

// ============================================================================
// E7: 会话结束事件
// ============================================================================

export interface SessionEndEvent extends EventBase {
  event_type: 'session_end';
  /** 会话持续时长（毫秒） */
  duration_ms: number;
  /** 总轮次数 */
  total_turns: number;
  /** 总工具调用次数 */
  total_tool_calls: number;
  /** 总错误数 */
  total_errors: number;
  /** 优雅接管错误数 */
  gracefully_handled_errors: number;
  /** 止损触发次数 */
  guardrail_triggers: {
    max_steps?: boolean;
    max_tool_calls?: boolean;
    timeout?: boolean;
    loop_detected?: boolean;
  };
  /** DSP 路径标识（若触发） */
  dsp_path?: 'dsp_1' | 'dsp_2' | 'dsp_3' | 'dsp_4' | 'dsp_5';
}

// ============================================================================
// E8: 样本分类事件（Self-Improve 闭环）
// ============================================================================

/** 样本分类标签 */
export type SampleLabel = 'positive' | 'negative' | 'neutral';

/**
 * 样本分类事件 — 对应 PRD 3.4.3 的正负样本分类。
 *
 * 正样本：用户点赞 / 主动追问深化 / 直接执行了 Agent 建议
 * 负样本：用户踩 / 重复问相同问题 / 修正了 Agent 判断 / 触发了止损
 * 中性样本：其余
 */
export interface SampleClassifiedEvent extends EventBase {
  event_type: 'sample_classified';
  /** 样本唯一 ID */
  sample_id: string;
  /** 分类标签 */
  label: SampleLabel;
  /** 分类依据（自动判定规则或 LLM-Judge 判断） */
  reason: string;
  /** 导致负样本分类的止损触发（仅 label=negative 时有值） */
  guardrail_trigger?: 'max_steps' | 'max_tool_calls' | 'timeout' | 'loop_detected' | 'user_correction' | 'user_repeat' | 'user_dislike';
}

// ============================================================================
// 事件联合类型
// ============================================================================

export type TrackedEvent =
  | UserMessageEvent
  | AgentMessageEvent
  | ToolCallEvent
  | ToolResultEvent
  | LLMRoundEvent
  | ErrorEvent
  | SessionEndEvent
  | SampleClassifiedEvent;

/**
 * Self-Improve 用的事件过滤类型。
 *
 * Optimizer 分析失败样本时 focus 在：
 * - sample_classified (label=negative)
 * - tool_result (ok=false)
 * - error
 * - user_message (意图识别失败)
 */
export type ImprovableEvent = SampleClassifiedEvent | ToolResultEvent | ErrorEvent | UserMessageEvent;
