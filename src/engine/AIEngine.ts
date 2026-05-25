/**
 * AIEngine — AI driven conversation engine (S5: Memory integration).
 *
 * S4 的 DSP-1/2 prompt 优化 + S5 的三层记忆 autoRecall / autoSave。
 */

import type { UserRole } from '@/types';
import type { ChatMessage } from '@/model';
import { OpenAIClient, type ToolChatResponse } from '@/model';
import { TOOL_DEFINITIONS, executeToolCalls, type ToolCall, type ToolDefinition, type ToolResult } from '@/tools';
import type { MemoryAdapter } from '@/memory';

// ══════════════════════════════════════════
// Memory tool definitions (S5)
// ══════════════════════════════════════════

const MEMORY_TOOL_DEFS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'memory_recall',
      description:
        '从记忆层召回相关信息。当需要上下文时主动调用。layer: session=当前会话, user=用户偏好, candidate=候选人记忆。candidate 层需传 candidate_id。',
      parameters: {
        type: 'object',
        properties: {
          layer: {
            type: 'string',
            enum: ['session', 'user', 'candidate'],
            description: '召回层级',
          },
          query: { type: 'string', description: '查询关键词' },
          candidate_id: { type: 'string', description: '候选人ID(layer=candidate必填)' },
        },
        required: ['layer', 'query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'memory_write',
      description:
        '将关键信息写入记忆层。当用户提到候选人关键信息(薪资/offer/偏好/面试评价)时主动调用。layer: candidate=候选人备注, user=用户偏好, session=会话摘要。candidate 层需传 entity_id(candidate_id)。',
      parameters: {
        type: 'object',
        properties: {
          layer: {
            type: 'string',
            enum: ['session', 'user', 'candidate'],
            description: '写入层级',
          },
          entity_id: { type: 'string', description: '关联实体ID(candidate层传candidate_id)' },
          content: { type: 'string', description: '要记住的内容' },
          source: {
            type: 'string',
            enum: ['user', 'llm', 'system'],
            description: '信息来源',
          },
        },
        required: ['layer', 'content'],
      },
    },
  },
];

const ALL_TOOL_DEFS = [...TOOL_DEFINITIONS, ...MEMORY_TOOL_DEFS];

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

interface EngineCard { type: string; title?: string; content?: string; data?: any; [key: string]: any; }
interface ParsedResponse { thinking?: string; text?: string; cards?: EngineCard[]; quickActions?: { label: string; message: string }[]; }

// ══════════════════════════════════════════
// System Prompt
// ══════════════════════════════════════════

