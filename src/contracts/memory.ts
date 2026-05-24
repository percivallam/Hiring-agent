/**
 * HireAgent 记忆契约层 — memory.ts
 *
 * 定义三层记忆 schema（ADR-003: JSON + LLM 摘要，不上向量数据库）。
 *
 * Layer 1 — SessionMemory: 会话级，当前对话上下文
 * Layer 2 — UserMemory:   跨会话用户级，HM/HR 的偏好与习惯
 * Layer 3 — CandidateMemory: 跨会话候选人级，候选人画像沉淀
 *
 * Owner: 林品臣(Spec Agent)
 * Consumers: Engine Agent, UI Agent(C9 记忆唤醒卡)
 */

// ============================================================================
// L1: 会话级记忆
// ============================================================================

/** 会话记忆 — 存活于单次对话生命周期 */
export interface SessionMemory {
  /** 会话 ID */
  session_id: string;
  /** 用户角色 */
  role: 'hm' | 'hr' | 'candidate';
  /** 当前对话上下文（最近 N 轮） */
  turns: SessionTurn[];
  /** 当前焦点（正在看的岗位/候选人/报告） */
  focus?: {
    type: 'job' | 'candidate' | 'report' | 'pipeline';
    entity_id: string;
  };
  /** 待确认事项 */
  pending_confirmations: {
    question: string;
    context: string;
  }[];
  /** 会话创建时间 */
  created_at: number;
}

/** 单轮对话 */
export interface SessionTurn {
  role: 'user' | 'agent';
  content: string;
  /** 工具调用记录（若有） */
  tool_calls?: {
    tool_name: string;
    params: Record<string, unknown>;
  }[];
  /** 卡片渲染记录（若有） */
  cards_rendered?: string[];
  timestamp: number;
}

// ============================================================================
// L2: 跨会话用户级记忆
// ============================================================================

/** 用户记忆 — 跨会话持久化（localStorage + JSON 文件） */
export interface UserMemory {
  /** 用户 ID */
  user_id: string;
  /** 用户角色 */
  role: 'hm' | 'hr' | 'candidate';
  /** 偏好岗位方向 */
  preferred_directions: string[];
  /** 偏好部门 */
  preferred_departments: string[];
  /** 风格偏好 */
  preferences: {
    /** 报告详细程度 */
    detail_level?: 'concise' | 'detailed';
    /** 对比偏好维度 */
    compare_focus?: string[];
    /** 个性化备注 */
    notes?: string;
  };
  /** 最近操作摘要 */
  recent_activity: UserActivitySummary[];
  /** 记忆更新时间 */
  updated_at: number;
}

/** 用户操作摘要 */
export interface UserActivitySummary {
  action: string;
  entity_type?: 'job' | 'candidate' | 'report';
  entity_id?: string;
  summary: string;
  timestamp: number;
}

// ============================================================================
// L3: 跨会话候选人级记忆
// ============================================================================

/** 候选人记忆 — 跨会话持久化，候选人的完整信息沉淀 */
export interface CandidateMemory {
  /** 候选人 ID */
  candidate_id: string;
  /** 基础信息 */
  profile: CandidateMemoryProfile;
  /** 关键标签（LLM 提取） */
  key_tags: string[];
  /** 关键注意事项（如 "薪资敏感"、"正在比较其他 offer"） */
  key_notes: CandidateNote[];
  /** 交互历史摘要 */
  interaction_summary: InteractionSummary[];
  /** 记忆更新时间 */
  updated_at: number;
}

export interface CandidateMemoryProfile {
  name: string;
  current_company: string;
  current_title: string;
  experience_years: number;
  education: string;
  skills: string[];
  location?: string;
}

/**
 * 备注状态：
 * - confirmed: 已确认
 * - conflict: 与已有记忆冲突，待用户确认
 * - archived: 已过期归档
 */
export type NoteStatus = 'confirmed' | 'conflict' | 'archived';

/** 关键备注 — DSP-3 故事点的数据载体 */
export interface CandidateNote {
  /** 备注内容，如 "薪资敏感，现薪资 45k，期望 55k+" */
  content: string;
  /** 来源（用户输入 / LLM 提取 / 系统记录） */
  source: 'user' | 'llm' | 'system';
  /** 记录时间 */
  created_at: number;
  /** 备注状态（PRD 3.4.2：冲突解决 + 过期机制） */
  status: NoteStatus;
  /** 过期时间戳（30 天无更新自动归档，null = 永不过期） */
  expires_at?: number;
}

/** 交互摘要 */
export interface InteractionSummary {
  /** 交互类型 */
  type: 'search' | 'profile_view' | 'compare' | 'interview' | 'offer' | 'note';
  /** 摘要 */
  summary: string;
  /** 交互时间 */
  timestamp: number;
}

// ============================================================================
// 联合类型
// ============================================================================

export type MemoryLayer = 'session' | 'user' | 'candidate';

export type MemorySnapshot = SessionMemory | UserMemory | CandidateMemory;
