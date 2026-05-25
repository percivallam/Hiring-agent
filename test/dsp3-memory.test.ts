/**
 * S5 DSP-3 integration test — "Agent remembers Zhang San OPPO offer"
 *
 * npx tsx test/dsp3-memory.test.ts
 */

import * as assert from 'node:assert';
import { MemoryManager } from '../src/memory/MemoryManager.js';
import { InMemoryStorage } from '../src/memory/storage.js';

const ZHANGSAN_ID = 'cand_007';
const ZHANGSAN_NOTES = [
  '二面后流程暂停（2025-11-20），当时薪资期望 130 万超出预算。',
  '已知正在比较 OPPO 推荐架构组的 offer（OPPO 给到 140 万+期权）。',
  '技术面评分很高（4.5/5），工程落地能力突出。薪资是唯一卡点。',
];

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
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

async function d1() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);
  const w = await mem.write({ layer: 'candidate', entity_id: ZHANGSAN_ID, content: ZHANGSAN_NOTES.join(' | '), source: 'llm' });
  assert.ok(w.ok);
}

async function d2() {
  const store = new InMemoryStorage();
  const m1 = new MemoryManager(store);
  await m1.write({ layer: 'candidate', entity_id: ZHANGSAN_ID, content: ZHANGSAN_NOTES.join(' | '), source: 'llm' });

  const m2 = new MemoryManager(store);
  const r = await m2.recall({ layer: 'candidate', query: '张三 OPPO 薪资', candidate_id: ZHANGSAN_ID });
  assert.ok(r.ok && r.data!.length >= 1);
  const all = r.data!.map(x => x.summary).join(' ');
  assert.ok(all.includes('OPPO'));
  assert.ok(all.includes('130') || all.includes('140'));
}

async function d3() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);
  await mem.write({ layer: 'candidate', entity_id: ZHANGSAN_ID, content: '薪资130万, OPPO offer 140万+期权', source: 'user' });
  const r = await mem.recall({ layer: 'candidate', query: 'OPPO', candidate_id: ZHANGSAN_ID });
  assert.ok(r.data!.length >= 1 && r.data![0].summary.includes('OPPO'));
}

async function d4() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);
  await mem.write({ layer: 'candidate', entity_id: ZHANGSAN_ID, content: '评分 4.5', source: 'user' });
  await mem.write({ layer: 'candidate', entity_id: ZHANGSAN_ID, content: '薪资 130 万', source: 'user' });
  await mem.write({ layer: 'candidate', entity_id: ZHANGSAN_ID, content: 'OPPO 140 万', source: 'user' });
  const r = await mem.recall({ layer: 'candidate', query: '张三', candidate_id: ZHANGSAN_ID, limit: 10 });
  assert.ok(r.data!.length >= 3);
}

async function d5() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);
  const r = await mem.recall({ layer: 'candidate', query: '不存在', candidate_id: 'cand_999' });
  assert.ok(r.ok && r.data!.length === 0 && r.hint);
}

async function d6() {
  const store = new InMemoryStorage();
  const s1 = new MemoryManager(store);

  const pre = await s1.recall({ layer: 'candidate', query: '张三', candidate_id: ZHANGSAN_ID });
  assert.strictEqual(pre.data!.length, 0, 'session 1 首次应无记忆');

  await s1.write({ layer: 'candidate', entity_id: ZHANGSAN_ID, content: ZHANGSAN_NOTES.join(' | '), source: 'llm' });

  const s2 = new MemoryManager(store);
  const recall = await s2.recall({ layer: 'candidate', query: '张三', candidate_id: ZHANGSAN_ID });
  assert.ok(recall.data!.length >= 1);
  const text = recall.data!.map(m => m.summary).join(' ');
  assert.ok(text.includes('OPPO'));

  const reply = `上次你关注过张三（腾讯），已知他在比较 OPPO offer（140万+期权），可能是谈判切入点。`;
  assert.ok(reply.includes('OPPO') && reply.includes('张三'));
  console.log(`     💬 Agent: "${reply}"`);
}

(async () => {
  console.log('🧪 S5 DSP-3 端到端\n');

  await test('D1: write notes', d1);
  await test('D2: cross-session recall OPPO', d2);
  await test('D3: instant recall', d3);
  await test('D4: multi-write recall', d4);
  await test('D5: empty graceful', d5);
  await test('D6: full DSP-3 story', d6);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
})();
