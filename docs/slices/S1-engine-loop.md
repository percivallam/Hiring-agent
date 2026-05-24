# Slice S1 — Engine Loop（Function Calling 骨架）

**Owner**: Engine Agent
**前置依赖**: S0(`s0-done` tag,contracts 已 locked)
**预计工期**: 1 天(净写代码 4-6h + 联调 1-2h)
**对应 PRD 章节**: Part 3.2(Function Calling Loop)、Part 3.4(止损)、Part 8(优雅失败)

> ⚠️ 本文件是 Engine Agent 的合同。Spec Owner(林品臣)说了算,其他人不许改。

---

## 1. 目标（一句话）

实现 **AIEngine 类**:接收用户消息 → 跑 Function Calling 循环 → 调 mock tools → 返回结构化结果(含止损兜底 + 事件流)。这是整个项目的**心脏**,所有 Agent 后续工作都基于它跑通。

---

## 2. 范围(In Scope)

- `src/engine/AIEngine.ts` — 主类,导出 `class AIEngine`
- `src/engine/loop.ts` — Function Calling 循环逻辑(可选拆分,看你怎么组织)
- `src/engine/stop_guards.ts` — 四件套止损实现
- `src/engine/events.ts` — 事件发射器(emit 到 `contracts/events.ts` 定义的 schema)
- `src/engine/__mocks__/mockTools.ts` — 仅用于单测的 mock tool 实现
- `test/engine.test.ts` — 单测,覆盖正常路径 + 4 种止损 + 优雅失败

---

## 3. 非范围(Out of Scope)— 不许做

- ❌ 不实现真实 tool(Tools Agent 负责,S2)
- ❌ 不接 UI(UI Agent 负责,S3)
- ❌ 不写 Self-Improve 收集器(S7 才做,但要 emit 事件供 S7 消费)
- ❌ 不优化 prompt 工程(先跑通 baseline,Phase 2 再调)
- ❌ 不实现 Memory(S5 才做,Engine 此刻只接 stub interface)
- ❌ 不许修改 `src/contracts/*`(要改先提 RFC 到 `.handoff/`)
- ❌ 不引入新依赖(基础 fetch + deepseek/openai SDK 已够用,要加先问 Spec Owner)

---

## 4. 接口契约(必须遵守)

### 4.1 输入/输出类型

```ts
// AIEngine.ts 顶部 import:
import type { ToolCall, ToolResult, ToolName } from '../contracts/tools'
import type { Card } from '../contracts/cards'
import type { EngineEvent } from '../contracts/events'
import type { MemoryAdapter } from '../contracts/memory'

export interface ChatInput {
  role: '用人经理' | '招聘HR' | '候选人'
  message: string
  sessionId: string
  memory?: MemoryAdapter  // S1 阶段可传 stub
}

export interface ChatOutput {
  messages: Array<{ role: 'assistant' | 'tool'; content: string }>
  cards: Card[]
  events: EngineEvent[]
  stoppedBy: null | 'max_steps' | 'max_tool_calls' | 'timeout' | 'loop_detected'
  finalText: string  // LLM 最终自然语言回复
}

export interface AIEngineConfig {
  maxSteps?: number              // default 8
  maxToolCalls?: number          // default 12
  timeoutMs?: number             // default 30_000
  loopDetectThreshold?: number   // default 3(同 tool+同参数连续命中次数)
  llmClient: LLMClient           // 注入式,方便单测
  toolExecutor: ToolExecutor     // 注入式,S1 用 mock,S2 联调换真实
}
```

### 4.2 必须 emit 的事件(给 S7 用)

每一步都要 emit 到 events 数组,顺序严格:

| 时机 | 事件类型(已在 events.ts 定义) |
|---|---|
| 收到 user message | `user_message_received` |
| LLM 调用前 | `llm_request` |
| LLM 调用后 | `llm_response`(含 token usage) |
| 决定调 tool | `tool_call_planned` |
| Tool 执行完 | `tool_call_completed`(含 latency / error) |
| 止损触发 | `stop_triggered`(含 reason) |
| 最终回复 | `final_message` |

