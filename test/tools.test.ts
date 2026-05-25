/**
 * S2 Tools 单测 — 每个工具 ≥ 3 个（正常 / 边界 / 错误）
 *
 * 运行: npx tsx test/tools.test.ts
 */

import * as assert from 'node:assert';
import { list_jobs } from '../src/tools/list_jobs';
import { get_job_detail } from '../src/tools/get_job_detail';
import { search_candidates } from '../src/tools/search_candidates';
import { get_candidate_profile } from '../src/tools/get_candidate_profile';
import { compare_candidates } from '../src/tools/compare_candidates';
import { market_analysis } from '../src/tools/market_analysis';
import { salary_benchmark } from '../src/tools/salary_benchmark';
import { analyze_pipeline } from '../src/tools/analyze_pipeline';
import { memory_recall } from '../src/tools/memory_recall';
import { memory_write } from '../src/tools/memory_write';
import { interview_kit_prepare } from '../src/tools/interview_kit_prepare';
import { generate_report } from '../src/tools/generate_report';
import { RealToolExecutor, createRealToolExecutor } from '../src/tools/index';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const r = fn();
    if (r instanceof Promise) {
      r.then(
        () => { passed++; console.log(`  ✓ ${name}`); },
        (e) => { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); },
      );
    } else {
      passed++; console.log(`  ✓ ${name}`);
    }
  } catch (e: any) {
    failed++; console.log(`  ✗ ${name}\n    ${e.message}`);
  }
}

function summary() {
  console.log(`\n${passed} passed, ${failed} failed`);
}

// ══════════════════════════════════════════
// T1: list_jobs
// ══════════════════════════════════════════

console.log('\n--- T1: list_jobs ---');

test('正常: 无参数返回全部岗位', async () => {
  const r = await list_jobs({});
  assert.ok(r.ok);
  assert.ok(r.data!.length > 0);
  assert.ok(r.data!.every(j => j.id && j.title));
});

