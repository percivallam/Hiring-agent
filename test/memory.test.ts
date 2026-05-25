/**
 * S5 Memory 单测 — 读写 / 冲突 / 过期。
 *
 * 运行: npx tsx test/memory.test.ts
 */

import * as assert from 'node:assert';
import { MemoryManager } from '../src/memory/MemoryManager.js';
import { InMemoryStorage } from '../src/memory/storage.js';
import type { MemoryAdapter } from '../src/memory/MemoryManager.js';

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

// ══════════════════════════════════════════
// M1: session 层读写
// ══════════════════════════════════════════

async function m1() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);

  const w = await mem.write({
    layer: 'session',
    entity_id: 'sess_001',
    content: 'HM 询问了推荐系统候选人',
    source: 'system',
  });
  assert.ok(w.ok, 'write 应成功');

  const r = await mem.recall({
    layer: 'session',
    query: '推荐系统',
    limit: 5,
  });
  assert.ok(r.ok, 'recall 应成功');
  assert.ok(r.data!.length >= 1, '应召回至少 1 条');
  assert.ok(r.data![0].summary.includes('推荐系统'), 'summary 应含关键词');
}

// ══════════════════════════════════════════
// M2: candidate 层读写
// ══════════════════════════════════════════

async function m2() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);

  await mem.write({
    layer: 'candidate',
    entity_id: 'cand_001',
    content: '张三薪资敏感，期望 55k+，在比较 OPPO offer',
    source: 'user',
  });

  const r = await mem.recall({
    layer: 'candidate',
    query: '张三 OPPO',
    candidate_id: 'cand_001',
  });
  assert.ok(r.ok);
  assert.ok(r.data!.length >= 1, '应召回候选人记忆');
  assert.ok(
    r.data!.some((item) => item.summary.includes('OPPO')),
    '应包含 OPPO 相关信息',
  );
}

// ══════════════════════════════════════════
// M3: 跨 session 持久化
// ══════════════════════════════════════════

async function m3() {
  const store = new InMemoryStorage();
  const mem1 = new MemoryManager(store);

  // Session 1 写入
  await mem1.write({
    layer: 'candidate',
    entity_id: 'cand_002',
    content: '李四期望 remote，不考虑 onsite',
    source: 'user',
  });

  // 模拟"新会话"：创建新的 MemoryManager 但共享同一个 store
  const mem2 = new MemoryManager(store);
  const r = await mem2.recall({
    layer: 'candidate',
    query: '李四 remote',
    candidate_id: 'cand_002',
  });

  assert.ok(r.ok);
  assert.ok(r.data!.length >= 1, '跨 session 应能召回');
  assert.ok(
    r.data!.some((item) => item.summary.includes('remote')),
    '应包含 remote 信息',
  );
}

// ══════════════════════════════════════════
// M4: 冲突检测
// ══════════════════════════════════════════

async function m4() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);

  // 第一次写入
  await mem.write({
    layer: 'candidate',
    entity_id: 'cand_003',
    content: '王五期望薪资 45k，不考虑加班',
    source: 'user',
  });

  // 第二次写入 — 内容部分重叠但薪资不同
  const w2 = await mem.write({
    layer: 'candidate',
    entity_id: 'cand_003',
    content: '王五期望薪资 60k，不考虑加班，偏好大模型方向',
    source: 'user',
  });

  // 冲突应该被检测到
  const conflicts = mem.getConflicts('cand_003');
  assert.ok(conflicts.length > 0, `应有冲突 note，实际 ${conflicts.length} 条`);
}

// ══════════════════════════════════════════
// M5: 冲突解决
// ══════════════════════════════════════════

async function m5() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);

  // 制造冲突
  await mem.write({
    layer: 'candidate',
    entity_id: 'cand_004',
    content: '陈晓期望薪资 50k，偏好后端方向',
    source: 'user',
  });
  await mem.write({
    layer: 'candidate',
    entity_id: 'cand_004',
    content: '陈晓期望薪资 65k，偏好后端方向，考虑管理岗',
    source: 'user',
  });

  const conflicts = mem.getConflicts('cand_004');
  assert.ok(conflicts.length > 0, '应有冲突');

  // 接受新信息（按内容查找冲突 note 的 ID）
  const noteId = `cand_004-note-${conflicts[0].created_at}`;
  mem.resolveConflict(noteId, 'accept');

  // 冲突应被清除或至少减少
  const after = mem.getConflicts('cand_004');
  assert.ok(after.length < conflicts.length, `冲突应减少：${conflicts.length} → ${after.length}`);
}

// ══════════════════════════════════════════
// M6: 过期清理
// ══════════════════════════════════════════

async function m6() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);

  // 写入一条"旧"记忆（直接操作底层数据模拟过期）
  const key = 'hireagent-memory-candidate-cand_old';
  const now = Date.now();
  store.set(key, {
    candidate_id: 'cand_old',
    profile: { name: '旧人', current_company: '', current_title: '', experience_years: 0, education: '', skills: [] },
    key_tags: [],
    key_notes: [
      {
        content: '过期的记忆',
        source: 'user' as const,
        created_at: now - 40 * 24 * 60 * 60 * 1000, // 40 天前
        status: 'confirmed' as const,
      },
    ],
    interaction_summary: [],
    updated_at: now - 40 * 24 * 60 * 60 * 1000,
  });

  const cleaned = mem.expireNotes();
  assert.ok(cleaned > 0, `应清理过期 note，实际清理 ${cleaned} 条`);

  // 清理后 note 状态应为 archived
  const data = store.get<any>(key);
  const archivedNote = data.key_notes[0];
  assert.strictEqual(archivedNote.status, 'archived', '过期 note 应标记为 archived');
}

// ══════════════════════════════════════════
// M7: 空召回优雅处理
// ══════════════════════════════════════════

async function m7() {
  const store = new InMemoryStorage();
  const mem = new MemoryManager(store);

  const r = await mem.recall({
    layer: 'candidate',
    query: '不存在的人',
    candidate_id: 'cand_999',
  });
  assert.ok(r.ok, '空召回也应返回 ok=true');
  assert.strictEqual(r.data!.length, 0, 'data 应为空数组');
  assert.ok(r.hint, '应有 hint');
}

// ══════════════════════════════════════════

(async () => {
  console.log('🧪 S5 Memory 单测\n');

  await test('M1: session 层读写', m1);
  await test('M2: candidate 层读写', m2);
  await test('M3: 跨 session 持久化', m3);
  await test('M4: 冲突检测', m4);
  await test('M5: 冲突解决', m5);
  await test('M6: 过期清理', m6);
  await test('M7: 空召回优雅处理', m7);

  console.log(`\n══════════════════════════════`);
  console.log(`  ${passed} passed, ${failed} failed`);
  console.log(`══════════════════════════════`);
  process.exit(failed > 0 ? 1 : 0);
})();
