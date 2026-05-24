/**
 * AIEngine — Function Calling Loop 骨架。
 *
 * 接收 ChatInput → 构建 System Prompt（含 ToolSpec）→ 跑 FC 循环 →
 * 调用注入的 LLM Client 和 ToolExecutor → 返回 ChatOutput（含事件流 + 止损标识）。
 *
 * 对应 S1 spec 第 4 节接口契约。
 */

import type { ChatMessage } from '../model/types';
import type { ToolSpec, ToolResult } from '../contracts/tools';
import type { AgentCard } from '../contracts/cards';
import type { TrackedEvent } from '../contracts/events';
import { TOOL_SPECS } from '../contracts/index';
import type { ToolExecutor } from './__mocks__/mockTools';
import type { StopReason, CallRecord } from './stop_guards';
import { checkMaxSteps, checkMaxToolCalls, checkTimeout, detectLoop } from './stop_guards';
import {
  roleToEnum,
  emitUserMessage,
  emitAgentMessage,
  emitToolCall,
  emitToolResult,
  emitLLMRound,
  emitError,
} from './events';

// ══════════════════════════════════════════
// 向后兼容类型（S1→S3 迁移期，待 UI Agent 整合后删除）
// ══════════════════════════════════════════

/** 旧版 API 的角色类型 */
type LegacyRole = 'hm' | 'hr' | 'candidate';

// ══════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════

/** Engine 外部输入 */
export interface ChatInput {
  role: '用人经理' | '招聘HR' | '候选人';
  message: string;
  sessionId: string;
  /** S1 阶段透传，S5 实现 */
  memory?: unknown;
}

/** Engine 外部输出 */
export interface ChatOutput {
  messages: Array<{ role: 'assistant' | 'tool'; content: string }>;
  cards: AgentCard[];
  events: TrackedEvent[];
  stoppedBy: null | StopReason;
  /** LLM 最终自然语言回复（止损触发时含优雅降级文案） */
  finalText: string;
}

/** LLM 单次调用的返回 */
export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** thinking token 数（DeepSeek/Claude） */
  thinkingTokens?: number;
}

/** 注入式 LLM Client 接口 */
export interface LLMClient {
  chat(
    messages: ChatMessage[],
    tools: OpenAIToolDef[],
  ): Promise<LLMResponse>;
}

/** OpenAI 兼容的 tool definition（Engine 内部格式） */
export interface OpenAIToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/** Engine 可配置项 */
export interface AIEngineConfig {
  maxSteps?: number;            // default 8
  maxToolCalls?: number;        // default 12
  timeoutMs?: number;           // default 30_000
  loopDetectThreshold?: number; // default 3
  llmClient: LLMClient;
  toolExecutor: ToolExecutor;
  /** 模型名（用于事件中的 model 字段） */
  model?: string;
}

// ══════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════

/**
 * 将 contracts ToolSpec 转为 OpenAI Function Calling tool definition。
 */
function toOpenAITool(spec: ToolSpec): OpenAIToolDef {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, field] of Object.entries(spec.parameters)) {
    const prop: Record<string, unknown> = {
      type: field.type,
      description: field.description,
    };
    if (field.enum) prop.enum = field.enum;
    if (field.items) prop.items = field.items;
    properties[key] = prop;
    if (field.required) required.push(key);
  }

  return {
    type: 'function',
    function: {
      name: spec.name,
      description: spec.description,
      parameters: {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      },
    },
  };
}

/**
 * 构建注入 ToolSpec 的 System Prompt。
 * 动态从 TOOL_SPECS 生成工具表，不硬编码。
 */
