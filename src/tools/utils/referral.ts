import referralsRaw from '../../data/referrals.json';

export interface ReferralRecord {
  id: string; candidate_id: string; candidate_name: string;
  referrer_name: string; referrer_title: string; relationship: string;
  recommendation: string; date: string; status: string;
}

function getReferrals(): ReferralRecord[] {
  const raw = referralsRaw as unknown as { referrals?: ReferralRecord[] };
  return raw.referrals ?? [];
}

export function getReferralsForCandidate(id: string): ReferralRecord[] {
  return getReferrals().filter(r => r.candidate_id === id);
}

export function formatReferralNote(r: ReferralRecord): string {
  return `[内推] ${r.referrer_name}(${r.referrer_title}) 推荐，${r.relationship}。${r.recommendation.slice(0, 80)}… 状态: ${r.status}`;
}
