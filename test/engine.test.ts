/**
 * S1 Engine 单测 — 覆盖 7 条路径。
 *
 * 运行: npx tsx test/engine.test.ts
 */

import * as assert from 'node:assert';
import { AIEngine } from '../src/engine/AIEngine.js';
import type { ChatOutput } from '../src/engine/AIEngine.js';
import { MockToolExecutor, emptyHandler, slowHandler, errorHandler } from '../src/engine/__mocks__/mockTools.js';
import { MockLLMClient, mkScene } from '../src/engine/__mocks__/mockLLM.js';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => Promise<void> | void) {
  // 同步/异步自适应
  const run = async () => {
    try {
      await fn();
      passed++;
      console.log(`  ✅ ${name}`);
    } catch (err) {
      failed++;
      console.log(`  ❌ ${name}`);
      console.error(`     ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  return { name, run };
}

async function runTests(tests: { name: string; run: () => Promise<void> }[]) {
  for (const t of tests) {
    console.log(`\n${t.name}`);
    await t.run();
  }
  console.log(`\n══════════════════════════════`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`══════════════════════════════`);
  process.exit(failed > 0 ? 1 : 0);
}

// ══════════════════════════════════════════
// E1: 正常路径 — 1 次 tool call → final
// ══════════════════════════════════════════

const e1 = test('E1: 正常路径 — search_candidates → final', async () => {
  const llm = new MockLLMClient([
    mkScene.toolCall('search_candidates', { query: '推荐系统' }, 'call_001'),
    mkScene.final('找到 3 位候选人，按匹配度排序如下：张三(92%)、李四(85%)、王五(78%)。建议先看张三的详细资料。'),
  ]);
  const tools = new MockToolExecutor();
  const engine = new AIEngine({ llmClient: llm, toolExecutor: tools });

  const output = await engine.chat({
    role: '用人经理',
    message: '帮我找几个做推荐系统的人',
    sessionId: 'sess_e1',
  });

  // 基础断言
  assert.strictEqual(output.stoppedBy, null, 'stoppedBy 应为 null');
  assert.ok(output.finalText.includes('张三'), 'finalText 应包含候选人名');
  assert.ok(output.events.length >= 4, '至少应有 user_message + llm_round + tool_call + tool_result + agent_message');

  // 事件顺序检查
  const types = output.events.map((e) => e.event_type);
  const userIdx = types.indexOf('user_message');
  const llmIdx = types.indexOf('llm_round');
  const callIdx = types.indexOf('tool_call');
  const resultIdx = types.indexOf('tool_result');
  const agentIdx = types.lastIndexOf('agent_message');
  assert.ok(userIdx < llmIdx, 'user_message 应在 llm_round 前');
  assert.ok(llmIdx < callIdx, 'llm_round 应在 tool_call 前');
  assert.ok(callIdx < resultIdx, 'tool_call 应在 tool_result 前');
  assert.ok(resultIdx < agentIdx, 'tool_result 应在 agent_message 前');

  // messages
  assert.ok(output.messages.some((m) => m.role === 'tool'), 'messages 应包含 tool 角色');
});

// ══════════════════════════════════════════
// E2: 多步路径 — 至少 2 跳 tool
// ══════════════════════════════════════════

const e2 = test('E2: 多步路径 — search_candidates → get_candidate_profile → final', async () => {
  const llm = new MockLLMClient([
    mkScene.toolCall('search_candidates', { query: '推荐系统' }, 'call_001'),
    mkScene.toolCall('get_candidate_profile', { candidate_id: 'cand_001' }, 'call_002'),
    mkScene.final('张三的完整画像如上。推荐系统经验 6 年，字节跳动背景，匹配度 92%，建议尽快安排面试。'),
  ]);
  const tools = new MockToolExecutor();
  const engine = new AIEngine({ llmClient: llm, toolExecutor: tools });

  const output = await engine.chat({
    role: '用人经理',
    message: '帮我看看张三的详细资料',
    sessionId: 'sess_e2',
  });

  assert.strictEqual(output.stoppedBy, null);
  assert.ok(output.finalText.includes('张三'));
  // 应有 2 次 tool_call 事件
  const toolCalls = output.events.filter((e) => e.event_type === 'tool_call');
  assert.strictEqual(toolCalls.length, 2, `应有 2 次 tool_call，实际 ${toolCalls.length} 次`);
});

// ══════════════════════════════════════════
// E3: max_steps 触发
// ══════════════════════════════════════════

const e3 = test('E3: max_steps 触发 — 超过 8 步强制终止', async () => {
  // 构建 20 个 tool_call 场景，超过 maxSteps=8
  const scenes = Array.from({ length: 20 }, (_, i) =>
    mkScene.toolCall('search_candidates', { query: `query_${i}` }, `call_${i}`),
  );
  const llm = new MockLLMClient(scenes);
  const tools = new MockToolExecutor();
  const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, maxSteps: 8 });

  const output = await engine.chat({
    role: '用人经理',
    message: '不断搜',
    sessionId: 'sess_e3',
  });

  assert.strictEqual(output.stoppedBy, 'max_steps');
  assert.ok(output.finalText.length > 0, 'finalText 应有优雅降级文案');
  // 应有 error 事件（stop_triggered）
  const errors = output.events.filter(
    (e) => e.event_type === 'error' && (e as any).error_code === 'max_steps',
  );
  assert.ok(errors.length >= 1, '应有 max_steps error 事件');
});

// ══════════════════════════════════════════
// E4: max_tool_calls 触发
// ══════════════════════════════════════════

const e4 = test('E4: max_tool_calls 触发 — 超过 12 次工具调用强制终止', async () => {
  // 一次 LLM 调用返回多个 tool_calls 加速计数
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
  // 注册批量返回的 search_candidates 不会返回空
  const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, maxToolCalls: 12 });

  const output = await engine.chat({
    role: '用人经理',
    message: '狂搜',
    sessionId: 'sess_e4',
  });

  assert.strictEqual(output.stoppedBy, 'max_tool_calls');
  assert.ok(output.finalText.length > 0);
});

// ══════════════════════════════════════════
// E5: timeout 触发
// ══════════════════════════════════════════

const e5 = test('E5: timeout 触发 — 超过配置时间强制终止', async () => {
  const llm = new MockLLMClient([
    mkScene.toolCall('search_candidates', { query: 'test' }, 'call_001'),
    mkScene.final('done'),
  ]);
  const tools = new MockToolExecutor();
  // 注入慢 handler — 500ms 延迟，timeout 50ms
  tools.register('search_candidates', slowHandler(500));
  const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, timeoutMs: 50 });

  const output = await engine.chat({
    role: '用人经理',
    message: '搜',
    sessionId: 'sess_e5',
  });

  assert.strictEqual(output.stoppedBy, 'timeout');
  assert.ok(output.finalText.length > 0);
});

// ══════════════════════════════════════════
// E6: loop_detected 触发
// ══════════════════════════════════════════

const e6 = test('E6: loop_detected — 同 tool 同参数 3 次强制终止', async () => {
  // LLM 连续 3 次用相同参数调 search_candidates
  const sameArgs = { query: '找不到的人', limit: 10 };
  const llm = new MockLLMClient([
    mkScene.toolCall('search_candidates', sameArgs, 'call_001'),
    mkScene.toolCall('search_candidates', sameArgs, 'call_002'),
    mkScene.toolCall('search_candidates', sameArgs, 'call_003'),
    mkScene.final('done'),
  ]);
  const tools = new MockToolExecutor();
  // 注册永远返回空的 handler
  tools.register('search_candidates', emptyHandler());
  const engine = new AIEngine({ llmClient: llm, toolExecutor: tools, loopDetectThreshold: 3 });

  const output = await engine.chat({
    role: '用人经理',
    message: '帮我找一个不存在的人',
    sessionId: 'sess_e6',
  });

  assert.strictEqual(output.stoppedBy, 'loop_detected');
  assert.ok(output.finalText.length > 0);
  assert.ok(output.finalText.includes('筛选条件过严') || output.finalText.includes('放宽'), 'finalText 应引导用户放宽条件');
});

// ══════════════════════════════════════════
// E7: tool 抛错 → 优雅降级
// ══════════════════════════════════════════

const e7 = test('E7: tool 抛错 → 优雅降级 (stoppedBy 仍为 null)', async () => {
  const llm = new MockLLMClient([
    mkScene.toolCall('search_candidates', { query: 'test' }, 'call_001'),
    // LLM 看到 tool 失败后决定直接最终回复
    mkScene.final('抱歉，候选人搜索服务暂时不可用，你可以稍后再试，或换个关键词。'),
  ]);
  const tools = new MockToolExecutor();
  // 注册错误 handler
  tools.register('search_candidates', errorHandler('候选人搜索服务暂时不可用'));
  const engine = new AIEngine({ llmClient: llm, toolExecutor: tools });

  const output = await engine.chat({
    role: '用人经理',
    message: '搜',
    sessionId: 'sess_e7',
  });

  // 优雅降级：stoppedBy 应为 null
  assert.strictEqual(output.stoppedBy, null, '优雅降级不应触发止损');
  // tool_result 的 ok 应为 false
  const toolResults = output.events.filter((e) => e.event_type === 'tool_result');
  assert.ok(toolResults.length >= 1, '应有 tool_result 事件');
  const lastResult = toolResults[toolResults.length - 1] as any;
  assert.strictEqual(lastResult.ok, false, 'tool_result 的 ok 应为 false');
  // 最终回复不应是裸错误
  assert.ok(!output.finalText.includes('stack') && !output.finalText.includes('Traceback'), 'finalText 不应含 stack trace');
  assert.ok(output.finalText.length > 0);
});

// ══════════════════════════════════════════
// 入口
// ══════════════════════════════════════════

(async () => {
  console.log('🧪 S1 Engine 单测\n');
  await runTests([e1, e2, e3, e4, e5, e6, e7]);
})();
