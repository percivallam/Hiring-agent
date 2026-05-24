# Slice S2 — Tools 集 + Golden Data(双 Agent 并行)

**Owners**: Tools Agent + Data Agent(两人共享本 spec,各自负责一半)
**前置依赖**: S0(`s0-done` tag,`contracts/tools.ts` 已 locked)
**预计工期**: 1.5 天(并行)
**对应 PRD 章节**: Part 3.5(12 工具)、Part 3.6(数据层)、Part 5(5 DSP 黄金故事点)

> ⚠️ 本 spec 是 Tools Agent + Data Agent 的**共同合同**。两个 Agent 必须先达成 Mock Schema 共识,才能各自开工,否则一定撞车。

---

## 1. 目标(一句话)

**Tools Agent** 实现 12 个工具的真实逻辑(读 `src/data/*.json`,符合 `contracts/tools.ts`)。
**Data Agent** 产出 5 类 mock JSON 数据,**精心植入 5 个 DSP 的故事钩子**(不是随机生成假数据)。
两者收尾时联调一次:Tools 跑得通 + Data 故事点能被命中。

---

## 2. 范围与分工

### 2.1 Tools Agent 范围(In Scope)

- `src/tools/T1_search_candidates.ts` ~ `T12_generate_report.ts`(12 个文件)
- `src/tools/index.ts` — TOOL_REGISTRY 注册表(给 Engine 用)
- `src/tools/utils/` — 共用的 fuzzy match / 排序 / 时间工具
- `test/tools/*.test.ts` — 每个工具 ≥ 3 个单测(正常 / 边界 / 错误)

### 2.2 Data Agent 范围(In Scope)

- `src/data/resumes.json`(30 条,**含黄金候选人「张三」**,见 §5.2)
- `src/data/jobs.json`(10 条,**故意不包含 BSP 工程师**,留给 DSP-1)
- `src/data/pipeline.json`(50 条,**算法岗通过率 28% → 19% 趋势**,留给 DSP-5)
- `src/data/market.json`(15 个方向,**含 BSP / 嵌入式底层条目**,DSP-1 兜底)
- `src/data/salary.json`(按职级×城市)
- `src/data/README.md`(**显式标注每个 DSP 的故事点埋在哪条数据**)

### 2.3 两人共同范围

- **Mock Schema 共识**:开工前 30 分钟,两人在 `.handoff/2026-05-25-S2-schema-sync.md` 互发 schema 草案,达成一致再各自写
- **联调**:S2 收尾时一起跑 `npx tsx test/tools/integration.test.ts`,确认 12 工具读真实数据全绿

---

## 3. 非范围(Out of Scope)

- ❌ 不实现 Memory(S5 才做,T9/T10 此刻先返回 stub)
- ❌ 不接 UI(UI Agent 负责)
- ❌ 不引入数据库(全部 JSON 文件 + in-memory 读)
- ❌ 不许改 `src/contracts/*`(要改先 RFC)
- ❌ Tools 不许硬编码任何具体候选人/岗位数据(全部从 `src/data/` 读)
- ❌ Data 不许生成"看起来很真"但与 DSP 故事点无关的数据(每条数据要么服务 DSP,要么是合理填充背景)

---

## 4. 接口契约(必须遵守)

### 4.1 Tools 端

```ts
// 每个工具文件必须导出:
import type { ToolDefinition } from '../contracts/tools'

export const T1_search_candidates: ToolDefinition<
  SearchCandidatesArgs,
  SearchCandidatesResult
> = {
  name: 'search_candidates',
  description: '...',  // 给 LLM 看的,要写清楚
  parameters: { /* JSON Schema */ },
  execute: async (args, ctx) => { /* ... */ },
}
```

每个工具的 `args` 和 `result` 类型 **必须** 来自 `contracts/tools.ts`,不许私自扩字段。

### 4.2 Data 端

每个 JSON 文件**根部必须有 `_meta` 字段**:

```json
{
  "_meta": {
    "version": "v1.0",
    "dsp_hooks": {
      "DSP-1": "无 BSP 岗位 → 触发 LLM 自主创建岗位画像",
      "DSP-3": "张三(id=res_007)是回访候选人,Memory 唤醒锚点"
    },
    "generated_at": "2026-05-25"
  },
  "data": [ ... ]
}
```

