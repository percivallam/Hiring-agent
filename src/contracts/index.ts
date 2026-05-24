/**
 * HireAgent 契约层统一导出 — index.ts
 *
 * 所有 Agent 跨边界通信的唯一类型入口。
 * 禁止从此文件引用 src/types/*。
 *
 * Owner: 林品臣(Spec Agent)
 */

// ============================================================================
// Tools
// ============================================================================

export type {
  ToolCategory,
  ToolMode,
  ToolMeta,
  ToolResult,
  ParameterField,
  ToolSpec,
  // T1
  ListJobsParams,
  JobSummary,
  ListJobsResult,
  // T2
  GetJobDetailParams,
  JobDetail,
  GetJobDetailResult,
  // T3
  SearchCandidatesParams,
  CandidateSummary,
  SearchCandidatesResult,
  // T4
  GetCandidateProfileParams,
  WorkExperience,
  Project,
  CandidateProfile,
  GetCandidateProfileResult,
  // T5
  CompareCandidatesParams,
  ComparisonItem,
  CompareCandidatesData,
  CompareCandidatesResult,
  // T6
  MarketAnalysisParams,
  MarketDataPoint as ToolMarketDataPoint,
  MarketAnalysisData,
  MarketAnalysisResult,
  // T7
  SalaryBenchmarkParams,
  SalaryBenchmarkEntry,
  SalaryBenchmarkData,
  SalaryBenchmarkResult,
  // T8
  AnalyzePipelineParams,
  PipelineStage,
  PipelineJobSnapshot,
  PipelineAnalysisData,
  AnalyzePipelineResult,
  // T9
  MemoryRecallParams,
  MemoryItem,
  MemoryRecallResult,
  // T10
  MemoryWriteParams,
  MemoryWriteData,
  MemoryWriteResult,
  // T11
  InterviewKitPrepareParams,
  InterviewQuestion,
  InterviewKitData,
  InterviewKitPrepareResult,
  // T12
  GenerateReportParams,
  ReportMetrics,
  ReportFunnelStage,
  ReportData,
  GenerateReportResult,
  // 联合类型
  ToolParams,
} from './tools';

// ============================================================================
// Cards
// ============================================================================

export type {
  CardMode,
  CardAction,
  CardBase,
  // C1
  ListCandidateItem,
  CandidateListCard,
  // C2
  ProfileWorkExperience,
  ProfileProject,
  ProfileInterviewRecord,
  ProfileCard,
  // C3
  CompareDimension,
  ComparisonCard,
  // C4
  JDPipelineStage,
  JDJob,
  JDCard,
  // C5
  ProfileSuggestionDimension,
  JobProfileCard,
  // C6
  MarketDataPoint as CardMarketDataPoint,
  MarketAnalysisCard,
  // C7
  FunnelStageData,
  ReportMetrics as CardReportMetrics,
  PipelineReportCard,
  // C8
  InterviewQuestionCategory,
  InterviewKitCard,
  // C9
  MemoryRecallItem,
  MemoryRecallCard,
  // C10
  ClarificationOption,
  ClarificationCard,
  // 联合类型
  AgentCard,
} from './cards';

// ============================================================================
// Memory
// ============================================================================

export type {
  SessionMemory,
  SessionTurn,
  UserMemory,
  UserActivitySummary,
  CandidateMemory,
  CandidateMemoryProfile,
  CandidateNote,
  NoteStatus,
  InteractionSummary,
  MemoryLayer,
  MemorySnapshot,
} from './memory';

// ============================================================================
// Events
// ============================================================================

export type {
  EventBase,
  UserMessageEvent,
  AgentMessageEvent,
  ToolCallEvent,
  ToolResultEvent,
  LLMRoundEvent,
  ErrorEvent,
  SessionEndEvent,
  SampleClassifiedEvent,
  SampleLabel,
  TrackedEvent,
  ImprovableEvent,
} from './events';

// ============================================================================
// 工具规范常量 — 12 个 ToolSpec 定义
// ============================================================================

import type { ToolSpec } from './tools';

/**
 * 所有工具的 ToolSpec 注册表。
 *
 * Engine Agent 在初始化 Function Calling Loop 时遍历此数组，
 * 将每个 ToolSpec 注入 LLM 的 tool definitions。
 * Tools Agent 在实现时用此数组校验 name/parameters 一致性。
 */
