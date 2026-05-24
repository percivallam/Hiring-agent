/**
 * Engine 止损四件套 — 纯函数，不依赖外部状态。
 *
 * 每个函数在给定当前状态后返回是否需要终止，以及终止原因。
 * 对应 PRD 3.2.4 + S1 spec 第 5 节验收项③。
 */

/** 止损原因 */
export type StopReason = 'max_steps' | 'max_tool_calls' | 'timeout' | 'loop_detected';

/** 循环检测用的调用记录 */
export interface CallRecord {
  toolName: string;
  argsHash: string;
}

/**
 * 检查是否超过最大步骤数。
 * 一个 step = 一次 LLM 调用（含其返回的 tool_calls 组）。
 */
export function checkMaxSteps(currentStep: number, maxSteps: number): StopReason | null {
  if (currentStep > maxSteps) return 'max_steps';
  return null;
}

/**
 * 检查工具调用总数是否超限。
 * 每次 execute a tool 计一次。
 */
export function checkMaxToolCalls(currentCalls: number, maxToolCalls: number): StopReason | null {
  if (currentCalls > maxToolCalls) return 'max_tool_calls';
  return null;
}

/**
 * 检查整体耗时是否超限。
 * @param startTime - chat() 入口的 Date.now()
 * @param timeoutMs  - 配置的超时毫秒数
 */
export function checkTimeout(startTime: number, timeoutMs: number): StopReason | null {
  if (Date.now() - startTime > timeoutMs) return 'timeout';
  return null;
}

/**
 * 循环检测：同一 (tool_name, args_hash) 连续命中 ≥ threshold 次。
 *
 * 只看**连续**命中 — 中间只要有一次不同就重置计数器。
 * argsHash 由调用方传入（建议 JSON.stringify 后取稳定的 key）。
 */
export function detectLoop(
  history: CallRecord[],
  threshold: number,
): { toolName: string; repeatCount: number } | null {
  if (history.length < threshold) return null;

  const last = history[history.length - 1];
  let count = 1;
  for (let i = history.length - 2; i >= 0; i--) {
    const prev = history[i];
    if (prev.toolName === last.toolName && prev.argsHash === last.argsHash) {
      count++;
    } else {
      break; // 只看连续
    }
  }

  if (count >= threshold) {
    return { toolName: last.toolName, repeatCount: count };
  }
  return null;
}
