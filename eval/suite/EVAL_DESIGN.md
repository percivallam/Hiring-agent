# HireAgent 招聘意图评测体系

> 版本: v1.1 | 日期: 2026-05-28 | Owner: Eval Agent

## 1. 结论先行

今天 demo 的放行标准不是“看起来能聊”，而是：完整招聘意图召回率 >= 90%、动作参数准确率 >= 85%、卡片稳定性 >= 95%、多轮关键链路通过率 >= 80%、无 crash 率 >= 99%、延迟 p95 < 15s。任何单项没过，都只能进入迭代，不建议宣称真实可用。

本评测服务三个决策：

| 决策 | 使用数据 | 结论口径 |
|------|----------|----------|
| 今天 demo 是否可用 | 冻结 smoke/ship 用例 + runner 报告 | 过阈值才可演示 |
| 下一轮 PE / system prompt 怎么改 | 失败聚类 + weak_slice | 优先修最大弱切片 |
| 下一批造什么数据 | 工具空结果 + 卡片缺数据 + 多轮断点 | 只补能提升弱切片的数据 |

## 2. System Under Test

| 项 | 当前固定值 |
|----|------------|
| 模型 | deepseek-chat |
| 编排 | Function Calling Loop，禁止 DAG/Router |
| 工具 | 12 类招聘工具 + memory 工具 |
| 数据 | `src/data/*.json` 本地招聘 demo 数据 |
| 输出 | JSON text + cards + quickActions |
| 状态 | localStorage 会话历史 + memory 工具，不得破坏历史 |

运行评测时必须记录模型、prompt 版本、工具定义、用例版本、温度、运行时间、延迟和原始输出。不能只保留聚合数字。

## 3. 评测集设计

当前已落地 110 条 JSONL 用例：

| 维度 | 数量 | 目的 | 主要指标 |
|------|------|------|----------|
| `intent_recall` | 50 | 用户各种问法能否被正确理解 | 意图召回率、参数准确率 |
| `action_stability` | 30 | 同一输入重复运行是否稳定且正确 | 正确且一致的动作稳定性 |
| `multi_turn` | 10 | 上下文引用、候选人指代、连续任务 | 多轮链路通过率 |
| `card_render` | 20 | 各类卡片和空/错态是否稳定 | 卡片渲染稳定性、无 crash |

对抗/边界用例目标 >= 20%。覆盖安全拒绝、隐私导出、歧视性筛选、英文输入、复合意图、极端条件、空输入、无效 ID 和库外岗位。

### 招聘意图覆盖

| 意图族 | 代表工具/行为 | 必测场景 |
|--------|---------------|----------|
| 找候选人 | `search_candidates` | 技能、公司、年限、英文、近义岗位、库外岗位 |
| 看候选人 | `get_candidate_profile` | 姓名、ID、上下文“第一个人” |
| 候选人对比 | `compare_candidates` | 姓名对比、ID 对比、老板摘要 |
| Pipeline | `analyze_pipeline` | 整体进展、卡点、紧急风险 |
| 市场/薪资 | `market_analysis`, `salary_benchmark` | 角色映射、无数据降级、竞争力判断 |
| JD/岗位 | `list_jobs`, `get_job_detail` | 岗位列表、JD详情、JD优化建议 |
| 面试/触达 | message/interview tools | offer、拒信、触达、面试题 |
| 风险/团队 | risk/team tools | 入职风险、团队缺口 |
| 记忆 | `memory_recall`, `memory_write` | 召回前文、写入新事实，不破坏历史 |
| 安全/范围 | no tool + graceful text | 歧视筛选、隐私导出、违法爬取、非招聘请求 |

## 4. Schema

每条用例一行 JSON：

```ts
interface EvalCase {
  id: string;
  input: string | string[];
  dimension: 'intent_recall' | 'action_stability' | 'multi_turn' | 'card_render';
  intent: string;
  slice_tags: string[];
  expected_tools: string[];
  expected_cards: string[];
  expected_behavior: string;
  adversarial: boolean;
}
```

后续新增字段必须向后兼容，例如 `expected_args`, `rubric`, `source_log_id`, `difficulty`, `holdout_group`。不得删除现有字段。

## 5. 指标口径

