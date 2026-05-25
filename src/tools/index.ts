/**
 * 工具层 — RealToolExecutor + TOOL_REGISTRY
 *
 * 实现 Engine 的 ToolExecutor 接口，将 12 个真实工具注入 Function Calling Loop。
 * 每个工具文件返回 contracts 的 ToolResult<T>，Executor 透传。
 */

import type { ToolResult } from '../contracts/tools';
import type { ToolExecutor } from '../engine/__mocks__/mockTools';

import { list_jobs } from './list_jobs';
import { get_job_detail } from './get_job_detail';
import { search_candidates } from './search_candidates';
import { get_candidate_profile } from './get_candidate_profile';
import { compare_candidates } from './compare_candidates';
import { market_analysis } from './market_analysis';
import { salary_benchmark } from './salary_benchmark';
import { analyze_pipeline } from './analyze_pipeline';
import { memory_recall } from './memory_recall';
import { memory_write } from './memory_write';
import { interview_kit_prepare } from './interview_kit_prepare';
import { generate_report } from './generate_report';

// ══════════════════════════════════════════
// 工具函数签名
// ══════════════════════════════════════════

type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult<unknown>>;

// ══════════════════════════════════════════
// TOOL_REGISTRY — 12 工具全注册
// ══════════════════════════════════════════

export const TOOL_REGISTRY: Record<string, ToolHandler> = {
  list_jobs: list_jobs as unknown as ToolHandler,
  get_job_detail: get_job_detail as unknown as ToolHandler,
  search_candidates: search_candidates as unknown as ToolHandler,
  get_candidate_profile: get_candidate_profile as unknown as ToolHandler,
  compare_candidates: compare_candidates as unknown as ToolHandler,
  market_analysis: market_analysis as unknown as ToolHandler,
  salary_benchmark: salary_benchmark as unknown as ToolHandler,
  analyze_pipeline: analyze_pipeline as unknown as ToolHandler,
  memory_recall: memory_recall as unknown as ToolHandler,
  memory_write: memory_write as unknown as ToolHandler,
  interview_kit_prepare: interview_kit_prepare as unknown as ToolHandler,
  generate_report: generate_report as unknown as ToolHandler,
};

// ══════════════════════════════════════════
// RealToolExecutor — 实现 Engine 的 ToolExecutor 接口
// ══════════════════════════════════════════

export class RealToolExecutor implements ToolExecutor {
  async execute(toolName: string, params: Record<string, unknown>): Promise<ToolResult<unknown>> {
    const handler = TOOL_REGISTRY[toolName];
    if (!handler) {
      return {
        ok: false,
        data: undefined,
        meta: { mode: 'real', latency_ms: 1 },
        hint: `工具 "${toolName}" 未注册。可用工具：${Object.keys(TOOL_REGISTRY).join(', ')}。`,
      };
    }

    try {
      return await handler(params);
    } catch (e) {
      return {
        ok: false,
        data: undefined,
        meta: { mode: 'real', latency_ms: 1 },
        hint: `工具 "${toolName}" 执行异常。请重试，或尝试用其他工具完成当前任务。`,
      };
    }
  }
}

/**
 * 创建 RealToolExecutor 工厂函数。
 * Engine 用此替代 MockToolExecutor 即可切换到真实工具。
 */
export function createRealToolExecutor(): RealToolExecutor {
  return new RealToolExecutor();
}

// ══════════════════════════════════════════
// 向后兼容 — 供 src/model/ 层使用的 OpenAI 格式类型
// ══════════════════════════════════════════

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}