> S7 Self-Improve 基于这些事件做正负样本分类。**少 emit 一个 = S7 直接瘫痪。**

### 4.3 禁止行为

- 禁止硬编码 tool 名字(从 `contracts/tools.ts` 的 `TOOL_REGISTRY` 取)
- 禁止吞错(tool 抛错 → emit `tool_call_completed` with `error` 字段 → 让 LLM 决定,不要 try-catch 后 return null)
- 禁止跨切片改文件(看到 `src/tools/` `src/ui/` `src/contracts/` 想动 → STOP,提 RFC)

---

## 5. 验收清单(Definition of Done)

不达标不算完。每完成一项,`STATE.md` 打勾 + commit。

- [ ] `src/engine/AIEngine.ts` 导出 `class AIEngine { async chat(input: ChatInput): Promise<ChatOutput> }`
- [ ] 多轮 Function Calling Loop 跑通:LLM → tool → LLM → tool → ... → final
- [ ] 止损四件套全部生效(各自有独立单测):
  - `max_steps = 8`(可 config 覆盖)
  - `max_tool_calls = 12`(可 config 覆盖)
  - `timeout = 30_000ms`(可 config 覆盖)
  - 循环检测:同一 `(tool_name, args_hash)` 连续命中 ≥ 3 次 → 强制终止
- [ ] 止损触发时,`stoppedBy` 字段标识原因,`finalText` 含**用户可读的优雅降级文案**(对应 PRD 公理 A3)
- [ ] 所有事件按 4.2 节 emit,顺序正确
- [ ] 不依赖真实 tool,单测用 `__mocks__/mockTools.ts` 跑通
- [ ] `npx tsx test/engine.test.ts` 全绿,覆盖:
  - `E1` 正常路径:1 工具调用 → final
  - `E2` 多步路径:至少 2 跳 tool
  - `E3` max_steps 触发
  - `E4` max_tool_calls 触发
  - `E5` timeout 触发(fake timer 或慢 mock)
  - `E6` loop_detected 触发(同 tool 同参数 3 次)
  - `E7` tool 抛错 → LLM 收到 error → 优雅降级 → final_message 含解释
- [ ] `tsc --noEmit` 零报错
- [ ] `STATE.md` S1 行打勾,投递 `S1-done` handoff

---

## 6. 参考示例(降低歧义)

### 6.1 正常路径(E1)

```ts
// Input
const input: ChatInput = {
  role: '用人经理',
  message: '帮我找在字节做过推荐系统、5年以上的',
  sessionId: 'sess_001',
}

// 期望流程
// Step1: LLM → tool_call(search_candidates, { company:'字节', skills:['推荐系统'], min_years:5 })
// Step2: mockTool 返回 5 个候选人
// Step3: LLM → final_message + card(C1 候选人列表)

// Output
{
  messages: [
    { role: 'assistant', content: '...' },
    { role: 'tool', content: '[5 candidates]' },
    { role: 'assistant', content: '我找到 5 位匹配的候选人...' },
  ],
  cards: [{ type: 'C1', payload: { candidates: [...] } }],
  events: [
    { type: 'user_message_received', ... },
    { type: 'llm_request', step: 1, ... },
    { type: 'llm_response', step: 1, ... },
    { type: 'tool_call_planned', tool: 'search_candidates', ... },
    { type: 'tool_call_completed', tool: 'search_candidates', latency_ms: 12, ... },
    { type: 'llm_request', step: 2, ... },
    { type: 'llm_response', step: 2, ... },
    { type: 'final_message', ... },
  ],
  stoppedBy: null,
  finalText: '我找到 5 位匹配的候选人,按匹配度排序如下...',
}
```

### 6.2 优雅失败(E7)

