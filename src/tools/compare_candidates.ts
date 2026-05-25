/**
 * T5: compare_candidates — 对比两个候选人多维度差异
 *
 * 数据源: resumes.json
 * 参数: candidate_ids: [string, string]
 * 返回: CompareCandidatesData
 */

import type {
  CompareCandidatesParams,
  CompareCandidatesResult,
  ComparisonItem,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { type RawResume } from './utils/mappers';

export async function compare_candidates(params: CompareCandidatesParams): Promise<CompareCandidatesResult> {
  try {
    const resumes: RawResume[] = loadData<RawResume[]>('resumes');
    if (!Array.isArray(resumes)) {
      return err('候选人数据暂时不可用，无法进行对比。');
    }

    const [idA, idB] = params.candidate_ids;
    if (!idA || !idB) {
      return err('请提供两个候选人的 ID 进行对比。例如："对比一下 res_001 和 res_002"。');
    }

    const resumeA = resumes.find((r) => r.id === idA);
    const resumeB = resumes.find((r) => r.id === idB);

    if (!resumeA || !resumeB) {
      const missing = !resumeA ? idA : idB;
      return err(
        `未找到候选人 ${missing}。请检查 ID 是否正确，或告诉我候选人名字，我帮你查。`,
      );
    }

    const dimensions: ComparisonItem[] = [];

    // 工作年限
    dimensions.push({
      label: '工作年限',
      candidate_a: `${resumeA.experience}年`,
      candidate_b: `${resumeB.experience}年`,
      advantage: resumeA.experience > resumeB.experience ? 'a' : resumeB.experience > resumeA.experience ? 'b' : 'neutral',
    });

    // 当前公司
    dimensions.push({
      label: '当前公司',
      candidate_a: resumeA.currentCompany,
      candidate_b: resumeB.currentCompany,
      advantage: 'neutral',
    });

    // 当前职位
    dimensions.push({
      label: '当前职位',
      candidate_a: resumeA.currentTitle,
      candidate_b: resumeB.currentTitle,
      advantage: 'neutral',
    });

    // 学历
    dimensions.push({
      label: '学历',
      candidate_a: resumeA.education,
      candidate_b: resumeB.education,
      advantage: 'neutral',
    });

    // 技能数量
    dimensions.push({
      label: '技能广度',
      candidate_a: `${resumeA.skills.length}项`,
      candidate_b: `${resumeB.skills.length}项`,
      advantage: resumeA.skills.length > resumeB.skills.length ? 'a' : resumeB.skills.length > resumeA.skills.length ? 'b' : 'neutral',
    });

    // 技能重叠度
    const commonSkills = resumeA.skills.filter((s) =>
      resumeB.skills.some((s2) => s2.toLowerCase() === s.toLowerCase()),
    );
    dimensions.push({
      label: '技能重叠',
      candidate_a: `${commonSkills.length}/${resumeA.skills.length}`,
      candidate_b: `${commonSkills.length}/${resumeB.skills.length}`,
      advantage: 'neutral',
    });

    // 期望薪资
    dimensions.push({
      label: '期望薪资',
      candidate_a: resumeA.salary,
      candidate_b: resumeB.salary,
      advantage: 'neutral',
    });

    // 工作经历数量
    dimensions.push({
      label: '工作经历',
      candidate_a: `${resumeA.careerHistory.length}段`,
      candidate_b: `${resumeB.careerHistory.length}段`,
      advantage: resumeA.careerHistory.length > resumeB.careerHistory.length ? 'a' : resumeB.careerHistory.length > resumeA.careerHistory.length ? 'b' : 'neutral',
    });

    return ok({
      candidate_a: { id: resumeA.id, name: resumeA.name },
      candidate_b: { id: resumeB.id, name: resumeB.name },
      dimensions,
    });
  } catch (e) {
    return err('对比数据暂时不全，但我可以基于已拿到的部分信息先给你一个初步判断。');
  }
}
