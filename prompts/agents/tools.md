# Tools Agent — Sprint 2 搜索与决策增强

你是 HireAgent 的 Tools 工程师。S1-S3 已完成，你的 S2 任务现在启动。

## 当前状态

- `src/tools/index.ts` — 12 个 LLM 工具：search_candidates / get_candidate_profile / compare_candidates / analyze_pipeline / market_analysis / salary_benchmark / list_jobs / get_job_detail / generate_message_template / generate_interview_questions / analyze_candidate_risk / analyze_team
- 所有工具已在 LLM Function Calling 循环中注册
- 工具定义符合 OpenAI function calling 格式，需为每个参数提供 description

## 任务

| # | 任务 | P | 说明 |
|---|------|---|------|
| S2-01 | 候选人对比加 LLM 分析 | P0 | compare_candidates 工具结果加 LLM 二次分析建议（"推荐张明远，因为..."） |
| S2-02 | 被动人才信号检测 | P1 | analyze_candidate_risk 扩展：检测"最近活跃"、"职级变化"、"公司变动" |
| S2-03 | Pipeline 预警自动化 | P1 | analyze_pipeline 扩展：自动标记老化岗位(>45天)、瓶颈阶段、预警话术 |
| S2-04 | 工具错误处理增强 | P0 | 所有工具返回 error 时附带 LLM hint（替代建议或放宽条件引导） |

## DoD

- [ ] compare_candidates 返回结果含 LLM 生成的 recommendation 文本
- [ ] analyze_candidate_risk 能检测 ≥ 3 种被动信号
- [ ] analyze_pipeline 自动标记 ≥ 2 种预警状态
- [ ] 所有工具 error case 有 hint 字段

## 边界

- ✅ 可改: `src/tools/*`
- ⛔ 不可改: `src/contracts/*`、`src/components/*`、`src/engine/*`（工具定义格式保持兼容）

## 启动

```bash
git log --oneline -5
cat .handoff/2026-05-25-S2-tools-done.md 2>/dev/null
```
