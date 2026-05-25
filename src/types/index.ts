export type UserRole = 'hm' | 'hr' | 'candidate';

export type MessageType = 
  | 'text' 
  | 'candidate_card' 
  | 'candidate_list' 
  | 'analytics' 
  | 'jd_card' 
  | 'evaluation' 
  | 'quick_actions' 
  | 'timeline' 
  | 'thinking'
  // 新增类型
  | 'profile_card'        // 人才档案（特定人查找、简历调取、动态追踪）
  | 'comparison'          // 对比分析（候选人对比、历史录用对标）
  | 'risk_analysis'       // 风险分析
  | 'interview_questions' // 面试题推荐
  | 'market_analysis'     // 市场分析（分布、供需、趋势）
  | 'salary_benchmark'    // 薪酬对标
  | 'pipeline_overview'   // Pipeline/进度总览
  | 'schedule_card'       // 面试排程
  | 'offer_package'       // Offer方案 / Sell方案
  | 'team_diagnosis'      // 团队诊断 / HC规划 / 招聘影响模拟
  | 'onboarding_plan'     // 入职计划
  | 'network_graph'       // 人脉关系
  | 'message_template';   // 消息模板（拒信、沟通函等）

export interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: number;
}

export interface TextMessage extends BaseMessage {
  type: 'text';
  role: 'user' | 'agent';
  content: string;
}

export interface Candidate {
  id: string;
  name: string;
  avatar: string | null;
  currentCompany: string;
  currentTitle: string;
  experience: number;
  education: string;
  matchScore: number;
  matchHighlights: string[];
  gapPoints: string[];
  tags: string[];
  salary?: string;
  status: 'active' | 'interview' | 'hired' | 'rejected';
}

export interface CandidateCardMessage extends BaseMessage {
  type: 'candidate_card';
  data: Candidate;
  actions?: ('view_resume' | 'shortlist' | 'reject' | 'schedule_interview')[];
}

export interface CandidateListMessage extends BaseMessage {
  type: 'candidate_list';
  title: string;
  candidates: Candidate[];
  sortable?: boolean;
  filterable?: boolean;
}

export type ChartType = 'funnel' | 'trend' | 'pie' | 'bar' | 'metric_grid';

export interface AnalyticsMessage extends BaseMessage {
  type: 'analytics';
  chartType: ChartType;
  title: string;
  data: any;
  insights?: string;
}

export interface JDCardMessage extends BaseMessage {
  type: 'jd_card';
  title: string;
  content: string;
  status: 'draft' | 'published';
  actions?: ('edit' | 'publish' | 'copy')[];
}

export interface EvaluationDimension {
  name: string;
  score: number;
  comment: string;
}

export type Rating = 'strong_hire' | 'hire' | 'lean_hire' | 'lean_no' | 'no_hire';

export interface EvaluationMessage extends BaseMessage {
  type: 'evaluation';
  candidateName: string;
  dimensions: EvaluationDimension[];
  overallRating: Rating;
  summary: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  message: string;
}

export interface QuickActionsMessage extends BaseMessage {
  type: 'quick_actions';
  title: string;
  actions: QuickAction[];
}

export interface TimelineStage {
  name: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  note?: string;
}

export interface TimelineMessage extends BaseMessage {
  type: 'timeline';
  candidateName: string;
  stages: TimelineStage[];
}

export interface ThinkingMessage extends BaseMessage {
  type: 'thinking';
  steps: string[];
  currentStep: number;
}

// ========== 新增类型定义 ==========

// 人才档案（用于特定人查找、简历调取、动态追踪）
export interface ProfileData {
  id: string;
  name: string;
  avatar: string | null;
  currentCompany: string;
  currentTitle: string;
  experience: number;
  education: string;
  location?: string;
  email?: string;
  phone?: string;
  skills: string[];
  careerHistory: {
    company: string;
    title: string;
    period: string;
    highlights: string[];
  }[];
  projects: {
    name: string;
    description: string;
    techStack: string[];
  }[];
  onlinePresence?: {
    github?: string;
    blog?: string;
    linkedin?: string;
  };
  status?: 'active' | 'passive' | 'not_interested';
  lastActive?: string;
  notes?: string[];
}

export interface ProfileCardMessage extends BaseMessage {
  type: 'profile_card';
  data: ProfileData;
  actions?: ('view_resume' | 'reach_out' | 'save' | 'track')[];
}

// 对比分析
export interface ComparisonItem {
  label: string;
  candidateA: string;
  candidateB: string;
  advantage?: 'A' | 'B' | 'neutral';
}

export interface ComparisonMessage extends BaseMessage {
  type: 'comparison';
  title: string;
  candidateA: { name: string; avatar?: string | null };
  candidateB: { name: string; avatar?: string | null };
  items: ComparisonItem[];
  recommendation?: string;
}

// 风险分析
export interface RiskItem {
  category: string;
  level: 'high' | 'medium' | 'low';
  description: string;
  suggestion?: string;
}

export interface RiskAnalysisMessage extends BaseMessage {
  type: 'risk_analysis';
  candidateName: string;
  risks: RiskItem[];
  overallRisk: 'high' | 'medium' | 'low';
  summary: string;
}

// 面试题推荐
export interface InterviewQuestion {
  category: string;
  questions: {
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    purpose: string;
  }[];
}