function buildSystemPrompt(role: 'hm' | 'hr' | 'candidate'): string {
  const roleContext =
    role === 'hm'
      ? '你正在和一位**用人经理（Hiring Manager）**对话。他关注候选人质量、招聘速度和业务结果。语言风格应该直接、结果导向、有业务视角。'
      : role === 'hr'
        ? '你正在和一位**招聘 HR** 对话。他关注流程效率、数据合规和候选人体验。语言风格应该专业、条理清晰、有数据支撑。'
        : '你正在和一位**候选人**对话。他关注岗位匹配度、职业发展和面试准备。语言风格应该友好、鼓励、有同理心。';

  // 动态生成工具表
  const toolTable = TOOL_SPECS.map(
    (t) => `| ${t.name} | ${t.description.split('。')[0]} |`,
  ).join('\n');

  return `你是 **HireAgent**，一位 AI 招聘合伙人，拥有 10 年以上科技行业招聘经验。

${roleContext}

## 核心行为准则

1. **先理解意图，再行动**。判断用户是在找人、看数据、写文档、求建议还是查进度。
2. **优先使用工具获取真实数据**。不要编造候选人信息、薪酬数据或市场数据 —— 用工具查询。
3. **每条回复都要有文字解读**。即使展示了数据，也要告诉用户你做了什么、为什么、下一步建议。
4. **工具返回为空或报错时，用领域知识接管**。不要说"未找到"，给用户替代建议或放宽条件的引导。
5. **工具返回的数据冲突时，指出矛盾并请求用户澄清**，不要掩盖。

## 可用工具

| 工具 | 用途 |
|-----|------|
${toolTable}

## 重要

- 当工具返回 ok=false 时，用 hint 字段的内容作为参考，用你作为招聘合伙人的经验找到替代方案。
- 不要在只有初步结果时就结束对话——如果用户可能需要更多信息，主动询问。
- 最终的回复应该是自然的人话，不是 JSON 或技术错误信息。`;
}

/** 稳定 hash 工具参数 */
function argsHash(params: Record<string, unknown>): string {
  return JSON.stringify(params, Object.keys(params).sort());
}

/** 从 ToolResult 估算数据条数 */
function estimateCount(data: unknown): number | undefined {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object' && 'length' in data) return Number((data as { length: number }).length);
  return undefined;
}

// ══════════════════════════════════════════
// AIEngine 类
// ══════════════════════════════════════════

export class AIEngine {
  private config: Required<Omit<AIEngineConfig, 'model'>> & { model: string };
  private openAITools: OpenAIToolDef[];
  private history: ChatMessage[] = [];

  // ── 新版构造器（S1+） ──
  constructor(config: AIEngineConfig);

  // ── 旧版构造器（S1→S3 兼容，待删除） ──
  /** @deprecated 旧版 API，请使用 `new AIEngine({ llmClient, toolExecutor })` */
  constructor(role: LegacyRole, apiKey?: string, baseUrl?: string, _model?: string);

  constructor(
    arg1: AIEngineConfig | LegacyRole,
    _apiKey?: string,
    _baseUrl?: string,
    model?: string,
  ) {
    if (typeof arg1 === 'object') {
      // 新版 API
      this.config = {
        maxSteps: arg1.maxSteps ?? 8,
        maxToolCalls: arg1.maxToolCalls ?? 12,
        timeoutMs: arg1.timeoutMs ?? 30_000,
        loopDetectThreshold: arg1.loopDetectThreshold ?? 3,
        llmClient: arg1.llmClient,
        toolExecutor: arg1.toolExecutor,
        model: arg1.model ?? 'unknown',
      };
    } else {
      // 旧版 API — 构造 stub config（不含真实 LLM/Tool）
      this.config = {
        maxSteps: 8,
        maxToolCalls: 12,
        timeoutMs: 30_000,
        loopDetectThreshold: 3,
        llmClient: undefined as unknown as LLMClient,
        toolExecutor: undefined as unknown as ToolExecutor,
        model: model ?? 'unknown',
      };
      // 旧版路径会抛出明确的迁移提示
    }
    this.openAITools = TOOL_SPECS.map(toOpenAITool);
  }

