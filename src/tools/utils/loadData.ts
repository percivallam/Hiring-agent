/**
 * 统一数据加载 + 错误包装
 *
 * 所有工具读 src/data/*.json 的统一入口。
 * 失败时返回 ToolResult（ok=false + hint），让 LLM 接管。
 */

import type { ToolResult, ToolMeta } from '../../contracts/tools';

// Vite 静态导入 JSON（tree-shakeable）
import resumesRaw from '../../data/resumes.json';
import jobsRaw from '../../data/jobs.json';
import pipelineRaw from '../../data/pipeline.json';
import marketRaw from '../../data/market.json';
import salaryRaw from '../../data/salary.json';

export type DataModule = 'resumes' | 'jobs' | 'pipeline' | 'market' | 'salary';

const MODULES: Record<DataModule, unknown> = {
  resumes: resumesRaw,
  jobs: jobsRaw,
  pipeline: pipelineRaw,
  market: marketRaw,
  salary: salaryRaw,
};

/** 构造 ToolMeta */
export function meta(mode: 'real' | 'demo' = 'real', latencyMs = 1): ToolMeta {
  return { mode, latency_ms: latencyMs };
}

/** 构造成功结果 */
export function ok<T>(data: T, hint?: string, mode: 'real' | 'demo' = 'real'): ToolResult<T> {
  return { ok: true, data, meta: meta(mode), ...(hint ? { hint } : {}) };
}

/** 构造错误结果（LLM 接管） */
export function err<T>(hint: string, data?: T, mode: 'real' | 'demo' = 'real'): ToolResult<T> {
  return { ok: false, data, meta: meta(mode), hint };
}

/**
 * 加载指定数据模块。
 *
 * Data Agent 为统一格式给 JSON 加了 `_meta` 字段。
 * 部分文件被包裹在 `data` 键下（resumes/jobs），
 * 部分文件仍以角色 key 为顶层键（market/salary）。
 * 此处自动检测并解包 `data` 字段。
 */
export function loadData<T>(module: DataModule): T {
  const raw = MODULES[module];
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as Record<string, unknown>).data as T;
  }
  return raw as T;
}
