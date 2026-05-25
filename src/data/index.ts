import type { Candidate, ProfileData } from '@/types';
import resumesRaw from './resumes.json';
import jobsRaw from './jobs.json';
import pipelineRaw from './pipeline.json';
import marketRaw from './market.json';
import salaryRaw from './salary.json';

// ─── 简历数据类型（JSON 中的原始格式） ───
interface ResumeRecord {
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
  careerHistory: { company: string; title: string; period: string; highlights: string[] }[];
  projects: { name: string; description: string; techStack: string[] }[];
  onlinePresence?: { github?: string; blog?: string; linkedin?: string };
  notes: string[];
}

// S2 新结构: { _meta, data: [...] }
const resumes: ResumeRecord[] = (resumesRaw as { _meta: unknown; data: ResumeRecord[] }).data;

// ─── 工具函数 ───

/** 简单的中文分词 + 关键词提取 */
function tokenize(text: string): string[] {
  const normalized = text.toLowerCase();
  const tokens: string[] = [];
  for (const part of normalized.split(/[,，、/()\s]+/)) {
    const trimmed = part.trim();
    if (trimmed) tokens.push(trimmed);
  }
  return tokens;
}

/** 技能同义词映射（支持语义级匹配） */
const SKILL_SYNONYMS: Record<string, string[]> = {
  '推荐系统': ['推荐算法', '推荐引擎', '个性化推荐', 'recommendation', 'ctr预估', '排序模型', '召回', '精排'],
  '大模型': ['llm', '大语言模型', '预训练', 'transformer', 'gpt', '语言模型', 'nlp', '自然语言处理', 'chatgpt'],
  '后端': ['后端开发', '服务端', 'java', 'go', '分布式', '微服务', '高并发'],
  '前端': ['react', 'vue', 'typescript', 'javascript', 'web', 'h5', 'css', 'node.js'],
  '数据工程': ['数据仓库', '数仓', 'etl', 'spark', 'flink', 'hive', '数据平台'],
  '产品经理': ['pm', '产品设计', '产品策划', '策略产品'],
  '广告': ['广告算法', '商业化', 'ctr', 'cvr', '出价', 'dsp', 'ssp'],
  '搜索': ['搜索引擎', '信息检索', '排序', 'query理解', '搜索算法'],
  'devops': ['sre', '运维', 'k8s', 'kubernetes', 'docker', 'cicd', 'terraform'],
  '项目管理': ['tpm', '项目经理', '敏捷', 'scrum', 'pmo'],
  'ui': ['ux', '设计', '交互', '视觉', 'figma', 'sketch'],
  'bsp': ['嵌入式', '驱动开发', '固件', '底层', 'bsp', 'rtos', 'arm', 'iot'],
};

/** 展开查询词的同义词 */
function expandTokens(tokens: string[]): string[] {
  const expanded = [...tokens];
  for (const token of tokens) {
    for (const [key, synonyms] of Object.entries(SKILL_SYNONYMS)) {
      if (token.includes(key) || key.includes(token)) {
        expanded.push(...synonyms);
      }
    }
  }
  return expanded;
}

/** 计算查询与简历的相关性得分 (0-100) */
function computeMatchScore(
  query: string,
  resume: ResumeRecord,
  filters?: { minExperience?: number; skills?: string[]; company?: string }
): number {
  const queryTokens = tokenize(query);
  const expandedTokens = expandTokens(queryTokens);
  let score = 0;

  for (const skill of resume.skills) {
    for (const qt of expandedTokens) {
      if (skill.toLowerCase().includes(qt) || qt.includes(skill.toLowerCase())) {
        score += 40 / Math.max(resume.skills.length, 1);
      }
    }
  }

  for (const qt of expandedTokens) {
    if (resume.currentTitle.toLowerCase().includes(qt)) score += 15;
    if (resume.currentCompany.toLowerCase().includes(qt)) score += 10;
  }

  for (const tag of resume.tags) {
    for (const qt of expandedTokens) {
      if (tag.toLowerCase().includes(qt)) score += 20 / Math.max(resume.tags.length, 1);
    }
  }

  if (filters?.minExperience && resume.experience >= filters.minExperience) {
    score += 10;
  }

  for (const qt of queryTokens) {
    if (resume.education.toLowerCase().includes(qt)) score += 5;
  }

  return Math.min(Math.round(score), 100);
}

