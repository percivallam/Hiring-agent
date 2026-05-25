/**
 * T2: get_job_detail — 查看岗位详情
 *
 * 数据源: jobs.json + pipeline.json
 * 参数: job_id
 * 返回: JobDetail
 */

import type {
  GetJobDetailParams,
  GetJobDetailResult,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import {
  rawToJobDetail,
  type RawJob,
  type RawPipelineJob,
  type RawPipeline,
} from './utils/mappers';

export async function get_job_detail(params: GetJobDetailParams): Promise<GetJobDetailResult> {
  try {
    const jobs: RawJob[] = loadData<RawJob[]>('jobs');
    if (!Array.isArray(jobs)) {
      return err('岗位数据格式异常，请稍后再试。');
    }

    const job = jobs.find((j) => j.id === params.job_id);
    if (!job) {
      return err(
        `未找到岗位 ${params.job_id}。请检查岗位 ID 是否正确，或告诉我岗位名/方向，我帮你查找。`,
      );
    }

    // 查 pipeline 中该岗位的进度
    let pipeline: { stage: string; count: number; target: number }[] = [];
    try {
      const pipelineRaw = loadData<RawPipeline>('pipeline');
      if (pipelineRaw?.jobs?.[params.job_id]) {
        pipeline = pipelineRaw.jobs[params.job_id].pipeline.map((s) => ({
          stage: s.stage,
          count: s.count,
          target: s.target,
        }));
      }
    } catch {
      // pipeline 降级
    }

    const status = (() => {
      try {
        const pipelineRaw = loadData<RawPipeline>('pipeline');
        const pj: RawPipelineJob | undefined = pipelineRaw?.jobs?.[params.job_id];
        if (pj?.status === 'stuck') return 'closed' as const;
        if (pj?.status === 'at_risk') return 'urgent' as const;
      } catch {}
      return 'open' as const;
    })();

    return ok(rawToJobDetail(job, pipeline, status));
  } catch (e) {
    return err(
      `岗位 ${params.job_id} 详情暂时获取不到。你可以告诉我岗位名或方向，我用经验先给你讲讲这个岗通常的要求。`,
    );
  }
}
