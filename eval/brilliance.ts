/**
 * 惊艳度评估 — DeepSeek LLM-as-Judge
 * 
 * 用法: npx tsx eval/brilliance.ts
 * 
 * 评估 DSP-1 和 DSP-2 的惊艳时刻，评分 1-5。
 * DSP-1 目标 ≥ 4.5 (领域知识接管的专业度)
 * DSP-2 目标 ≥ 4.0 (对比推荐的判断力)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载 .env
function loadEnv() {
  const p = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf-8').split('\n')) {
      const m = line.match(/^VITE_DEEPSEEK_API_KEY=(.+)/);
      if (m) process.env.DEEPSEEK_API_KEY = m[1].trim();
    }
  }
}
loadEnv();

const API_KEY = process.env.DEEPSEEK_API_KEY || '';
const BASE_URL = 'https://api.deepseek.com';
const MODEL = 'deepseek-chat';

// ── DSP 惊艳时刻样本 ──

const DSP1_SAMPLES = [
  {
    label: 'DSP-1 BSP 工程师接管',
    input: '帮我找一个 BSP 工程师',
    expected_behavior: 'search_candidates 返回空后，LLM 用领域知识接管，给出 BSP 方向的市场判断、典型来源公司、薪酬带和搜索策略建议。不应出现"未找到""暂无数据"。',
    min_score: 4.5,
  },
];

const DSP2_SAMPLES = [
  {
    label: 'DSP-2 推荐系统对比',
    input: '帮我找几个做推荐系统的人，然后对比一下张明远和钱一鸣',
    expected_behavior: '先搜索推荐系统候选人（返回列表），再对比张明远和钱一鸣，给出有倾向的推荐结论（非"各有优势"式套话），指出谁更适合什么场景。',
    min_score: 4.0,
  },
];

// ── 调用 DeepSeek ──

async function chat(messages: Array<{ role: string; content: string }>): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0, max_tokens: 800 }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().slice(0, 200)}`);
  const j = await res.json() as any;
  return j.choices[0]?.message?.content || '';
}

// ── 模拟 Engine 调用 ──

function buildSystemPrompt(): string {
  return `你是 HireAgent，一位有 10 年科技公司招聘经验的合伙人。主攻技术岗位。

当 search_candidates 返回空时，绝对禁止说"未找到""暂无数据"。必须用领域知识接管：给出市场判断、典型来源、薪酬带、搜索策略。

回复 JSON 格式：{"text":"...","cards":[...]}`;
}

async function simulateEngine(userInput: string): Promise<string> {
  const TOOLS = [
    { type: 'function', function: { name: 'search_candidates', description: '搜索候选人', parameters: { type: 'object', properties: { query: { type: 'string' }, experience_min: { type: 'number' }, experience_max: { type: 'number' } }, required: ['query'] } } },
    { type: 'function', function: { name: 'market_analysis', description: '市场分析', parameters: { type: 'object', properties: { position: { type: 'string' } }, required: ['position'] } } },
    { type: 'function', function: { name: 'salary_benchmark', description: '薪酬对标', parameters: { type: 'object', properties: { position: { type: 'string' } }, required: ['position'] } } },
    { type: 'function', function: { name: 'compare_candidates', description: '对比候选人', parameters: { type: 'object', properties: { candidate_ids: { type: 'array', items: { type: 'string' } } }, required: ['candidate_ids'] } } },
  ];

  const msgs: any[] = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: userInput },
  ];

  // 最多 3 轮 tool calling
  for (let i = 0; i < 3; i++) {
    const r = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: MODEL, messages: msgs, tools: TOOLS, temperature: 0.7, max_tokens: 1500 }),
    });
    const j = await r.json() as any;
    const msg = j.choices[0]?.message;
    if (!msg?.tool_calls) return msg?.content || '';
    msgs.push({ role: 'assistant', content: msg.content, tool_calls: msg.tool_calls });
    for (const tc of msg.tool_calls) {
      const args = JSON.parse(tc.function.arguments);
      let result = '{}';
      if (tc.function.name === 'search_candidates') {
        // 模拟 BSP 搜索返回空
        if (args.query?.toLowerCase().includes('bsp') || args.query?.toLowerCase().includes('嵌入') || args.query?.toLowerCase().includes('固件')) {
          result = JSON.stringify({ total: 0, candidates: [] });
        } else {
          result = JSON.stringify({ total: 3, candidates: [{ name: '张明远', match: 95 }, { name: '李雨桐', match: 88 }, { name: '钱一鸣', match: 82 }] });
        }
      } else if (tc.function.name === 'market_analysis') {
        result = JSON.stringify({ title: 'BSP 工程师市场分析', data: [{ label: '人才池', value: 1200 }, { label: '平均薪酬', value: 85 }], insights: ['BSP 人才集中在芯片原厂和手机厂商'] });
      } else if (tc.function.name === 'salary_benchmark') {
        result = JSON.stringify({ position: args.position, benchmarks: [{ company: '高通', salary_range: '80-120万' }], market_median: 95 });
      } else if (tc.function.name === 'compare_candidates') {
        result = JSON.stringify({
          candidate_a: { name: '张明远' }, candidate_b: { name: '钱一鸣' },
          dimensions: [
            { label: '推荐系统经验', candidate_a: '8年，主导淘宝首页推荐', candidate_b: '10年，C++底层优化为主', advantage: 'a' },
            { label: '团队管理', candidate_a: '带过 5 人算法小组', candidate_b: '无管理经验', advantage: 'a' },
            { label: '业务落地', candidate_a: 'CTR 提升 12%，直接业务指标', candidate_b: '底层引擎优化，间接贡献', advantage: 'a' },
            { label: '技术深度', candidate_a: 'PyTorch/深度学习', candidate_b: 'C++/底层优化更扎实', advantage: 'b' },
            { label: '沟通风格', candidate_a: '协作型，跨团队推动', candidate_b: '专注型，独立攻坚', advantage: 'a' },
            { label: '薪酬期望', candidate_a: '120-150万', candidate_b: '180万+', advantage: 'a' },
          ],
          recommendation: null,
        });
      }
      msgs.push({ role: 'tool', content: result, tool_call_id: tc.id });
    }
  }
  msgs.push({ role: 'user', content: '请基于工具返回数据给出最终回复。' });
  const fr = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages: msgs, temperature: 0.7, max_tokens: 1500 }),
  });
  const fj = await fr.json() as any;
  return fj.choices[0]?.message?.content || '';
}

// ── LLM-Judge 评分 ──

async function judgeBrilliance(label: string, expected: string, llmOutput: string): Promise<{ score: number; reasoning: string }> {
  const prompt = `你是招聘产品的UX评审专家。请对以下AI招聘助手的一次对话做惊i艳度评分。

【场景】${label}
【期望行为】${expected}
【AI实际输出】
${llmOutput.slice(0, 2000)}

请按 1-5 分评分：
- 5: 超出预期，展现出真正的专家判断力，不是套话
- 4: 专业且有用，有判断但不惊艳
- 3: 够用但没有亮点
- 2: 有明显问题
- 1: 完全不合格（裸"未找到"/报错/套话堆砌）

回复 JSON: {"score": <数字>, "reasoning": "<一句话理由>"}`;

  const r = await chat([{ role: 'user', content: prompt }]);
  try {
    const m = r.match(/\{[\s\S]*\}/);
    const j = m ? JSON.parse(m[0]) : { score: 0, reasoning: 'parse error' };
    return { score: j.score || 0, reasoning: j.reasoning || '' };
  } catch {
    return { score: 0, reasoning: `parse error: ${r.slice(0, 100)}` };
  }
}

// ── Main ──

async function main() {
  console.log('═'.repeat(60));
  console.log('  HireAgent 惊艳度评估 — LLM-as-Judge (DeepSeek)');
  console.log('═'.repeat(60));
  console.log('');

  let totalScore = 0;
  let count = 0;

  // DSP-1
  for (const sample of DSP1_SAMPLES) {
    console.log(`\n🎯 ${sample.label}`);
    console.log(`  期望 ≥ ${sample.min_score}`);
    console.log('  模拟 Engine 调用中...');
    const output = await simulateEngine(sample.input);
    console.log(`  输出 (前 200 字): ${output.slice(0, 200)}...`);
    const { score, reasoning } = await judgeBrilliance(sample.label, sample.expected_behavior, output);
    console.log(`  📊 惊艳度: ${score}/5 ${score >= sample.min_score ? '✅' : '❌'}`);
    console.log(`  💬 ${reasoning}`);
    totalScore += score;
    count++;
  }

  // DSP-2
  for (const sample of DSP2_SAMPLES) {
    console.log(`\n🎯 ${sample.label}`);
    console.log(`  期望 ≥ ${sample.min_score}`);
    console.log('  模拟 Engine 调用中...');
    const output = await simulateEngine(sample.input);
    console.log(`  输出 (前 200 字): ${output.slice(0, 200)}...`);
    const { score, reasoning } = await judgeBrilliance(sample.label, sample.expected_behavior, output);
    console.log(`  📊 惊艳度: ${score}/5 ${score >= sample.min_score ? '✅' : '❌'}`);
    console.log(`  💬 ${reasoning}`);
    totalScore += score;
    count++;
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  平均惊艳度: ${(totalScore / count).toFixed(1)}/5`);
  console.log(`  DSP-1 达标: ${DSP1_SAMPLES.length ? '见上' : 'N/A'}`);
  console.log(`  DSP-2 达标: ${DSP2_SAMPLES.length ? '见上' : 'N/A'}`);
  console.log('═'.repeat(60));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