/** 提取匹配亮点 */
function extractHighlights(query: string, resume: ResumeRecord): string[] {
  const highlights: string[] = [];
  const qt = tokenize(query);

  for (const skill of resume.skills) {
    for (const q of qt) {
      if (skill.toLowerCase().includes(q)) {
        highlights.push(`技能匹配: ${skill}`);
        break;
      }
    }
  }

  if (highlights.length === 0 && resume.tags.length > 0) {
    return resume.tags.slice(0, 3).map(t => `标签: ${t}`);
  }

  return highlights.slice(0, 3);
}

/** 提取差距点 */
function extractGaps(query: string, resume: ResumeRecord): string[] {
  const gaps: string[] = [];
  const qt = tokenize(query);
  const commonSkills = ['python', 'java', 'go', 'react', 'k8s', 'kubernetes', 'spark', 'flink',
    'tensorflow', 'pytorch', 'nlp', 'cv', '机器学习', '深度学习', '推荐系统'];

  for (const skill of commonSkills) {
    for (const q of qt) {
      if (skill.includes(q) || q.includes(skill)) {
        const hasSkill = resume.skills.some(s => s.toLowerCase().includes(skill));
        if (!hasSkill) {
          gaps.push(`缺少: ${skill}`);
        }
      }
    }
  }

  return gaps.slice(0, 2);
}

// ─── 公共查询接口 ───

/** 搜索候选人 */
export function searchResumes(
  query: string,
  filters?: { minExperience?: number; skills?: string[]; company?: string }
): Candidate[] {
  if (!query || query.trim().length === 0) {
    return [...resumes]
      .sort((a, b) => b.experience - a.experience)
      .map(r => toCandidate(r, 50));
  }

  const results = resumes
    .map(r => ({
      resume: r,
      score: computeMatchScore(query, r, filters),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ resume, score }) => toCandidate(resume, score, query));

  return results;
}

function toCandidate(
  resume: ResumeRecord,
  matchScore: number,
  query?: string
): Candidate {
  const displayStatus = resume.status === 'passive'
    ? 'active' as const
    : resume.status === 'not_interested'
      ? 'active' as const
      : resume.status;

  return {
    id: resume.id,
    name: resume.name,
    avatar: resume.avatar,
    currentCompany: resume.currentCompany,
    currentTitle: resume.currentTitle,
    experience: resume.experience,
    education: resume.education,
    matchScore,
    matchHighlights: query ? extractHighlights(query, resume) : [],
    gapPoints: query ? extractGaps(query, resume) : [],
    tags: resume.tags,
    salary: resume.salary,
    status: displayStatus,
  };
}

/** 获取候选人完整档案 */
export function getResumeById(id: string): ProfileData | undefined {
  const r = resumes.find(r => r.id === id);
  if (!r) return undefined;

  const profileStatus = r.status as 'active' | 'passive' | 'not_interested';

  return {
    id: r.id,
    name: r.name,
    avatar: r.avatar,
    currentCompany: r.currentCompany,
    currentTitle: r.currentTitle,
    experience: r.experience,
    education: r.education,
    location: r.location,
    email: r.email,
    phone: r.phone,
    skills: r.skills,
    careerHistory: r.careerHistory,
    projects: r.projects,
    onlinePresence: r.onlinePresence,
    status: profileStatus,
    lastActive: r.lastActive,
    notes: r.notes,
  };
}

/** 获取所有候选人 ID 列表 */
export function getAllResumeIds(): string[] {
  return resumes.map(r => r.id);
}

// ─── 岗位数据 ───

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  level: string;
  openDays: number;
  targetCount: number;
  description: string;
  requirements?: string[];
  nice_to_have?: string[];
  salary_range?: string;
  status?: 'open' | 'urgent' | 'closed';
}

// S2 新结构: { _meta, data: [...] }
const jobsArr: Job[] = (jobsRaw as { _meta: unknown; data: Job[] }).data;

/** 获取所有岗位 */
export function getJobs(): Job[] {
  return jobsArr;
}

/** 获取单个岗位 */
export function getJobById(id: string): Job | undefined {
  return jobsArr.find(j => j.id === id);
}

