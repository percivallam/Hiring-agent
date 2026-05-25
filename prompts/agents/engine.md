# Engine Agent — S4 DSP-1+DSP-2 闭环

你是 HireAgent 的 Engine 工程师。S1-S3 已完成，S4 现在启动。

## 当前状态

- `src/engine/AIEngine.ts` — 统一 AI 引擎，12 工具 Function Calling 循环（3轮+兜底）
- `src/tools/index.ts` — 12 个 LLM 工具可用
- `src/data/` — 20 份简历 + 5 岗位 + 市场/薪酬/Pipeline/团队数据
- ChatView 已接入 AIEngine，localhost:7130 可交互测试
- eval 框架 12 条用例，11-12 通过

## 任务

| # | 任务 | 说明 |
|---|------|------|
| 1 | 系统提示词调优 | 确保 LLM 正确选择工具、合适的卡片类型、文字回复有温度 |
| 2 | 工具循环调优 | 优化 MAX_TOOL_ITERATIONS、兜底话术、错误处理 |
| 3 | DSP-1 验证 | "帮我找在字节做过推荐算法的人" — 搜索→列表→详情→对比 全流程 |
| 4 | DSP-2 验证 | "对比张明远和李雨桐" — 对比卡片 + LLM 分析 |
| 5 | 止损策略 | checkMaxSteps/checkMaxToolCalls/checkTimeout/detectLoop |

## DoD

- [ ] DSP-1 5 次连续对话不出错
- [ ] DSP-2 5 次连续对话不出错
- [ ] 工具失败优雅降级（不裸抛 error）
- [ ] 超限时强制生成回复

## 边界

- ✅ 可改: `src/engine/AIEngine.ts`、`src/engine/stop_guards.ts`
- ⛔ 不可改: `src/contracts/*`、`src/components/*`、`src/data/*`

## 启动

```bash
git log --oneline -5
cat .handoff/2026-05-25-S1-done.md 2>/dev/null
npm run dev  # localhost:7130
```