export const TOOL_SPECS: ToolSpec[] = [
  // T1
  {
    name: 'list_jobs',
    description:
      '列出所有在招岗位。HM/HR 查看全局招聘面板时使用。例如："看看我们现在有哪些岗位在招"。支持按部门/状态筛选。',
    parameters: {
      department: { type: 'string', description: '部门筛选，不传 = 全部', required: false },
      status: { type: 'string', description: '状态筛选：open/urgent/closed', required: false, enum: ['open', 'urgent', 'closed'] },
    },
    returns: {
      jobs: { type: 'array', description: '岗位摘要列表（JobSummary[]）' },
    },
    category: 'job',
    mode: 'real',
    fallback_hint: '暂无在招岗位数据，可能是数据源暂时不可用。请先告诉我你想找什么方向的岗位，我用经验给你建议。',
  },
  // T2
  {
    name: 'get_job_detail',
    description:
      '查看某个具体岗位的完整 JD、要求和 Pipeline 进度。HM 想要深入了解某个 HC 时使用。例如："这个前端岗位的具体要求是什么？"。需提供 job_id。',
    parameters: {
      job_id: { type: 'string', description: '岗位 ID', required: true },
    },
    returns: {
      job: { type: 'object', description: '岗位详情（JobDetail）' },
    },
    category: 'job',
    mode: 'real',
    fallback_hint: '这个岗位的详细信息暂时拉不到，可能是 job_id 不对或数据源出问题。你可以告诉我岗位名或方向，我用经验先给你讲讲这个岗通常的要求。',
  },
  // T3
  {
    name: 'search_candidates',
    description:
      '根据关键词搜索匹配候选人。HM 说"找 XXX 方向的人"时用。支持按技能/公司/岗位名搜索，可按工作年限、学历、城市筛选。例如："帮我找几个做推荐系统的"、"3-5 年经验的 Golang 后端"。',
    parameters: {
      query: { type: 'string', description: '搜索关键词（技能/公司/岗位名）', required: true },
      experience_min: { type: 'number', description: '最低工作年限', required: false },
      experience_max: { type: 'number', description: '最高工作年限', required: false },
      education: { type: 'string', description: '学历筛选', required: false },
      location: { type: 'string', description: '城市筛选', required: false },
      limit: { type: 'number', description: '返回上限，默认 10', required: false },
      sort_by_match: { type: 'boolean', description: '按匹配度排序', required: false },
    },
    returns: {
      candidates: { type: 'array', description: '候选人摘要列表（CandidateSummary[]）' },
    },
    category: 'candidate',
    mode: 'real',
    fallback_hint: '我这边搜下来没有完全匹配的，但根据我对这个方向的经验，建议你试试放宽条件，或者换个关键词（比如用技术栈而非岗位名）。我也可以先给你分析一下市场上这类人才的分布情况。',
  },
  // T4
  {
    name: 'get_candidate_profile',
    description:
      '查看某个候选人的完整画像，包括工作经历、项目经验、技能、面试记录和活跃状态。用户点击候选人卡片或说"帮我看看张三的详细资料"时使用。需提供 candidate_id。',
    parameters: {
      candidate_id: { type: 'string', description: '候选人 ID', required: true },
    },
    returns: {
      profile: { type: 'object', description: '候选人完整画像（CandidateProfile）' },
    },
    category: 'candidate',
    mode: 'real',
    fallback_hint: '这位候选人的详细资料暂时拿不到，可能是 candidate_id 有误或数据同步问题。你可以告诉我名字或之前聊过的上下文，我试着帮你回忆。',
  },
  // T5
  {
    name: 'compare_candidates',
    description:
      '对比两个候选人的多维度差异（技能、经验、薪资等），LLM 会基于对比结果生成推荐结论。HM 纠结于"张三和李四选谁"时使用。需提供两个 candidate_id。',
    parameters: {
      candidate_ids: {
        type: 'array',
        description: '两个候选人 ID',
        required: true,
        items: { type: 'string', description: '候选人 ID' },
      },
    },
    returns: {
      comparison: { type: 'object', description: '对比数据（CompareCandidatesData）' },
    },
    category: 'candidate',
    mode: 'real',
    fallback_hint: '对比数据暂时不全，但我可以基于已拿到的部分信息先给你一个初步判断。需要我基于已有信息继续吗？',
  },
  // T6
  {
    name: 'market_analysis',
    description:
      '分析指定岗位的人才市场现状（分布、供需、趋势、竞对）。HM 想了解"市面上的推荐系统工程师好不好招"时使用。需提供岗位关键词和可选城市。',
    parameters: {
      position: { type: 'string', description: '目标岗位关键词', required: true },
      location: { type: 'string', description: '城市', required: false },
    },
    returns: {
      analysis: { type: 'object', description: '市场分析数据（MarketAnalysisData）' },
    },
    category: 'market',
    mode: 'real',
    fallback_hint: '这个方向的详细市场数据暂时不全，但根据我了解的情况，我先给你一个大概判断……',
  },
  // T7
  {
    name: 'salary_benchmark',
    description:
      '查看某岗位的行业薪酬对标数据（不同公司/级别的薪资范围和市场中位数）。HM 准备发 offer 或 HR 定薪时使用。例如："推荐系统工程师 P7 的市场薪资是多少？"。',
    parameters: {
      position: { type: 'string', description: '岗位名称', required: true },
      level: { type: 'string', description: '级别', required: false },
      location: { type: 'string', description: '城市', required: false },
    },
    returns: {
      benchmark: { type: 'object', description: '薪酬对标数据（SalaryBenchmarkData）' },
    },
    category: 'market',
    mode: 'real',
    fallback_hint: '这个岗位的薪酬对标数据暂时不全，我先给你同级别通用行情作为参考。',
  },
  // T8
  {
    name: 'analyze_pipeline',
    description:
      '分析招聘 Pipeline 的整体健康度（各阶段数量 vs 目标、瓶颈识别）。HM 问"招聘进度怎么样了"或 HR 做周报时使用。可选指定 job_id 聚焦单个岗位。',
    parameters: {
      job_id: { type: 'string', description: '可选：只查某个岗位', required: false },
    },
    returns: {
      pipeline: { type: 'object', description: 'Pipeline 分析数据（PipelineAnalysisData）' },
    },
    category: 'pipeline',
    mode: 'real',
    fallback_hint: 'Pipeline 数据暂时拉不到，可能是数据同步延迟。我建议你先告诉我关注哪个岗位或部门，我看看有没有缓存的进度信息。',
  },
  // T9
  {
    name: 'memory_recall',
    description:
      '从记忆层召回相关信息。Engine 在对话开始时自动调用检查是否有历史上下文，或用户说"上次我们聊到张三"时手动触发。支持三层召回：session/user/candidate。',
    parameters: {
      layer: {
        type: 'string',
        description: '召回层级',
        required: true,
        enum: ['session', 'user', 'candidate'],
      },
      query: { type: 'string', description: '查询关键词', required: true },
      candidate_id: { type: 'string', description: '候选人 ID（layer=candidate 时必填）', required: false },
      limit: { type: 'number', description: '返回条数上限', required: false },
    },
    returns: {
      items: { type: 'array', description: '记忆条目列表（MemoryItem[]）' },
    },
    category: 'memory',
    mode: 'real',
    fallback_hint: '暂时没有找到相关的历史记忆，这是第一次聊这个话题。',
  },
  // T10
  {
    name: 'memory_write',
    description:
      '将关键信息写入记忆层。Engine 在对话中发现值得记住的信息时自动调用（用户偏好、候选人备注、决策记录）。例如 HM 说"张三薪资敏感，期望 55k+"时。',
    parameters: {
      layer: {
        type: 'string',
        description: '写入层级',
        required: true,
        enum: ['session', 'user', 'candidate'],
      },
      entity_id: { type: 'string', description: '关联实体 ID', required: false },
      content: { type: 'string', description: '要记住的内容', required: true },
    },
    returns: {
      written: { type: 'object', description: '写入结果（MemoryWriteData）' },
    },
    category: 'memory',
    mode: 'real',
    fallback_hint: undefined,
  },
  // T11
  {
    name: 'interview_kit_prepare',
    description:
      '为特定候选人和岗位生成个性化面试包（面试题 + 面试官建议）。HM 准备面试时使用。这是演示型工具，返回精心构造的 mock 数据。需提供 candidate_id 和 job_id。',
    parameters: {
      candidate_id: { type: 'string', description: '候选人 ID', required: true },
      job_id: { type: 'string', description: '岗位 ID', required: true },
    },
    returns: {
      kit: { type: 'object', description: '面试包数据（InterviewKitData），含 categories/questions/interviewer_notes' },
    },
    category: 'interview',
    mode: 'demo',
    fallback_hint: '面试包暂时生成不了，但我可以先根据岗位要求给你几个方向性建议。',
  },
  // T12
  {
    name: 'generate_report',
    description:
      '生成招聘周报/月报/专项报告，包含指标总览、漏斗和 LLM 洞察。HM 说"给我本周招聘周报"或 HR 做汇报时使用。支持按部门筛选。',
    parameters: {
      report_type: {
        type: 'string',
        description: '报告类型',
        required: true,
        enum: ['weekly', 'monthly', 'ad_hoc'],
      },
      department: { type: 'string', description: '可选：部门筛选', required: false },
    },
    returns: {
      report: { type: 'object', description: '报告数据（ReportData），含 metrics/funnel/insights' },
    },
    category: 'report',
    mode: 'real',
    fallback_hint: '报告暂时生成不出来，可能是数据同步问题。我先给你口头汇总一下我知道的情况。',
  },
];

/**
 * 根据工具名查找 ToolSpec
 */
export function getToolSpec(name: string): ToolSpec | undefined {
  return TOOL_SPECS.find((t) => t.name === name);
}

/**
 * 获取演示型工具列表
 */
export function getDemoTools(): ToolSpec[] {
  return TOOL_SPECS.filter((t) => t.mode === 'demo');
}

/**
 * 获取真实工具列表
 */
export function getRealTools(): ToolSpec[] {
  return TOOL_SPECS.filter((t) => t.mode === 'real');
}
