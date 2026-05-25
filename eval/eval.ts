#!/usr/bin/env npx tsx
/**
 * HireAgent 自动化评测 Agent
 * 
 * 用法: npx tsx eval/eval.ts
 * 
 * 测试维度:
 *   1. 意图识别 — LLM 是否正确选择工具
 *   2. 响应质量 — 卡片类型、文本内容是否完备
 *   3. 稳定性   — 异常输入不崩溃
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TEST_CASES, type TestCase, getTestStats } from './testCases';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── 配置 ───

// 从 .env 加载 API Key（必须在顶层常量之前）
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const m = line.match(/^VITE_DEEPSEEK_API_KEY=(.+)/);
      if (m) {
        process.env.DEEPSEEK_API_KEY = m[1].trim();
        return;
      }
    }
  }
}
loadEnv();

// ─── 加载数据文件 ───

const resumesData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'data', 'resumes.json'), 'utf-8'));
const jobsData     = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'data', 'jobs.json'), 'utf-8'));
const pipelineData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'data', 'pipeline.json'), 'utf-8'));
const marketData   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'data', 'market.json'), 'utf-8'));
const salaryData   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'src', 'data', 'salary.json'), 'utf-8'));

// ─── 本地工具执行 ───

function executeToolLocally(name: string, args: any): any {
  switch (name) {
    case 'search_candidates': {
      const q = (args.query || '').toLowerCase();
      const results = (resumesData as any[])
        .filter((r: any) => 
          r.skills?.some((s: string) => s.toLowerCase().includes(q)) ||
          r.currentTitle?.toLowerCase().includes(q) ||
          r.tags?.some((t: string) => t.toLowerCase().includes(q))
        )
        .slice(0, 5)
        .map((r: any) => ({
          id: r.id, name: r.name, currentCompany: r.currentCompany,
          currentTitle: r.currentTitle, experience: r.experience,
          education: r.education, skills: r.skills?.slice(0, 5),
          tags: r.tags, salary: r.salary, status: r.status,
        }));
      return { total: results.length, query: args.query, candidates: results };
    }
    case 'get_candidate_profile': {
      const r = (resumesData as any[]).find((r: any) => r.id === args.candidate_id);
      return r || { error: `未找到候选人 ${args.candidate_id}` };
    }
    case 'compare_candidates': {
      const a = (resumesData as any[]).find((r: any) => r.id === args.candidate_id_1);
      const b = (resumesData as any[]).find((r: any) => r.id === args.candidate_id_2);
      return a && b ? {
        candidateA: { name: a.name, company: a.currentCompany, title: a.currentTitle, experience: a.experience },
        candidateB: { name: b.name, company: b.currentCompany, title: b.currentTitle, experience: b.experience },
      } : { error: '候选人未找到' };
    }
    case 'analyze_pipeline':
      return { summary: (pipelineData as any).overallSummary, jobs: Object.values((pipelineData as any).jobs || {}) };
    case 'market_analysis':
      return (marketData as Record<string, any>)[args.role] || { error: '无数据' };
    case 'salary_benchmark':
      return (salaryData as Record<string, any>)[args.role] || { error: '无数据' };
    case 'list_jobs':
      return jobsData;
    case 'get_job_detail':
      return (jobsData as any[]).find((j: any) => j.id === args.job_id) || { error: '未找到岗位' };
    case 'generate_message_template': {
      const p = (resumesData as any[]).find((r: any) => r.id === args.candidate_id);
      const j = args.job_id ? (jobsData as any[]).find((x: any) => x.id === args.job_id) : null;
      return p ? { template_type: args.template_type, candidate: { name: p.name, company: p.currentCompany }, job: j ? { title: j.title } : null } : { error: '未找到候选人' };
    }
    case 'generate_interview_questions': {
      const j = (jobsData as any[]).find((x: any) => x.id === args.job_id);
      return j ? { job: { title: j.title }, category: args.category || 'all', difficulty: args.difficulty || 'mixed' } : { error: '未找到岗位' };
    }
    default:
      return { error: `未知工具: ${name}` };
  }
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';

// ─── 工具定义（与 src/tools/index.ts 保持一致） ───

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_candidates',
      description: '搜索候选人库。支持按关键词、经验年限、技能、公司等条件筛选。',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          min_experience: { type: 'number', description: '最低经验年限' },
          skills: { type: 'array', items: { type: 'string' }, description: '技能列表' },
          company: { type: 'string', description: '期望公司' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_candidate_profile',
      description: '获取候选人完整档案',
      parameters: {
        type: 'object',
        properties: { candidate_id: { type: 'string' } },
        required: ['candidate_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_candidates',
      description: '对比两个候选人',
      parameters: {
        type: 'object',
        properties: {
          candidate_id_1: { type: 'string' },
          candidate_id_2: { type: 'string' },
        },
        required: ['candidate_id_1', 'candidate_id_2'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_pipeline',
      description: '查看招聘 Pipeline 进度',
      parameters: {
        type: 'object',
        properties: { job_id: { type: 'string' } },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'market_analysis',
      description: '获取市场分析数据',
      parameters: {
        type: 'object',
        properties: { role: { type: 'string' } },
        required: ['role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'salary_benchmark',
      description: '获取薪酬对标数据',
      parameters: {
        type: 'object',
        properties: { role: { type: 'string' } },
        required: ['role'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_jobs',
      description: '列出所有在招岗位',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_job_detail',
      description: '获取岗位详情',
      parameters: {
        type: 'object',
        properties: { job_id: { type: 'string' } },
        required: ['job_id'],
      },
    },
  },
  {
    type: 'function',
    function: { name: 'generate_message_template', description: '生成消息模板',
      parameters: { type: 'object', properties: { candidate_id: { type: 'string', description: '候选人ID' }, job_id: { type: 'string' }, template_type: { type: 'string', enum: ['rejection','offer','sell','reminder','reach_out'], description: '类型' } }, required: ['candidate_id','template_type'] } },
  },
  {
    type: 'function',
    function: { name: 'generate_interview_questions', description: '生成面试题',
      parameters: { type: 'object', properties: { candidate_id: { type: 'string' }, job_id: { type: 'string' }, category: { type: 'string', enum: ['algorithm','system_design','behavioral','project_deep_dive','all'], description: '类别' }, difficulty: { type: 'string', enum: ['easy','medium','hard','mixed'], description: '难度' } }, required: ['job_id'] } },
  },
];

// ─── System Prompt（精简版，与 AIEngine 一致） ───

function buildSystemPrompt(role: string): string {
  const roleContext = role === 'hm'
    ? '你正在和一位用人经理对话。语言风格直接、结果导向。'
    : role === 'hr'
      ? '你正在和一位招聘HR对话。语言风格专业、有数据支撑。'
      : '你正在和一位候选人对话。语言风格友好、鼓励。';

  return `你是 HireAgent，AI招聘专家。

${roleContext}

优先使用工具获取真实数据。不要编造信息。

最终回复用 JSON 格式：
{
  "thinking": "分析",
  "text": "文字回复（必须提供）",
  "cards": [{ "type": "类型", "title": "标题", "data": {...} }],
  "quickActions": [{ "label": "按钮", "message": "消息" }]
}

卡片类型: search_candidates 结果必须用 candidate_list，禁止用多个 candidate_card。其他: analytics, jd_card, profile_card, comparison, pipeline_overview, market_analysis, salary_benchmark, timeline, quick_actions`;
}

// ─── API 调用 ───

interface ApiMessage {
  role: string;
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

async function callDeepSeek(messages: ApiMessage[]): Promise<any> {
  const res = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      tools: TOOLS,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── JSON 解析 ───

function parseResponse(content: string): any {
  try {
    const m = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (m) return JSON.parse(m[1]);
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end > start) return JSON.parse(content.slice(start, end + 1));
    return { text: content };
  } catch {
    return { text: content };
  }
}

// ─── 单个用例评测 ───

interface EvalResult {
  testId: string;
  testName: string;
  passed: boolean;
  toolCallsMade: string[];
  cardTypesReturned: string[];
  hasText: boolean;
  hasError: boolean;
  errors: string[];
  details: string;
  duration: number;
}

async function evaluateCase(tc: TestCase): Promise<EvalResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const toolCallsMade: string[] = [];
  const cardTypesReturned: string[] = [];

  const messages: ApiMessage[] = [
    { role: 'system', content: buildSystemPrompt(tc.role) },
    { role: 'user', content: tc.input },
  ];

  try {
    // 工具调用循环（最多 3 轮，超出后强制要求回复）
    let finalContent = '';
    for (let iter = 0; iter < 3; iter++) {
      const data = await callDeepSeek(messages);
      const msg = data.choices[0]?.message;

      if (msg?.tool_calls?.length > 0) {
        for (const tc of msg.tool_calls) {
          toolCallsMade.push(tc.function.name);
        }
        messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls });
        for (const tc of msg.tool_calls) {
          const toolResult = executeToolLocally(tc.function.name, JSON.parse(tc.function.arguments));
          messages.push({ role: 'tool', content: JSON.stringify(toolResult), tool_call_id: tc.id });
        }
      } else {
        finalContent = msg?.content || '';
        break;
      }
    }
    // 兜底：LLM 仍在请求工具但已达上限，强制要求回复
    if (!finalContent) {
      messages.push({ role: 'user', content: '请基于以上工具返回的数据，用 JSON 格式给出最终回复（必须包含 text 字段）。' });
      const data = await callDeepSeek(messages);
      finalContent = data.choices[0]?.message?.content || '';
    }

    // 解析响应
    const parsed = parseResponse(finalContent || '');
    // 调试：失败时打印原始内容
    if (!parsed.text) {
      console.log(`\n      [DEBUG] raw (first 300): ${finalContent?.slice(0, 300) || '(empty)'}`);
    }
    if (parsed.text) {
      cardTypesReturned.push('text');
    } else {
      errors.push('缺少 text 字段');
    }
    if (parsed.cards) {
      for (const card of parsed.cards) {
        cardTypesReturned.push(card.type || 'unknown');
      }
    }

    // ─── 校验 ───

    // 工具调用
    if (tc.expectedToolCalls) {
      for (const expected of tc.expectedToolCalls) {
        if (!toolCallsMade.includes(expected)) {
          errors.push(`期望调用 ${expected}，实际调用: [${toolCallsMade.join(', ') || '无'}]`);
        }
      }
    }

    // 卡片类型
    if (tc.expectedCardTypes && !tc.relaxed) {
      for (const expected of tc.expectedCardTypes) {
        if (!cardTypesReturned.includes(expected)) {
          errors.push(`期望卡片 ${expected}，实际: [${cardTypesReturned.join(', ')}]`);
        }
      }
    }

    // 文本内容
    if (tc.expectText && !parsed.text) {
      errors.push('期望有文本回复但未找到');
    }

    const passed = errors.length === 0 && (tc.relaxed ? true : true);
    const hasError = errors.length > 0;

    return {
      testId: tc.id,
      testName: tc.name,
      passed: !hasError,
      toolCallsMade,
      cardTypesReturned,
      hasText: !!parsed.text,
      hasError,
      errors,
      details: parsed.text?.slice(0, 100) || '(无文本)',
      duration: Date.now() - startTime,
    };
  } catch (err: any) {
    return {
      testId: tc.id,
      testName: tc.name,
      passed: false,
      toolCallsMade,
      cardTypesReturned,
      hasText: false,
      hasError: true,
      errors: [`异常: ${err.message}`],
      details: '',
      duration: Date.now() - startTime,
    };
  }
}

// ─── 报告生成 ───

function generateReport(results: EvalResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((s, r) => s + r.duration, 0);
  const stats = getTestStats();

  let report = '';
  report += '═'.repeat(60) + '\n';
  report += '  HireAgent 自动化评测报告\n';
  report += '═'.repeat(60) + '\n\n';
  report += `  总计: ${total}  通过: ${passed}  失败: ${failed}  总耗时: ${(totalDuration / 1000).toFixed(1)}s\n\n`;

  report += '── 分类统计 ──\n';
  for (const [cat, cases] of Object.entries(stats.byCategory)) {
    const catResults = results.filter(r => cases.some(c => c.id === r.testId));
    const catPassed = catResults.filter(r => r.passed).length;
    report += `  ${cat}: ${catPassed}/${cases.length} 通过\n`;
  }

  report += '\n── 详细结果 ──\n\n';
  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    report += `${icon} [${r.testId}] ${r.testName}\n`;
    report += `   工具调用: [${r.toolCallsMade.join(', ') || '无'}]\n`;
    report += `   卡片类型: [${r.cardTypesReturned.join(', ') || '无'}]\n`;
    report += `   文本内容: ${r.details}\n`;
    if (r.errors.length > 0) {
      for (const e of r.errors) {
        report += `   ⚠️  ${e}\n`;
      }
    }
    report += `   耗时: ${r.duration}ms\n\n`;
  }

  return report;
}

// ─── 主入口 ───

async function main() {
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ 未找到 DEEPSEEK_API_KEY。请确保 .env 文件存在且包含 VITE_DEEPSEEK_API_KEY。');
    process.exit(1);
  }

  console.log(`🔍 HireAgent 评测开始 — ${TEST_CASES.length} 条用例\n`);

  const results: EvalResult[] = [];
  for (const tc of TEST_CASES) {
    process.stdout.write(`  [${tc.id}] ${tc.name} ... `);
    const result = await evaluateCase(tc);
    results.push(result);
    console.log(result.passed ? '✅' : '❌');
    if (result.errors.length > 0) {
      for (const e of result.errors) console.log(`      ⚠️  ${e}`);
    }
  }

  console.log('\n' + generateReport(results));

  // 写入报告文件
  const reportPath = path.resolve(__dirname, '..', 'eval', 'report.txt');
  fs.writeFileSync(reportPath, generateReport(results), 'utf-8');
  console.log(`📄 报告已保存: eval/report.txt`);

  const failed = results.filter(r => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