DSP 故事点在哪条数据上,必须能从 `_meta.dsp_hooks` 反查。

### 4.3 12 工具清单(Tools Agent 必须全做)

| ID | 名称 | 数据源 | 说明 |
|---|---|---|---|
| T1 | search_candidates | resumes | 多字段过滤 + 模糊匹配 |
| T2 | get_candidate_profile | resumes | 详情 + LLM 总结 hint |
| T3 | compare_candidates | resumes | 多人对比矩阵 |
| T4 | analyze_pipeline | pipeline | 漏斗 / 转化率 |
| T5 | market_analysis | market | 方向供需 + 薪酬范围 |
| T6 | salary_benchmark | salary | 按职级×城市 |
| T7 | list_jobs | jobs | 列表 + 状态过滤 |
| T8 | get_job_detail | jobs | 详情 |
| T9 | memory_recall | (stub) | S5 才真实实现,S2 返回空数组 |
| T10 | memory_write | (stub) | S5 才真实,S2 返回 success: true |
| T11 | interview_kit_prepare | resumes + jobs | **演示型工具**,返回精心构造的面试包,不真跑 AI |
| T12 | generate_report | pipeline | 周报数据聚合 + LLM 洞察 hint |

> T9/T10 现在写 stub 是为了 Engine S1 能把工具调用链跑通,S5 才补真实实现。

---

## 5. 验收清单(Definition of Done)

### 5.1 Tools Agent DoD

- [ ] 12 个工具文件齐备,每个导出符合 `ToolDefinition<Args, Result>` 类型
- [ ] `src/tools/index.ts` 的 `TOOL_REGISTRY` 注册全部 12 个
- [ ] 每个工具 ≥ 3 个单测(正常路径 / 边界 / 错误)
- [ ] T9/T10 实现 stub,签名符合契约,但 body 返回常量
- [ ] `npx tsx test/tools/*.test.ts` 全绿
- [ ] `tsc --noEmit` 零报错
- [ ] 投递 `S2-tools-done` handoff

### 5.2 Data Agent DoD

- [ ] 5 个 JSON 文件齐备,每个含 `_meta.dsp_hooks`
- [ ] **黄金故事点植入完成**:
  - DSP-1:`jobs.json` 故意没有 "BSP工程师 / 嵌入式底层" 岗位,但 `market.json` 有相关方向信息(LLM 能基于 market 数据反推)
  - DSP-2:`resumes.json` 至少有 5 个推荐系统方向、5+ 年经验的候选人,用于"找人+对比"
  - DSP-3:`resumes.json` 必须含 **id=res_007 张三**,字段含 `last_interaction: '2025-11-20'`,触发 Memory 唤醒(虽然 Memory S5 才做,但数据要预埋)
  - DSP-4:`resumes.json` + `jobs.json` 至少有一组"候选人 × 岗位"匹配,能让 T11 生成有意义的面试包
  - DSP-5:`pipeline.json` 算法岗近 4 周通过率呈现 28%→25%→22%→19% 下降趋势,留给周报洞察发现
- [ ] `src/data/README.md` 明确标注每条 DSP 钩子在哪个文件、哪条 id
- [ ] 数据通过 JSON Schema 校验(`npx tsx scripts/validate-data.ts`)
- [ ] 投递 `S2-data-done` handoff

### 5.3 联调 DoD(两人共同)

- [ ] `npx tsx test/tools/integration.test.ts` 全绿,12 工具读真实数据无报错
- [ ] 跑 5 个验收 query,每个 query 返回结果不为空(具体 query 见 §6.3)

---

## 6. 参考示例

### 6.1 Tools 单测示例(T1)

```ts
test('T1 search_candidates: 字段过滤', async () => {
  const result = await T1_search_candidates.execute({
    company: '字节',
    skills: ['推荐系统'],
    min_years: 5,
  }, ctx)
  expect(result.candidates.length).toBeGreaterThan(0)
  expect(result.candidates.every(c => c.years >= 5)).toBe(true)
})

test('T1 边界:无匹配返回空数组', async () => { /* ... */ })
test('T1 错误:非法参数抛 ToolError', async () => { /* ... */ })
```

### 6.2 Data 黄金数据示例(张三)

