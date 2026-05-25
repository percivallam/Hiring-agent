/**
 * S1 Engine 单测 — 覆盖 7 条路径 (vitest 格式)
 */
import { describe, it, expect } from 'vitest';
import { AIEngine } from '../src/engine/AIEngine';
import type { ChatOutput } from '../src/engine/AIEngine';
import { MockToolExecutor, emptyHandler, slowHandler, errorHandler } from '../src/engine/__mocks__/mockTools';
import { MockLLMClient, mkScene } from '../src/engine/__mocks__/mockLLM';

describe('AIEngine', () => {
  it('E1: 正常路径 — search_candidates → final', async () => {
    const llm = new MockLLMClient([
      mkScene.toolCall('search_candidates', { query: '推荐系统' }, 'call_001'),
      mkScene.final('找到 3 位候选人，按匹配度排序如下：张三(92%)、李四(85%)、王五(78%)。建议先看张三的详细资料。'),
    ]);
    const tools = new MockToolExecutor();
    const engine = new AIEngine({ llmClient: llm, toolExecutor: tools });
    const output = await engine.chat({ role: '用人经理', message: '帮我找几个做推荐系统的人', sessionId: 'sess_e1' });

    expect(output.stoppedBy).toBeNull();
    expect(output.finalText).toContain('张三');
    expect(output.events.length).toBeGreaterThanOrEqual(4);

    const types = output.events.map((e) => e.event_type);
    const userIdx = types.indexOf('user_message');
    const llmIdx = types.indexOf('llm_round');
    const callIdx = types.indexOf('tool_call');
    const resultIdx = types.indexOf('tool_result');
    const agentIdx = types.lastIndexOf('agent_message');
    expect(userIdx).toBeLessThan(llmIdx);
    expect(llmIdx).toBeLessThan(callIdx);
    expect(callIdx).toBeLessThan(resultIdx);
    expect(resultIdx).toBeLessThan(agentIdx);
    expect(output.messages.some((m) => m.role === 'tool')).toBe(true);
  });

  it('E2: 多步路径 — search_candidates → get_candidate_profile → final', async () => {
    const llm = new MockLLMClient([
      mkScene.toolCall('search_candidates', { query: '推荐系统' }, 'call_001'),
      mkScene.toolCall('get_candidate_profile', { candidate_id: 'cand_001' }, 'call_002'),
      mkScene.final('张三的完整画像如上。推荐系统经验 6 年，字节跳动背景，匹配度 92%，建议尽快安排面试。'),
    ]);
    const tools = new MockToolExecutor();
    const engine = new AIEngine({ llmClient: llm, toolExecutor: tools });
    const output = await engine.chat({ role: '用人经理', message: '帮我看看张三的详细资料', sessionId: 'sess_e2' });

    expect(output.stoppedBy).toBeNull();
    expect(output.finalText).toContain('张三');
    const toolCalls = output.events.filter((e) => e.event_type === 'tool_call');
    expect(toolCalls).toHaveLength(2);
  });

  it('E3: max_steps 触发 — 超过 8 步强制终止', async () => {
    const scenes = Array.from({ length: 20 }, (_, i) =>
      mkScene.toolCall('search_candidates', { query: `query_${i}` }, `call_${i}`),
    );
    const llm = new MockLLMClient(scenes);
    const tools = new MockToolExecutor();
    const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, maxSteps: 8 });
    const output = await engine.chat({ role: '用人经理', message: '不断搜', sessionId: 'sess_e3' });

    expect(output.stoppedBy).toBe('max_steps');
    expect(output.finalText.length).toBeGreaterThan(0);
    const errors = output.events.filter(
      (e) => e.event_type === 'error' && (e as any).error_code === 'max_steps',
    );
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('E4: max_tool_calls 触发 — 超过 12 次工具调用强制终止', async () => {
    const scenes = [
      {
        kind: 'tool_call' as const,
        toolCalls: Array.from({ length: 13 }, (_, i) => ({
          id: `call_${i}`,
          name: 'search_candidates',
          arguments: { query: `q_${i}` },
        })),
      },
      mkScene.final('done'),
    ];
    const llm = new MockLLMClient(scenes);
    const tools = new MockToolExecutor();
    const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, maxToolCalls: 12 });
    const output = await engine.chat({ role: '用人经理', message: '狂搜', sessionId: 'sess_e4' });

    expect(output.stoppedBy).toBe('max_tool_calls');
    expect(output.finalText.length).toBeGreaterThan(0);
  });

  it('E5: timeout 触发 — 超过配置时间强制终止', async () => {
    const llm = new MockLLMClient([
      mkScene.toolCall('search_candidates', { query: 'test' }, 'call_001'),
      mkScene.final('done'),
    ]);
    const tools = new MockToolExecutor();
    tools.register('search_candidates', slowHandler(500));
    const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, timeoutMs: 50 });
    const output = await engine.chat({ role: '用人经理', message: '搜', sessionId: 'sess_e5' });

    expect(output.stoppedBy).toBe('timeout');
    expect(output.finalText.length).toBeGreaterThan(0);
  });

  it('E6: loop_detected — 同 tool 同参数 3 次强制终止', async () => {
    const sameArgs = { query: '找不到的人', limit: 10 };
    const llm = new MockLLMClient([
      mkScene.toolCall('search_candidates', sameArgs, 'call_001'),
      mkScene.toolCall('search_candidates', sameArgs, 'call_002'),
      mkScene.toolCall('search_candidates', sameArgs, 'call_003'),
      mkScene.final('done'),
    ]);
    const tools = new MockToolExecutor();
    const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, loopDetectThreshold: 3 });
    const output = await engine.chat({ role: '用人经理', message: '找', sessionId: 'sess_e6' });

    expect(output.stoppedBy).toBe('loop_detected');
    expect(output.finalText).toContain('筛选条件过严');
  });

  it('E7: emptyHandler — 工具返回空数据时 LLM 优雅降级', async () => {
    const llm = new MockLLMClient([
      mkScene.toolCall('search_candidates', { query: '找不到的人' }, 'call_001'),
      mkScene.final('搜索结果显示没有完全匹配的候选人。建议放宽条件，或尝试搜索相邻方向的人才。'),
    ]);
    const tools = new MockToolExecutor();
    tools.register('search_candidates', emptyHandler);
    const engine = new AIEngine({ llmClient: llm, toolExecutor: tools });
    const output = await engine.chat({ role: '用人经理', message: '找人', sessionId: 'sess_e7' });

    expect(output.stoppedBy).toBeNull();
    expect(output.finalText.length).toBeGreaterThan(0);
    expect(output.events.some((e) => e.event_type === 'tool_result')).toBe(true);
  });
});
