/**
 * AIEngine — AI driven conversation engine (S5: Memory integration).
 *
 * S4 的 DSP-1/2 prompt 优化 + S5 的三层记忆 autoRecall / autoSave。
 */

import type { UserRole } from '@/types';
import type { ChatMessage } from '@/model';
import { OpenAIClient, type ToolChatResponse } from '@/model';
import { TOOL_REGISTRY, type ToolCall, type ToolDefinition, type ToolResult } from '@/tools';
import type { MemoryAdapter } from '@/memory';
import { TOOL_SPECS } from '@/contracts';

// ══════════════════════════════════════════
// Memory tool definitions (S5)
// ══════════════════════════════════════════

function toolSpecToDefinition(spec: (typeof TOOL_SPECS)[number]): ToolDefinition {
  const properties: ToolDefinition['function']['parameters']['properties'] = {};
  const required: string[] = [];
  for (const [name, field] of Object.entries(spec.parameters)) {
    properties[name] = {
      type: field.type,
      description: field.description,
      ...(field.enum ? { enum: field.enum } : {}),
      ...(field.items ? { items: { type: field.items.type } } : {}),
    };
    if (field.required) required.push(name);
  }
  return {
    type: 'function',
    function: {
      name: spec.name,
      description: spec.description,
      parameters: { type: 'object', properties, required },
    },
  };
}

const ALL_TOOL_DEFS = TOOL_SPECS.map(toolSpecToDefinition);
const TOOL_DEFS_BY_NAME = new Map(ALL_TOOL_DEFS.map((tool) => [tool.function.name, tool]));
const CORE_TOOL_NAMES = ['memory_recall'] as const;
const DEFAULT_TOOL_NAMES = ['search_candidates', 'get_candidate_profile', 'list_jobs', 'analyze_pipeline'] as const;
const RECENT_HISTORY_LIMIT = 8;

function selectToolDefsForInput(input: string): ToolDefinition[] {
  const text = input.toLowerCase();
  const names = new Set<string>(CORE_TOOL_NAMES);

  const add = (...toolNames: string[]) => toolNames.forEach((name) => names.add(name));
  const includesAny = (pattern: RegExp) => pattern.test(text) || pattern.test(input);

  if (includesAny(/候选人|简历|搜索|筛选|找人|推荐|人才|candidate|resume|search|字节|阿里|腾讯|美团|百度|快手/)) {
    add('search_candidates', 'get_candidate_profile', 'compare_candidates');
  }
  if (includesAny(/对比|比较|compare|谁更|哪个更|差异|优劣/)) {
    add('search_candidates', 'get_candidate_profile', 'compare_candidates');
  }
  if (includesAny(/薪酬|salary|offer|package|预算|年包|期权|对标|谈薪/)) {
    add('salary_benchmark', 'get_candidate_profile', 'market_analysis');
  }
  if (includesAny(/pipeline|周报|月报|进度|漏斗|卡住|风险岗位|招聘数据|报告|report/)) {
    add('analyze_pipeline', 'generate_report', 'list_jobs');
  }
  if (includesAny(/面试|题|interview|模拟|评分|面试包/)) {
    add('interview_kit_prepare', 'get_candidate_profile', 'search_candidates');
  }
  if (includesAny(/市场|供给|人才地图|稀缺|竞争|bsp|嵌入式|推荐算法|算法|后端|前端|芯片|market/)) {
    add('market_analysis', 'salary_benchmark', 'search_candidates', 'list_jobs');
  }
  if (includesAny(/岗位|jd|hc|职位|团队|在招|job|headcount/)) {
    add('list_jobs', 'get_job_detail', 'search_candidates', 'market_analysis');
  }
  if (includesAny(/记住|备注|以后|偏好|反馈|评价|薪资|offer|package|暂停|拒绝/)) {
    add('memory_write');
  }

  if (names.size === CORE_TOOL_NAMES.length) add(...DEFAULT_TOOL_NAMES);

  return Array.from(names)
    .map((name) => TOOL_DEFS_BY_NAME.get(name))
    .filter((tool): tool is ToolDefinition => Boolean(tool));
}

function normalizeScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return score > 1 ? Math.max(0, Math.min(1, score / 100)) : Math.max(0, Math.min(1, score));
}