test('边界: 部门筛选无匹配返回空数组', async () => {
  const r = await list_jobs({ department: '不存在的部门' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.length, 0);
  assert.ok(r.hint);
});

test('正常: status 参数透传', async () => {
  const r = await list_jobs({ status: 'open' });
  assert.ok(r.ok);
  assert.ok(Array.isArray(r.data!));
});

// ══════════════════════════════════════════
// T2: get_job_detail
// ══════════════════════════════════════════

console.log('\n--- T2: get_job_detail ---');

test('正常: 查 job_001', async () => {
  const r = await get_job_detail({ job_id: 'job_001' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.id, 'job_001');
  assert.ok(r.data!.title.includes('推荐'));
});

test('边界: 不存在的 job_id', async () => {
  const r = await get_job_detail({ job_id: 'job_999' });
  assert.strictEqual(r.ok, false);
  assert.ok(r.hint!.includes('job_999'));
});

test('正常: 查 job_002', async () => {
  const r = await get_job_detail({ job_id: 'job_002' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.id, 'job_002');
});

// ══════════════════════════════════════════
// T3: search_candidates
// ══════════════════════════════════════════

console.log('\n--- T3: search_candidates ---');

test('正常: 搜"推荐系统"有结果', async () => {
  const r = await search_candidates({ query: '推荐系统' });
  assert.ok(r.ok);
  assert.ok(r.data!.length > 0);
});

test('边界: 搜不存在的关键词返回空', async () => {
  const r = await search_candidates({ query: '量子物理' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.length, 0);
  assert.ok(r.hint);
});

test('正常: 加 experience_min 过滤', async () => {
  const r = await search_candidates({ query: '推荐', experience_min: 10 });
  assert.ok(r.ok);
  // 10 年以上的推荐候选人很少
  assert.ok(Array.isArray(r.data!));
});

test('正常: limit 截断', async () => {
  const r = await search_candidates({ query: '推荐', limit: 2 });
  assert.ok(r.ok);
  assert.ok(r.data!.length <= 2);
});

test('错误: 空 query', async () => {
  const r = await search_candidates({ query: '' });
  assert.strictEqual(r.ok, false);
});

// ══════════════════════════════════════════
// T4: get_candidate_profile
// ══════════════════════════════════════════

console.log('\n--- T4: get_candidate_profile ---');

test('正常: 查 res_001', async () => {
  const r = await get_candidate_profile({ candidate_id: 'res_001' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.id, 'res_001');
  assert.ok(r.data!.skills.length > 0);
});

test('边界: 不存在的 candidate_id', async () => {
  const r = await get_candidate_profile({ candidate_id: 'res_999' });
  assert.strictEqual(r.ok, false);
  assert.ok(r.hint!.includes('res_999'));
});

test('正常: 查 res_007', async () => {
  const r = await get_candidate_profile({ candidate_id: 'res_007' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.name, '张三');
});

// ══════════════════════════════════════════
// T5: compare_candidates
// ══════════════════════════════════════════

console.log('\n--- T5: compare_candidates ---');

test('正常: 对比 res_001 vs res_002', async () => {
  const r = await compare_candidates({ candidate_ids: ['res_001', 'res_002'] });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.candidate_a.id, 'res_001');
  assert.strictEqual(r.data!.candidate_b.id, 'res_002');
  assert.ok(r.data!.dimensions.length > 0);
});

test('边界: 一个候选人不存在', async () => {
  const r = await compare_candidates({ candidate_ids: ['res_001', 'res_999'] });
  assert.strictEqual(r.ok, false);
});

test('正常: 对比同方向候选人', async () => {
  const r = await compare_candidates({ candidate_ids: ['res_001', 'res_003'] });
  assert.ok(r.ok);
  assert.ok(r.data!.dimensions.length > 0);
});

// ══════════════════════════════════════════
// T6: market_analysis
// ══════════════════════════════════════════

console.log('\n--- T6: market_analysis ---');

test('正常: 分析"推荐系统"市场', async () => {
  const r = await market_analysis({ position: '推荐系统' });
  assert.ok(r.ok);
  assert.ok(r.data!.insights.length > 0);
});

test('正常: 分析"大模型"市场', async () => {
  const r = await market_analysis({ position: '大模型' });
  assert.ok(r.ok);
  assert.ok(r.data!.insights.length > 0);
});

test('边界: 未知方向返回空 insights', async () => {
  const r = await market_analysis({ position: '无人驾驶' });
  assert.ok(r.ok);
  assert.ok(r.hint);
});

// ══════════════════════════════════════════
// T7: salary_benchmark
// ══════════════════════════════════════════

console.log('\n--- T7: salary_benchmark ---');

test('正常: 查"推荐"薪酬', async () => {
  const r = await salary_benchmark({ position: '推荐' });
  assert.ok(r.ok);
  assert.ok(r.data!.benchmarks.length > 0);
});

test('正常: 带 level 过滤', async () => {
  const r = await salary_benchmark({ position: '推荐', level: 'P7' });
  assert.ok(r.ok);
});

test('边界: 未知岗位', async () => {
  const r = await salary_benchmark({ position: '量子计算' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.benchmarks.length, 0);
});

// ══════════════════════════════════════════
// T8: analyze_pipeline
// ══════════════════════════════════════════

console.log('\n--- T8: analyze_pipeline ---');

test('正常: 全量分析', async () => {
  const r = await analyze_pipeline({});
  assert.ok(r.ok);
  assert.ok(r.data!.jobs.length > 0);
});

test('正常: 单岗位分析', async () => {
  const r = await analyze_pipeline({ job_id: 'job_001' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.jobs.length, 1);
});

test('边界: 不存在的 job_id', async () => {
  const r = await analyze_pipeline({ job_id: 'job_999' });
  assert.strictEqual(r.ok, false);
});

// ══════════════════════════════════════════
// T9: memory_recall (stub)
// ══════════════════════════════════════════

console.log('\n--- T9: memory_recall (stub) ---');

test('正常: 返回空数组', async () => {
  const r = await memory_recall({ layer: 'session', query: 'test' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.length, 0);
});

test('正常: candidate 层', async () => {
  const r = await memory_recall({ layer: 'candidate', query: '张三', candidate_id: 'res_001' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.length, 0);
});

test('正常: user 层', async () => {
  const r = await memory_recall({ layer: 'user', query: '偏好' });
  assert.ok(r.ok);
});

// ══════════════════════════════════════════
// T10: memory_write (stub)
// ══════════════════════════════════════════

console.log('\n--- T10: memory_write (stub) ---');

test('正常: 写入成功', async () => {
  const r = await memory_write({ layer: 'session', content: '测试记忆' });
  assert.ok(r.ok);
  assert.ok(r.data!.id.startsWith('mem_'));
  assert.strictEqual(r.data!.layer, 'session');
});

test('正常: candidate 层写入', async () => {
  const r = await memory_write({ layer: 'candidate', entity_id: 'res_001', content: '张三期望薪资 55k' });
  assert.ok(r.ok);
  assert.strictEqual(r.data!.entity_id, 'res_001');
});

test('正常: 摘要截断', async () => {
  const long = 'x'.repeat(200);
  const r = await memory_write({ layer: 'session', content: long });
  assert.ok(r.ok);
  assert.ok(r.data!.summary.length <= 100);
});

// ══════════════════════════════════════════
// T11: interview_kit_prepare (demo)
// ══════════════════════════════════════════

console.log('\n--- T11: interview_kit_prepare (demo) ---');

test('正常: 生成面试包', async () => {
  const r = await interview_kit_prepare({ candidate_id: 'res_001', job_id: 'job_001' });
  assert.ok(r.ok);
  assert.strictEqual(r.meta.mode, 'demo');
  assert.ok(r.data!.categories.length >= 3);
});

test('边界: 候选人不存在', async () => {
  const r = await interview_kit_prepare({ candidate_id: 'res_999', job_id: 'job_001' });
  assert.strictEqual(r.ok, false);
});

test('边界: 岗位不存在', async () => {
  const r = await interview_kit_prepare({ candidate_id: 'res_001', job_id: 'job_999' });
  assert.strictEqual(r.ok, false);
});

// ══════════════════════════════════════════
// T12: generate_report
// ══════════════════════════════════════════

console.log('\n--- T12: generate_report ---');

test('正常: 生成周报', async () => {
  const r = await generate_report({ report_type: 'weekly' });
  assert.ok(r.ok);
  assert.ok(r.data!.metrics.open_positions > 0);
  assert.ok(r.data!.funnel.length > 0);
  assert.ok(r.data!.insights.length > 0);
});

test('正常: 生成月报', async () => {
  const r = await generate_report({ report_type: 'monthly' });
  assert.ok(r.ok);
});

test('边界: 部门筛选', async () => {
  const r = await generate_report({ report_type: 'weekly', department: '数据智能部' });
  assert.ok(r.ok);
});

// ══════════════════════════════════════════
// RealToolExecutor 集成测试
// ══════════════════════════════════════════

console.log('\n--- RealToolExecutor ---');

test('正常: execute 已注册工具', async () => {
  const ex = createRealToolExecutor();
  const r = await ex.execute('list_jobs', {});
  assert.ok(r.ok);
});

test('错误: execute 未注册工具', async () => {
  const ex = createRealToolExecutor();
  const r = await ex.execute('unknown_tool', {});
  assert.strictEqual(r.ok, false);
  assert.ok(r.hint!.includes('未注册'));
});

test('正常: 所有 12 工具均可 execute', async () => {
  const ex = createRealToolExecutor();
  const tools = [
    { name: 'list_jobs', args: {} },
    { name: 'get_job_detail', args: { job_id: 'job_001' } },
    { name: 'search_candidates', args: { query: '推荐' } },
    { name: 'get_candidate_profile', args: { candidate_id: 'res_001' } },
    { name: 'compare_candidates', args: { candidate_ids: ['res_001', 'res_002'] } },
    { name: 'market_analysis', args: { position: '推荐' } },
    { name: 'salary_benchmark', args: { position: '推荐' } },
    { name: 'analyze_pipeline', args: {} },
    { name: 'memory_recall', args: { layer: 'session', query: 'test' } },
    { name: 'memory_write', args: { layer: 'session', content: 'test' } },
    { name: 'interview_kit_prepare', args: { candidate_id: 'res_001', job_id: 'job_001' } },
    { name: 'generate_report', args: { report_type: 'weekly' } },
  ];
  for (const t of tools) {
    const r = await ex.execute(t.name, t.args);
    assert.ok(r.ok, `${t.name} should succeed`);
  }
});

// ══════════════════════════════════════════
// 完成后输出
// ══════════════════════════════════════════

// 给 async tests 足够的时间完成
setTimeout(() => {
  summary();
  process.exit(failed > 0 ? 1 : 0);
}, 2000);
