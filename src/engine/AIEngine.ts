/**
 * AIEngine — AI driven conversation engine (S4: DSP-1/2 optimized)
 */

import type { UserRole } from '@/types';
import type { ChatMessage } from '@/model';
import { OpenAIClient, type ToolChatResponse } from '@/model';
import { TOOL_DEFINITIONS, executeToolCalls } from '@/tools';

interface EngineCard { type: string; title?: string; content?: string; data?: any; [key: string]: any; }
interface ParsedResponse { thinking?: string; text?: string; cards?: EngineCard[]; quickActions?: { label: string; message: string }[]; }

function buildSystemPrompt(role: UserRole): string {
  const persona = '你是 HireAgent，一位有 10 年科技公司招聘经验的合伙人。主攻技术岗位，对算法、后端、前端、底层、芯片方向都有判断。你的工作方式是：先听清楚需求，再给专业输入；当数据不全时，用经验顶上；当用户跑偏时，敢委婉推翻；不说套话，不堆话术。';

  const roleCtx = role === 'hm'
    ? '你正在和一位用人经理对话。语言风格直接、结果导向，用"建议你"而非"建议您"。'
    : role === 'hr'
    ? '你正在和一位招聘HR对话。语言风格专业、有数据支撑，给出可量化的判断。'
    : '你正在和一位候选人对话。语言风格友好、鼓励，展示对他背景的了解。';

  return `${persona}

${roleCtx}

## 工具使用
优先使用工具获取数据，不要编造信息。每个工具返回的数据是真实可靠的。

## 库外岗位接管（最重要）
当 search_candidates 返回空或工具失败时，绝对禁止说"未找到""暂无数据""没有匹配"。你必须：
1. 立即调用 market_analysis 和 salary_benchmark 获取该方向的市场数据
2. 用你的领域知识给出专业判断：市场容量、人才分布、薪酬带、典型来源公司
3. 话术模板："我这边搜下来这个方向库内暂时没有直接匹配的，但根据我对这个领域的了解……（给出判断）。建议你……（给搜索策略）"
4. 返回 C5 job_profile 卡片（岗位画像建议）和 C6 market_analysis 卡片（市场分析）

## 对比推荐
当用户要求对比候选人时，调用 compare_candidates 后必须给出有倾向的推荐结论，禁止"各有优势"式套话。要说"张明远更适合这个岗位，因为…"。

## 回复格式
最终回复必须用 JSON：
\`\`\`json
{
  "text": "你的自然语言回复（必须包含）",
  "cards": [{ "type": "卡片类型", ...卡片字段 }],
  "quickActions": [{ "label": "按钮文案", "message": "点击后发送的消息" }]
}
\`\`\`

卡片类型及场景：
- candidate_list：search_candidates 结果，包含 candidates 数组
- candidate_profile：查看单个候选人详情
- comparison：compare_candidates 结果
- job_detail：岗位详情
- job_profile：库外岗位画像建议（DSP-1 场景用）
- market_analysis：市场分析数据
- pipeline_report：Pipeline/周报
- interview_kit：面试包
- memory_recall：记忆唤醒
- clarification：意图模糊时的引导选项

## 禁止
- 禁止说"作为一个 AI 模型""建议您""我可以帮您"等套话
- 禁止裸返回"未找到""暂无数据"
- 禁止在 search_candidates 返回空时直接放弃
- 禁止编造候选人名字或虚假数据`;
}

const MAX_ITER = 3;

export interface AIEngineResult { responses: EngineCard[]; thinkingSteps?: string[]; }

export class AIEngine {
  private role: UserRole;
  private client: OpenAIClient | null = null;
  private history: ChatMessage[] = [];

  constructor(role: UserRole, apiKey?: string, baseUrl?: string, model?: string) {
    this.role = role;
    if (apiKey) {
      this.client = new OpenAIClient({
        apiKey, baseUrl: baseUrl || 'https://api.deepseek.com',
        model: model || 'deepseek-chat', temperature: 0.7, maxTokens: 4000,
      });
    }
  }

