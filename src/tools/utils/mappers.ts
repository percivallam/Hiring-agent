/**
 * 数据映射层 — 原始 JSON (camelCase) ↔ Contracts 类型 (snake_case)
 *
 * Data Agent 未来统一为 snake_case 后，此文件变成空壳或直接透传。
 * 现阶段做精确字段映射，不做通用 camel/snake 递归转换。
 */

import type {
  CandidateSummary,
  CandidateProfile,
  WorkExperience,
  Project as ContractProject,
  JobSummary,
  JobDetail,
  PipelineStage,
  PipelineJobSnapshot,
  PipelineAnalysisData,
  MarketAnalysisData,
  MarketDataPoint,
  SalaryBenchmarkEntry,
  SalaryBenchmarkData,
} from '../../contracts/tools';

// ══════════════════════════════════════════
// 原始 JSON 类型（与现有 data/*.json 严格对照）
// ══════════════════════════════════════════

export interface RawResume {
  id: string;
  name: string;
  avatar: string | null;
  currentCompany: string;
  currentTitle: string;
  experience: number;
  education: string;
  location: string;
  email: string;
  phone: string;
  skills: string[];
  tags: string[];
  salary: string;
  status: 'active' | 'passive' | 'not_interested';
  lastActive: string;
  careerHistory: RawCareer[];
  projects: RawProject[];
  onlinePresence?: { github?: string; blog?: string; linkedin?: string };
  notes: string[];
}

export interface RawCareer {
  company: string;
  title: string;
  period: string;
  highlights: string[];
}

export interface RawProject {
  name: string;
  description: string;
  techStack: string[];
}

export interface RawJob {
  id: string;
  title: string;
  department: string;
  location: string;
  level: string;
  openDays: number;
  targetCount: number;
  description: string;
}

export interface RawPipelineStage {
  stage: string;
  count: number;
  target: number;
}

export interface RawPipelineJob {
  jobId: string;
  title: string;
  department: string;
  openDays: number;
  status: 'healthy' | 'at_risk' | 'stuck';
  pipeline: RawPipelineStage[];
  bottlenecks?: string[];
}

export interface RawPipeline {
  jobs: Record<string, RawPipelineJob>;
  overallSummary: string;
}

export interface RawMarketRole {
  totalCandidates: string;
  activeCandidates: string;
  topCompanies: string[];
  cityDistribution: { label: string; value: number }[];
  salaryRange: { p25: number; p50: number; p75: number };
  demandTrend: string;
  avgTimeToHire: string;
  insights: string[];
}

export interface RawSalaryRole {
  position: string;
  benchmarks: { company: string; level: string; salaryRange: string; median: number }[];
  marketMedian: number;
  recommendation: string;
}

// ══════════════════════════════════════════
// Resume 映射
// ══════════════════════════════════════════

export function rawToCandidateSummary(
  r: RawResume,
  matchScore: number,
  matchHighlights: string[],
  gapPoints: string[],
): CandidateSummary {
  const statusMap: Record<string, 'active' | 'interview' | 'hired' | 'rejected'> = {
    active: 'active',
    passive: 'active',
    not_interested: 'rejected',
  };
  return {
    id: r.id,
    name: r.name,
    current_company: r.currentCompany,
    current_title: r.currentTitle,
    experience_years: r.experience,
    education: r.education,
    match_score: matchScore,
    match_highlights: matchHighlights,
    gap_points: gapPoints,
    tags: r.tags,
    status: statusMap[r.status] ?? 'active',
  };
}

export function rawToCandidateProfile(r: RawResume): CandidateProfile {
  return {
    id: r.id,
    name: r.name,
    current_company: r.currentCompany,
    current_title: r.currentTitle,
    experience_years: r.experience,
    education: r.education,
    location: r.location,
    email: r.email,
    phone: r.phone,
    skills: r.skills,
    career: r.careerHistory.map(rawCareerToWorkExperience),
    projects: r.projects.map(rawProjectToContractProject),
    online_presence: r.onlinePresence
      ? {
          github: r.onlinePresence.github,
          blog: r.onlinePresence.blog,
          linkedin: r.onlinePresence.linkedin,
        }
      : undefined,
    active_status: r.status,
    last_active: r.lastActive,
    expected_salary: r.salary,
    notes: r.notes,
  };
}