function buildSystemPrompt(role: UserRole, memoryCtx?: string): string {
  const persona = '你是 HireAgent，一位有 10 年科技公司招聘经验的合伙人。主攻技术岗位，对算法、后端、前端、底层、芯片方向都有判断。你的工作方式是：先听清楚需求，再给专业输入；当数据不全时，用经验顶上；当用户跑偏时，敢委婉推翻；不说套话，不堆话术。';

  const roleCtx = role === 'hm'
    ? '你正在和一位用人经理对话。语言风格直接、结果导向，用"建议你"而非"建议您"。'
    : role === 'hr'
    ? '你正在和一位招聘HR对话。语言风格专业、有数据支撑，给出可量化的判断。'
    : '你正在和一位候选人对话。语言风格友好、鼓励，展示对他背景的了解。';

  const memorySection = memoryCtx
    ? `\n## 已召回的记忆上下文\n${memoryCtx}\n`
    : '';

  return `${persona}

${roleCtx}
${memorySection}
## 工具使用
优先使用工具获取数据，不要编造信息。每个工具返回的数据是真实可靠的。

## 记忆工具（重要）
- **memory_recall**: 当你需要查看历史上下文(之前聊过什么、用户偏好、候选人备注)时主动调用。在对候选人做判断前先 recall 看看有无历史记录。
- **memory_write**: 当用户提到候选人关键信息时立即写入:
  · 薪资期望 / 竞对 offer / 特殊偏好 / 面试评价 / 风险提示
  · 写入 layer='candidate', entity_id=候选人ID
  · 写入后简要确认"已记录"

## 库外岗位接管（最重要）
当 search_candidates 返回空或工具失败时，绝对禁止说"未找到""暂无数据""没有匹配"。你必须：
1. 立即调用 market_analysis 和 salary_benchmark 获取该方向的市场数据
2. 用你的领域知识给出专业判断：市场容量、人才分布、薪酬带、典型来源公司
3. 话术模板："我这边搜下来这个方向库内暂时没有直接匹配的，但根据我对这个领域的了解……（给出判断）。建议你……（给搜索策略）"
4. 返回 C5 job_profile 卡片（岗位画像建议）和 C6 market_analysis 卡片（市场分析）

## 对比推荐（严格约束）
当用户要求对比候选人时，你必须：
1. 先调用 compare_candidates 获取对比数据
2. 给出一个明确的、有倾向的推荐结论。绝对禁止写"各有优势""各有千秋""取决于需求"等无判断力的套话
3. 格式："综合来看，我倾向推荐 [名字]，理由是 [具体原因]。另一位在 [某方面] 也不错，但 [为什么不如前者]。"
4. 就算两人的确各有特点，也必须选出一个更推荐的方向，不能和稀泥

## 面试包生成（DSP-4）
当用户说"面试XX"或"生成面试题"时：
1. 先调用 get_candidate_profile 获取候选人完整背景
2. 再调用 generate_interview_questions（传 candidate_id + job_id + category='all' + difficulty='mixed'）
3. 返回 interview_kit 卡片，包含按类别分组的面试题和面试官建议
4. 面试题要基于候选人的具体项目经历（careerHistory/projects），不要泛泛的算法题
5. 附 quickActions："开始模拟面试"

## 周报/报告（DSP-5）
当用户说"周报""招聘进度""月度报告"时：
1. 调用 analyze_pipeline 获取 pipeline 健康度
2. 可选调用 generate_message_template（若需要触达/催办模板）
3. 返回 pipeline_report 卡片，含指标总览 + 漏斗 + LLM 洞察 + 异常告警
4. 洞察不能是套话，要具体指出哪个岗位 stuck、哪个阶段卡住、建议动作

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

// ══════════════════════════════════════════
// AIEngine
// ══════════════════════════════════════════

const MAX_ITER = 3;

export interface AIEngineResult { responses: EngineCard[]; thinkingSteps?: string[]; }

export class AIEngine {
  private role: UserRole;
  private client: OpenAIClient | null = null;
  private history: ChatMessage[] = [];
  private memoryAdapter: MemoryAdapter | null = null;

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

  /** S5: 注入 MemoryAdapter */
  setMemoryAdapter(adapter: MemoryAdapter): void { this.memoryAdapter = adapter; }

  getWelcomeMessage(): { type: string; content: string } {
    const m: Record<UserRole, string> = {
      hm: `你好！我是 HireAgent，你的 AI 招聘合伙人。

我可以帮你：
· 搜索和筛选候选人
· 查看 Pipeline 和数据
· 撰写 JD
· 对标薪酬
· 对比候选人
· 生成消息模板和面试题
· 分析风险

直接告诉我你需要什么。`,
      hr: `你好！我是 HireAgent，你的 AI 招聘助手。

我可以帮你：
· 全局 Pipeline 监控
· 搜索和筛选候选人
· 招聘数据分析
· 生成沟通模板
· 薪酬对标

直接告诉我你需要什么。`,
      candidate: `你好！我是 HireAgent，你的 AI 职业顾问。

我可以帮你：
· 发现匹配的岗位
· 查看申请进度
· 面试准备建议
· 简历优化建议
· 了解目标团队

直接告诉我你感兴趣的方向。`,
    };
    return { type: 'text', content: m[this.role] };
  }

  async processInput(userInput: string): Promise<AIEngineResult> {
    if (!this.client) return { responses: [{ type: 'text', role: 'agent', content: '请在 .env 设置 VITE_DEEPSEEK_API_KEY' }] };

    // ── S5: autoRecall — 注入记忆上下文 ──
    let memoryCtx: string | undefined;
    if (this.memoryAdapter) {
      try {
        // 召回 session 级记忆
        const sessionRecall = await this.memoryAdapter.recall({
          layer: 'session',
          query: this.role + ' ' + userInput,
          limit: 3,
        });
        if (sessionRecall.ok && sessionRecall.data && sessionRecall.data.length > 0) {
          memoryCtx = '[历史对话] ' + sessionRecall.data.map((m) => m.summary).join(' | ');
        }

        // 尝试从用户输入提取候选人名，召回 candidate 记忆
        const nameMatch = userInput.match(/张三|李四|王五|张明远|李雨桐|钱一鸣|陈晓|赵磊|刘洋/g);
        if (nameMatch) {
          // 简单映射：名字 → candidate_id（从 src/data/resumes.json 的 id 对齐）
          const nameToId: Record<string, string> = {
            '张三': 'res_007', '张明远': 'res_001', '李雨桐': 'res_002',
            '钱一鸣': 'res_021', '李四': 'res_004', '王五': 'res_005',
            '陈晓': 'res_006', '赵磊': 'res_008', '刘洋': 'res_009',
          };
          for (const name of nameMatch) {
            const cid = nameToId[name];
            if (!cid) continue;
            const candidateRecall = await this.memoryAdapter.recall({
              layer: 'candidate',
              query: name,
              candidate_id: cid,
              limit: 5,
            });
            if (candidateRecall.ok && candidateRecall.data && candidateRecall.data.length > 0) {
              const ctx = candidateRecall.data.map((m) => m.summary).join(' | ');
              memoryCtx = memoryCtx
                ? memoryCtx + '\n[关于' + name + '] ' + ctx
                : '[关于' + name + '] ' + ctx;
            }
          }
        }
      } catch {
        // autoRecall 失败不影响主流程
      }
    }

    const systemContent = buildSystemPrompt(this.role, memoryCtx);
    const sm: ChatMessage = { role: 'system', content: systemContent };
    this.history.push({ role: 'user', content: userInput });

    try {
      const resp = await this.toolCallLoop([sm, ...this.history]);
      const parsed = this.parseResponse(resp.content || '');
      this.history.push({ role: 'assistant', content: resp.content || '' });

      // ── S5: autoSave — 保存本轮对话到 session memory ──
      if (this.memoryAdapter) {
        try {
          await this.memoryAdapter.write({
            layer: 'session',
            entity_id: 'default-session',
            content: `[user] ${userInput.slice(0, 200)} → [agent] ${(parsed.text || resp.content || '').slice(0, 200)}`,
            source: 'system',
          });
        } catch {
          // autoSave 失败不影响
        }
      }

      return { responses: this.buildCards(parsed), thinkingSteps: parsed.thinking ? [parsed.thinking] : undefined };
    } catch (err) {
      return { responses: [{ type: 'text', role: 'agent', content: 'Error: ' + (err instanceof Error ? err.message : '') }] };
    }
  }

  private async toolCallLoop(msgs: ChatMessage[]): Promise<ToolChatResponse> {
    let cur = [...msgs];
    for (let i = 0; i < MAX_ITER; i++) {
      const r = await this.client!.chatWithTools(cur, ALL_TOOL_DEFS);
      if (!r.toolCalls || r.toolCalls.length === 0) return r;

      cur.push({ role: 'assistant', content: r.content || '', tool_calls: r.toolCalls });

      // ── S5: 分离 memory 工具调用 ──
      const memoryCalls = r.toolCalls.filter(
        (tc) => (tc.function.name === 'memory_recall' || tc.function.name === 'memory_write') && this.memoryAdapter,
      );
      const standardCalls = r.toolCalls.filter(
        (tc) => !(tc.function.name === 'memory_recall' || tc.function.name === 'memory_write') || !this.memoryAdapter,
      );

      // 执行 memory 工具
      const memoryResults: ToolResult[] = [];
      for (const tc of memoryCalls) {
        memoryResults.push(await this.executeMemoryTool(tc));
      }

      // 执行标准工具
      const standardResults = standardCalls.length > 0 ? executeToolCalls(standardCalls) : [];

      const results = [...memoryResults, ...standardResults];
      for (const tr of results) {
        cur.push({ role: 'tool', content: tr.content, tool_call_id: tr.tool_call_id });
      }
    }
    cur.push({ role: 'user', content: '请基于工具返回数据给出最终回复。' });
    return await this.client!.chatWithTools(cur, ALL_TOOL_DEFS);
  }

  /** S5: 路由 memory 工具到 MemoryAdapter */
  private async executeMemoryTool(call: ToolCall): Promise<ToolResult> {
    try {
      const args = JSON.parse(call.function.arguments);
      if (call.function.name === 'memory_recall') {
        const result = await this.memoryAdapter!.recall({
          layer: args.layer || 'session',
          query: args.query || '',
          candidate_id: args.candidate_id,
          limit: args.limit ?? 5,
        });
        return {
          tool_call_id: call.id,
          role: 'tool',
          content: JSON.stringify(result.data ?? []),
        };
      } else {
        // memory_write
        const result = await this.memoryAdapter!.write({
          layer: args.layer || 'candidate',
          entity_id: args.entity_id,
          content: args.content || '',
          source: args.source || 'llm',
        });
        return {
          tool_call_id: call.id,
          role: 'tool',
          content: JSON.stringify({ ok: result.ok, hint: result.hint, id: result.data?.id }),
        };
      }
    } catch (err) {
      return {
        tool_call_id: call.id,
        role: 'tool',
        content: JSON.stringify({ error: 'Memory tool failed: ' + (err instanceof Error ? err.message : '') }),
      };
    }
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
