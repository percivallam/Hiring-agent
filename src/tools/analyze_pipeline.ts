/**
 * T8: analyze_pipeline — 招聘 Pipeline 分析（含周趋势 DSP-5）
 */

import type { AnalyzePipelineParams, AnalyzePipelineResult } from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawPipelineToAnalysisData, rawToPipelineSnapshot, extractTrend, type RawPipeline } from './utils/mappers';

export async function analyze_pipeline(params: AnalyzePipelineParams): Promise<AnalyzePipelineResult> {
  try {
    const raw = loadData<RawPipeline>('pipeline');
    if (!raw?.jobs) return err('Pipeline 数据暂时拉不到。我建议你先告诉我关注哪个岗位或部门。');

    if (params.job_id) {
      const job = raw.jobs[params.job_id];
      if (!job) return err(`未找到岗位 ${params.job_id} 的 Pipeline 数据。`);
      const snapshot = rawToPipelineSnapshot(job);
      const trend = extractTrend(job);
      let summary = `${job.title}当前状态：${job.status==='healthy'?'健康':job.status==='at_risk'?'需关注':'卡顿'}。开放 ${job.openDays} 天。`;
      if (trend && trend.trend === 'down') {
        summary += ` ⚠️ ${trend.detail}，呈下降趋势，需关注。`;
      } else if (trend) {
        summary += ` ${trend.detail}。`;
      }
      return ok({ title: `${job.title} — Pipeline 分析`, jobs: [snapshot], summary });
    }

    // 全量分析：为每个有趋势的岗位追加洞察
    const data = rawPipelineToAnalysisData(raw);
    const trendJobs: string[] = [];
    for (const [, job] of Object.entries(raw.jobs)) {
      const trend = extractTrend(job);
      if (trend && trend.trend === 'down') trendJobs.push(`${job.title}(${trend.detail})`);
    }
    if (trendJobs.length > 0) {
      data.summary = data.summary + ' | 趋势预警: ' + trendJobs.join('; ');
    }
    return ok(data);
  } catch (e) {
    return err('Pipeline 数据暂时拉不到，可能是数据同步延迟。');
  }
}
