/**
 * T9: memory_recall — 记忆召回（S2 stub）
 *
 * S5 替换为真实实现。当前返回空数组。
 */

import type { MemoryRecallParams, MemoryRecallResult } from '../contracts/tools';
import { ok } from './utils/loadData';

export async function memory_recall(_params: MemoryRecallParams): Promise<MemoryRecallResult> {
  // S2 Stub: 不读任何数据，直接返回空
  return ok(
    [],
    '暂时没有找到相关的历史记忆，这是第一次聊这个话题。',
  );
}
