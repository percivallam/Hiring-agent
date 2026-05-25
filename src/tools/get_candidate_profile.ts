/**
 * T4: get_candidate_profile — 查看候选人完整画像
 *
 * 数据源: resumes.json
 * 参数: candidate_id
 * 返回: CandidateProfile
 */

import type {
  GetCandidateProfileParams,
  GetCandidateProfileResult,
} from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawToCandidateProfile, type RawResume } from './utils/mappers';

export async function get_candidate_profile(params: GetCandidateProfileParams): Promise<GetCandidateProfileResult> {
  try {
    const resumes: RawResume[] = loadData<RawResume[]>('resumes');
    if (!Array.isArray(resumes)) {
      return err('候选人数据暂时不可用。请稍后重试。');
    }

    const resume = resumes.find((r) => r.id === params.candidate_id);
    if (!resume) {
      return err(
        `未找到候选人 ${params.candidate_id}。可能是 ID 有误或数据同步问题。你可以告诉我名字或之前聊过的上下文，我试着帮你回忆。`,
      );
    }

    return ok(rawToCandidateProfile(resume));
  } catch (e) {
    return err(
      `候选人 ${params.candidate_id} 的详细资料暂时拿不到。你可以告诉我名字或之前聊过的上下文，我试着帮你回忆。`,
    );
  }
}