  isConfigured(): boolean { return this.client !== null; }

  getWelcomeMessage(): { type: string; content: string } {
    const m: Record<UserRole, string> = {
      hm: '你好！我是 HireAgent，你的 AI 招聘合伙人。\\n\\n我可以帮你：\\n· 搜索和筛选候选人\\n· 查看 Pipeline 和数据\\n· 撰写 JD\\n· 对标薪酬\\n· 对比候选人\\n· 生成消息模板和面试题\\n· 分析风险\\n\\n直接告诉我你需要什么。',
      hr: '你好！我是 HireAgent，你的 AI 招聘助手。\\n\\n我可以帮你：\\n· 全局 Pipeline 监控\\n· 搜索和筛选候选人\\n· 招聘数据分析\\n· 生成沟通模板\\n· 薪酬对标\\n\\n直接告诉我你需要什么。',
      candidate: '你好！我是 HireAgent，你的 AI 职业顾问。\\n\\n我可以帮你：\\n· 发现匹配的岗位\\n· 查看申请进度\\n· 面试准备建议\\n· 简历优化建议\\n· 了解目标团队\\n\\n直接告诉我你感兴趣的方向。',
    };
    return { type: 'text', content: m[this.role] };
  }

  async processInput(userInput: string): Promise<AIEngineResult> {
    if (!this.client) return { responses: [{ type: 'text', role: 'agent', content: '请在 .env 设置 VITE_DEEPSEEK_API_KEY' }] };
    const sm: ChatMessage = { role: 'system', content: buildSystemPrompt(this.role) };
    this.history.push({ role: 'user', content: userInput });
    try {
      const resp = await this.toolCallLoop([sm, ...this.history]);
      const parsed = this.parseResponse(resp.content || '');
      this.history.push({ role: 'assistant', content: resp.content || '' });
      return { responses: this.buildCards(parsed), thinkingSteps: parsed.thinking ? [parsed.thinking] : undefined };
    } catch (err) {
      return { responses: [{ type: 'text', role: 'agent', content: 'Error: ' + (err instanceof Error ? err.message : '') }] };
    }
  }

  private async toolCallLoop(msgs: ChatMessage[]): Promise<ToolChatResponse> {
    let cur = [...msgs];
    for (let i = 0; i < MAX_ITER; i++) {
      const r = await this.client!.chatWithTools(cur, TOOL_DEFINITIONS);
      if (!r.toolCalls || r.toolCalls.length === 0) return r;
      cur.push({ role: 'assistant', content: r.content || '', tool_calls: r.toolCalls });
      for (const tr of executeToolCalls(r.toolCalls)) cur.push({ role: 'tool', content: tr.content, tool_call_id: tr.tool_call_id });
    }
    cur.push({ role: 'user', content: '请基于工具返回数据给出最终回复。' });
    return await this.client!.chatWithTools(cur, TOOL_DEFINITIONS);
  }

  private parseResponse(content: string): ParsedResponse {
    try {
      const m = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (m) return JSON.parse(m[1]);
      const s = content.indexOf('{'), e = content.lastIndexOf('}');
      if (s !== -1 && e > s) return JSON.parse(content.substring(s, e + 1));
      return { text: content };
    } catch { return { text: content }; }
  }

  private buildCards(parsed: ParsedResponse): EngineCard[] {
    const WR = new Set(['candidate_card', 'profile_card', 'analytics']);
    const cards: EngineCard[] = [];
    if (parsed.text) cards.push({ type: 'text', role: 'agent', content: parsed.text });
    if (parsed.cards) for (const c of parsed.cards) {
      if (c.data && typeof c.data === 'object' && !WR.has(c.type)) { const { data, ...r } = c; cards.push({ ...r, ...data }); }
      else cards.push(c);
    }
    if (parsed.quickActions?.length) cards.push({ type: 'quick_actions', title: '快捷操作', actions: parsed.quickActions });
    return cards;
  }

  clearHistory(): void { this.history = []; }
  setRole(r: UserRole): void { this.role = r; this.clearHistory(); }
}