export interface InterviewQuestionsMessage extends BaseMessage {
  type: 'interview_questions';
  candidateName: string;
  position: string;
  categories: InterviewQuestion[];
}

// 市场分析
export interface MarketDataPoint {
  label: string;
  value: number;
  detail?: string;
}

export interface MarketAnalysisMessage extends BaseMessage {
  type: 'market_analysis';
  title: string;
  analysisType: 'distribution' | 'supply_demand' | 'trend' | 'competitor';
  data: MarketDataPoint[] | any;
  insights: string[];
  chartType?: 'bar' | 'pie' | 'trend' | 'map';
}

// 薪酬对标
export interface SalaryBenchmarkMessage extends BaseMessage {
  type: 'salary_benchmark';
  title: string;
  position: string;
  benchmarks: {
    company: string;
    level: string;
    salaryRange: string;
    median: number;
  }[];
  marketMedian: number;
  recommendation: string;
}

// Pipeline 总览
export interface PipelineJob {
  jobId: string;
  title: string;
  department: string;
  openDays: number;
  status: 'healthy' | 'at_risk' | 'stuck';
  pipeline: {
    stage: string;
    count: number;
    target: number;
  }[];
  bottlenecks?: string[];
}

export interface PipelineOverviewMessage extends BaseMessage {
  type: 'pipeline_overview';
  title: string;
  jobs: PipelineJob[];
  summary: string;
}

// 面试排程
export interface ScheduleSlot {
  date: string;
  time: string;
  interviewer: string;
  type: string;
  available: boolean;
}

export interface ScheduleCardMessage extends BaseMessage {
  type: 'schedule_card';
  candidateName: string;
  position: string;
  suggestedSlots: ScheduleSlot[];
  notes?: string;
}

// Offer 方案
export interface OfferComponent {
  name: string;
  value: string;
  note?: string;
}

export interface OfferPackageMessage extends BaseMessage {
  type: 'offer_package';
  candidateName: string;
  position: string;
  components: OfferComponent[];
  totalValue: string;
  competitiveness: 'above_market' | 'market' | 'below_market';
  sellPoints: string[];
  risks?: string[];
}

// 团队诊断
export interface TeamMember {
  name: string;
  role: string;
  skills: string[];
  level: string;
}

export interface TeamDiagnosisMessage extends BaseMessage {
  type: 'team_diagnosis';
  teamName: string;
  members: TeamMember[];
  gaps: {
    skill: string;
    urgency: 'high' | 'medium' | 'low';
    description: string;
  }[];
  recommendations: string[];
  afterHireSimulation?: {
    candidateName: string;
    improvedSkills: string[];
    newGaps: string[];
  };
}

// 入职计划
export interface OnboardingTask {
  day: string;
  tasks: {
    title: string;
    owner: string;
    type: 'hr' | 'manager' | 'buddy' | 'self';
  }[];
}

export interface OnboardingPlanMessage extends BaseMessage {
  type: 'onboarding_plan';
  candidateName: string;
  position: string;
  startDate: string;
  plan: OnboardingTask[];
  milestones: string[];
}

// 人脉关系
export interface NetworkNode {
  id: string;
  name: string;
  relation: string;
  company: string;
  connectionStrength: number; // 1-10
}

export interface NetworkGraphMessage extends BaseMessage {
  type: 'network_graph';
  centerPerson: string;
  connections: NetworkNode[];
  insights: string[];
}

// 消息模板（拒信、sell方案等）
export interface MessageTemplateMessage extends BaseMessage {
  type: 'message_template';
  templateType: 'rejection' | 'sell' | 'reach_out' | 'reminder' | 'offer';
  subject?: string;
  content: string;
  recipient: string;
  tone: 'warm' | 'professional' | 'formal';
  editable: boolean;
}

// ========== 消息联合类型 ==========

export type Message = 
  | TextMessage 
  | CandidateCardMessage 
  | CandidateListMessage 
  | AnalyticsMessage 
  | JDCardMessage 
  | EvaluationMessage 
  | QuickActionsMessage 
  | TimelineMessage 
  | ThinkingMessage
  | ProfileCardMessage
  | ComparisonMessage
  | RiskAnalysisMessage
  | InterviewQuestionsMessage
  | MarketAnalysisMessage
  | SalaryBenchmarkMessage
  | PipelineOverviewMessage
  | ScheduleCardMessage
  | OfferPackageMessage
  | TeamDiagnosisMessage
  | OnboardingPlanMessage
  | NetworkGraphMessage
  | MessageTemplateMessage;

export interface Session {
  id: string;
  title: string;
  timestamp: number;
  pinned?: boolean;
  role: UserRole;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  level: string;
  openDays: number;
  pipeline: {
    resume: number;
    screening: number;
    interview: number;
    offer: number;
    hired: number;
  };
  status: 'open' | 'urgent' | 'closed';
}

export interface AnalyticsData {
  funnel: {
    stages: string[];
    values: number[];
    conversionRates: string[];
  };
  metrics: {
    openPositions: number;
    activeCandidates: number;
    hiredThisMonth: number;
    avgTimeToHire: number;
  };
  trendData: {
    month: string;
    hires: number;
    offers: number;
  }[];
}

export interface ConversationRule {
  keywords: string[];
  role?: UserRole;
  response: Omit<Message, 'id' | 'timestamp'>[];
  delay?: number;
  thinkingSteps?: string[];
}
