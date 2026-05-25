/**
 * T8: analyze_pipeline — 招聘 Pipeline 分析
 *
 * 数据源: pipeline.json
 * 参数: job_id?
 * 返回: PipelineAnalysisData
 */

import type {
  AnalyzePipelineParams,
  AnalyzePipelineResult,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawPipelineToAnalysisData, rawToPipelineSnapshot, type RawPipeline } from './utils/mappers';

export async function analyze_pipeline(params: AnalyzePipelineParams): Promise<AnalyzePipelineResult> {
  try {
    const raw = loadData<RawPipeline>('pipeline');
    if (!raw?.jobs) {
      return err('Pipeline 数据暂时拉不到，可能是数据同步延迟。我建议你先告诉我关注哪个岗位或部门，我看看有没有缓存的进度信息。');
    }

    if (params.job_id) {
      // 单岗位分析
      const job = raw.jobs[params.job_id];
      if (!job) {
        return err(
          `未找到岗位 ${params.job_id} 的 Pipeline 数据。请检查岗位 ID，或告诉我部门名称，我帮你查。`,
        );
      }
      const snapshot = rawToPipelineSnapshot(job);
      return ok({
        title: `${job.title} — Pipeline 分析`,
        jobs: [snapshot],
        summary: `${job.title}当前状态：${job.status === 'healthy' ? '健康' : job.status === 'at_risk' ? '需关注' : '卡顿'}。开放 ${job.openDays} 天。`,
      });
    }

    // 全量分析
    return ok(rawPipelineToAnalysisData(raw));
  } catch (e) {
    return err('Pipeline 数据暂时拉不到，可能是数据同步延迟。我建议你先告诉我关注哪个岗位或部门，我看看有没有缓存的进度信息。');
  }
}
