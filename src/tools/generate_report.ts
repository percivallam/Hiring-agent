/**
 * T12: generate_report — 生成招聘周报/月报
 *
 * 数据源: pipeline.json + jobs.json
 * 参数: report_type, department?
 * 返回: ReportData
 */

import type {
  GenerateReportParams,
  GenerateReportResult,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { type RawPipeline } from './utils/mappers';

export async function generate_report(params: GenerateReportParams): Promise<GenerateReportResult> {
  try {
    const rawPipeline = loadData<RawPipeline>('pipeline');

    if (!rawPipeline?.jobs) {
      return err('报告暂时生成不出来，可能是数据同步问题。我先给你口头汇总一下我知道的情况。');
    }

    // 按部门筛选（如果指定）
    let pipelineJobs = Object.values(rawPipeline.jobs);
    if (params.department) {
      const dept = params.department.toLowerCase();
      pipelineJobs = pipelineJobs.filter((j) => j.department.toLowerCase().includes(dept));
    }

    // 总指标
    const totalStages = pipelineJobs.flatMap((j) => j.pipeline);
    const offerCount = totalStages.filter((s: { stage: string }) => s.stage.includes('Offer')).reduce((sum: number, s: { count: number }) => sum + s.count, 0);
    const activeCount = totalStages.reduce((sum: number, s: { count: number }) => sum + s.count, 0);

    const openCount = pipelineJobs.length;

    // 漏斗（按阶段合并）
    const stageNames = ['简历筛选', 'HR初筛通过', '技术一面', '技术二面', '交叉面', 'HR面', 'Offer'];
    const funnel = stageNames.map((name) => {
      const entries = totalStages.filter((s: { stage: string }) => s.stage === name);
      const count = entries.reduce((sum: number, s: { count: number }) => sum + s.count, 0);
      const base = totalStages.filter((s: { stage: string }) => s.stage === '简历筛选').reduce((sum: number, s: { count: number }) => sum + s.count, 0);
      return {
        stage: name,
        count,
        conversion_rate: base > 0 ? Math.round((count / base) * 100) : 0,
      };
    });

    // 洞察
    const stuckJobs = pipelineJobs.filter((j) => j.status === 'stuck');
    const atRiskJobs = pipelineJobs.filter((j) => j.status === 'at_risk');
    const insights: string[] = [];
    if (stuckJobs.length > 0) {
      insights.push(`${stuckJobs.length} 个岗位处于卡顿状态：${stuckJobs.map((j) => j.title).join('、')}`);
    }
    if (atRiskJobs.length > 0) {
      insights.push(`${atRiskJobs.length} 个岗位需关注：${atRiskJobs.map((j) => j.title).join('、')}`);
    }
    const convRate = funnel.length >= 1 ? funnel[0].conversion_rate : 0;
    if (convRate < 30) {
      insights.push('简历到面试的整体转化率偏低，建议优化初筛标准或拓宽简历渠道');
    }

    if (insights.length === 0) {
      insights.push('当前 Pipeline 整体健康，各岗位按正常节奏推进。');
    }

    const periodLabel = params.report_type === 'weekly' ? '本周' : params.report_type === 'monthly' ? '本月' : '专项';

    return ok({
      title: `招聘${periodLabel}报告`,
      period: periodLabel,
      metrics: {
        open_positions: openCount,
        active_candidates: activeCount,
        hired_this_period: offerCount,
        avg_time_to_hire_days: Math.round(
          pipelineJobs.reduce((sum, j) => sum + j.openDays, 0) / Math.max(pipelineJobs.length, 1),
        ),
        offer_accept_rate: 0,
      },
      funnel,
      insights,
    });
  } catch (e) {
    return err('报告暂时生成不出来，可能是数据同步问题。我先给你口头汇总一下我知道的情况。');
  }
}
