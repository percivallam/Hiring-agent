/**
 * T1: list_jobs — 列出所有在招岗位
 *
 * 数据源: jobs.json
 * 参数: department? / status?
 * 返回: JobSummary[]
 */

import type {
  ListJobsParams,
  ListJobsResult,
  JobSummary,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawToJobSummary, type RawJob } from './utils/mappers';

export async function list_jobs(params: ListJobsParams): Promise<ListJobsResult> {
  try {
    const jobs: RawJob[] = loadData<RawJob[]>('jobs');
    if (!Array.isArray(jobs)) {
      return err('岗位数据格式异常，暂时无法获取。请告诉我你想找什么方向的岗位，我用经验给你建议。');
    }

    // 从 pipeline.json 获取 pipeline_counts
    let pipelineMap: Record<string, { resume: number; screening: number; interview: number; offer: number; hired: number }> = {};
    try {
      const pipelineRaw = loadData<{ jobs: Record<string, { pipeline: Array<{ stage: string; count: number }> }> }>('pipeline');
      if (pipelineRaw?.jobs) {
        for (const [jobId, pj] of Object.entries(pipelineRaw.jobs)) {
          const stages = pj.pipeline ?? [];
          pipelineMap[jobId] = {
            resume: stages[0]?.count ?? 0,
            screening: stages[1]?.count ?? 0,
            interview: (stages[2]?.count ?? 0) + (stages[3]?.count ?? 0),
            offer: (stages[5]?.count ?? 0) + (stages[6]?.count ?? 0),
            hired: stages[6]?.count ?? 0,
          };
        }
      }
    } catch {
      // pipeline 可能不可用，降级
    }

    let filtered = jobs;

    if (params.department) {
      const dept = params.department.toLowerCase();
      filtered = filtered.filter((j) => j.department.toLowerCase().includes(dept));
    }

    const result: JobSummary[] = filtered.map((j) => {
      const counts = pipelineMap[j.id] ?? { resume: 0, screening: 0, interview: 0, offer: 0, hired: 0 };
      return rawToJobSummary(j, counts);
    });

    if (result.length === 0) {
      return ok([], '暂无在招岗位数据。请告诉我你想找什么方向的岗位，我用经验给你建议。');
    }

    return ok(result);
  } catch (e) {
    return err(
      '岗位列表暂时拉不到，可能是数据源出问题。你可以告诉我关注的方向或部门，我帮你分析市场情况。',
    );
  }
}