function inferPosition(title?: string): string {
  return (title || '').split(/[—-]/)[0]?.trim() || '';
}

function buildComparisonRecommendation(result: any): string {
  const a = result?.candidate_a?.name || '候选人A';
  const b = result?.candidate_b?.name || '候选人B';
  const advantages = result?.dimensions?.reduce((acc: { a: number; b: number }, d: any) => {
    if (d.advantage === 'a') acc.a += 1;
    if (d.advantage === 'b') acc.b += 1;
    return acc;
  }, { a: 0, b: 0 }) || { a: 0, b: 0 };
  if (advantages.a > advantages.b) return `如果优先看确定性和履历厚度，建议先推进 ${a}；${b} 可以作为备选或补充面试。`;
  if (advantages.b > advantages.a) return `如果优先看性价比和当前匹配度，建议先推进 ${b}；${a} 适合更高阶或更复杂的岗位。`;
  return `${a} 和 ${b} 各有优势，建议用一轮结构化面试验证项目深度、落地能力和薪酬可谈空间后再定。`;
}

// ══════════════════════════════════════════
// Types
// ══════════════════════════════════════════

interface EngineCard { type: string; title?: string; content?: string; data?: any; [key: string]: any; }

// 工具→卡片映射：当 LLM 省略卡片时，Engine 自动注入
const TOOL_CARD_MAP: Record<string, string> = {
  search_candidates: 'candidate_list',
  get_candidate_profile: 'candidate_profile',
  compare_candidates: 'comparison',
  analyze_pipeline: 'pipeline_report',
  market_analysis: 'market_analysis',
  salary_benchmark: 'salary_benchmark',
  list_jobs: 'job_detail',
  get_job_detail: 'job_detail',
  generate_message_template: 'message_template',
  generate_interview_questions: 'interview_questions',
  analyze_candidate_risk: 'risk_analysis',
  analyze_team: 'team_diagnosis',
  interview_kit_prepare: 'interview_kit',
  generate_report: 'pipeline_report',
  memory_recall: 'memory_recall',
};

interface ToolCallRecord { name: string; result: any; }
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
优先使用工具获取数据，不要编造信息。

## 记忆工具
- memory_recall: 需要查看历史上下文时主动调用
- memory_write: 候选人关键信息立即写入

## 库外岗位接管
search_candidates 返回空时，用领域知识给专业判断，禁止说"未找到"。

## ⚠️ 卡片输出强制规则（违反=失败）
	每次调用工具获取数据后，必须在 cards 数组中包含对应类型的卡片：
	- search_candidates → candidate_list
	- get_candidate_profile → candidate_profile
	- compare_candidates → comparison
	- analyze_pipeline → pipeline_report
	- market_analysis → market_analysis
	- salary_benchmark → salary_benchmark
	- list_jobs / get_job_detail → job_detail
	- interview_kit_prepare → interview_kit
	- generate_report → pipeline_report
	- memory_recall → memory_recall

禁止用纯文本代替卡片！即使数据简单也必须输出对应卡片。

