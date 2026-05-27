#!/usr/bin/env npx tsx
/**
 * HireAgent 综合评测 Runner v2
 *
 * 用法:
 *   npx tsx eval/suite/runner.ts                    # 跑全量
 *   npx tsx eval/suite/runner.ts --dim intent       # 只跑意图召回
 *   npx tsx eval/suite/runner.ts --dim stability    # 只跑动作稳定性
 *   npx tsx eval/suite/runner.ts --dim multi_turn   # 只跑多轮
 *   npx tsx eval/suite/runner.ts --dim card_render  # 只跑卡片渲染
 *   npx tsx eval/suite/runner.ts --validate-cases  # 只检查用例集覆盖和schema，不调用API
 *   npx tsx eval/suite/runner.ts --gate            # 指标不达阈值时以非0退出
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

// ─── 配置 ───

function loadEnv() {
  const envPath = path.resolve(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^VITE_DEEPSEEK_API_KEY=(.+)/);
      if (m) { process.env.DEEPSEEK_API_KEY = m[1].trim(); return; }
    }
  }
}
loadEnv();

const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const API_BASE = 'https://api.deepseek.com';
const MODEL = 'deepseek-chat';

const THRESHOLDS = {
  total_pass_rate: 0.9,
  intent_recall: 0.9,
  param_accuracy: 0.85,
  card_render: 0.95,
  action_stability: 0.85,
  crash_free: 0.99,
  latency_p95_ms: 15_000,
};

const TOOL_REQUIRED_PARAMS: Record<string, string[]> = {
  search_candidates: ['query'],
  get_candidate_profile: ['candidate_id'],
  compare_candidates: ['candidate_id_1', 'candidate_id_2'],
  analyze_pipeline: [],
  market_analysis: ['role'],
  salary_benchmark: ['role'],
  list_jobs: [],
  get_job_detail: ['job_id'],
  generate_message_template: ['candidate_id', 'template_type'],
  generate_interview_questions: [],
  analyze_candidate_risk: ['candidate_id'],
  analyze_team: [],
  memory_recall: [],
  memory_write: [],
};

const KNOWN_CARDS = new Set([
  'candidate_list',
  'profile_card',
  'candidate_profile',
  'comparison',
  'pipeline_overview',
  'pipeline_report',
  'market_analysis',
  'salary_benchmark',
  'team_diagnosis',
  'risk_analysis',
  'interview_questions',
  'interview_kit',
  'message_template',
  'jd_card',
  'job_detail',
  'quick_actions',
]);

// ─── 数据加载 ───

function loadData(f: string) {
  const raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src/data', f), 'utf-8'));
  return Array.isArray(raw) ? raw : (raw._meta ? (raw.data || Object.fromEntries(Object.entries(raw).filter(([k]) => k !== '_meta'))) : raw);
}

const resumes = (() => { const r = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src/data/resumes.json'), 'utf-8')); return Array.isArray(r) ? r : r.data || []; })();
const jobs = (() => { const r = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src/data/jobs.json'), 'utf-8')); return Array.isArray(r) ? r : r.data || []; })();
const pipeline = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src/data/pipeline.json'), 'utf-8'));
const market = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src/data/market.json'), 'utf-8'));
const salary = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src/data/salary.json'), 'utf-8'));
const team = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'src/data/team.json'), 'utf-8'));

// ─── 本地工具执行 ───

function executeToolLocally(name: string, args: any): any {
  switch (name) {
    case 'search_candidates': {
      const q = (args.query || '').toLowerCase();
      const results = (resumes as any[])
        .filter((r: any) =>
          r.skills?.some((s: string) => s.toLowerCase().includes(q)) ||
          r.currentTitle?.toLowerCase().includes(q) ||
          r.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
          r.name?.toLowerCase().includes(q)
        ).slice(0, 5).map((r: any) => ({
          id: r.id, name: r.name, currentCompany: r.currentCompany,
          currentTitle: r.currentTitle, experience: r.experience,
          skills: r.skills?.slice(0, 5), tags: r.tags, salary: r.salary,
        }));
      return { total: results.length, query: args.query, candidates: results };
    }
    case 'get_candidate_profile':
      return (resumes as any[]).find((r: any) => r.id === args.candidate_id) || { error: 'Not found' };
    case 'compare_candidates': {
      const a = (resumes as any[]).find((r: any) => r.id === args.candidate_id_1);
      const b = (resumes as any[]).find((r: any) => r.id === args.candidate_id_2);
      return a && b ? { candidateA: { name: a.name, skills: a.skills }, candidateB: { name: b.name, skills: b.skills } } : { error: 'Not found' };
    }
    case 'analyze_pipeline':
      return { summary: (pipeline as any).overallSummary || pipeline.summary, jobs: Object.values((pipeline as any).jobs || pipeline) };
    case 'market_analysis':
      return (market as any)[args.role] || { error: 'No data', availableRoles: Object.keys(market).filter(k => k !== '_meta') };
    case 'salary_benchmark':
      return (salary as any)[args.role] || { error: 'No data', availableRoles: Object.keys(salary).filter(k => k !== '_meta') };
    case 'list_jobs':
      return jobs;
    case 'get_job_detail':
      return (jobs as any[]).find((j: any) => j.id === args.job_id) || { error: 'Not found' };
    case 'generate_message_template': {
      const p = (resumes as any[]).find((r: any) => r.id === args.candidate_id);
      return p ? { template_type: args.template_type, candidate: { name: p.name, company: p.currentCompany } } : { error: 'Not found' };
    }
    case 'generate_interview_questions': {
      const j = args.job_id ? (jobs as any[]).find((x: any) => x.id === args.job_id) : null;
      return { job: j ? { title: j.title } : { title: '通用岗位' }, category: args.category || 'all', difficulty: args.difficulty || 'mixed' };
    }
    case 'analyze_candidate_risk': {
      const c = (resumes as any[]).find((r: any) => r.id === args.candidate_id);
      return c ? { candidate: c.name, risks: c.risks || [], salary: c.salary } : { error: 'Not found' };
    }
    case 'analyze_team': {
      const t = Array.isArray(team) ? team[0] : (team.data?.[0] || team);
      return t || { error: 'No team data' };
    }
    case 'memory_recall':
      return { ok: true, data: [], hint: '暂无相关记忆' };
    case 'memory_write':
      return { ok: true };
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── 工具定义 ───

const TOOLS = [
  { type: 'function', function: { name: 'search_candidates', description: '搜索候选人库', parameters: { type: 'object', properties: { query: { type: 'string' }, min_experience: { type: 'number' }, skills: { type: 'array', items: { type: 'string' } }, company: { type: 'string' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'get_candidate_profile', description: '获取候选人完整档案', parameters: { type: 'object', properties: { candidate_id: { type: 'string' } }, required: ['candidate_id'] } } },
  { type: 'function', function: { name: 'compare_candidates', description: '对比两个候选人', parameters: { type: 'object', properties: { candidate_id_1: { type: 'string' }, candidate_id_2: { type: 'string' } }, required: ['candidate_id_1', 'candidate_id_2'] } } },
  { type: 'function', function: { name: 'analyze_pipeline', description: '查看招聘Pipeline进度', parameters: { type: 'object', properties: { job_id: { type: 'string' } }, required: [] } } },
  { type: 'function', function: { name: 'market_analysis', description: '获取市场人才分析', parameters: { type: 'object', properties: { role: { type: 'string' } }, required: ['role'] } } },
  { type: 'function', function: { name: 'salary_benchmark', description: '获取薪酬对标数据', parameters: { type: 'object', properties: { role: { type: 'string' } }, required: ['role'] } } },
  { type: 'function', function: { name: 'list_jobs', description: '列出所有在招岗位', parameters: { type: 'object', properties: {}, required: [] } } },
  { type: 'function', function: { name: 'get_job_detail', description: '获取岗位详情', parameters: { type: 'object', properties: { job_id: { type: 'string' } }, required: ['job_id'] } } },
  { type: 'function', function: { name: 'generate_message_template', description: '生成消息模板', parameters: { type: 'object', properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' }, template_type: { type: 'string', enum: ['rejection','offer','sell','reminder','reach_out'] } }, required: ['candidate_id','template_type'] } } },
  { type: 'function', function: { name: 'generate_interview_questions', description: '生成面试题，job_id可选', parameters: { type: 'object', properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' }, category: { type: 'string', enum: ['algorithm','system_design','behavioral','project_deep_dive','all'] }, difficulty: { type: 'string', enum: ['easy','medium','hard','mixed'] } }, required: [] } } },
  { type: 'function', function: { name: 'analyze_candidate_risk', description: '分析候选人风险', parameters: { type: 'object', properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' } }, required: ['candidate_id'] } } },
  { type: 'function', function: { name: 'analyze_team', description: '团队能力诊断，team_id可选', parameters: { type: 'object', properties: { team_id: { type: 'string' } }, required: [] } } },
];

// ─── System Prompt ───

const SYSTEM_PROMPT = `你是 HireAgent，一位拥有 10 年经验的 AI 招聘专家。

你正在和一位用人经理对话。语言风格直接、结果导向。

规则：
1. 优先使用工具获取真实数据，不要编造
2. search_candidates 返回结果后必须用 candidate_list 卡片展示
3. 搜索为空时，用你的领域知识给出专业建议（市场分析、招聘策略等），不要只说"没找到"
4. 所有回复必须包含 text 字段

最终回复用 JSON 格式：
{
  "thinking": "你的分析过程",
  "text": "给用户的文字回复（必须提供）",
  "cards": [{ "type": "卡片类型", "title": "标题", "data": {...} }],
  "quickActions": [{ "label": "按钮文字", "message": "点击发送的消息" }]
}

可用卡片类型: candidate_list, profile_card, comparison, pipeline_overview, market_analysis, salary_benchmark, team_diagnosis, risk_analysis, interview_questions, message_template, jd_card, quick_actions`;

// ─── API 调用 ───

interface Msg { role: string; content: string | null; tool_calls?: any[]; tool_call_id?: string; }

async function callLLM(messages: Msg[]): Promise<any> {
  if (!API_KEY) throw new Error('DEEPSEEK_API_KEY not found in .env');
  const res = await fetch(`${API_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, tools: TOOLS, temperature: 0.3, max_tokens: 2000 }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// ─── Function Calling Loop ───

async function runConversation(inputs: string[]): Promise<TurnResult[]> {
  const results: TurnResult[] = [];
  const history: Msg[] = [{ role: 'system', content: SYSTEM_PROMPT }];

  for (const input of inputs) {
    const turnStart = Date.now();
    history.push({ role: 'user', content: input });
    const toolCalls: string[] = [];
    const toolArgs: Record<string, any>[] = [];
    let finalContent = '';
    let steps = 0;

    while (steps < 8) {
      steps++;
      const resp = await callLLM(history);
      const choice = resp.choices?.[0];
      if (!choice) break;

      const msg = choice.message;
      if (msg.tool_calls?.length) {
        history.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls });
        for (const tc of msg.tool_calls) {
          const name = tc.function.name;
          let args: any = {};
          try { args = JSON.parse(tc.function.arguments || '{}'); } catch {}
          toolCalls.push(name);
          toolArgs.push({ tool: name, args });
          const result = executeToolLocally(name, args);
          history.push({ role: 'tool', content: JSON.stringify(result), tool_call_id: tc.id });
        }
      } else {
        finalContent = msg.content || '';
        history.push({ role: 'assistant', content: finalContent });
        break;
      }
    }

    // Parse response
    let parsed: any = {};
    try {
      const m = finalContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (m) parsed = JSON.parse(m[1]);
      else {
        const s = finalContent.indexOf('{'), e = finalContent.lastIndexOf('}');
        if (s !== -1 && e > s) parsed = JSON.parse(finalContent.slice(s, e + 1));
        else parsed = { text: finalContent };
      }
    } catch { parsed = { text: finalContent }; }

    const cards: string[] = (parsed.cards || []).map((c: any) => c.type).filter(Boolean);
    if (Array.isArray(parsed.quickActions) && parsed.quickActions.length > 0) cards.push('quick_actions');

    results.push({
      input,
      toolCalls,
      toolArgs,
      cards,
      text: parsed.text || '',
      hasText: !!(parsed.text && parsed.text.trim()),
      raw: finalContent,
      duration: Date.now() - turnStart,
      steps,
    });
  }
  return results;
}

// ─── 类型定义 ───

interface EvalCase {
  id: string;
  input: string | string[];
  dimension: string;
  intent: string;
  slice_tags: string[];
  expected_tools: string[];
  expected_cards: string[];
  expected_behavior: string;
  adversarial: boolean;
}

interface TurnResult {
  input: string;
  toolCalls: string[];
  toolArgs: Record<string, any>[];
  cards: string[];
  text: string;
  hasText: boolean;
  raw: string;
  duration: number;
  steps: number;
}

interface CaseResult {
  id: string;
  dimension: string;
  intent: string;
  slice_tags: string[];
  adversarial: boolean;
  expected_tools: string[];
  expected_cards: string[];
  passed: boolean;
  tool_match: boolean;
  param_match: boolean;
  card_match: boolean;
  has_text: boolean;
  no_crash: boolean;
  details: string;
  duration: number;
  turns: TurnResult[];
}

// ─── 评判逻辑 ───

function includesAll(actual: string[], expected: string[]): boolean {
  return expected.every(item => actual.includes(item));
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function validateExpectedToolParams(c: EvalCase, turns: TurnResult[]): boolean {
  return c.expected_tools.every(tool => {
    const required = TOOL_REQUIRED_PARAMS[tool] || [];
    const calls = turns.flatMap(t => t.toolArgs).filter(call => call.tool === tool);
    if (calls.length === 0) return false;
    return calls.some(call => required.every(param => hasValue(call.args?.[param])));
  });
}

function judgeCase(c: EvalCase, turns: TurnResult[]): CaseResult {
  const allTools = turns.flatMap(t => t.toolCalls);
  const allCards = turns.flatMap(t => t.cards);
  const totalDuration = turns.reduce((s, t) => s + t.duration, 0);

  // Tool match: must include every expected tool. Empty expected_tools means no tool should be called.
  const tool_match = c.expected_tools.length === 0
    ? allTools.length === 0
    : includesAll(allTools, c.expected_tools);

  const param_match = c.expected_tools.length === 0
    ? true
    : validateExpectedToolParams(c, turns);

  // Card match: must include every expected card. Empty expected_cards means no card requirement.
  const card_match = c.expected_cards.length === 0
    ? true
    : includesAll(allCards, c.expected_cards);

  // Has text: 最后一轮有文字回复
  const has_text = turns.length > 0 && turns[turns.length - 1].hasText;

  // No crash: 没有异常（有输出就算没crash）
  const no_crash = turns.length > 0 && turns.every(t => t.raw.length > 0);

  // 综合判定
  const passed = tool_match && param_match && card_match && has_text && no_crash;

  const details = [
    !tool_match ? `TOOL_MISS: expected [${c.expected_tools}] got [${allTools}]` : '',
    !param_match ? `PARAM_MISS: expected required params for [${c.expected_tools}] got ${JSON.stringify(turns.flatMap(t => t.toolArgs))}` : '',
    !card_match ? `CARD_MISS: expected [${c.expected_cards}] got [${allCards}]` : '',
    !has_text ? 'NO_TEXT' : '',
    !no_crash ? 'CRASH' : '',
  ].filter(Boolean).join('; ') || 'OK';

  return {
    id: c.id,
    dimension: c.dimension,
    intent: c.intent,
    slice_tags: c.slice_tags,
    adversarial: c.adversarial,
    expected_tools: c.expected_tools,
    expected_cards: c.expected_cards,
    passed,
    tool_match,
    param_match,
    card_match,
    has_text,
    no_crash,
    details,
    duration: totalDuration,
    turns,
  };
}

// ─── 报告生成 ───

function wilsonInterval(successes: number, total: number): string {
  if (total === 0) return 'N/A';
  const z = 1.96;
  const p = successes / total;
  const denom = 1 + z ** 2 / total;
  const center = (p + z ** 2 / (2 * total)) / denom;
  const margin = z * Math.sqrt((p * (1 - p) + z ** 2 / (4 * total)) / total) / denom;
  return `${((center - margin) * 100).toFixed(1)}-${((center + margin) * 100).toFixed(1)}%`;
}

function pct(successes: number, total: number): string {
  return total ? `${((successes / total) * 100).toFixed(1)}%` : 'N/A';
}

function statusByRate(successes: number, total: number, threshold: number): string {
  return total && successes / total >= threshold ? '✅' : '❌';
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const item of items) (grouped[keyFn(item)] ??= []).push(item);
  return grouped;
}

function generateReport(results: CaseResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;

  const byDim = groupBy(results, r => r.dimension);
  const byIntent = groupBy(results, r => r.intent);

  let report = `# HireAgent 评测报告\n\n`;
  report += `> 时间: ${new Date().toISOString()}\n`;
  report += `> 模型: ${MODEL}\n`;
  report += `> 用例总数: ${total}\n\n`;
  report += `## 结论\n\n`;
  report += `总通过率 ${pct(passed, total)} (${passed}/${total}, 95% CI ${wilsonInterval(passed, total)})，门槛 ${THRESHOLDS.total_pass_rate * 100}%。`;
  report += passed / Math.max(total, 1) >= THRESHOLDS.total_pass_rate ? `当前可进入 demo 回归复核。\n\n` : `当前不建议作为真实可用 demo 放行。\n\n`;

  report += `## 总体结果\n\n`;
  report += `| 指标 | 值 | 95% CI | 阈值 | 状态 |\n|------|-----|--------|------|------|\n`;
  report += `| 总通过率 | ${pct(passed, total)} (${passed}/${total}) | ${wilsonInterval(passed, total)} | ${THRESHOLDS.total_pass_rate * 100}% | ${statusByRate(passed, total, THRESHOLDS.total_pass_rate)} |\n`;

  // 意图召回率
  const intentCases = results.filter(r => r.dimension === 'intent_recall');
  const intentPass = intentCases.filter(r => r.tool_match).length;
  report += `| 意图召回率 | ${pct(intentPass, intentCases.length)} (${intentPass}/${intentCases.length}) | ${wilsonInterval(intentPass, intentCases.length)} | ${THRESHOLDS.intent_recall * 100}% | ${statusByRate(intentPass, intentCases.length, THRESHOLDS.intent_recall)} |\n`;

  // 参数准确率
  const paramCases = results.filter(r => r.expected_tools.length > 0);
  const paramPass = paramCases.filter(r => r.param_match).length;
  report += `| 参数准确率 | ${pct(paramPass, paramCases.length)} (${paramPass}/${paramCases.length}) | ${wilsonInterval(paramPass, paramCases.length)} | ${THRESHOLDS.param_accuracy * 100}% | ${statusByRate(paramPass, paramCases.length, THRESHOLDS.param_accuracy)} |\n`;

  // 卡片渲染率
  const cardCases = results.filter(r => r.expected_cards?.length > 0);
  const cardPass = cardCases.filter(r => r.card_match).length;
  report += `| 卡片渲染稳定性 | ${pct(cardPass, cardCases.length)} (${cardPass}/${cardCases.length}) | ${wilsonInterval(cardPass, cardCases.length)} | ${THRESHOLDS.card_render * 100}% | ${statusByRate(cardPass, cardCases.length, THRESHOLDS.card_render)} |\n`;

  // 动作稳定性
  const stabCases = results.filter(r => r.dimension === 'action_stability');
  const stabGroups: Record<string, CaseResult[]> = {};
  for (const r of stabCases) { const g = r.id.replace(/[abc]$/, ''); (stabGroups[g] ??= []).push(r); }
  let stabConsistent = 0, stabTotal = 0;
  for (const [, group] of Object.entries(stabGroups)) {
    stabTotal++;
    const tools = group.map(r => r.turns.flatMap(t => t.toolCalls).join(','));
    if (group.every(r => r.tool_match && r.param_match) && new Set(tools).size <= 1) stabConsistent++;
  }
  report += `| 动作稳定性 | ${pct(stabConsistent, stabTotal)} (${stabConsistent}/${stabTotal} groups) | ${wilsonInterval(stabConsistent, stabTotal)} | ${THRESHOLDS.action_stability * 100}% | ${statusByRate(stabConsistent, stabTotal, THRESHOLDS.action_stability)} |\n`;

  // 无crash率
  const crashFree = results.filter(r => r.no_crash).length;
  report += `| 无crash率 | ${pct(crashFree, total)} (${crashFree}/${total}) | ${wilsonInterval(crashFree, total)} | ${THRESHOLDS.crash_free * 100}% | ${statusByRate(crashFree, total, THRESHOLDS.crash_free)} |\n`;

  report += `\n## 维度分解\n\n| 维度 | 通过 | 总数 | 通过率 | 95% CI |\n|------|------|------|--------|--------|\n`;
  for (const [dim, cases] of Object.entries(byDim)) {
    const p = cases.filter(r => r.passed).length;
    report += `| ${dim} | ${p} | ${cases.length} | ${pct(p, cases.length)} | ${wilsonInterval(p, cases.length)} |\n`;
  }

  report += `\n## 意图分解\n\n| 意图 | 通过 | 总数 | 通过率 | 标记 |\n|------|------|------|--------|------|\n`;
  for (const [intent, cases] of Object.entries(byIntent).sort((a, b) => a[0].localeCompare(b[0]))) {
    const p = cases.filter(r => r.passed).length;
    const rate = cases.length ? p / cases.length : 0;
    report += `| ${intent} | ${p} | ${cases.length} | ${pct(p, cases.length)} | ${rate < 0.85 ? 'weak_slice' : ''} |\n`;
  }

  // 失败用例
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    report += `\n## 失败用例 (${failures.length})\n\n`;
    report += `| ID | 意图 | 问题 | 详情 |\n|-----|------|------|------|\n`;
    for (const f of failures.slice(0, 20)) {
      const input = Array.isArray(f.turns[0]?.input) ? f.turns[0].input : f.turns[0]?.input?.slice(0, 30) || '';
      report += `| ${f.id} | ${f.intent} | ${input}... | ${f.details} |\n`;
    }
  }

  // 延迟统计
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;
  report += `\n## 延迟\n\n| 指标 | 值 |\n|------|-----|\n`;
  report += `| p50 | ${(p50 / 1000).toFixed(1)}s |\n`;
  report += `| p95 | ${(p95 / 1000).toFixed(1)}s |\n`;
  report += `| max | ${(Math.max(...durations) / 1000).toFixed(1)}s |\n`;
  report += `| p95门槛 | ${(THRESHOLDS.latency_p95_ms / 1000).toFixed(1)}s |\n`;

  return report;
}

function loadCases(dimFilter: string | null): EvalCase[] {
  const casesDir = path.resolve(__dirname, 'cases');
  const files: Record<string, string> = {
    intent_recall: 'intent_recall.jsonl',
    action_stability: 'action_stability.jsonl',
    multi_turn: 'multi_turn.jsonl',
    card_render: 'card_render.jsonl',
  };

  const allCases: EvalCase[] = [];
  for (const [dim, file] of Object.entries(files)) {
    if (dimFilter && !dim.startsWith(dimFilter)) continue;
    const fp = path.resolve(casesDir, file);
    if (!fs.existsSync(fp)) continue;
    const lines = fs.readFileSync(fp, 'utf-8').split('\n').filter(Boolean);
    for (const [lineNo, line] of lines.entries()) {
      try { allCases.push(JSON.parse(line)); }
      catch (err: any) { throw new Error(`${file}:${lineNo + 1} invalid JSON: ${err.message}`); }
    }
  }
  return allCases;
}

function validateCases(cases: EvalCase[]): string {
  const errors: string[] = [];
  const byDim = groupBy(cases, c => c.dimension);
  const byIntent = groupBy(cases, c => c.intent);
  const adversarial = cases.filter(c => c.adversarial).length;

  for (const c of cases) {
    if (!c.id || !('input' in c) || !c.dimension || !c.intent) errors.push(`${c.id || 'UNKNOWN'} missing required fields`);
    if (!Array.isArray(c.slice_tags) || c.slice_tags.length === 0) errors.push(`${c.id} missing slice_tags`);
    if (!Array.isArray(c.expected_tools)) errors.push(`${c.id} expected_tools must be array`);
    if (!Array.isArray(c.expected_cards)) errors.push(`${c.id} expected_cards must be array`);
    for (const tool of c.expected_tools || []) {
      if (!(tool in TOOL_REQUIRED_PARAMS)) errors.push(`${c.id} unknown tool ${tool}`);
    }
    for (const card of c.expected_cards || []) {
      if (!KNOWN_CARDS.has(card)) errors.push(`${c.id} unknown card ${card}`);
    }
  }

  const lines = [
    '# HireAgent Eval Set Profile',
    '',
    `cases=${cases.length}`,
    `adversarial=${adversarial} (${pct(adversarial, cases.length)})`,
    '',
    '## By Dimension',
    ...Object.entries(byDim).map(([dim, items]) => `- ${dim}: ${items.length}`),
    '',
    '## By Intent',
    ...Object.entries(byIntent).sort((a, b) => a[0].localeCompare(b[0])).map(([intent, items]) => `- ${intent}: ${items.length}`),
    '',
    '## Validation',
    errors.length ? errors.map(e => `- ERROR: ${e}`).join('\n') : '- OK',
  ];

  return lines.join('\n');
}

function passesGate(results: CaseResult[]): boolean {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const intentCases = results.filter(r => r.dimension === 'intent_recall');
  const intentPass = intentCases.filter(r => r.tool_match).length;
  const paramCases = results.filter(r => r.expected_tools.length > 0);
  const paramPass = paramCases.filter(r => r.param_match).length;
  const cardCases = results.filter(r => r.expected_cards.length > 0);
  const cardPass = cardCases.filter(r => r.card_match).length;
  const crashFree = results.filter(r => r.no_crash).length;
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const p95 = durations[Math.floor(durations.length * 0.95)] || 0;

  return passed / Math.max(total, 1) >= THRESHOLDS.total_pass_rate
    && intentPass / Math.max(intentCases.length, 1) >= THRESHOLDS.intent_recall
    && paramPass / Math.max(paramCases.length, 1) >= THRESHOLDS.param_accuracy
    && cardPass / Math.max(cardCases.length, 1) >= THRESHOLDS.card_render
    && crashFree / Math.max(total, 1) >= THRESHOLDS.crash_free
    && p95 <= THRESHOLDS.latency_p95_ms;
}

// ─── 主流程 ───

async function main() {
  const args = process.argv.slice(2);
  const dimFilter = args.includes('--dim') ? args[args.indexOf('--dim') + 1] : null;
  const validateOnly = args.includes('--validate-cases');
  const gate = args.includes('--gate');

  const allCases = loadCases(dimFilter);

  if (validateOnly) {
    const profile = validateCases(allCases);
    console.log(profile);
    if (profile.includes('ERROR:')) process.exit(1);
    return;
  }

  console.log(`\n🧪 HireAgent 综合评测 v2`);
  console.log(`   用例: ${allCases.length} 条${dimFilter ? ` (filter: ${dimFilter})` : ''}`);
  console.log(`   模型: ${MODEL}\n`);

  const results: CaseResult[] = [];
  let idx = 0;

  for (const c of allCases) {
    idx++;
    const inputs = Array.isArray(c.input) ? c.input : [c.input];
    process.stdout.write(`  [${idx}/${allCases.length}] ${c.id} — ${inputs[0].slice(0, 25)}...`);

    try {
      const turns = await runConversation(inputs);
      const result = judgeCase(c, turns);
      results.push(result);
      console.log(result.passed ? ' ✅' : ` ❌ ${result.details}`);
    } catch (err: any) {
      console.log(` 💥 ${err.message?.slice(0, 60)}`);
      results.push({
        id: c.id, dimension: c.dimension, intent: c.intent, slice_tags: c.slice_tags,
        adversarial: c.adversarial, expected_tools: c.expected_tools, expected_cards: c.expected_cards,
        passed: false, tool_match: false, param_match: false, card_match: false,
        has_text: false, no_crash: false, details: `ERROR: ${err.message?.slice(0, 100)}`,
        duration: 0, turns: [],
      });
    }

    // Rate limit: 200ms between requests
    await new Promise(r => setTimeout(r, 200));
  }

  // 生成报告
  const report = generateReport(results);
  const reportPath = path.resolve(__dirname, 'report.md');
  fs.writeFileSync(reportPath, report);

  // 保存原始结果
  const rawPath = path.resolve(__dirname, 'results.jsonl');
  fs.writeFileSync(rawPath, results.map(r => JSON.stringify(r)).join('\n'));

  console.log(`\n${report}`);
  console.log(`\n📄 报告已保存: ${reportPath}`);
  console.log(`📊 原始数据: ${rawPath}`);

  if (gate && !passesGate(results)) process.exit(1);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
