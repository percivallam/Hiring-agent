/**
 * 数据映射层 — 原始 JSON (camelCase) ↔ Contracts 类型 (snake_case)
 */

import type {
  CandidateSummary, CandidateProfile,
  JobSummary, JobDetail,
  PipelineJobSnapshot, PipelineAnalysisData,
  MarketAnalysisData, MarketDataPoint,
  SalaryBenchmarkData,
} from '../../contracts/tools';

// Raw types

export interface RawResume {
  id: string; name: string; avatar: string | null;
  currentCompany: string; currentTitle: string; experience: number;
  education: string; location: string; email: string; phone: string;
  skills: string[]; tags: string[]; salary: string;
  status: 'active' | 'passive' | 'not_interested'; lastActive: string;
  careerHistory: RawCareer[]; projects: RawProject[];
  onlinePresence?: { github?: string; blog?: string; linkedin?: string };
  notes: string[];
}
export interface RawCareer { company: string; title: string; period: string; highlights: string[]; }
export interface RawProject { name: string; description: string; techStack: string[]; }
export interface RawJob {
  id: string; title: string; department: string; location: string;
  level: string; openDays: number; targetCount: number; description: string;
}
export interface RawPipelineStage { stage: string; count: number; target: number; }

export interface WeeklyHistoryEntry {
  week: string; date: string; resumes: number;
  screening_pass_rate: number; notes: string;
}

export interface RawPipelineJob {
  jobId: string; title: string; department: string; openDays: number;
  status: 'healthy' | 'at_risk' | 'stuck';
  pipeline: RawPipelineStage[]; bottlenecks?: string[];
  weekly_history?: WeeklyHistoryEntry[];
}

export interface RawPipeline { jobs: Record<string, RawPipelineJob>; overallSummary: string; }
export interface RawMarketRole {
  totalCandidates: string; activeCandidates: string; topCompanies: string[];
  cityDistribution: { label: string; value: number }[];
  salaryRange: { p25: number; p50: number; p75: number };
  demandTrend: string; avgTimeToHire: string; insights: string[];
}
export interface RawSalaryRole {
  position: string;
  benchmarks: { company: string; level: string; salaryRange: string; median: number }[];
  marketMedian: number; recommendation: string;
}

// Resume mappers

export function rawToCandidateSummary(r: RawResume, matchScore: number, matchHighlights: string[], gapPoints: string[]): CandidateSummary {
  const sm: Record<string, 'active'|'interview'|'hired'|'rejected'> = { active:'active', passive:'active', not_interested:'rejected' };
  return { id:r.id, name:r.name, current_company:r.currentCompany, current_title:r.currentTitle, experience_years:r.experience, education:r.education, match_score:matchScore, match_highlights:matchHighlights, gap_points:gapPoints, tags:r.tags, status:sm[r.status]??'active' };
}

export function rawToCandidateProfile(r: RawResume): CandidateProfile {
  return {
    id:r.id, name:r.name, current_company:r.currentCompany, current_title:r.currentTitle,
    experience_years:r.experience, education:r.education, location:r.location,
    email:r.email, phone:r.phone, skills:r.skills,
    career:r.careerHistory.map(c=>({company:c.company,title:c.title,period:c.period,highlights:c.highlights})),
    projects:r.projects.map(p=>({name:p.name,description:p.description,tech_stack:p.techStack})),
    online_presence:r.onlinePresence?{github:r.onlinePresence.github,blog:r.onlinePresence.blog,linkedin:r.onlinePresence.linkedin}:undefined,
    active_status:r.status, last_active:r.lastActive, expected_salary:r.salary, notes:r.notes,
  };
}

// Job mappers

export function rawToJobSummary(j: RawJob, pc: {resume:number;screening:number;interview:number;offer:number;hired:number}): JobSummary {
  return { id:j.id, title:j.title, department:j.department, level:j.level, open_days:j.openDays, status:'open', pipeline_counts:pc };
}

export function rawToJobDetail(j: RawJob, pipeline: {stage:string;count:number;target:number}[], status:'open'|'urgent'|'closed'): JobDetail {
  return { id:j.id, title:j.title, department:j.department, level:j.level, description:j.description, requirements:[], nice_to_have:[], salary_range:undefined, pipeline, open_days:j.openDays, status };
}

// Pipeline mappers

export function rawToPipelineSnapshot(job: RawPipelineJob): PipelineJobSnapshot {
  return { job_id:job.jobId, title:job.title, department:job.department, open_days:job.openDays, status:job.status, stages:job.pipeline.map(s=>({stage:s.stage,count:s.count,target:s.target})), bottlenecks:job.bottlenecks };
}

export function rawPipelineToAnalysisData(raw: RawPipeline): PipelineAnalysisData {
  return { title:'招聘 Pipeline 概览', jobs:Object.values(raw.jobs).map(rawToPipelineSnapshot), summary:raw.overallSummary };
}

export function extractTrend(job: RawPipelineJob): { weeks:string[]; rates:number[]; trend:'up'|'down'|'flat'; detail:string } | null {
  const wh = job.weekly_history;
  if (!wh || wh.length < 2) return null;
  const weeks = wh.map(w=>w.week);
  const rates = wh.map(w=>Math.round(w.screening_pass_rate*100));
  const first = rates[0], last = rates[rates.length-1];
  const trend:'up'|'down'|'flat' = last>first?'up':last<first?'down':'flat';
  return { weeks, rates, trend, detail:`近 ${wh.length} 周通过率: ${rates.join('% → ')}%` };
}

// Market mappers

export function rawMarketToAnalysisData(roleKey: string, role: RawMarketRole): MarketAnalysisData {
  const data: MarketDataPoint[] = [];
  if (role.salaryRange) data.push({label:'薪酬 P25',value:role.salaryRange.p25,detail:'万/年'},{label:'薪酬 P50',value:role.salaryRange.p50,detail:'万/年'},{label:'薪酬 P75',value:role.salaryRange.p75,detail:'万/年'});
  for (const city of role.cityDistribution) data.push({label:`${city.label}人才占比`,value:city.value,detail:'%'});
  return { title:`${roleKey} — 市场分析`, analysis_type:'supply_demand', data, insights:[`人才总量: ${role.totalCandidates}，活跃约 ${role.activeCandidates}`,`主要公司: ${role.topCompanies.join('、')}`,`需求趋势: ${role.demandTrend}`,`平均入职周期: ${role.avgTimeToHire}`,...role.insights] };
}

// Salary mappers

export function rawSalaryToBenchmarkData(role: RawSalaryRole): SalaryBenchmarkData {
  return { title:`${role.position} — 薪酬对标`, position:role.position, benchmarks:role.benchmarks.map(b=>({company:b.company,level:b.level,salary_range:b.salaryRange,median:b.median})), market_median:role.marketMedian, recommendation:role.recommendation };
}
