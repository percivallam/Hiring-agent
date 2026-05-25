/**
 * S2 Tools 单测 — 每个工具 ≥ 3 个（正常 / 边界 / 错误）(vitest 格式)
 */
import { describe, it, expect } from 'vitest';
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

describe('T1: list_jobs', () => {
  it('正常: 无参数返回全部岗位', async () => {
    const r = await list_jobs({});
    expect(r.ok).toBe(true);
    expect(r.data!.length).toBeGreaterThan(0);
    expect(r.data!.every(j => j.id && j.title)).toBe(true);
  });
  it('边界: 部门筛选无匹配返回空数组', async () => {
    const r = await list_jobs({ department: '不存在的部门' });
    expect(r.ok).toBe(true);
    expect(r.data!.length).toBe(0);
    expect(r.hint).toBeTruthy();
  });
  it('正常: status 参数透传', async () => {
    const r = await list_jobs({ status: 'open' });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.data!)).toBe(true);
  });
});

describe('T2: get_job_detail', () => {
  it('正常: 查 job_001', async () => {
    const r = await get_job_detail({ job_id: 'job_001' });
    expect(r.ok).toBe(true);
    expect(r.data!.id).toBe('job_001');
    expect(r.data!.title).toContain('推荐');
  });
  it('边界: 不存在的 job_id', async () => {
    const r = await get_job_detail({ job_id: 'job_999' });
    expect(r.ok).toBe(false);
    expect(r.hint!).toContain('job_999');
  });
  it('正常: 查 job_002', async () => {
    const r = await get_job_detail({ job_id: 'job_002' });
    expect(r.ok).toBe(true);
    expect(r.data!.id).toBe('job_002');
  });
});

describe('T3: search_candidates', () => {
  it('正常: 搜"推荐系统"有结果', async () => {
    const r = await search_candidates({ query: '推荐系统' });
    expect(r.ok).toBe(true);
    expect(r.data!.length).toBeGreaterThan(0);
  });
  it('边界: 搜不存在的关键词返回空', async () => {
    const r = await search_candidates({ query: '量子物理' });
    expect(r.ok).toBe(true);
    expect(r.data!.length).toBe(0);
    expect(r.hint).toBeTruthy();
  });
  it('正常: 加 experience_min 过滤', async () => {
    const r = await search_candidates({ query: '推荐', experience_min: 10 });
    expect(r.ok).toBe(true);
    expect(Array.isArray(r.data!)).toBe(true);
  });
  it('正常: limit 截断', async () => {
    const r = await search_candidates({ query: '推荐', limit: 2 });
    expect(r.ok).toBe(true);
    expect(r.data!.length).toBeLessThanOrEqual(2);
  });
  it('错误: 空 query', async () => {
    const r = await search_candidates({ query: '' });
    expect(r.ok).toBe(false);
  });
});

describe('T4: get_candidate_profile', () => {
  it('正常: 查 res_001', async () => {
    const r = await get_candidate_profile({ candidate_id: 'res_001' });
    expect(r.ok).toBe(true);
    expect(r.data!.id).toBe('res_001');
    expect(r.data!.skills.length).toBeGreaterThan(0);
  });
  it('边界: 不存在的 candidate_id', async () => {
    const r = await get_candidate_profile({ candidate_id: 'res_999' });
    expect(r.ok).toBe(false);
    expect(r.hint!).toContain('res_999');
  });
  it('正常: 查 res_007', async () => {
    const r = await get_candidate_profile({ candidate_id: 'res_007' });
    expect(r.ok).toBe(true);
    expect(r.data!.name).toBe('张三');
  });
});

describe('T5: compare_candidates', () => {
  it('正常: 对比 res_001 vs res_002', async () => {
    const r = await compare_candidates({ candidate_ids: ['res_001', 'res_002'] });
    expect(r.ok).toBe(true);
    expect(r.data!.candidate_a.id).toBe('res_001');
    expect(r.data!.candidate_b.id).toBe('res_002');
    expect(r.data!.dimensions.length).toBeGreaterThan(0);
  });
  it('边界: 一个候选人不存在', async () => {
    const r = await compare_candidates({ candidate_ids: ['res_001', 'res_999'] });
    expect(r.ok).toBe(false);
  });
  it('正常: 对比同方向候选人', async () => {
    const r = await compare_candidates({ candidate_ids: ['res_001', 'res_003'] });
    expect(r.ok).toBe(true);
    expect(r.data!.dimensions.length).toBeGreaterThan(0);
  });
});

describe('T6: market_analysis', () => {
  it('正常: 分析"推荐系统"市场', async () => {
    const r = await market_analysis({ position: '推荐系统' });
    expect(r.ok).toBe(true);
    expect(r.data!.insights.length).toBeGreaterThan(0);
  });
  it('正常: 分析"大模型"市场', async () => {
    const r = await market_analysis({ position: '大模型' });
    expect(r.ok).toBe(true);
    expect(r.data!.insights.length).toBeGreaterThan(0);
  });
  it('边界: 未知方向返回空 insights', async () => {
    const r = await market_analysis({ position: '无人驾驶' });
    expect(r.ok).toBe(true);
    expect(r.hint).toBeTruthy();
  });
});