```json
{
  "id": "res_007",
  "name": "张三",
  "current_company": "阿里",
  "skills": ["推荐系统", "强化学习"],
  "years": 7,
  "_dsp_hook": "DSP-3",
  "last_interaction": "2025-11-20",
  "previous_status": "二面后流程暂停"
}
```

### 6.3 联调验收 query(5 条,必须全通过)

| Query | 期望命中工具 | 期望故事点 |
|---|---|---|
| "帮我找推荐系统 5 年以上的" | T1 | 返回 ≥ 3 个候选人 |
| "对比候选人 res_007 和 res_012" | T2 / T3 | 返回结构化对比 |
| "BSP 工程师怎么招" | T5 + T7 | 发现没岗位 + 给 market 信息(DSP-1) |
| "算法岗最近怎么样" | T4 | 返回漏斗 + 下降趋势(DSP-5 钩子) |
| "给候选人 res_007 准备一面" | T2 + T11 | 返回面试包(DSP-4 钩子) |

---

## 7. 开工自检(两人各自回答)

不要立刻写代码,先按 CLAUDE.md 启动仪式,在 `.handoff/2026-05-25-S2-kickoff.md` 共同回答:

**Tools Agent 必答**:
1. 12 个工具的实现顺序(建议:T7→T8→T1→T2→T3→T4→T5→T6→T9/T10 stub→T11→T12)
2. 每个工具的 `args` 是否完全符合 `contracts/tools.ts`?有出入列出来
3. 共享 utils 计划放哪些函数(避免每个工具重复写)
4. 疑问 ≤ 3 条

**Data Agent 必答**:
1. 5 个 DSP 钩子的具体植入方案(每条数据怎么写,id 怎么编)
2. 30 条 resume 怎么分布(职能 / 司龄 / 经验)才像真的
3. 是否用脚本生成 + 手工微调 vs 纯手工
4. 疑问 ≤ 3 条

**Mock Schema 共识**(两人合答):
- 30 分钟内对齐每个工具读什么字段、字段叫什么、缺失值怎么处理
- 共识写进 `.handoff/2026-05-25-S2-schema-sync.md`,**两人都 commit** 后才开工

Spec Owner 审完两人开工自检后,放行。

---

## 8. 收尾仪式

```bash
# Tools Agent:
npx tsx test/tools/*.test.ts && tsc --noEmit
git add src/tools/ test/tools/ STATE.md
git commit -m "S2-tools: 12 tools + 36+ unit tests"
git tag s2-tools-done

# Data Agent:
npx tsx scripts/validate-data.ts
git add src/data/ STATE.md
git commit -m "S2-data: 5 mock files + 5 DSP hooks"
git tag s2-data-done

# 联调(两人一起):
npx tsx test/tools/integration.test.ts
# 全绿后:
git tag s2-done

# 投 handoff
cat > .handoff/$(date +%Y-%m-%d)-S2-done.md <<'EOF'
# S2 Done — Tools + Data Ready

From: Tools Agent + Data Agent
To: Engine Agent / UI Agent / Spec Owner

## 交付
- 12 工具全实现(T9/T10 stub,S5 替换)
- 5 mock JSON,5 DSP 钩子全植入
- 联调 5 query 全通过

## 解锁
- Engine Agent 可把 mock tool 换成真实 tool
- UI Agent 可基于真实数据调试 C1-C10
- Eval Agent 可基于真实数据跑回归

## 已知 TODO
- T9/T10 stub,S5 替换为真实 memory_recall/write
- (其他待 Spec Owner 确认)
EOF
git add .handoff/ && git commit -m "handoff: S2 done"
```

---

## 9. Spec Owner 介入边界

| 问题类型 | 必须问 | 你自己定 |
|---|---|---|
| DSP 故事点怎么编 | ✅ | |
| 工具参数语义模糊 | ✅ | |
| JSON 字段命名风格 | | ✅(写 ADR) |
| 数据条数 | | ✅(30/10/50/15 是建议,微调可) |
| 是否引入 lodash | | ✅(用 native 优先) |

---

**两人共识协议**:Data Agent 出 schema 草案,Tools Agent 30 分钟内 review,有问题就在 schema-sync handoff 里来回 1 次,不超过 2 个回合。超过 → 升级给 Spec Owner 一锤定音。