// ─── Pipeline 数据 ───

export interface PipelineStage {
  stage: string;
  count: number;
  target: number;
}

export interface PipelineJob {
  jobId: string;
  title: string;
  department: string;
  openDays: number;
  status: 'healthy' | 'at_risk' | 'stuck';
  pipeline: PipelineStage[];
  bottlenecks?: string[];
  weekly_history?: { week: string; date: string; resumes: number; screening_pass_rate: number; notes: string }[];
}

export interface PipelineData {
  jobs: Record<string, PipelineJob>;
  overallSummary: string;
  _meta?: unknown;
}

const pipelineRecord = pipelineRaw as unknown as PipelineData;

/** 获取 Pipeline 数据 */
export function getPipelineData(jobId?: string): PipelineJob[] {
  if (jobId) {
    const job = pipelineRecord.jobs[jobId];
    return job ? [job] : [];
  }
  return Object.values(pipelineRecord.jobs);
}

/** 获取 Pipeline 总览摘要 */
export function getPipelineSummary(): string {
  return pipelineRecord.overallSummary;
}

// ─── 市场数据 ───

export interface MarketAnalysisData {
  totalCandidates: string;
  activeCandidates: string;
  topCompanies: string[];
  cityDistribution: { label: string; value: number }[];
  salaryRange: { p25: number; p50: number; p75: number };
  demandTrend: string;
  avgTimeToHire: string;
  insights: string[];
}

// S2 新结构: { _meta, ...directions }
const marketRecord = marketRaw as Record<string, unknown>;

/** 获取市场分析数据（按角色） */
export function getMarketData(role?: string): MarketAnalysisData | undefined {
  if (!role) {
    const roles = getMarketRoles();
    if (roles.length === 0) return undefined;
    return marketRecord[roles[0]] as MarketAnalysisData;
  }
  return marketRecord[role] as MarketAnalysisData;
}

/** 获取所有可查询的市场角色（排除 _meta） */
export function getMarketRoles(): string[] {
  return Object.keys(marketRecord).filter(k => k !== '_meta');
}

// ─── 薪酬数据 ───

export interface SalaryBenchmarkEntry {
  company: string;
  level: string;
  salaryRange: string;
  median: number;
}

export interface SalaryBenchmarkData {
  position: string;
  benchmarks: SalaryBenchmarkEntry[];
  marketMedian: number;
  recommendation: string;
}

// S2 新结构: { _meta, ...positions }
const salaryRecord = salaryRaw as Record<string, unknown>;

/** 获取薪酬对标数据 */
export function getSalaryBenchmark(role: string): SalaryBenchmarkData | undefined {
  return salaryRecord[role] as SalaryBenchmarkData;
}

/** 获取所有可查询的薪酬角色（排除 _meta） */
export function getSalaryRoles(): string[] {
  return Object.keys(salaryRecord).filter(k => k !== '_meta');
}

// ─── 团队数据 ───

import teamRaw from './team.json';

export interface TeamMember {
  name: string;
  role: string;
  skills: string[];
  level: string;
}

export interface TeamGap {
  skill: string;
  urgency: 'high' | 'medium' | 'low';
  description: string;
}

export interface TeamRecord {
  teamName: string;
  members: TeamMember[];
  gaps: TeamGap[];
  recommendations: string[];
  afterHireSimulation?: {
    candidateName: string;
    improvedSkills: string[];
    newGaps: string[];
  } | null;
}

const teamData = teamRaw as unknown as { teams: Record<string, TeamRecord> };

export function getTeamList(): string[] { return Object.keys(teamData.teams); }
export function getTeamData(teamId: string): TeamRecord | undefined { return teamData.teams[teamId]; }
export function getAllTeams(): Record<string, TeamRecord> { return teamData.teams; }

// ─── 导出 _meta（供 debug / validate 使用） ───

export function getResumesMeta() { return (resumesRaw as { _meta: unknown })._meta; }
export function getJobsMeta() { return (jobsRaw as { _meta: unknown })._meta; }
export function getPipelineMeta() { return (pipelineRaw as unknown as { _meta: unknown })._meta; }
export function getMarketMeta() { return marketRecord._meta; }
export function getSalaryMeta() { return salaryRecord._meta; }