function rawCareerToWorkExperience(c: RawCareer): WorkExperience {
  return {
    company: c.company,
    title: c.title,
    period: c.period,
    highlights: c.highlights,
  };
}

function rawProjectToContractProject(p: RawProject): ContractProject {
  return {
    name: p.name,
    description: p.description,
    tech_stack: p.techStack,
  };
}

// ══════════════════════════════════════════
// Job 映射
// ══════════════════════════════════════════

export function rawToJobSummary(
  j: RawJob,
  pipelineCounts: { resume: number; screening: number; interview: number; offer: number; hired: number },
): JobSummary {
  return {
    id: j.id,
    title: j.title,
    department: j.department,
    level: j.level,
    open_days: j.openDays,
    status: 'open',
    pipeline_counts: pipelineCounts,
  };
}

export function rawToJobDetail(
  j: RawJob,
  pipeline: { stage: string; count: number; target: number }[],
  status: 'open' | 'urgent' | 'closed',
): JobDetail {
  return {
    id: j.id,
    title: j.title,
    department: j.department,
    level: j.level,
    description: j.description,
    requirements: [],
    nice_to_have: [],
    salary_range: undefined,
    pipeline,
    open_days: j.openDays,
    status,
  };
}

// ══════════════════════════════════════════
// Pipeline 映射
// ══════════════════════════════════════════

export function rawToPipelineSnapshot(
  job: RawPipelineJob,
): PipelineJobSnapshot {
  return {
    job_id: job.jobId,
    title: job.title,
    department: job.department,
    open_days: job.openDays,
    status: job.status,
    stages: job.pipeline.map((s): PipelineStage => ({
      stage: s.stage,
      count: s.count,
      target: s.target,
    })),
    bottlenecks: job.bottlenecks,
  };
}

export function rawPipelineToAnalysisData(raw: RawPipeline): PipelineAnalysisData {
  const jobs = Object.values(raw.jobs).map(rawToPipelineSnapshot);
  return {
    title: '招聘 Pipeline 概览',
    jobs,
    summary: raw.overallSummary,
  };
}

// ══════════════════════════════════════════
// Market 映射
// ══════════════════════════════════════════

export function rawMarketToAnalysisData(
  roleKey: string,
  role: RawMarketRole,
): MarketAnalysisData {
  const data: MarketDataPoint[] = [];
  if (role.salaryRange) {
    data.push(
      { label: '薪酬 P25', value: role.salaryRange.p25, detail: '万/年' },
      { label: '薪酬 P50', value: role.salaryRange.p50, detail: '万/年' },
      { label: '薪酬 P75', value: role.salaryRange.p75, detail: '万/年' },
    );
  }
  for (const city of role.cityDistribution) {
    data.push({ label: `${city.label}人才占比`, value: city.value, detail: '%' });
  }
  return {
    title: `${roleKey} — 市场分析`,
    analysis_type: 'supply_demand',
    data,
    insights: [
      `人才总量: ${role.totalCandidates}，活跃约 ${role.activeCandidates}`,
      `主要公司: ${role.topCompanies.join('、')}`,
      `需求趋势: ${role.demandTrend}`,
      `平均入职周期: ${role.avgTimeToHire}`,
      ...role.insights,
    ],
  };
}

// ══════════════════════════════════════════
// Salary 映射
// ══════════════════════════════════════════

export function rawSalaryToBenchmarkData(
  role: RawSalaryRole,
): SalaryBenchmarkData {
  return {
    title: `${role.position} — 薪酬对标`,
    position: role.position,
    benchmarks: role.benchmarks.map((b): SalaryBenchmarkEntry => ({
      company: b.company,
      level: b.level,
      salary_range: b.salaryRange,
      median: b.median,
    })),
    market_median: role.marketMedian,
    recommendation: role.recommendation,
  };
}
