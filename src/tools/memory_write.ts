import type { MemoryWriteParams, MemoryWriteResult } from '../contracts/tools';
import { getMemoryManager } from './utils/memoryStore';

export async function memory_write(params: MemoryWriteParams): Promise<MemoryWriteResult> {
  return getMemoryManager().write({
    ...params,
    source: 'llm',
  });
}