| 指标 | 阈值 | 分子 | 分母 | 说明 |
|------|------|------|------|------|
| 总通过率 | >= 90% | 全部断言通过用例数 | 全部用例 | 只做总览，不单独作为 ship 依据 |
| 意图召回率 | >= 90% | 所有期望工具均被调用的 intent 用例 | intent 用例 | 复合意图必须命中全部关键工具 |
| 参数准确率 | >= 85% | 期望工具必填参数齐全的用例 | 有期望工具的用例 | 先做 required param，后续加 role/id fuzzy |
| 动作稳定性 | >= 85% | 三次运行均正确且工具链一致的组 | stability 组 | 错得一致不算稳定 |
| 卡片稳定性 | >= 95% | 所有期望卡片均出现的用例 | 有期望卡片的用例 | 复合意图必须展示全部关键卡片 |
| 多轮链路通过率 | >= 80% | 工具+卡片+文本都过的多轮用例 | multi_turn 用例 | 后续接 LLM judge 连贯性分 |
| 无 crash 率 | >= 99% | 有可解析输出且无异常的用例 | 全部用例 | 裸 error/empty 直接失败 |
| 延迟 p95 | < 15s | p95 turn duration | 全部用例 | 成本/延迟是质量维度 |

所有比例报告 Wilson 95% CI；随机系统至少 N>=3 次，报告 mean +/- std。今天的 runner 支持单次 smoke，正式 ship 决策必须跑三次并合并结果。

## 6. Judge 策略

优先级：exact/programmatic > rubric 程序化 > LLM-as-Judge。

当前自动化：

- 工具召回：expected_tools 全包含。
- 参数：required params 存在且非空。
- 卡片：expected_cards 全包含。
- crash：有文本、有原始输出、不抛异常。
- 稳定性：重复组必须正确且调用序列一致。

后续 LLM judge 只用于两类主观指标：多轮连贯性、优雅降级质量。上线前必须抽样 30 条做人标，报告 judge-human Cohen's kappa，目标 >= 0.7。judge prompt 必须盲评，不暴露系统版本，避免长度偏好和自偏好。

## 7. 自动化运行

```bash
npx tsx eval/suite/runner.ts --validate-cases
npx tsx eval/suite/runner.ts --dim intent_recall
npx tsx eval/suite/runner.ts --gate
```

输出：

- `eval/suite/report.md`：老板/研发可读报告。
- `eval/suite/results.jsonl`：逐条输入、工具、卡片、文本、耗时、失败详情。

CI 建议：PR 默认跑 `--validate-cases` 和一组 50 条 smoke；prompt/model/tool 改动跑全量三次。主指标下降 >2pp、任一 guardrail 破线、或安全用例失败，PR 不准合。

## 8. 分析报告格式

报告必须按这个顺序写：

1. Headline number：主指标、分母、95% CI、预设阈值。
2. Slice breakdown：按 dimension、intent、difficulty、adversarial、language 拆分，标出低于平均值 5pp 以上的切片。
3. Top 5 failure clusters：每类给原始 input、actual tools/cards/text、expected。
4. Cost/latency：p50/p95/max，必要时加 tokens/cost。
5. Recommendation：ship / iterate / kill。
6. Next experiment：只提一个最可能提升弱切片的改动。

## 9. 失败聚类到迭代动作

| 失败簇 | 典型症状 | 优先迭代动作 |
|--------|----------|--------------|
| 意图漏召回 | 没调工具或调错工具 | PE：强化 tool description 和 few-shot |
| 参数错 | role/job_id/candidate_id 缺失 | 加实体解析 few-shot，补 alias 数据 |
| 卡片缺失 | text 里有数据但 cards 为空 | system prompt 加强 JSON/cards 硬约束，UI 加兜底 |
| 空结果糟糕 | 只说没找到 | 补 fallback hint，造相近岗位/市场建议数据 |
| 多轮断链 | “第一个人/这个岗位”无法解析 | 加上下文摘要和可引用实体列表 |
| 安全违规 | 调工具处理歧视/隐私请求 | 加安全拒绝 policy + adversarial few-shot |
| 延迟过高 | 多次重复调用同工具 | loop guard、工具结果缓存、压缩 prompt |

## 10. 数据和 PE 闭环

每次全量评测后，按失败簇产出三类 backlog：

- 造数据：缺角色 alias、缺候选人画像、缺市场/薪资数据、缺空态 hint。
- PE 优化：工具选择 few-shot、复合意图拆解、JSON 输出约束、安全拒绝示例。
- 产品修复：卡片 schema 映射、空/错态组件、多轮上下文实体、历史持久化回归。

禁止只优化公开 eval 分数。至少保留 20% held-out 用例，不参与 prompt 迭代；正式比较 variant 时用同一 frozen set + paired bootstrap。
