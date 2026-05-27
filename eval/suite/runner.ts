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
 *   npx tsx eval/suite/runner.ts --n 1             # 每条只跑1次(默认1)
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

if (!API_KEY) { console.error('❌ DEEPSEEK_API_KEY not found in .env'); process.exit(1); }

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
  passed: boolean;
  tool_match: boolean;
  card_match: boolean;
  has_text: boolean;
  no_crash: boolean;
  details: string;
  duration: number;
  turns: TurnResult[];
}

// ─── 评判逻辑 ───

function judgeCase(c: EvalCase, turns: TurnResult[]): CaseResult {
  const allTools = turns.flatMap(t => t.toolCalls);
  const allCards = turns.flatMap(t => t.cards);
  const totalDuration = turns.reduce((s, t) => s + t.duration, 0);

  // Tool match: 期望的工具至少出现一个
  const tool_match = c.expected_tools.length === 0
    ? allTools.length === 0 || true  // 无期望工具时，不调用或调用都可以
    : c.expected_tools.some(et => allTools.includes(et));

  // Card match: 期望的卡片类型出现（空期望 = 不要求卡片）
  const card_match = c.expected_cards.length === 0
    ? true
    : c.expected_cards.some(ec => allCards.includes(ec));

  // Has text: 最后一轮有文字回复
  const has_text = turns.length > 0 && turns[turns.length - 1].hasText;

  // No crash: 没有异常（有输出就算没crash）
  const no_crash = turns.length > 0 && turns.every(t => t.raw.length > 0);

  // 综合判定
  const passed = tool_match && card_match && has_text && no_crash;

  const details = [
    !tool_match ? `TOOL_MISS: expected [${c.expected_tools}] got [${allTools}]` : '',
    !card_match ? `CARD_MISS: expected [${c.expected_cards}] got [${allCards}]` : '',
    !has_text ? 'NO_TEXT' : '',
    !no_crash ? 'CRASH' : '',
  ].filter(Boolean).join('; ') || 'OK';

  return { id: c.id, dimension: c.dimension, intent: c.intent, slice_tags: c.slice_tags, adversarial: c.adversarial, passed, tool_match, card_match, has_text, no_crash, details, duration: totalDuration, turns };
}

// ─── 报告生成 ───

function generateReport(results: CaseResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const rate = ((passed / total) * 100).toFixed(1);

  // 按维度分组
  const byDim: Record<string, CaseResult[]> = {};
  for (const r of results) { (byDim[r.dimension] ??= []).push(r); }

  // 按 intent 分组
  const byIntent: Record<string, CaseResult[]> = {};
  for (const r of results) { (byIntent[r.intent] ??= []).push(r); }

  let report = `# HireAgent 评测报告\n\n`;
  report += `> 时间: ${new Date().toISOString()}\n`;
  report += `> 模型: ${MODEL}\n`;
  report += `> 用例总数: ${total}\n\n`;
  report += `## 总体结果\n\n`;
  report += `| 指标 | 值 | 阈值 | 状态 |\n|------|-----|------|------|\n`;
  report += `| 总通过率 | ${rate}% (${passed}/${total}) | 90% | ${Number(rate) >= 90 ? '✅' : '❌'} |\n`;

  // 意图召回率
  const intentCases = results.filter(r => r.dimension === 'intent_recall');
  const intentPass = intentCases.filter(r => r.tool_match).length;
  const intentRate = intentCases.length ? ((intentPass / intentCases.length) * 100).toFixed(1) : 'N/A';
  report += `| 意图召回率 | ${intentRate}% (${intentPass}/${intentCases.length}) | 90% | ${Number(intentRate) >= 90 ? '✅' : '❌'} |\n`;

  // 卡片渲染率
  const cardCases = results.filter(r => r.expected_cards?.length > 0);
  const cardPass = cardCases.filter(r => r.card_match).length;
  const cardRate = cardCases.length ? ((cardPass / cardCases.length) * 100).toFixed(1) : 'N/A';
  report += `| 卡片渲染稳定性 | ${cardRate}% (${cardPass}/${cardCases.length}) | 95% | ${Number(cardRate) >= 95 ? '✅' : '❌'} |\n`;

  // 动作稳定性
  const stabCases = results.filter(r => r.dimension === 'action_stability');
  const stabGroups: Record<string, CaseResult[]> = {};
  for (const r of stabCases) { const g = r.id.replace(/[abc]$/, ''); (stabGroups[g] ??= []).push(r); }
  let stabConsistent = 0, stabTotal = 0;
  for (const [, group] of Object.entries(stabGroups)) {
    stabTotal++;
    const tools = group.map(r => r.turns.flatMap(t => t.toolCalls).join(','));
    if (new Set(tools).size <= 1) stabConsistent++;
  }
  const stabRate = stabTotal ? ((stabConsistent / stabTotal) * 100).toFixed(1) : 'N/A';
  report += `| 动作稳定性 | ${stabRate}% (${stabConsistent}/${stabTotal} groups) | 85% | ${Number(stabRate) >= 85 ? '✅' : '❌'} |\n`;

  // 无crash率
  const crashFree = results.filter(r => r.no_crash).length;
  const crashRate = ((crashFree / total) * 100).toFixed(1);
  report += `| 无crash率 | ${crashRate}% | 99% | ${Number(crashRate) >= 99 ? '✅' : '❌'} |\n`;

  report += `\n## 维度分解\n\n| 维度 | 通过 | 总数 | 通过率 |\n|------|------|------|--------|\n`;
  for (const [dim, cases] of Object.entries(byDim)) {
    const p = cases.filter(r => r.passed).length;
    report += `| ${dim} | ${p} | ${cases.length} | ${((p / cases.length) * 100).toFixed(1)}% |\n`;
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

  return report;
}

// ─── 主流程 ───

async function main() {
  const args = process.argv.slice(2);
  const dimFilter = args.includes('--dim') ? args[args.indexOf('--dim') + 1] : null;

  // 加载用例
  const casesDir = path.resolve(__dirname, 'cases');
  const files: Record<string, string> = {
    intent_recall: 'intent_recall.jsonl',
    action_stability: 'action_stability.jsonl',
    multi_turn: 'multi_turn.jsonl',
    card_render: 'card_render.jsonl',
  };

  let allCases: EvalCase[] = [];
  for (const [dim, file] of Object.entries(files)) {
    if (dimFilter && !dim.startsWith(dimFilter)) continue;
    const fp = path.resolve(casesDir, file);
    if (!fs.existsSync(fp)) continue;
    const lines = fs.readFileSync(fp, 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      try { allCases.push(JSON.parse(line)); } catch {}
    }
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
        adversarial: c.adversarial, passed: false, tool_match: false, card_match: false,
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
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