describe('T7: salary_benchmark', () => {
  it('正常: 查"推荐"薪酬', async () => {
    const r = await salary_benchmark({ position: '推荐' });
    expect(r.ok).toBe(true);
    expect(r.data!.benchmarks.length).toBeGreaterThan(0);
  });
  it('正常: 带 level 过滤', async () => {
    const r = await salary_benchmark({ position: '推荐', level: 'P7' });
    expect(r.ok).toBe(true);
  });
  it('边界: 未知岗位', async () => {
    const r = await salary_benchmark({ position: '量子计算' });
    expect(r.ok).toBe(true);
    expect(r.data!.benchmarks.length).toBe(0);
  });
});

describe('T8: analyze_pipeline', () => {
  it('正常: 全量分析', async () => {
    const r = await analyze_pipeline({});
    expect(r.ok).toBe(true);
    expect(r.data!.jobs.length).toBeGreaterThan(0);
  });
  it('正常: 单岗位分析', async () => {
    const r = await analyze_pipeline({ job_id: 'job_001' });
    expect(r.ok).toBe(true);
    expect(r.data!.jobs.length).toBe(1);
  });
  it('边界: 不存在的 job_id', async () => {
    const r = await analyze_pipeline({ job_id: 'job_999' });
    expect(r.ok).toBe(false);
  });
});

describe('T9: memory_recall (stub)', () => {
  it('正常: 返回空数组', async () => {
    const r = await memory_recall({ layer: 'session', query: 'test' });
    expect(r.ok).toBe(true);
    expect(r.data!.length).toBe(0);
  });
  it('正常: candidate 层', async () => {
    const r = await memory_recall({ layer: 'candidate', query: '张三', candidate_id: 'res_001' });
    expect(r.ok).toBe(true);
    expect(r.data!.length).toBe(0);
  });
  it('正常: user 层', async () => {
    const r = await memory_recall({ layer: 'user', query: '偏好' });
    expect(r.ok).toBe(true);
  });
});

describe('T10: memory_write (stub)', () => {
  it('正常: 写入成功', async () => {
    const r = await memory_write({ layer: 'session', content: '测试记忆' });
    expect(r.ok).toBe(true);
    expect(r.data!.id).toMatch(/^mem_/);
    expect(r.data!.layer).toBe('session');
  });
  it('正常: candidate 层写入', async () => {
    const r = await memory_write({ layer: 'candidate', entity_id: 'res_001', content: '张三期望薪资 55k' });
    expect(r.ok).toBe(true);
    expect(r.data!.entity_id).toBe('res_001');
  });
  it('正常: 摘要截断', async () => {
    const long = 'x'.repeat(200);
    const r = await memory_write({ layer: 'session', content: long });
    expect(r.ok).toBe(true);
    expect(r.data!.summary.length).toBeLessThanOrEqual(100);
  });
});

describe('T11: interview_kit_prepare (demo)', () => {
  it('正常: 生成面试包', async () => {
    const r = await interview_kit_prepare({ candidate_id: 'res_001', job_id: 'job_001' });
    expect(r.ok).toBe(true);
    expect(r.meta.mode).toBe('demo');
    expect(r.data!.categories.length).toBeGreaterThanOrEqual(3);
  });
  it('边界: 候选人不存在', async () => {
    const r = await interview_kit_prepare({ candidate_id: 'res_999', job_id: 'job_001' });
    expect(r.ok).toBe(false);
  });
  it('边界: 岗位不存在', async () => {
    const r = await interview_kit_prepare({ candidate_id: 'res_001', job_id: 'job_999' });
    expect(r.ok).toBe(false);
  });
});

describe('T12: generate_report', () => {
  it('正常: 生成周报', async () => {
    const r = await generate_report({ report_type: 'weekly' });
    expect(r.ok).toBe(true);
    expect(r.data!.metrics.open_positions).toBeGreaterThan(0);
    expect(r.data!.funnel.length).toBeGreaterThan(0);
    expect(r.data!.insights.length).toBeGreaterThan(0);
  });
  it('正常: 生成月报', async () => {
    const r = await generate_report({ report_type: 'monthly' });
    expect(r.ok).toBe(true);
  });
  it('边界: 部门筛选', async () => {
    const r = await generate_report({ report_type: 'weekly', department: '数据智能部' });
    expect(r.ok).toBe(true);
  });
});

describe('RealToolExecutor', () => {
  it('正常: execute 已注册工具', async () => {
    const ex = createRealToolExecutor();
    const r = await ex.execute('list_jobs', {});
    expect(r.ok).toBe(true);
  });
  it('错误: execute 未注册工具', async () => {
    const ex = createRealToolExecutor();
    const r = await ex.execute('unknown_tool', {});
    expect(r.ok).toBe(false);
    expect(r.hint!).toContain('未注册');
  });
  it('正常: 所有 12 工具均可 execute', async () => {
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
      expect(r.ok, `${t.name} should succeed`).toBe(true);
    }
  });
});