  /** 核心入口：处理一次用户输入，返回结构化结果 */
  async chat(input: ChatInput): Promise<ChatOutput> {
    const { maxSteps, maxToolCalls, timeoutMs, loopDetectThreshold, llmClient, toolExecutor, model } =
      this.config;
    const roleEnum = roleToEnum(input.role);
    const events: TrackedEvent[] = [];
    const chatMessages: ChatOutput['messages'] = [];
    const startTime = Date.now();
    const callHistory: CallRecord[] = [];

    // E1: user_message
    events.push(emitUserMessage(input.sessionId, roleEnum, input.message));

    // 构建初始 messages
    const systemMsg: ChatMessage = {
      role: 'system',
      content: buildSystemPrompt(roleEnum),
    };
    const userMsg: ChatMessage = { role: 'user', content: input.message };

    let steps = 0;
    let totalToolCalls = 0;
    let stoppedBy: StopReason | null = null;
    let finalText = '';
    let thinkingTokens = 0;

    // 当前轮 messages（system + history + user，逐步追加 assistant/tool）
    const currentMessages: ChatMessage[] = [systemMsg, ...this.history, userMsg];

    try {
      // ── Function Calling Loop ──
      while (true) {
        steps++;

        // 止损检查
        let reason = checkMaxSteps(steps, maxSteps);
        if (reason) {
          stoppedBy = reason;
          finalText = '抱歉，处理步骤超过了限制。请简化你的需求，或稍后再试。';
          events.push(
            emitError(input.sessionId, roleEnum, 'engine', reason, `max_steps=${maxSteps} exceeded`, true, finalText),
          );
          break;
        }

        reason = checkTimeout(startTime, timeoutMs);
        if (reason) {
          stoppedBy = reason;
          finalText = '抱歉，这次查询耗时过长。请尝试缩减范围或换个问法。';
          events.push(
            emitError(input.sessionId, roleEnum, 'engine', reason, `timeout=${timeoutMs}ms exceeded`, true, finalText),
          );
          break;
        }

        // LLM 调用
        const roundStart = Date.now();
        let response: LLMResponse;
        try {
          response = await llmClient.chat(currentMessages, this.openAITools);
        } catch (err) {
          // LLM 调用异常 → 优雅降级
          const errMsg = err instanceof Error ? err.message : 'LLM 调用失败';
          events.push(
            emitError(input.sessionId, roleEnum, 'llm', 'LLM_CALL_FAILED', errMsg, true, '抱歉，智能服务暂时不可用。请稍后重试，或尝试用更简单的关键词描述你的需求。'),
          );
          finalText = '抱歉，智能服务暂时不可用。请稍后重试，或尝试用更简单的关键词描述你的需求。';
          stoppedBy = null; // 不是止损，是优雅降级
          break;
        }

        const roundDuration = Date.now() - roundStart;
        const toolCalls = response.toolCalls ?? [];
        const tokenUsage = response.usage;
        thinkingTokens += response.thinkingTokens ?? 0;

        events.push(
          emitLLMRound(
            input.sessionId,
            roleEnum,
            steps,
            tokenUsage?.promptTokens ?? 0,
            tokenUsage?.completionTokens ?? 0,
            response.thinkingTokens ?? 0,
            model,
            toolCalls.length,
            roundDuration,
          ),
        );

        // LLM 不再请求工具 → 最终回复
        if (toolCalls.length === 0) {
          finalText = response.content || '';
          break;
        }

        // 检查：tool_calls 后是否又 timeout
        reason = checkTimeout(startTime, timeoutMs);
        if (reason) {
          stoppedBy = reason;
          finalText = '抱歉，这次查询耗时过长。请尝试缩减范围或换个问法。';
          events.push(
            emitError(input.sessionId, roleEnum, 'engine', reason, `timeout=${timeoutMs}ms exceeded`, true, finalText),
          );
          break;
        }

        // ── 处理 tool calls ──
        // 将 assistant 消息加入对话
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: response.content || '',
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        };
        currentMessages.push(assistantMsg);
        chatMessages.push({
          role: 'assistant',
          content: response.content || `[调用工具: ${toolCalls.map((t) => t.name).join(', ')}]`,
        });

        for (const tc of toolCalls) {
          totalToolCalls++;

          // 检查 max_tool_calls
          reason = checkMaxToolCalls(totalToolCalls, maxToolCalls);
          if (reason) {
            stoppedBy = reason;
            finalText = `抱歉，我已经尝试了 ${totalToolCalls} 次工具调用，但仍无法完成你的需求。建议简化查询条件。`;
            events.push(
              emitError(input.sessionId, roleEnum, 'engine', reason, `max_tool_calls=${maxToolCalls} exceeded`, true, finalText),
            );
            break;
          }

          // 循环检测
          const hash = argsHash(tc.arguments);
          callHistory.push({ toolName: tc.name, argsHash: hash });
          const loop = detectLoop(callHistory, loopDetectThreshold);
          if (loop) {
            stoppedBy = 'loop_detected';
            finalText = `我尝试了 ${loop.repeatCount} 次相同的查询但没有找到匹配结果，可能筛选条件过严。建议放宽条件或换个关键词试试。`;
            events.push(
              emitError(input.sessionId, roleEnum, 'engine', 'loop_detected', `tool=${loop.toolName} repeated ${loop.repeatCount}x`, true, finalText),
            );
            break;
          }

          // E3: tool_call
          events.push(emitToolCall(input.sessionId, roleEnum, tc.name, tc.arguments, totalToolCalls));

          // 执行 tool
          const toolStart = Date.now();
          let result: ToolResult<unknown>;
          try {
            result = await toolExecutor.execute(tc.name, tc.arguments);
          } catch (err) {
            // Tool 抛异常 → 构造失败结果（不吞错，让 LLM 接管）
            const errMsg = err instanceof Error ? err.message : '工具执行异常';
            result = {
              ok: false,
              meta: { mode: 'demo', latency_ms: Date.now() - toolStart },
              hint: `工具 ${tc.name} 执行异常：${errMsg}`,
            };
          }
          const toolLatency = Date.now() - toolStart;

          // E4: tool_result
          events.push(
            emitToolResult(
              input.sessionId,
              roleEnum,
              tc.name,
              result.ok,
              result.meta.mode,
              toolLatency,
              result.hint,
              estimateCount(result.data),
            ),
          );

          // 工具失败也是优雅降级的一部分 — 把结果交给 LLM 决定
          if (!result.ok) {
            events.push(
              emitError(
                input.sessionId,
                roleEnum,
                'tool',
                'TOOL_FAILED',
                result.hint || `工具 ${tc.name} 返回失败`,
                true,
                result.hint,
              ),
            );
          }

          // 将 tool 结果加入对话
          const toolContent = JSON.stringify({
            ok: result.ok,
            data: result.data,
            hint: result.hint,
          });
          currentMessages.push({
            role: 'tool',
            content: toolContent,
            tool_call_id: tc.id,
          });
          chatMessages.push({
            role: 'tool',
            content: `[${tc.name}] ${result.ok ? '成功' : '失败'}${result.hint ? ' — ' + result.hint : ''}`,
          });
        }

        // 内层 break 传递到外层
        if (stoppedBy) break;
      }
    } catch (err) {
      // 兜底异常
      const errMsg = err instanceof Error ? err.message : '未知错误';
      events.push(
        emitError(input.sessionId, roleEnum, 'engine', 'UNHANDLED_ERROR', errMsg, false),
      );
      finalText = '抱歉，系统遇到了一个意外问题。请稍后重试。';
    }

