import * as assert from 'node:assert';
import { search_candidates } from '../../src/tools/search_candidates';
import { get_candidate_profile } from '../../src/tools/get_candidate_profile';
import { compare_candidates } from '../../src/tools/compare_candidates';
import { market_analysis } from '../../src/tools/market_analysis';
import { analyze_pipeline } from '../../src/tools/analyze_pipeline';
import { interview_kit_prepare } from '../../src/tools/interview_kit_prepare';
import { list_jobs } from '../../src/tools/list_jobs';

let passed = 0;
let failed = 0;

async function check(name: string, fn: () => Promise<void>) {
  try { await fn(); passed++; console.log('  OK ' + name); }
  catch (e: any) { failed++; console.log('  FAIL ' + name + '\n    ' + e.message); }
}

async function main() {
  console.log('\n--- Q1: search_candidates (>= 3) ---');
  await check('Q1', async () => {
    const r = await search_candidates({ query: '推荐系统', experience_min: 5, sort_by_match: true });
    assert.ok(r.ok); assert.ok(r.data!.length >= 3);
    for (const c of r.data!) assert.ok(c.experience_years >= 5);
    console.log('    -> found ' + r.data!.length + ' candidates');
  });

  console.log('\n--- Q2: compare res_007 vs res_012 ---');
  await check('Q2a profile', async () => {
    const r = await get_candidate_profile({ candidate_id: 'res_007' });
    assert.ok(r.ok); assert.strictEqual(r.data!.name, '张三');
  });
  await check('Q2b compare', async () => {
    const r = await compare_candidates({ candidate_ids: ['res_007', 'res_012'] });
    assert.ok(r.ok); assert.ok(r.data!.dimensions.length >= 5);
    console.log('    -> ' + r.data!.dimensions.length + ' dimensions');
  });

  console.log('\n--- Q3: BSP DSP-1 ---');
  await check('Q3a no BSP jobs', async () => {
    const r = await list_jobs({});
    const bsp = r.data!.filter(j => j.title.toLowerCase().includes('bsp') || j.title.includes('嵌入式'));
    assert.strictEqual(bsp.length, 0);
  });
  await check('Q3b market BSP', async () => {
    const r = await market_analysis({ position: 'BSP' });
    assert.ok(r.ok);
    console.log('    -> market hints available');
  });

  console.log('\n--- Q4: pipeline DSP-5 ---');
  await check('Q4 pipeline', async () => {
    const r = await analyze_pipeline({ job_id: 'job_001' });
    assert.ok(r.ok); assert.ok(r.data!.jobs[0].stages.length >= 3);
    console.log('    -> ' + r.data!.jobs[0].title + ': ' + r.data!.jobs[0].stages.length + ' stages');
  });

  console.log('\n--- Q5: interview kit DSP-4 ---');
  await check('Q5 kit', async () => {
    const r = await interview_kit_prepare({ candidate_id: 'res_007', job_id: 'job_001' });
    assert.ok(r.ok); assert.strictEqual(r.meta.mode, 'demo');
    assert.ok(r.data!.categories.length >= 3);
    const n = r.data!.categories.reduce((s: any, c: any) => s + c.questions.length, 0);
    console.log('    -> ' + r.data!.categories.length + ' categories, ' + n + ' questions');
  });

  console.log('\n' + '='.repeat(40));
  console.log(passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
  else console.log('OK: S2 integration done');
}
main();
