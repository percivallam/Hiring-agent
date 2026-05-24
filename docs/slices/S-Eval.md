# Slice S-Eval — 三层评测体系骨架

**Owner**: Eval Agent
**前置依赖**: S0(`s0-done`) + S2(`s2-done`,工具和数据齐全)
**预计工期**: 1.5 天
**对应 PRD 章节**: Part 4(三层 Eval)、Part 5(5 DSP 验收)、Part 8(优雅失败)

> ⚠️ Eval Agent 是项目的"质检员"。其他 Agent 写功能,你写卡尺。你的标准定低了,整个项目就废了。

---

## 1. 目标(一句话)

搭建 **三层评测体系**:① 路径回归(5 DSP 必通过)② 惊艳度(主观分,人评)③ 兜底(优雅失败覆盖率)。Engine / Tools / UI 任意改动后,跑 `npx tsx eval/run.ts` 一键验证是否退化。

---

## 2. 范围(In Scope)

- `eval/runner.ts` — 统一评测入口
- `eval/cases/regression/` — 5 DSP 路径回归用例(每个 DSP 至少 3 条 query → expect)
- `eval/cases/wow/` — 惊艳度评分模板(主观,但要结构化记录)
- `eval/cases/fallback/` — 优雅失败用例(故意触发各种异常,看是否优雅)
- `eval/scorer/` — 自动评分逻辑(命中工具 / 命中卡片 / 文案长度合理)
- `eval/reports/` — 输出目录,生成 `eval-report-YYYY-MM-DD.md`(给老板看的)
- `eval/baselines/` — 基线快照(每个 tag 一次,用于回归对比)
- `package.json` 加 script:`"eval": "tsx eval/runner.ts"`

---

## 3. 非范围(Out of Scope)

- ❌ 不写真实的 LLM-as-Judge(Phase 2 / S7 Self-Improve 一起做)
- ❌ 不接 CI(老板看 demo 前手动跑就够)
- ❌ 不许改 `src/contracts/*` `src/engine/*` `src/tools/*`(评测是消费方,不是生产方)
- ❌ 不要追求 100% 自动化,**主观惊艳度必须人评**(你只负责给人评分提供结构化模板)

---

## 4. 三层 Eval 规范

### 4.1 第一层:路径回归(必须自动化,100% 通过才能 release)

为每个 DSP 写 ≥3 条 query,验证:
- 期望的工具被调用(命中 `tool_call_planned` 事件)
- 期望的卡片被生成(`Card.type` 匹配)
- final_message 不为空且长度 > 20 字符

**5 DSP 至少 15 条用例**:

| DSP | 用例数 | 关键验证点 |
|---|---|---|
| DSP-1 库外岗位接管 | 3+ | "BSP 工程师怎么招" → 命中 T5/T7 + C4/C5,且 final_message 含"创建岗位"或"无现成岗位"语义 |
| DSP-2 找人对比 | 3+ | "找推荐系统 5 年" → T1 → C1,然后"对比 res_001 和 res_007" → T3 → C3 |
| DSP-3 Memory 唤醒 | 3+ | "我想招个推荐方向的" → T1 + T9(memory_recall) → C1 + C9(张三浮现) |
| DSP-4 面试包(壳) | 3+ | "给 res_007 准备一面" → T11 → C8,且面试包字段齐全 |
| DSP-5 周报洞察 | 3+ | "上周算法岗怎么样" → T4/T12 → C7,且洞察文案非空、含具体数字 |

### 4.2 第二层:惊艳度评分(主观,人评但结构化)

每个 DSP 准备 1 个 **"给老板看"的 demo query**,跑完后请 2-3 位 reviewer 按 1-5 分打:

| 维度 | 1 分 | 5 分 |
|---|---|---|
| 流畅度 | 反复打转 / 超长 latency | 一气呵成 / <10s |
| 智能感 | 像在查关键词 | 像在"思考" |
| 视觉冲击 | 文本流 | 富卡片 + 数据可视化 |
| 决策辅助力 | 列数据 | 给建议 + 理由 |
| 优雅降级 | 抛 stack trace | 像同事在说"这个我帮你看看" |

≥4 分通过。打分模板生成在 `eval/reports/wow-template.md`。

### 4.3 第三层:兜底覆盖(必须自动化)

故意触发以下场景,验证不崩、不抛 stack、给出人性化解释:

| 场景 | 期望表现 |
|---|---|
| LLM 调不存在的 tool | Engine 兜底 + 给用户"AI 误判工具,已修正"提示 |
| Tool 返回空数据 | 不显示空白,显示 empty 态 + hint |
| Tool timeout | 30s 触发止损,给"服务繁忙,稍后再试"文案 |
| LLM 同 tool 同参数死循环 | loop_detected 触发,给"换个角度问问" |
| 用户输入完全无意义("abc 123") | C10 引导澄清卡浮现 |
| 用户问超出范围("帮我订机票") | LLM 礼貌拒绝 + 引导回招聘场景 |

至少 6 个 fallback 用例,**全部自动化运行**。

---

## 5. 验收清单(Definition of Done)

