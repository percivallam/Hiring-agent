/**
 * MockLLMClient — S1 单测用。
 *
 * 预设"场景序列"：每次 chat() 调用按顺序消费一个场景。
 * 每个场景可以是 final（无 tool_calls）或 tool_call（带 tool_calls）。
 */
import type { LLMClient, LLMResponse, OpenAIToolDef } from '../AIEngine';
import type { ChatMessage } from '../../model/types';

/** 单次 LLM 响应的场景 */
export type MockScene =
  | { kind: 'final'; content: string; thinkingTokens?: number }
  | {
      kind: 'tool_call';
      toolCalls: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
      }>;
      content?: string;
      thinkingTokens?: number;
    };

/** Mock LLM Client — 按预设场景序列返回 */
export class MockLLMClient implements LLMClient {
  private scenes: MockScene[];
  private index = 0;
  /** 记录每次调用的 messages（用于断言） */
  calls: ChatMessage[][] = [];

  constructor(scenes: MockScene[]) {
    this.scenes = scenes;
  }

  async chat(
    messages: ChatMessage[],
    _tools: OpenAIToolDef[],
  ): Promise<LLMResponse> {
    this.calls.push([...messages]);

    if (this.index >= this.scenes.length) {
      return {
        content: '没有更多预设场景了。',
        thinkingTokens: 0,
      };
    }

    const scene = this.scenes[this.index++];

    if (scene.kind === 'final') {
      return {
        content: scene.content,
        thinkingTokens: scene.thinkingTokens ?? 0,
        usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
      };
    }

    return {
      content: scene.content ?? '',
      toolCalls: scene.toolCalls.map((tc) => ({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
      })),
      thinkingTokens: scene.thinkingTokens ?? 0,
      usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
    };
  }

  /** 重置场景索引 */
  reset(): void {
    this.index = 0;
    this.calls = [];
  }
}

/**
 * 快速创建 mock 场景的辅助函数。
 */
export const mkScene = {
  /** 最终回复 */
  final: (content: string, thinkingTokens?: number): MockScene => ({
    kind: 'final',
    content,
    thinkingTokens,
  }),

  /** 单次 tool call */
  toolCall: (
    toolName: string,
    args: Record<string, unknown>,
    id?: string,
  ): MockScene => ({
    kind: 'tool_call',
    toolCalls: [
      {
        id: id ?? `call_${Math.random().toString(36).slice(2, 8)}`,
        name: toolName,
        arguments: args,
      },
    ],
  }),
};
