/**
 * HireAgent 卡片契约层 — cards.ts
 *
 * 定义 10 类卡片 schema。每张卡片必须支持四态：
 * Loading / 空态(empty) / 错误态(error) / 演示态(demo)
 *
 * 空/错态强制包含 LLM 接管话术字段（ADR-007）。
 * 每张卡片必须声明可触发的下一步动作（actions）。
 *
 * Owner: 林品臣(Spec Agent)
 * Consumers: UI Agent, Engine Agent
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 卡片展示模式 */
export type CardMode = 'loading' | 'empty' | 'error' | 'demo' | 'live';

/** 卡片触发动作 — 用户点击后 UI 发送对应消息 */
export interface CardAction {
  /** 动作显示文本 */
  label: string;
  /** 发送给 Engine 的消息文本 */
  message: string;
  /** 图标标识（Lucide icon name） */
  icon?: string;
  /** 动作类型：primary = 主推，secondary = 次要 */
  variant?: 'primary' | 'secondary';
}

/** 卡片基类 — 所有卡片继承 */
export interface CardBase {
  /** 卡片类型标识 */
  card_type: string;
  /** 卡片标题 */
  title: string;
  /** 当前展示模式 */
  mode: CardMode;
  /** 加载文案（mode=loading 时展示） */
  loading_text?: string;
  /** LLM 生成的空态接管话术（mode=empty 时必填，ADR-007） */
  empty_hint: string;
  /** LLM 生成的错误接管话术（mode=error 时必填，ADR-007） */
  error_hint: string;
  /** 演示数据标识（mode=demo 时 UI 右上角展示，dev mode 可隐藏） */
  is_demo?: boolean;
  /** 可触发的下一步动作 */
  actions: CardAction[];
  /** 时间戳 */
  timestamp: number;
}

// ============================================================================
// C1: 候选人列表卡 — search_candidates 返回
// ============================================================================

export interface ListCandidateItem {
  id: string;
  name: string;
  current_company: string;
  current_title: string;
  experience_years: number;
  match_score: number;
  match_highlights: string[];
  gap_points: string[];
  tags: string[];
  status: 'active' | 'interview' | 'hired' | 'rejected';
}

export interface CandidateListCard extends CardBase {
  card_type: 'candidate_list';
  /** 列表标题（如 "推荐系统工程师 — 匹配候选人"） */
  title: string;
  candidates: ListCandidateItem[];
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可筛选 */
  filterable?: boolean;
}

// ============================================================================
// C2: 候选人画像卡 — get_candidate_profile 返回
// ============================================================================

export interface ProfileWorkExperience {
  company: string;
  title: string;
  period: string;
  highlights: string[];
}

export interface ProfileProject {
  name: string;
  description: string;
  tech_stack: string[];
}

export interface ProfileInterviewRecord {
  date: string;
  feedback: string;
  rating: number;
}

export interface ProfileCard extends CardBase {
  card_type: 'candidate_profile';
  id: string;
  name: string;
  current_company: string;
  current_title: string;
  experience_years: number;
  education: string;
  location?: string;
  skills: string[];
  career: ProfileWorkExperience[];
  projects: ProfileProject[];
  match_score: number;
  tags: string[];
  active_status: 'active' | 'passive' | 'not_interested';
  expected_salary?: string;
  interview_history?: ProfileInterviewRecord[];
}

// ============================================================================
// C3: 候选人对比卡 — compare_candidates 返回
// ============================================================================

export interface CompareDimension {
  label: string;
  candidate_a: string;
  candidate_b: string;
  advantage?: 'a' | 'b' | 'neutral';
}

export interface ComparisonCard extends CardBase {
  card_type: 'comparison';
  candidate_a: { id: string; name: string };
  candidate_b: { id: string; name: string };
  dimensions: CompareDimension[];
  /** LLM 生成的推荐结论 */
  recommendation?: string;
}

// ============================================================================
// C4: 岗位卡 — list_jobs / get_job_detail 返回
// ============================================================================

export interface JDPipelineStage {
  stage: string;
  count: number;
  target: number;
}

export interface JDJob {
  id: string;
  title: string;
  department: string;
  level: string;
  description: string;
  requirements: string[];
  nice_to_have: string[];
  salary_range?: string;
  pipeline: JDPipelineStage[];
  open_days: number;
  status: 'open' | 'urgent' | 'closed';
}

