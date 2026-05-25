/**
 * LLM-as-Optimizer — 负样本聚类 + prompt 修改建议。
 *
 * 对应 ADR-004 方案 B。
 */

import type { ClassifiedSample, ClassifiedTurn } from './classifier';

export interface PromptSuggestion {
  section: string;
  current_behavior: string;
  desired_behavior: string;
  suggested_change: string;
  priority: 'high' | 'medium' | 'low';
  affected_dsp: string;
}

export interface ClusterSummary {
  trigger: string;
  count: number;
  examples: string[];
}

export interface OptimizerReport {
  negativeCount: number;
  negativeRate: number;
  clusters: ClusterSummary[];
  suggestions: PromptSuggestion[];
}

function clusterNegatives(turns: ClassifiedTurn[]): ClusterSummary[] {
  const groups = new Map<string, ClassifiedTurn[]>();
  for (const t of turns) {
    if (t.label !== 'negative') continue;
    const key = t.trigger ?? 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([trigger, items]) => ({ trigger, count: items.length, examples: items.slice(0, 2).map(t => t.user.slice(0, 80)) }));
}

function generateSuggestions(clusters: ClusterSummary[]): PromptSuggestion[] {
  const out: PromptSuggestion[] = [];
  for (const c of clusters) {
    switch (c.trigger) {
      case 'user_correction':
        if (c.count >= 2) out.push({ section: '库外岗位接管', current_behavior: 'Agent 判断被频繁修正', desired_behavior: '先获取更多数据再判断', suggested_change: '强化 DSP-1 接管规则：search_candidates 空时必须先调 market_analysis + salary_benchmark', priority: 'high', affected_dsp: 'dsp_1' });
        break;
      case 'user_repeat':
        out.push({ section: '工具使用', current_behavior: '首轮回复未满足需求', desired_behavior: '首轮主动澄清', suggested_change: '追加：需求不具体时先 clarification 引导', priority: 'medium', affected_dsp: 'dsp_2' });
        break;
      case 'guardrail':
        out.push({ section: '止损机制', current_behavior: `止损触发 ${c.count} 次`, desired_behavior: '接近限制时主动总结', suggested_change: '追加：多次调用未满足时总结已有信息并建议换角度', priority: 'high', affected_dsp: 'all' });
        break;
      case 'tool_failure':
        out.push({ section: '优雅失败', current_behavior: '工具失败裸返回错误', desired_behavior: '领域知识兜底', suggested_change: '强化：禁用"未找到"/"暂无数据"，用招聘经验替代方案', priority: 'high', affected_dsp: 'dsp_1' });
        break;
    }
  }
  return out;
}

export function optimizeSync(samples: ClassifiedSample[]): OptimizerReport {
  const negs: ClassifiedTurn[] = [];
  let total = 0;
  for (const s of samples) {
    for (const t of s.turns) { total++; if (t.label === 'negative') negs.push(t); }
  }
  const clusters = clusterNegatives(negs);
  return { negativeCount: negs.length, negativeRate: total > 0 ? negs.length / total : 0, clusters, suggestions: generateSuggestions(clusters) };
}

export async function optimize(samples: ClassifiedSample[], _llm?: (p: string) => Promise<string>): Promise<OptimizerReport> {
  return optimizeSync(samples);
}
