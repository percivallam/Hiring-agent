/**
 * HireAgent 工具契约层 — tools.ts
 *
 * 定义 12 个工具的 ToolSpec（Engine 用来做 Function Calling LLM 决策）
 * 和 ToolResult<T>（Tools Agent 实现时返回）。
 *
 * Owner: 林品臣(Spec Agent)
 * Consumers: Engine Agent, Tools Agent
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 工具类别 */
export type ToolCategory = 'job' | 'candidate' | 'market' | 'pipeline' | 'memory' | 'interview' | 'report';

/** 工具运行模式 */
export type ToolMode = 'real' | 'demo';

/** 工具结果元数据 */
export interface ToolMeta {
  /** real = 读 data/*.json；demo = 返回精心 mock 的数据 */
  mode: ToolMode;
  /** 工具执行耗时（毫秒） */
  latency_ms: number;
}

/**
 * 工具结果泛型 — 所有工具必须返回此结构。
 *
 * - ok=true  → data 必有值，hint 可选
 * - ok=false → data 可选，hint 必有（交给 LLM 生成接管话术）
 */
export type ToolResult<T> = {
  ok: boolean;
  data?: T;
  /** 人话接管提示 — 失败时必填（ADR-007），成功时可附带补充说明 */
  hint?: string;
  meta: ToolMeta;
};

/**
 * 工具参数 JSON Schema 字段定义
 *
 * Engine Agent 用它构造 Function Calling 的 parameters 字段，
 * Tools Agent 用它校验入参。
 */
export interface ParameterField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
  /** 嵌套对象的属性定义 */
  properties?: Record<string, ParameterField>;
  /** 数组元素的 schema */
  items?: ParameterField;
}

/**
 * 工具规范 — 每个工具的「身份证」。
 *
 * Engine Agent 在 System Prompt 中注入全部 ToolSpec.description
 * 作为 LLM Function Calling 的 tool description。
 * Tools Agent 在实现时以此校验 name/parameters 一致性。
 *
 * 对应 PRD 3.5.3 工具契约模板。
 */
export interface ToolSpec {
  /** 工具唯一标识，如 "search_candidates" */
  name: string;
  /** LLM 决策的唯一依据 — 必须包含「什么时候用」+「典型例子」（Tools Agent 要求） */
  description: string;
  /** Function Calling 入参 JSON Schema */
  parameters: Record<string, ParameterField>;
  /** 出参 JSON Schema（含 success / fallback_hint 描述） */
  returns: Record<string, ParameterField>;
  category: ToolCategory;
  /** real = 读真实数据；demo = 返回精心 mock 的数据 */
  mode: ToolMode;
  /** 失败时给 LLM 的接管提示 — Tools Agent 在工具失败时自动注入 hint */
  fallback_hint?: string;
}

// ============================================================================
// T1: list_jobs
// ============================================================================

export interface ListJobsParams {
  /** 部门筛选，不传 = 全部 */
  department?: string;
  /** 状态筛选 */
  status?: 'open' | 'urgent' | 'closed';
}

export interface JobSummary {
  id: string;
  title: string;
  department: string;
  level: string;
  open_days: number;
  status: 'open' | 'urgent' | 'closed';
  /** 各阶段候选人数量 */
  pipeline_counts: {
    resume: number;
    screening: number;
    interview: number;
    offer: number;
    hired: number;
  };
}

export type ListJobsResult = ToolResult<JobSummary[]>;

// ============================================================================
// T2: get_job_detail
// ============================================================================

export interface GetJobDetailParams {
  job_id: string;
}

export interface JobDetail {
  id: string;
  title: string;
  department: string;
  level: string;
  /** 岗位 JD 全文 */
  description: string;
  /** 硬性要求 */
  requirements: string[];
  /** 加分项 */
  nice_to_have: string[];
  /** 薪资范围 */
  salary_range?: string;
  /** 当前 pipeline 快照 */
  pipeline: {
    stage: string;
    count: number;
    target: number;
  }[];
  open_days: number;
  status: 'open' | 'urgent' | 'closed';
}