export interface JDCard extends CardBase {
  card_type: 'job_detail';
  job: JDJob;
  /** 是否已发布 */
  is_published: boolean;
}

// ============================================================================
// C5: 岗位画像建议卡 — DSP-1 新 HC 接管（岗位在库中不存在时）
// ============================================================================

export interface ProfileSuggestionDimension {
  name: string;
  importance: 'critical' | 'important' | 'nice_to_have';
  suggestion: string;
}

export interface JobProfileCard extends CardBase {
  card_type: 'job_profile';
  /** 用户输入的岗位名称（可能在库中不存在） */
  requested_title: string;
  /** LLM 基于领域知识生成的需求画像 */
  profile_suggestions: ProfileSuggestionDimension[];
  /** LLM 生成的搜索策略建议 */
  search_strategy: string;
  /** 匹配到的相近岗位（可为空数组） */
  similar_jobs: { id: string; title: string; department: string }[];
}

// ============================================================================
// C6: 市场分析卡 — market_analysis 返回
// ============================================================================

export interface MarketDataPoint {
  label: string;
  value: number;
  detail?: string;
}

export interface MarketAnalysisCard extends CardBase {
  card_type: 'market_analysis';
  position: string;
  analysis_type: 'distribution' | 'supply_demand' | 'trend' | 'competitor';
  data: MarketDataPoint[];
  insights: string[];
  /** 建议图表类型 */
  chart_type?: 'bar' | 'pie' | 'trend' | 'map';
}

// ============================================================================
// C7: 漏斗/周报卡 — DSP-5 (analyze_pipeline / generate_report)
// ============================================================================

export interface FunnelStageData {
  stage: string;
  count: number;
  conversion_rate: number;
}

export interface ReportMetrics {
  open_positions: number;
  active_candidates: number;
  hired_this_period: number;
  avg_time_to_hire_days: number;
  offer_accept_rate: number;
}

export interface PipelineReportCard extends CardBase {
  card_type: 'pipeline_report';
  report_type: 'weekly' | 'monthly' | 'ad_hoc';
  period: string;
  metrics: ReportMetrics;
  funnel: FunnelStageData[];
  insights: string[];
  /** 异常岗位（状态 stuck / at_risk） */
  alerts?: {
    job_id: string;
    title: string;
    status: 'at_risk' | 'stuck';
    reason: string;
  }[];
}

// ============================================================================
// C8: 面试包卡 — DSP-4 (interview_kit_prepare)
// ============================================================================

export interface InterviewQuestionCategory {
  category: string;
  questions: {
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    purpose: string;
  }[];
}

export interface InterviewKitCard extends CardBase {
  card_type: 'interview_kit';
  candidate_name: string;
  position: string;
  categories: InterviewQuestionCategory[];
  interviewer_notes: string;
  /** 是否包含模拟面试入口 */
  has_mock_interview?: boolean;
}

// ============================================================================
// C9: 记忆唤醒卡 — DSP-3 (memory_recall)
// ============================================================================

export interface MemoryRecallItem {
  id: string;
  layer: 'session' | 'user' | 'candidate';
  summary: string;
  created_at: number;
  updated_at: number;
}

export interface MemoryRecallCard extends CardBase {
  card_type: 'memory_recall';
  /** 唤醒的上下文（如："这是您第二次提及张三"） */
  recall_context: string;
  items: MemoryRecallItem[];
}

// ============================================================================
// C10: 引导/澄清卡 — Engine 检测到意图模糊时
// ============================================================================

export interface ClarificationOption {
  label: string;
  message: string;
  icon?: string;
}

export interface ClarificationCard extends CardBase {
  card_type: 'clarification';
  /** 引导文案 */
  prompt: string;
  options: ClarificationOption[];
}

// ============================================================================
// 卡片联合类型
// ============================================================================

export type AgentCard =
  | CandidateListCard
  | ProfileCard
  | ComparisonCard
  | JDCard
  | JobProfileCard
  | MarketAnalysisCard
  | PipelineReportCard
  | InterviewKitCard
  | MemoryRecallCard
  | ClarificationCard;