```ts
// mockTool.search_candidates 抛 { code: 'API_TIMEOUT', message: '...' }
// 期望:
//   - tool_call_completed 事件含 error 字段
//   - 下一轮 LLM 收到 tool error message
//   - LLM 决定 final_message: "抱歉,候选人搜索服务暂时不可用,你可以稍后再试,或换个关键词"
//   - stoppedBy 仍为 null(这是优雅降级,不是止损)
```

### 6.3 循环检测(E6)

```ts
// mockTool 永远返回空结果
// LLM 反复用同样参数调 search_candidates
// 第 3 次调用时,Engine 强制终止:
//   - emit stop_triggered { reason: 'loop_detected', tool: 'search_candidates', repeat_count: 3 }
//   - finalText: '我尝试了多次但没有找到匹配的候选人,可能筛选条件过严,建议放宽...'
//   - stoppedBy: 'loop_detected'
```

---

## 7. 给 Engine Agent 的开工自检

收到这份 spec 后,**不要立刻写代码**。先按 CLAUDE.md 启动仪式回答以下问题,发给 Spec Owner 确认:

1. **复述验收清单**:用自己的话讲一遍第 5 节的 9 个验收项,确认理解一致
2. **文件改动清单**:计划新建/改哪些文件,各预估行数
3. **Mock Tool 接口草案**:贴出打算给 `__mocks__/mockTools.ts` 的 3-5 个 mock 签名
4. **疑问最多 5 条**:slice spec 哪里模糊、契约哪里不够、默认值有没有异议
5. **风险预判**:你觉得最容易翻车的点(止损?事件 schema?LLM 协议?)

Spec Owner 确认后,才进入写代码阶段。

---

## 8. 收尾仪式(关窗前必做)

```bash
# 1. 自检
npx tsc --noEmit
npx tsx test/engine.test.ts

# 2. 更新 STATE.md(S1 行打勾 + 本次实际工时 + 遗留 TODO)

# 3. commit + tag
git add src/engine/ test/engine.test.ts STATE.md
git commit -m "S1: Engine Function Calling Loop + 4 stop guards + 7 unit tests"
git tag s1-done

# 4. 投递 handoff
cat > .handoff/$(date +%Y-%m-%d)-S1-done.md <<'EOF'
# S1 Done — Engine Loop Ready

From: Engine Agent
To: Tools Agent / UI Agent / Spec Owner

## 交付
- AIEngine 已实现,Function Calling Loop + 4 件套止损全部跑通
- 7 个单测全绿,覆盖正常/止损/降级三类路径
- 事件 schema 严格按 contracts/events.ts emit,S7 可消费

## 解锁
- Tools Agent 可把 mock 换成真实实现(S2)
- UI Agent 可基于 ChatOutput 接卡片渲染(S3)

## 已知 TODO
- prompt 工程未优化(baseline 跑通即可)
- token usage 已 emit,未做聚合(留给 S6 Eval)

## 风险/请 Spec Owner 确认
- (列出过程中发现的契约缺口/疑问)
EOF

git add .handoff/
git commit -m "handoff: S1 done"
```

---

## 9. Spec Owner 介入边界

写代码过程中遇到这些问题,**必须暂停问 Spec Owner**:

| 问题类型 | 例子 | 处理 |
|---|---|---|
| 产品决策 | "止损文案怎么写" | 必须问,这是 Spec |
| 契约缺口 | "events.ts 少了 `llm_token_usage` 字段" | 必须问,改契约要 RFC |
| 跨切片影响 | "Tools 的 timeout 是 Engine 管还是 Tool 自管" | 必须问,涉及边界 |
| 架构决策 | "用 class 还是函数式" | 不用问,你定,记进 ADR-008 |
| 实现细节 | "Promise.race 还是 AbortController" | 不用问,你定 |

---

**一句话:这份 spec 是你的合同。9 个验收项做到 = 拿到尾款。其他你怎么折腾我不管,但越界禁令(第 3 节)碰一条 = 直接 revert。**
