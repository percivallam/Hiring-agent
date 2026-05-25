/**
 * S7 Self-Improve 单测 — collector → classifier → optimizer 管道。
 *
 * 运行: npx tsx test/self_improve.test.ts
 */

import * as assert from 'node:assert';
import { collectFromMessages } from '../src/self_improve/collector.js';
import { classifySamplesSync } from '../src/self_improve/classifier.js';
import { optimizeSync } from '../src/self_improve/optimizer.js';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ══════════════════════════════════════════
// I1: collector — 空消息
// ══════════════════════════════════════════

function i1() {
  const sample = collectFromMessages([]);
  assert.strictEqual(sample.turns.length, 0);
  assert.strictEqual(sample.sessionId, 'unknown');
}

// ══════════════════════════════════════════
// I2: collector — 单轮无工具
// ══════════════════════════════════════════

function i2() {
  const msgs = [
    { role: 'system' as const, content: 'sys' },
    { role: 'user' as const, content: '帮我找推荐系统的人' },
    { role: 'assistant' as const, content: '找到 3 位候选人' },
  ];
  const sample = collectFromMessages(msgs, 'sess_1', 'hm');
  assert.strictEqual(sample.turns.length, 1);
  assert.strictEqual(sample.turns[0].user, '帮我找推荐系统的人');
  assert.strictEqual(sample.turns[0].agent, '找到 3 位候选人');
}

// ══════════════════════════════════════════
// I3: collector — 带工具调用
// ══════════════════════════════════════════

function i3() {
  const msgs = [
    { role: 'user' as const, content: '找推荐系统' },
    { role: 'assistant' as const, content: '', tool_calls: [{ function: { name: 'search_candidates' } }] },
    { role: 'tool' as const, content: JSON.stringify({ ok: true, data: [{ name: '张三' }] }), tool_call_id: 'call_1' },
    { role: 'assistant' as const, content: '找到张三' },
  ];
  const sample = collectFromMessages(msgs);
  assert.strictEqual(sample.turns.length, 1);
  assert.ok(sample.turns[0].toolCalls?.includes('search_candidates'));
  assert.ok(sample.turns[0].toolResults?.[0]?.ok);
}

// ══════════════════════════════════════════
// I4: classifier — positive
// ══════════════════════════════════════════

function i4() {
  const samples = [
    {
      sessionId: 's1',
      role: 'hm' as const,
      turns: [{ user: '很好，就这个', agent: '已为您生成 JD。' }],
    },
  ];
  const result = classifySamplesSync(samples);
  assert.strictEqual(result[0].label, 'positive');
}

// ══════════════════════════════════════════
// I5: classifier — negative（用户修正）
// ══════════════════════════════════════════

function i5() {
  const samples = [
    {
      sessionId: 's2',
      role: 'hm' as const,
      turns: [{ user: '不对，我要的是后端不是前端', agent: '好的，重新搜索后端。' }],
    },
  ];
  const result = classifySamplesSync(samples);
  assert.strictEqual(result[0].label, 'negative');
  assert.strictEqual(result[0].turns[0].trigger, 'user_correction');
}

// ══════════════════════════════════════════
// I6: classifier — negative（用户重复）
// ══════════════════════════════════════════

function i6() {
  const samples = [
    {
      sessionId: 's3',
      role: 'hm' as const,
      turns: [
        { user: '帮我找推荐系统工程师', agent: '找到 3 位' },
        { user: '帮我找推荐系统工程师', agent: '还是这 3 位' },
      ],
    },
  ];
  const result = classifySamplesSync(samples);
  assert.strictEqual(result[0].label, 'negative');
}

// ══════════════════════════════════════════
// I7: classifier — negative（止损）
// ══════════════════════════════════════════

function i7() {
  const samples = [
    {
      sessionId: 's4',
      role: 'hm' as const,
      turns: [{ user: '搜', agent: '...' }],
      guardrailTrigger: 'max_steps' as const,
    },
  ];
  const result = classifySamplesSync(samples);
  assert.strictEqual(result[0].label, 'negative');
  assert.strictEqual(result[0].turns[0].trigger, 'guardrail');
}

// ══════════════════════════════════════════
// I8: optimizer — 空输入
// ══════════════════════════════════════════

function i8() {
  const report = optimizeSync([]);
  assert.strictEqual(report.negativeCount, 0);
  assert.strictEqual(report.negativeRate, 0);
  assert.strictEqual(report.clusters.length, 0);
}

// ══════════════════════════════════════════
// I9: optimizer — 有负样本产出建议
// ══════════════════════════════════════════

function i9() {
  const samples = [
    {
      sessionId: 's9',
      label: 'negative' as const,
      turns: [
        { user: '不对，重新搜', agent: '好的', label: 'negative' as const, reason: '修正', trigger: 'user_correction' as const },
        { user: '还是不对', agent: '...', label: 'negative' as const, reason: '再次修正', trigger: 'user_correction' as const },
      ],
    },
  ];
  const report = optimizeSync(samples);
  assert.strictEqual(report.negativeCount, 2);
  assert.ok(report.suggestions.length > 0, '应有建议产出');
  assert.ok(report.suggestions.some(s => s.affected_dsp === 'dsp_1'), '应影响 dsp_1');
}

// ══════════════════════════════════════════
// I10: 完整管道 integration
// ══════════════════════════════════════════

function i10() {
  const msgs = [
    { role: 'user' as const, content: '帮我找推荐系统的人' },
    { role: 'assistant' as const, content: '找到 3 位候选人：张三、李四、王五。建议先看张三的详细资料。' },
    { role: 'user' as const, content: '很好，看看张三' },
    { role: 'assistant' as const, content: '张三，字节跳动，推荐系统 6 年，匹配度 92%……' },
    { role: 'user' as const, content: '不对，我要找的是后端，不是推荐系统' },
    { role: 'assistant' as const, content: '抱歉理解有误。重新搜索后端工程师……' },
  ];

  const sample = collectFromMessages(msgs, 'sess_10', 'hm');
  const classified = classifySamplesSync([sample]);
  const report = optimizeSync(classified);

  assert.strictEqual(sample.turns.length, 3);
  assert.strictEqual(classified[0].label, 'negative'); // 第三轮有用户修正
  assert.ok(report.negativeCount > 0);
  assert.ok(report.clusters.length > 0);
}

// ══════════════════════════════════════════

(async () => {
  console.log('🧪 S7 Self-Improve 单测\n');

  await test('I1: collector 空消息', () => i1());
  await test('I2: collector 单轮无工具', () => i2());
  await test('I3: collector 带工具调用', () => i3());
  await test('I4: classifier positive', () => i4());
  await test('I5: classifier negative (修正)', () => i5());
  await test('I6: classifier negative (重复)', () => i6());
  await test('I7: classifier negative (止损)', () => i7());
  await test('I8: optimizer 空输入', () => i8());
  await test('I9: optimizer 产出建议', () => i9());
  await test('I10: 完整管道 integration', () => i10());

  console.log(`\n══════════════════════════════`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`══════════════════════════════`);
  process.exit(failed > 0 ? 1 : 0);
})();