- [ ] `eval/runner.ts` 可执行,`npx tsx eval/runner.ts` 一键跑全部三层
- [ ] 第一层:5 DSP × 15+ 用例,**通过率 100%**(否则其他 Agent 必须修)
- [ ] 第二层:5 DSP 各 1 个惊艳度用例,生成结构化打分模板
- [ ] 第三层:6+ fallback 用例,全部触发预期止损/降级
- [ ] 报告自动生成 `eval/reports/eval-report-YYYY-MM-DD.md`,含:
  - 每条用例的 pass/fail + 命中事件链
  - 失败用例的 diff(期望 vs 实际)
  - 惊艳度打分模板(待人填)
  - 与上次基线的对比(回归提醒)
- [ ] `eval/baselines/baseline-s2.json` 落盘当前快照(作为后续回归基准)
- [ ] `package.json` 加 `"eval"` script
- [ ] 投递 `S-Eval-done` handoff

---

## 6. 参考示例

### 6.1 路径回归用例(DSP-3)

```ts
// eval/cases/regression/dsp3-memory.ts
export const cases = [
  {
    id: 'DSP3-01',
    query: '我想招个推荐方向的算法工程师',
    role: '用人经理',
    expect: {
      tools_called: ['search_candidates', 'memory_recall'],
      cards_generated: ['C1', 'C9'],
      final_text_must_include: ['张三'],
      stopped_by: null,
    },
  },
  {
    id: 'DSP3-02',
    query: '之前跟我聊过的那个候选人怎么样了',
    role: '用人经理',
    expect: {
      tools_called: ['memory_recall'],
      cards_generated: ['C9'],
      final_text_must_include: ['二面后'],  // 张三的上次状态
    },
  },
  // ...
]
```

### 6.2 评测报告样例(给老板看)

```markdown
# HireAgent Eval Report — 2026-05-25

## 总览
- 路径回归: 15/15 ✅
- 惊艳度: 待人评(打分链接见下)
- 兜底覆盖: 6/6 ✅

## DSP-1 库外岗位接管
- DSP1-01 "BSP 工程师怎么招" ✅
- DSP1-02 "我们要招嵌入式底层" ✅
- DSP1-03 "找个做芯片驱动的" ✅

## 失败用例 diff
(无)

## 与上次基线对比
- baseline: s1-done (2026-05-24)
- 新增: 5 DSP 用例
- 退化: 无
- 改进: tool_call 平均 step 从 3.2 → 2.7
```

### 6.3 Fallback 用例

```ts
{
  id: 'FALLBACK-01',
  query: '帮我订张去上海的机票',
  expect: {
    stopped_by: null,  // 不是止损,是 LLM 礼貌拒绝
    final_text_must_include: ['招聘', '帮不了'],  // 至少匹配一个
    final_text_must_not_include: ['error', 'undefined', 'stack'],
  },
}
```

---

## 7. 开工自检

不要立刻写代码,先按 CLAUDE.md 启动仪式,在 `.handoff/2026-05-25-S-Eval-kickoff.md` 回答:

1. 复述三层 Eval 各自的目的(为什么需要三层,不是一层够吗)
2. 路径回归 15 条 query 草案(每个 DSP 3 条,贴出原始 query 文本)
3. 惊艳度 5 个 demo query(老板看的那种,要够有说服力)
4. 6 个 fallback 场景(其中哪个最难自动化)
5. 疑问 ≤ 5 条(重点:命中"工具调用"如何判定 = strict 还是 fuzzy)

Spec Owner 审完 query 列表 → 放行。

---

## 8. 收尾仪式

```bash
npx tsx eval/runner.ts > eval/reports/eval-$(date +%Y-%m-%d).md
# 确认报告里第一层 + 第三层全绿

git add eval/ package.json STATE.md
git commit -m "S-Eval: 3-layer eval framework + 15 regression + 6 fallback cases"
git tag s-eval-done

cat > .handoff/$(date +%Y-%m-%d)-S-Eval-done.md <<'EOF'
# S-Eval Done — Quality Gate Live

From: Eval Agent
To: All Agents / Spec Owner

## 交付
- 三层 Eval 框架就绪
- 路径回归 15/15 ✅
- 兜底覆盖 6/6 ✅
- 惊艳度模板已生成,待 reviewer 打分

## 协议
- 任何 Agent 提交前必须跑 `npm run eval`,通过率 < 100% 不许 merge
- 改 contracts → 必须重跑全套 + 更新 baseline

## 已知 TODO
- LLM-as-Judge 留给 S7
- CI 接入待定
EOF
git add .handoff/ && git commit -m "handoff: S-Eval done"
```

---

## 9. Spec Owner 介入边界

| 问题类型 | 必须问 | 你自己定 |
|---|---|---|
| 哪些 query 算"惊艳" | ✅(产品判断) | |
| 验收阈值(通过率 100%?95%?) | ✅(我说 100%) | |
| 报告格式 | | ✅(给老板看的部分要好看) |
| 用 vitest 还是裸 tsx | | ✅ |
| 是否引入 LLM-as-Judge | ✅(暂不,留给 S7) | |

---

**一句话**:你是质检员。其他 Agent 求快,你必须求严。任何 Agent 跑你的 eval 不过就别想 merge,这是 CLAUDE.md「三大铁律」之一。
