import type { GetCandidateProfileParams, GetCandidateProfileResult } from '../contracts/tools';
import { loadData, ok, err } from './utils/loadData';
import { rawToCandidateProfile, type RawResume } from './utils/mappers';
import { getReferralsForCandidate, formatReferralNote } from './utils/referral';

export async function get_candidate_profile(params: GetCandidateProfileParams): Promise<GetCandidateProfileResult> {
  try {
    const resumes: RawResume[] = loadData<RawResume[]>('resumes');
    if (!Array.isArray(resumes)) return err('候选人数据暂时不可用。');

    const resume = resumes.find(r => r.id === params.candidate_id);
    if (!resume) return err(`未找到候选人 ${params.candidate_id}。`);

    const profile = rawToCandidateProfile(resume);

    // 注入内推信息到 notes
    const referrals = getReferralsForCandidate(params.candidate_id);
    if (referrals.length > 0) {
      const refNotes = referrals.map(formatReferralNote);
      profile.notes = [...(profile.notes || []), ...refNotes];
    }

    return ok(profile);
  } catch (e) {
    return err(`候选人 ${params.candidate_id} 的详细资料暂时拿不到。`);
  }
}
