/**
 * SampleClassifier — 正负样本自动分类。
 *
 * 策略：规则优先（高置信度）→ LLM-judge 兜底。
 */

import type { RawSample, RawTurn } from './collector';
import type { SampleLabel } from '../contracts/events';

export interface ClassifiedTurn {
  user: string;
  agent: string;
  label: SampleLabel;
  reason: string;
  trigger?: 'user_correction' | 'user_repeat' | 'user_dislike' | 'tool_failure' | 'guardrail' | 'rule_match';
}

export interface ClassifiedSample {
  sessionId: string;
  label: SampleLabel;
  turns: ClassifiedTurn[];
}

export interface LLMJudge {
  classify(user: string, agent: string): Promise<SampleLabel>;
}

const POS = /不错|很好|对|就是|就这个|可以|行|ok|yes|好|棒|厉害|专业|到位|正是/i;
const NEG = /不对|不是|不.*对|错了|重新|再.*一遍|不对吧|不行|算了|没用|帮不了|不懂|没理解/i;

function sim(a: string, b: string): number {
  const sa = new Set(a), sb = new Set(b);
  let c = 0; for (const ch of sa) if (sb.has(ch)) c++;
  return c / Math.max(sa.size, sb.size);
}

function classifyTurn(
  turn: RawTurn,
  prevUserMsgs: string[],
  guardrail?: RawSample['guardrailTrigger'],
): ClassifiedTurn {
  if (guardrail) return { user: turn.user, agent: turn.agent, label: 'negative', reason: `止损: ${guardrail}`, trigger: 'guardrail' };
  if (NEG.test(turn.user)) return { user: turn.user, agent: turn.agent, label: 'negative', reason: '否定/修正意图', trigger: 'user_correction' };
  for (const p of prevUserMsgs) {
    if (sim(turn.user, p) > 0.7) return { user: turn.user, agent: turn.agent, label: 'negative', reason: '重复问题', trigger: 'user_repeat' };
  }
  if (turn.toolResults?.length && turn.toolResults.every(r => !r.ok) && (turn.agent.includes('未找到') || turn.agent.includes('暂无') || turn.agent.length < 20)) {
    return { user: turn.user, agent: turn.agent, label: 'negative', reason: '工具失败未兜底', trigger: 'tool_failure' };
  }
  if (POS.test(turn.user)) return { user: turn.user, agent: turn.agent, label: 'positive', reason: '肯定意图', trigger: 'rule_match' };
  if (turn.agent.length > 200 && !turn.agent.includes('Error')) return { user: turn.user, agent: turn.agent, label: 'positive', reason: '详细回复', trigger: 'rule_match' };
  return { user: turn.user, agent: turn.agent, label: 'neutral', reason: '规则无法判定' };
}

export function classifySamplesSync(samples: RawSample[]): ClassifiedSample[] {
  return samples.map(s => {
    const turns: ClassifiedTurn[] = [];
    const prev: string[] = [];
    for (const t of s.turns) {
      turns.push(classifyTurn(t, prev, s.guardrailTrigger));
      if (t.user) prev.push(t.user);
    }
    const hasNeg = turns.some(t => t.label === 'negative');
    const hasPos = turns.some(t => t.label === 'positive');
    return { sessionId: s.sessionId, label: hasNeg ? 'negative' : hasPos ? 'positive' : 'neutral', turns };
  });
}

export async function classifySamples(samples: RawSample[], judge?: LLMJudge): Promise<ClassifiedSample[]> {
  const results = classifySamplesSync(samples);
  if (!judge) return results;
  // LLM-judge 二次判定 neutral 轮次
  for (const r of results) {
    for (const t of r.turns) {
      if (t.label !== 'neutral') continue;
      t.label = await judge.classify(t.user, t.agent);
      t.reason = 'LLM-judge';
    }
  }
  return results;
}
