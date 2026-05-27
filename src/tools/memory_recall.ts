import type { MemoryRecallParams, MemoryRecallResult } from '../contracts/tools';
import { getMemoryManager } from './utils/memoryStore';

export async function memory_recall(params: MemoryRecallParams): Promise<MemoryRecallResult> {
  return getMemoryManager().recall(params);
}
