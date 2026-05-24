/**
 * Mock ToolExecutor — S1 单测用。
 *
 * 实现 ToolExecutor 接口，预设 3 个正常返回的 mock tool，
 * 并提供 register() 让测试按需注入特殊行为（空结果/慢响应/报错）。
 *
 * 对应 S1 spec 第 5 节验收项⑥ "不依赖真实 tool"。
 */

import type { ToolResult, ToolMeta } from '../../contracts/tools';

// ══════════════════════════════════════════
// 接口
// ══════════════════════════════════════════

/** Engine 依赖注入的 ToolExecutor 接口 */
export interface ToolExecutor {
  execute(toolName: string, params: Record<string, unknown>): Promise<ToolResult<unknown>>;
}

/** Mock tool handler 签名 */
export type MockHandler = (params: Record<string, unknown>) => Promise<ToolResult<unknown>>;

// ══════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════

function meta(mode: 'real' | 'demo' = 'demo'): ToolMeta {
  return { mode, latency_ms: 5 };
}

function okResult<T>(data: T, hint?: string): ToolResult<T> {
  return { ok: true, data, meta: meta(), hint };
}

function errResult<T>(hint: string, data?: T): ToolResult<T> {
  return { ok: false, data, meta: meta(), hint };
}

// ══════════════════════════════════════════
// 预设 handlers
// ══════════════════════════════════════════

const searchCandidatesHandler: MockHandler = async (_params) => {
  return okResult([
    {
      id: 'cand_001',
      name: '张三',
      current_company: '字节跳动',
      current_title: '高级推荐算法工程师',
      experience_years: 6,
      education: '硕士',
      match_score: 92,
      match_highlights: ['推荐系统经验丰富', '大规模模型训练'],
      gap_points: ['无 Go 经验'],
      tags: ['推荐系统', '深度学习', '字节'],
      status: 'active' as const,
    },
    {
      id: 'cand_002',
      name: '李四',
      current_company: '美团',
      current_title: '搜索推荐工程师',
      experience_years: 5,
      education: '本科',
      match_score: 85,
      match_highlights: ['搜索+推荐双栖', '工程落地强'],
      gap_points: ['纯工程背景', '无论文'],
      tags: ['搜索', '推荐', '工程'],
      status: 'interview' as const,
    },
    {
      id: 'cand_003',
      name: '王五',
      current_company: '阿里巴巴',
      current_title: '算法专家',
      experience_years: 8,
      education: '博士',
      match_score: 78,
      match_highlights: ['顶会论文', '团队管理经验'],
      gap_points: ['偏学术', '期望薪资偏高'],
      tags: ['算法', '学术', '管理'],
      status: 'active' as const,
    },
  ]);
};

const getCandidateProfileHandler: MockHandler = async (params) => {
  const id = String(params.candidate_id);
  return okResult({
    id,
    name: id === 'cand_001' ? '张三' : '候选人',
    current_company: '字节跳动',
    current_title: '高级推荐算法工程师',
    experience_years: 6,
    education: '硕士',
    location: '北京',
    skills: ['推荐系统', '深度学习', 'Python', 'C++', 'TensorFlow'],
    career: [
      {
        company: '字节跳动',
        title: '高级推荐算法工程师',
        period: '2020-至今',
        highlights: ['负责抖音推荐模型迭代', 'CTR 提升 12%'],
      },
    ],
    projects: [
      { name: '大规模召回系统', description: '基于双塔模型的召回', tech_stack: ['Python', 'TF'] },
    ],
    match_score: 92,
    tags: ['推荐系统', '深度学习'],
    active_status: 'active' as const,
    expected_salary: '55k-70k',
    interview_history: [
      { date: '2026-05-20', feedback: '技术过关，沟通良好', rating: 4 },
    ],
  });
};

const analyzePipelineHandler: MockHandler = async (_params) => {
  return okResult({
    title: '招聘 Pipeline 概览',
    jobs: [
      {
        job_id: 'job_001',
        title: '推荐系统工程师',
        department: '推荐架构',
        open_days: 30,
        status: 'healthy' as const,
        stages: [
          { stage: '简历筛选', count: 15, target: 10 },
          { stage: '初筛通过', count: 8, target: 6 },
          { stage: '面试中', count: 3, target: 4 },
          { stage: 'Offer', count: 1, target: 2 },
          { stage: '入职', count: 0, target: 1 },
        ],
      },
    ],
    summary: '推荐系统岗位 pipeline 健康，面试阶段需要加速。',
  });
};

// ══════════════════════════════════════════
// MockToolExecutor 类
// ══════════════════════════════════════════

export class MockToolExecutor implements ToolExecutor {
  private handlers = new Map<string, MockHandler>();

  constructor() {
    // 预设 3 个正常返回的 tool
    this.handlers.set('search_candidates', searchCandidatesHandler);
    this.handlers.set('get_candidate_profile', getCandidateProfileHandler);
    this.handlers.set('analyze_pipeline', analyzePipelineHandler);
  }

  /** 注册/覆盖一个 tool handler */
  register(name: string, handler: MockHandler): void {
    this.handlers.set(name, handler);
  }

  /** 注销一个 tool handler */
  unregister(name: string): void {
    this.handlers.delete(name);
  }

  async execute(toolName: string, params: Record<string, unknown>): Promise<ToolResult<unknown>> {
    const handler = this.handlers.get(toolName);
    if (!handler) {
      return errResult(`工具 "${toolName}" 未注册，可用工具：${[...this.handlers.keys()].join(', ')}`);
    }
    return handler(params);
  }
}

/**
 * 创建预设的 MockToolExecutor。
 * 包含 search_candidates / get_candidate_profile / analyze_pipeline 三个正常返回的 tool。
 */
export function createMockToolExecutor(): MockToolExecutor {
  return new MockToolExecutor();
}

/**
 * 测试辅助：创建一个永远返回空的 handler（用于 loop_detected 测试）。
 */
export function emptyHandler(): MockHandler {
  return async () => okResult([], '未找到匹配结果');
}

/**
 * 测试辅助：创建一个延时 handler（用于 timeout 测试）。
 */
export function slowHandler(delayMs: number): MockHandler {
  return async () => {
    await new Promise((r) => setTimeout(r, delayMs));
    return okResult([{ id: 'late', name: '迟到数据' }]);
  };
}

/**
 * 测试辅助：创建一个抛错的 handler（用于优雅降级测试）。
 */
export function errorHandler(hint?: string): MockHandler {
  return async () => errResult(hint || '工具执行失败', undefined);
}