export type GetJobDetailResult = ToolResult<JobDetail>;

// ============================================================================
// T3: search_candidates
// ============================================================================

export interface SearchCandidatesParams {
  /** 搜索关键词（技能 / 公司 / 岗位名） */
  query: string;
  /** 工作年限范围 */
  experience_min?: number;
  experience_max?: number;
  /** 最高学历 */
  education?: string;
  /** 期望城市 */
  location?: string;
  /** 返回数量上限，默认 10 */
  limit?: number;
  /** 按匹配度降序 */
  sort_by_match?: boolean;
}

export interface CandidateSummary {
  id: string;
  name: string;
  current_company: string;
  current_title: string;
  experience_years: number;
  education: string;
  /** 匹配评分 0-100 */
  match_score: number;
  /** 匹配高亮（3 条以内） */
  match_highlights: string[];
  /** 差距点（3 条以内） */
  gap_points: string[];
  tags: string[];
  status: 'active' | 'interview' | 'hired' | 'rejected';
}

export type SearchCandidatesResult = ToolResult<CandidateSummary[]>;

// ============================================================================
// T4: get_candidate_profile
// ============================================================================

export interface GetCandidateProfileParams {
  candidate_id: string;
}

export interface WorkExperience {
  company: string;
  title: string;
  period: string;
  highlights: string[];
}

export interface Project {
  name: string;
  description: string;
  tech_stack: string[];
}

export interface CandidateProfile {
  id: string;
  name: string;
  current_company: string;
  current_title: string;
  experience_years: number;
  education: string;
  location?: string;
  email?: string;
  phone?: string;
  skills: string[];
  /** 工作经历 */
  career: WorkExperience[];
  /** 项目经历 */
  projects: Project[];
  /** 在线足迹 */
  online_presence?: {
    github?: string;
    blog?: string;
    linkedin?: string;
  };
  /** 当前活跃状态 */
  active_status: 'active' | 'passive' | 'not_interested';
  /** 最近活跃时间 */
  last_active?: string;
  /** 期望薪资 */
  expected_salary?: string;
  /** 内部备注 */
  notes?: string[];
  /** 面试记录 */
  interview_history?: {
    date: string;
    feedback: string;
    rating: number;
  }[];
}

export type GetCandidateProfileResult = ToolResult<CandidateProfile>;

// ============================================================================
// T5: compare_candidates
// ============================================================================

export interface CompareCandidatesParams {
  candidate_ids: [string, string];
}

/** 单维度对比 */
export interface ComparisonItem {
  label: string;
  candidate_a: string;
  candidate_b: string;
  /** 优势方 */
  advantage?: 'a' | 'b' | 'neutral';
}

export interface CompareCandidatesData {
  candidate_a: { id: string; name: string };
  candidate_b: { id: string; name: string };
  dimensions: ComparisonItem[];
  /** LLM 生成的推荐结论 — 可空，空时由 Engine 追加 */
  recommendation?: string;
}

export type CompareCandidatesResult = ToolResult<CompareCandidatesData>;

// ============================================================================
// T6: market_analysis
// ============================================================================

export interface MarketAnalysisParams {
  /** 目标岗位关键词 */
  position: string;
  /** 城市 */
  location?: string;
}

export interface MarketDataPoint {
  label: string;
  value: number;
  detail?: string;
}

export interface MarketAnalysisData {
  title: string;
  analysis_type: 'distribution' | 'supply_demand' | 'trend' | 'competitor';
  data: MarketDataPoint[];
  insights: string[];
}

export type MarketAnalysisResult = ToolResult<MarketAnalysisData>;

// ============================================================================
// T7: salary_benchmark
// ============================================================================

export interface SalaryBenchmarkParams {
  position: string;
  level?: string;
  location?: string;
}

export interface SalaryBenchmarkEntry {
  company: string;
  level: string;
  salary_range: string;
  median: number;
}

export interface SalaryBenchmarkData {
  title: string;
  position: string;
  benchmarks: SalaryBenchmarkEntry[];
  market_median: number;
  recommendation: string;
}