    // E2: agent_message（最终回复）
    events.push(emitAgentMessage(input.sessionId, roleEnum, finalText, [], thinkingTokens));

    // 将最终回复和历史存入对话历史
    this.history.push(userMsg);
    this.history.push({ role: 'assistant', content: finalText });

    return {
      messages: chatMessages,
      cards: [], // S3 才填卡片
      events,
      stoppedBy,
      finalText,
    };
  }

  /** 清除对话历史 */
  clearHistory(): void {
    this.history = [];
  }

  // ══════════════════════════════════════════
  // 向后兼容桩（S1→S3 迁移期，待 UI Agent 整合后删除）
  // ══════════════════════════════════════════

  /** @deprecated 旧版 API — 请使用 `engine.chat(input)` */
  getWelcomeMessage(): { type: string; content: string } {
    if (!this.config.llmClient) {
      throw new Error(
        'AIEngine v2: 旧版构造器不再支持。请迁移到 `new AIEngine({ llmClient, toolExecutor })`，然后调用 `engine.chat(input)`。',
      );
    }
    return { type: 'text', content: '欢迎使用 HireAgent v2。请使用 chat() 方法开始对话。' };
  }

  /** @deprecated 旧版 API — 请使用 `new AIEngine({ llmClient, toolExecutor })` */
  isConfigured(): boolean {
    return !!this.config.llmClient;
  }

  /** @deprecated 旧版 API — 请使用 `engine.chat(input)` */
  async processInput(_userInput: string): Promise<{ responses: Array<{ type: string; content?: string }>; thinkingSteps: string[] }> {
    throw new Error(
      'AIEngine v2: processInput() 已移除。请使用 `engine.chat({ role, message, sessionId })`。',
    );
  }
}
