/**
 * Memory 单例 — 所有 T9/T10 工具共享同一个 MemoryManager。
 *
 * 使用 InMemoryStorage，在 eval/CLI 模式下工作。
 * 浏览器模式后续替换为 BrowserStorage。
 */

import { MemoryManager } from '../../memory/MemoryManager';
import { InMemoryStorage } from '../../memory/storage';

let _inst: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
  if (!_inst) {
    _inst = new MemoryManager(new InMemoryStorage());
    seedCandidateData(_inst);
  }
  return _inst;
}

/** 预埋 DSP-3 黄金数据: 张三 (res_007) 的备注 */
async function seedCandidateData(mm: MemoryManager) {
  const notes = [
    {
      layer: 'candidate' as const,
      entity_id: 'res_007',
      content: '薪资敏感，现薪资 45k，期望 55k+。正在比较 OPPO 的 offer，对方给到 60k。如果我们要争取，建议预算上浮 15%。',
      source: 'user' as const,
    },
    {
      layer: 'candidate' as const,
      entity_id: 'res_007',
      content: '2025-11-20 二面后因薪酬未对齐暂停流程。当时反馈：技术过硬，但对薪资期望较高。',
      source: 'system' as const,
    },
    {
      layer: 'candidate' as const,
      entity_id: 'res_007',
      content: '张三在推荐系统方向有 6 年经验，PyTorch/强化学习背景，适合对标 P7。',
      source: 'llm' as const,
    },
  ];

  for (const note of notes) {
    await mm.write(note);
  }
}