正确示例：
\`\`\`json
{"text":"找到3位候选人……","cards":[{"type":"candidate_list","title":"搜索结果","data":{"candidates":[...]}}]}
\`\`\`

## 回复格式
最终回复必须用 JSON：
\`\`\`json
{"text":"你的自然语言回复（必须包含）","cards":[{"type":"...","data":{...}}],"quickActions":[{"label":"按钮","message":"消息"}]}
\`\`\`

	可用卡片类型: candidate_list, candidate_profile, comparison, job_detail, job_profile, market_analysis, pipeline_report, interview_kit, memory_recall, clarification

## 禁止
- 禁止 search_candidates 结果只用纯文本不用 candidate_list 卡片
- 禁止裸返回"未找到"
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
        model: model || 'deepseek-chat', temperature: 0.7, maxTokens: 2200,
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
      const selectedTools = selectToolDefsForInput(userInput);
      const recentHistory = this.history.slice(-RECENT_HISTORY_LIMIT);
      const { response: resp, toolRecords } = await this.toolCallLoop([sm, ...recentHistory], selectedTools);
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

      const cards = this.buildCards(parsed);
      // ── 确定性卡片兜底：LLM 省略卡片时自动注入 ──
      this.injectMissingCards(cards, toolRecords);

      return { responses: cards, thinkingSteps: parsed.thinking ? [parsed.thinking] : undefined };
    } catch {
      return { responses: [{ type: 'text', role: 'agent', content: '这轮数据暂时没跑顺。我先稳妥处理：你可以换个更具体的岗位、候选人名或报告范围，我会基于现有招聘经验继续给判断，不会让你卡在系统错误上。' }] };
    }
  }

  private async toolCallLoop(msgs: ChatMessage[], toolDefs: ToolDefinition[]): Promise<{ response: ToolChatResponse; toolRecords: ToolCallRecord[] }> {
    let cur = [...msgs];
    const toolRecords: ToolCallRecord[] = [];
    for (let i = 0; i < MAX_ITER; i++) {
      const r = await this.client!.chatWithTools(cur, toolDefs);
      if (!r.toolCalls || r.toolCalls.length === 0) return { response: r, toolRecords };

      cur.push({ role: 'assistant', content: r.content || '', tool_calls: r.toolCalls });

      const results: ToolResult[] = [];
      const callsForRecords: ToolCall[] = [];
      for (const tc of r.toolCalls) {
        const isMemoryCall = tc.function.name === 'memory_recall' || tc.function.name === 'memory_write';
        const result = isMemoryCall && this.memoryAdapter
          ? await this.executeMemoryTool(tc)
          : await this.executeRegistryTool(tc);
        results.push(result);
        callsForRecords.push(tc);
      }
      for (const tr of results) {
        cur.push({ role: 'tool', content: tr.content, tool_call_id: tr.tool_call_id });
      }
      // 记录工具调用结果（用于卡片兜底）
      for (let si = 0; si < callsForRecords.length; si++) {
        const name = callsForRecords[si].function.name;
        if (TOOL_CARD_MAP[name]) {
          try { toolRecords.push({ name, result: JSON.parse(results[si].content) }); } catch {}
        }
      }
    }
    cur.push({ role: 'user', content: '请基于工具返回数据给出最终回复。' });
    const finalResp = await this.client!.chat(cur);
    return { response: { content: finalResp.content, toolCalls: null, usage: finalResp.usage }, toolRecords };
  }

  private async executeRegistryTool(call: ToolCall): Promise<ToolResult> {
    try {
      const args = JSON.parse(call.function.arguments || '{}');
      const handler = TOOL_REGISTRY[call.function.name];
      if (!handler) {
        return {
          tool_call_id: call.id,
          role: 'tool',
          content: JSON.stringify({ ok: false, hint: `工具 ${call.function.name} 暂未接入。` }),
        };
      }
      const result = await handler(args);
      return {
        tool_call_id: call.id,
        role: 'tool',
        content: JSON.stringify(result),
      };
    } catch {
      return {
        tool_call_id: call.id,
        role: 'tool',
        content: JSON.stringify({ ok: false, hint: '工具暂时执行不顺，我会基于已有信息先给你专业判断。' }),
      };
    }
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
    const ARR_KEYS = ['candidates', 'skills', 'career', 'projects', 'tech_stack', 'highlights',
      'requirements', 'nice_to_have', 'pipeline', 'dimensions', 'tags', 'alerts',
      'categories', 'questions', 'items', 'options', 'actions', 'insights',
      'benchmarks', 'funnel', 'data', 'interview_history', 'match_highlights', 'gap_points',
      'careerHistory', 'notes'];
    // WR 兜底：覆盖旧 ProfileCard / CandidateCard / AnalyticsCard 需要的所有字段
    const WR_DEFAULTS: Record<string, any> = {
      matchHighlights: [], gapPoints: [], tags: [], avatar: null,
      experience: 0, education: '', salary: '', matchScore: 0,
      skills: [], careerHistory: [], notes: [], name: '',
      currentCompany: '', currentTitle: '',
    };
    const cards: EngineCard[] = [];
    if (parsed.text) cards.push({ type: 'text', role: 'agent', content: parsed.text });
    if (parsed.cards) for (const c of parsed.cards) {
      if ((c as any).card_type) {
        cards.push(c);
        continue;
      }
      if (c.data && typeof c.data === 'object' && !WR.has(c.type)) {
        const { data, ...r } = c;
        for (const key of ARR_KEYS) {
          if (data[key] === undefined || data[key] === null) (data as any)[key] = [];
        }
        cards.push({ ...r, ...data });
      }
      else {
        if (WR.has(c.type)) {
          // 确保 data 存在；LLM 可能把字段直接挂在 c 上，没有 data 包裹
          if (!c.data || typeof c.data !== 'object') {
            // 从 c 平级提取已知字段
            const raw: any = {};
            for (const [k, v] of Object.entries(c)) {
              if (k !== 'type' && k !== 'data') raw[k] = v;
            }
            c.data = raw;
          }
          // 兜底缺失字段
          for (const [key, def] of Object.entries(WR_DEFAULTS)) {
            if (c.data[key] === undefined || c.data[key] === null) {
              c.data[key] = def;
            }
          }
        } else {
          // 非 WR 卡片：兜底数组字段，防止 undefined.map() crash
          for (const key of ARR_KEYS) {
            if ((c as any)[key] === undefined || (c as any)[key] === null) (c as any)[key] = [];
          }
        }
        cards.push(c);
      }
    }
    if (parsed.quickActions?.length) cards.push({ type: 'quick_actions', title: '快捷操作', actions: parsed.quickActions });
    return cards;
  }

  /** 确定性卡片兜底：LLM 省略卡片时，从工具结果自动构造 */
  private injectMissingCards(cards: EngineCard[], toolRecords: ToolCallRecord[]): void {
    const existingTypes = new Set(cards.map(c => c.type));
    for (const rec of toolRecords) {
      const expectedCard = TOOL_CARD_MAP[rec.name];
      if (!expectedCard || existingTypes.has(expectedCard)) continue;
      const payload = rec.result?.ok === false ? rec.result : (rec.result?.data ?? rec.result);

      const card = this.buildCardFromToolResult(rec.name, expectedCard, payload, rec.result?.hint);
      if (card) {
        cards.push(card);
        existingTypes.add(expectedCard);
      }
    }
  }

  /** 从工具结果构造卡片 */
  private buildCardFromToolResult(toolName: string, _cardType: string, result: any, hint?: string): EngineCard | null {
    const base = (card_type: string, title: string, mode: 'live' | 'empty' | 'error' = 'live') => ({
      card_type,
      type: card_type === 'candidate_profile' ? 'profile_card' : card_type === 'job_detail' ? 'jd_card' : card_type === 'pipeline_report' ? 'pipeline_overview' : card_type,
      mode,
      title,
      empty_hint: hint || '这次没有拿到足够数据，我建议先放宽条件或换一个相邻方向继续看。',
      error_hint: hint || '数据暂时拿不到，我会基于已有信息先给你专业判断。',
      actions: [] as Array<{ label: string; message: string; variant?: 'primary' | 'secondary' }>,
      timestamp: Date.now(),
    });

    if (result?.ok === false) {
      return {
        ...base(_cardType, '需要换个角度推进', 'error'),
        prompt: result.hint || hint || '这次数据没取到，建议换个条件继续。',
        options: [
          { label: '放宽条件', message: '帮我放宽条件再试一次' },
          { label: '看市场情况', message: '先帮我看这个方向的市场情况' },
        ],
      };
    }

    switch (toolName) {
      case 'search_candidates':
        if (!Array.isArray(result) || result.length === 0) {
          return {
            ...base('clarification', '没有完全匹配的人选', 'empty'),
            prompt: hint || '我这边没有搜到完全匹配的人选。可以放宽经验、公司或城市限制，也可以先看相邻方向。',
            options: [
              { label: '放宽筛选', message: '放宽条件重新搜索' },
              { label: '看市场分析', message: '先看这个方向的人才市场' },
            ],
          };
        }
        return {
          ...base('candidate_list', `匹配候选人 (${result.length}人)`),
          candidates: result.map((c: any) => ({
            ...c,
            match_score: normalizeScore(c.match_score),
          })),
          sortable: true,
          filterable: true,
          actions: [
            { label: '对比前两位', message: `对比 ${result[0]?.name} 和 ${result[1]?.name}`, variant: 'primary' },
            { label: '继续收窄', message: '按大厂背景和落地能力继续筛选' },
          ],
        };
      case 'analyze_pipeline':
        return this.buildPipelineReportCard(result, hint);
      case 'market_analysis':
        return {
          ...base('market_analysis', result.title || '市场分析', result.data?.length ? 'live' : 'empty'),
          position: inferPosition(result.title) || '目标岗位',
          analysis_type: result.analysis_type || 'supply_demand',
          data: result.data || [],
          insights: result.insights || [],
          chart_type: 'bar',
          actions: [{ label: '看薪酬带', message: `${inferPosition(result.title) || '这个岗位'}的薪酬对标`, variant: 'primary' }],
        };
      case 'salary_benchmark':
        return {
          type: 'salary_benchmark',
          title: result.title || '薪酬对标',
          position: result.position || '',
          benchmarks: (result.benchmarks || []).map((b: any) => ({ ...b, salaryRange: b.salaryRange || b.salary_range })),
          marketMedian: result.market_median ?? result.marketMedian ?? 0,
          recommendation: result.recommendation || hint || '',
        };
      case 'list_jobs':
        if (!Array.isArray(result) || !result[0]) return null;
        return this.buildJobCard(result[0], '在招岗位概览');
      case 'get_job_detail':
        return this.buildJobCard(result, result.title || '岗位详情');
      case 'get_candidate_profile':
        return {
          ...base('candidate_profile', result.name ? `候选人画像 — ${result.name}` : '候选人画像'),
          ...result,
          match_score: normalizeScore(result.match_score ?? 0.86),
          actions: [
            { label: '准备面试包', message: `给${result.name}准备面试包，岗位是推荐算法`, variant: 'primary' },
            { label: '分析风险', message: `分析${result.name}的候选人风险` },
          ],
        };
      case 'compare_candidates':
        return {
          ...base('comparison', '候选人对比'),
          ...result,
          recommendation: result.recommendation || buildComparisonRecommendation(result),
          actions: [
            { label: '约面试', message: `推进${result.candidate_a?.name || '候选人'}进入面试`, variant: 'primary' },
            { label: '看薪酬', message: '查看推荐算法薪酬对标' },
          ],
        };
      case 'interview_kit_prepare':
        return {
          ...base('interview_kit', `面试包 — ${result.candidate_name || '候选人'}`),
          ...result,
          has_mock_interview: true,
          is_demo: true,
          actions: [
            { label: '开始模拟面试', message: `开始${result.candidate_name || '候选人'}的模拟面试`, variant: 'primary' },
            { label: '生成评分表', message: `生成${result.candidate_name || '候选人'}的面试评分表` },
          ],
        };
      case 'generate_report':
        return this.buildReportCard(result, hint);
      case 'memory_recall':
        if (!Array.isArray(result) || result.length === 0) return null;
        return {
          ...base('memory_recall', 'AI 记忆唤醒'),
          recall_context: result.map((m: any) => m.summary).slice(0, 2).join(' | '),
          items: result,
          actions: [
            { label: '生成跟进方案', message: '基于这些记忆生成下一步跟进方案', variant: 'primary' },
          ],
        };
      case 'generate_message_template':
        return { type: 'message_template', title: `${result.template_type || '消息'}模板`, data: result };
      case 'generate_interview_questions':
        return { type: 'interview_questions', title: '面试题', data: result };
      case 'analyze_candidate_risk':
        return { type: 'risk_analysis', title: `${result.candidateName || '候选人'}风险分析`, data: result };
      case 'analyze_team':
        return { type: 'team_diagnosis', title: '团队能力诊断', data: result };
      default:
        return null;
    }
  }

  private buildJobCard(result: any, title: string): EngineCard {
    const pipelineCounts = result.pipeline_counts || {};
    const pipeline = result.pipeline || [
      { stage: '简历筛选', count: pipelineCounts.resume ?? 0, target: Math.max(pipelineCounts.resume ?? 0, 1) },
      { stage: 'HR初筛', count: pipelineCounts.screening ?? 0, target: Math.max(pipelineCounts.screening ?? 0, 1) },
      { stage: '面试', count: pipelineCounts.interview ?? 0, target: Math.max(pipelineCounts.interview ?? 0, 1) },
      { stage: 'Offer', count: pipelineCounts.offer ?? 0, target: Math.max(pipelineCounts.offer ?? 0, 1) },
    ];
    return {
      card_type: 'job_detail',
      type: 'jd_card',
      mode: 'live',
      title,
      empty_hint: '暂时没有岗位详情。',
      error_hint: '岗位详情暂时拿不到。',
      timestamp: Date.now(),
      is_published: result.status !== 'closed',
      job: {
        id: result.id,
        title: result.title,
        department: result.department,
        level: result.level,
        description: result.description || `${result.title} 当前开放 ${result.open_days ?? result.openDays ?? 0} 天。`,
        requirements: result.requirements || [],
        nice_to_have: result.nice_to_have || [],
        salary_range: result.salary_range,
        pipeline,
        open_days: result.open_days ?? result.openDays ?? 0,
        status: result.status || 'open',
      },
      actions: [{ label: '找匹配候选人', message: `帮我找适合${result.title}的人`, variant: 'primary' }],
    };
  }

  private buildPipelineReportCard(result: any, hint?: string): EngineCard {
    const jobs = result.jobs || [];
    const stages = jobs.flatMap((j: any) => j.stages || []);
    const baseCount = stages.filter((s: any) => s.stage === '简历筛选').reduce((sum: number, s: any) => sum + (s.count || 0), 0) || 1;
    const byStage = new Map<string, number>();
    for (const s of stages) byStage.set(s.stage, (byStage.get(s.stage) || 0) + (s.count || 0));
    const funnel = Array.from(byStage.entries()).slice(0, 7).map(([stage, count]) => ({
      stage,
      count,
      conversion_rate: count / baseCount,
    }));
    const alerts = jobs
      .filter((j: any) => j.status === 'at_risk' || j.status === 'stuck')
      .map((j: any) => ({
        job_id: j.job_id,
        title: j.title,
        status: j.status,
        reason: (j.bottlenecks || [j.open_days > 45 ? `已开放 ${j.open_days} 天` : '需要关注推进节奏'])[0],
      }));
    return {
      card_type: 'pipeline_report',
      type: 'pipeline_overview',
      mode: jobs.length ? 'live' : 'empty',
      title: result.title || '招聘 Pipeline 报告',
      empty_hint: hint || '暂时没有 Pipeline 数据。',
      error_hint: hint || 'Pipeline 数据暂时拿不到。',
      timestamp: Date.now(),
      report_type: 'weekly',
      period: '本周',
      metrics: {
        open_positions: jobs.length,
        active_candidates: stages.reduce((sum: number, s: any) => sum + (s.count || 0), 0),
        hired_this_period: byStage.get('Offer') || 0,
        avg_time_to_hire_days: jobs.length ? Math.round(jobs.reduce((sum: number, j: any) => sum + (j.open_days || 0), 0) / jobs.length) : 0,
        offer_accept_rate: 78,
      },
      funnel,
      insights: (result.summary ? [result.summary] : []).concat(alerts.length ? ['异常岗位需要优先处理，尤其关注通过率下降和开放天数过长的岗位。'] : []),
      alerts,
      actions: [{ label: '展开风险岗位', message: '展开这些风险岗位的详细分析', variant: 'primary' }],
    };
  }

  private buildReportCard(result: any, hint?: string): EngineCard {
    return {
      card_type: 'pipeline_report',
      type: 'pipeline_overview',
      mode: result?.metrics ? 'live' : 'empty',
      title: result.title || '招聘周报',
      empty_hint: hint || '暂时没有报告数据。',
      error_hint: hint || '报告暂时生成不了。',
      timestamp: Date.now(),
      report_type: result.period === '本月' ? 'monthly' : 'weekly',
      period: result.period || '本周',
      metrics: result.metrics || { open_positions: 0, active_candidates: 0, hired_this_period: 0, avg_time_to_hire_days: 0, offer_accept_rate: 0 },
      funnel: (result.funnel || []).map((f: any) => ({ ...f, conversion_rate: f.conversion_rate > 1 ? f.conversion_rate / 100 : f.conversion_rate })),
      insights: result.insights || [],
      alerts: (result.insights || []).filter((x: string) => x.includes('⚠️') || x.includes('卡顿')).slice(0, 3).map((reason: string, i: number) => ({
        job_id: `alert_${i}`,
        title: reason.split(':')[0].replace('⚠️', '').trim() || '风险岗位',
        status: 'at_risk' as const,
        reason,
      })),
      actions: [{ label: '生成下周动作', message: '基于这份周报生成下周招聘动作', variant: 'primary' }],
    };
  }

  clearHistory(): void { this.history = []; }
  setRole(r: UserRole): void { this.role = r; this.clearHistory(); }
}
