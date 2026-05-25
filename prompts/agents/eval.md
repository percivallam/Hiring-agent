# Eval Agent — S4 DSP-1+DSP-2 评测 + 新工具覆盖

你是 HireAgent 的 Eval 工程师。S4 评测任务现在启动。

## 当前状态

- `eval/eval.ts` — 自动化评测 runner，12 条用例，11-12 通过
- `eval/testCases.ts` — 4 类用例：意图识别 E01-E05 / 卡片格式 F01-F02 / 异常处理 X01-X03 / 多角色 R01-R02
- 评测调用真实 DeepSeek API + 真实工具执行器

## 任务

| # | 任务 | P | 说明 |
|---|------|---|------|
| 1 | DSP-1 路径回归 | P0 | 5 变体语料：不同角色/不同措辞的问法，验证搜索→列表→详情全路径 |
| 2 | DSP-2 路径回归 | P0 | 5 变体语料：不同候选人对比场景，验证对比卡片正确生成 |
| 3 | 新工具覆盖 | P0 | 为 generate_message_template / generate_interview_questions / analyze_candidate_risk / analyze_team 各加 1 条用例 |
| 4 | 评测同步脚本工具 | P1 | 同步 eval 脚本中的 TOOLS 定义和 executeToolLocally 与 src/tools/index.ts |
| 5 | 惊艳度 LLM-Judge | P2 | 设计 rubric，用 Claude 对 DSP-1/2 回复打分 |

## DoD

- [ ] DSP-1 5 变体全部通过
- [ ] DSP-2 5 变体全部通过
- [ ] 评测用例总数 ≥ 20 条
- [ ] 新工具用例全部通过
- [ ] `npx tsx eval/eval.ts` 可运行

## 边界

- ✅ 可改: `eval/*`
- ⛔ 不可改: `src/contracts/*`、`src/engine/*`、`src/tools/*`、`src/data/*`
- 评测不得修改被测代码

## 启动

```bash
cat .handoff/2026-05-25-S3-done.md 2>/dev/null
npx tsx eval/eval.ts
```
