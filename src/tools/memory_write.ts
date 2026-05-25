/**
 * T10: memory_write — 记忆写入（S2 stub）
 *
 * S5 替换为真实实现。当前返回 success: true 的占位数据。
 */

import type { MemoryWriteParams, MemoryWriteResult } from '../contracts/tools';
import { ok } from './utils/loadData';

export async function memory_write(params: MemoryWriteParams): Promise<MemoryWriteResult> {
  // S2 Stub: 不存数据，仅返回 success
  const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return ok({
    id,
    layer: params.layer,
    entity_id: params.entity_id,
    summary: params.content.slice(0, 100),
    created_at: Date.now(),
  });
}
