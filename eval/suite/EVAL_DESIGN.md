# HireAgent 评测体系设计文档

> 版本: v1.0 | 日期: 2026-05-27 | 作者: Eval Agent

---

## 1. 系统概述

**System Under Test**: DeepSeek V4 Flash + AIEngine system prompt + 14 tools + localStorage memory + 16 card types

**评测目标**: 验证产品作为可演示 demo 的质量，驱动迭代（造数据/改 prompt/修渲染）

---

## 2. 核心指标 & 阈值

| 指标 | 阈值 | 计算方式 | Judge 类型 |
|------|------|----------|-----------|
| 意图召回率 | ≥ 90% | 正确调用工具数 / 总用例数 | Programmatic |
| 参数准确率 | ≥ 85% | 参数正确的调用数 / 总调用数 | Programmatic + fuzzy |
| 卡片渲染稳定性 | ≥ 95% | 成功渲染数 / 期望卡片数 | Programmatic |
| 多轮连贯性 | ≥ 80% (4.0/5) | LLM Judge 评分 | LLM-as-Judge |
| 优雅降级率 | ≥ 90% | 有价值兜底数 / 无数据场景数 | LLM-as-Judge |

### Guardrail Metrics

| 指标 | 红线 |
|------|------|
| 响应延迟 p95 | < 15s |
| 单次 token 消耗 | < 4000 |
| 安全违规 | 0 |

---

## 3. 评测集结构

### 3.1 维度 1: 意图召回 (intent_recall) — 40 条

覆盖 14 个工具意图 + 闲聊兜底 + 越库(DSP-1)，每意图 2-3 条不同表述。

难度分布: Easy 40% / Medium 40% / Hard 20%

### 3.2 维度 2: 动作稳定性 (action_stability) — 30 条

10 个核心意图 × 3 次重复，验证 tool_name 一致率和参数结构一致率。

### 3.3 维度 3: 多轮连贯性 (multi_turn) — 30 条

10 组对话链 × 3 轮，验证上下文引用和自然衔接。

### 3.4 维度 4: 卡片渲染稳定性 (card_render) — 20 条

覆盖 16 种卡片类型 + 4 条边界场景。

---

## 4. 用例 Schema

```typescript
interface EvalCase {
  id: string;
  input: string | string[];       // 单轮 string, 多轮 string[]
  slice_tags: string[];           // easy/medium/hard + intent type
  intent: string;                 // 期望触发的意图
  dimension: 'intent_recall' | 'action_stability' | 'multi_turn' | 'card_render';
  expected_tools: string[];       // 期望调用的工具列表
  expected_cards: string[];       // 期望渲染的卡片类型
  expected_behavior: string;      // rubric 文字描述
  adversarial: boolean;           // 是否对抗性用例
}
```

---

## 5. Judge 设计

### 5.1 Programmatic Judge (意图/参数/卡片)

- tool_name exact match
- 参数: required params 存在 + 类型正确
- 卡片: type 字段存在 + data 非空 + 无 crash

### 5.2 LLM Judge — 多轮连贯性

```
你是招聘产品质量评审员。评估以下多轮对话的连贯性。

评分标准（1-5）：
5 = 完美引用前文，无需用户重复信息，自然衔接
4 = 基本连贯，偶尔需要用户补充已说过的信息
3 = 部分连贯，有明显的上下文丢失
2 = 大部分不连贯，像是独立对话
1 = 完全无关联，忽略前文

输出 JSON: {"score": N, "reasoning": "..."}
```

### 5.3 LLM Judge — 优雅降级

```
你是招聘产品质量评审员。评估 AI 在无法满足用户需求时的降级质量。

评分标准（1-5）：
5 = 像资深招聘顾问一样给出替代建议和市场洞察
4 = 承认无数据但给出有价值的方向性建议
3 = 承认无数据，给出泛泛建议
2 = 简单说"没找到"，无附加价值
1 = 报错/空白/不相关回复

输出 JSON: {"score": N, "reasoning": "..."}
```

---

## 6. 数据边界（决定 expected 结果）

### 有数据的查询
- search_candidates("推荐系统/大模型/后端/前端/数据") → 有结果
- market_analysis("recommendation_engineer/llm_engineer/...") → 有数据
- salary_benchmark("recommendation_engineer/llm_engineer/...") → 有数据
- analyze_pipeline() → 有数据
- list_jobs() → 10 个岗位

### 无数据的查询（触发降级）
- search_candidates("BSP/嵌入式驱动/量子计算") → 空
- market_analysis("unknown_role") → error
- salary_benchmark("unknown_role") → error

---

## 7. 执行架构

```
eval/suite/
├── runner.ts          — 统一执行器
├── cases/
│   ├── intent_recall.jsonl
│   ├── action_stability.jsonl
│   ├── multi_turn.jsonl
│   └── card_render.jsonl
├── judges/
│   ├── coherence_judge.ts
│   └── graceful_judge.ts
├── metrics.ts         — 指标计算
└── report.ts          — 报告生成
```

---

## 8. 运行方式

```bash
npx tsx eval/suite/runner.ts              # 跑全量
npx tsx eval/suite/runner.ts --dim intent  # 只跑意图召回
npx tsx eval/suite/runner.ts --report      # 生成报告
```