export type SalaryBenchmarkResult = ToolResult<SalaryBenchmarkData>;

// ============================================================================
// T8: analyze_pipeline
// ============================================================================

export interface AnalyzePipelineParams {
  /** 可选：只查某个岗位 */
  job_id?: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  target: number;
}

export interface PipelineJobSnapshot {
  job_id: string;
  title: string;
  department: string;
  open_days: number;
  status: 'healthy' | 'at_risk' | 'stuck';
  stages: PipelineStage[];
  bottlenecks?: string[];
}

export interface PipelineAnalysisData {
  title: string;
  jobs: PipelineJobSnapshot[];
  /** LLM 生成的总览洞察 */
  summary: string;
}

export type AnalyzePipelineResult = ToolResult<PipelineAnalysisData>;

// ============================================================================
// T9: memory_recall
// ============================================================================

export interface MemoryRecallParams {
  /** 召回层级 */
  layer: 'session' | 'user' | 'candidate';
  /** 查询关键词 */
  query: string;
  /** 候选人 ID（layer=candidate 时必填） */
  candidate_id?: string;
  /** 返回条数上限 */
  limit?: number;
}

/** 单条记忆条目 */
export interface MemoryItem {
  id: string;
  layer: 'session' | 'user' | 'candidate';
  /** 关联实体 ID */
  entity_id?: string;
  /** 记忆摘要 */
  summary: string;
  /** 原始文本（用于全文匹配） */
  raw: string;
  /** 创建时间戳 */
  created_at: number;
  /** 最近更新时间戳 */
  updated_at: number;
}

export type MemoryRecallResult = ToolResult<MemoryItem[]>;

// ============================================================================
// T10: memory_write
// ============================================================================

export interface MemoryWriteParams {
  layer: 'session' | 'user' | 'candidate';
  /** 关联实体 ID（candidate 层时填 candidate_id） */
  entity_id?: string;
  /** 要记住的内容 */
  content: string;
}

export interface MemoryWriteData {
  id: string;
  layer: 'session' | 'user' | 'candidate';
  entity_id?: string;
  summary: string;
  created_at: number;
}

export type MemoryWriteResult = ToolResult<MemoryWriteData>;

// ============================================================================
// T11: interview_kit_prepare（演示型）
// ============================================================================

export interface InterviewKitPrepareParams {
  candidate_id: string;
  job_id: string;
}

export interface InterviewQuestion {
  category: string;
  questions: {
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    purpose: string;
  }[];
}

export interface InterviewKitData {
  candidate_name: string;
  position: string;
  /** 个性化面试题 */
  categories: InterviewQuestion[];
  /** 面试官建议（根据候选人简历定制） */
  interviewer_notes: string;
}

export type InterviewKitPrepareResult = ToolResult<InterviewKitData>;

// ============================================================================
// T12: generate_report
// ============================================================================

export interface GenerateReportParams {
  /** 报告类型 */
  report_type: 'weekly' | 'monthly' | 'ad_hoc';
  /** 可选：部门筛选 */
  department?: string;
}

export interface ReportMetrics {
  open_positions: number;
  active_candidates: number;
  hired_this_period: number;
  avg_time_to_hire_days: number;
  offer_accept_rate: number;
}

export interface ReportFunnelStage {
  stage: string;
  count: number;
  conversion_rate: number;
}

export interface ReportData {
  title: string;
  period: string;
  metrics: ReportMetrics;
  funnel: ReportFunnelStage[];
  /** LLM 生成的洞察 */
  insights: string[];
}

export type GenerateReportResult = ToolResult<ReportData>;

// ============================================================================
// 联合类型
// ============================================================================

/** 所有工具参数联合 */
export type ToolParams =
  | ListJobsParams
  | GetJobDetailParams
  | SearchCandidatesParams
  | GetCandidateProfileParams
  | CompareCandidatesParams
  | MarketAnalysisParams
  | SalaryBenchmarkParams
  | AnalyzePipelineParams
  | MemoryRecallParams
  | MemoryWriteParams
  | InterviewKitPrepareParams
  | GenerateReportParams;
