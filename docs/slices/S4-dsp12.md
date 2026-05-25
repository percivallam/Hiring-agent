# Slice S4 — DSP-1 + DSP-2 闭环

**Owner**: Engine Agent + Eval Agent
**PM Agent**: 调度决策
**前置依赖**: S0✅ S1✅ S2✅ S3✅
**预计工期**: 1.5 天 (加速模式)
**对应 PRD**: Part 3.1 DSP-1/DSP-2, Part 4

---

## 0. 前置检查

S3 UI Agent 已完成 CardRenderer → MessageList 集成 (commit `4142783`)。`ChatOutput.cards` 可直接渲染。

```bash
git tag -l | grep s3-done && ls src/components/cards/CardRenderer.tsx
```

---

## 1. 目标

打通 DSP-1(库外岗位接管) + DSP-2(找人对比) 端到端闭环。

---

## 2. 范围

### Engine Agent
- 接入真实 Tools (`createRealToolExecutor()`)
- 连接 DeepSeek API (需 `.env` 中 `VITE_DEEPSEEK_API_KEY`)
- System Prompt 优化 (DSP-1 接管话术 + DSP-2 对比话术)
- `ChatOutput.cards` 填入真实卡片

### Eval Agent
- DSP-1 路径回归 5 变体 (BSP/嵌入式/固件/底层驱动/芯片)
- DSP-2 路径回归 5 变体 (推荐系统/Golang/前端/数据平台/全栈)
- 惊艳度 LLM-Judge: DSP-1 ≥ 4.5, DSP-2 ≥ 4.0
- 兜底测试 ≥ 10 条

### 非范围
- ❌ 不改 contracts / 不新增工具 / 不实现 Memory / 不做 Self-Improve

---

## 3. DSP 行为规格

### DSP-1: 库外岗位接管

**语料**: "帮我找一个 BSP 工程师"

**预期**:
1. search_candidates → 返回空 (库中故意为 0)
2. market_analysis + salary_benchmark → 返回 BSP 市场数据
3. LLM 用领域知识接管: 市场判断 / 典型来源 / 薪酬带 / 搜索策略
4. **不输出** "未找到" / "暂无"
5. cards: C5(岗位画像建议卡) + C6(市场分析卡)

### DSP-2: 找人 + 对比

**语料**: "帮我找几个做推荐系统的人" → "对比一下张明远和李雷"

**预期**:
1. search_candidates → C1(候选人列表卡, ≥3人)
2. compare_candidates → C3(对比卡, ≥5维度)
3. LLM 给明确推荐结论 (非"各有优势")

---

## 4. 验收 (DoD)

- [ ] Engine: 真实 Tools 接入, `test/engine.test.ts` 全绿
- [ ] Engine: `ChatOutput.cards` 非空 (DSP-1: C5+C6, DSP-2: C1+C3)
- [ ] Eval: DSP-1 5/5 + DSP-2 5/5 路径回归
- [ ] Eval: 惊艳度 DSP-1 ≥ 4.5 / DSP-2 ≥ 4.0
- [ ] Eval: 兜底 ≥ 90%
- [ ] `tsc --noEmit` + `git tag s4-done` + handoff

---

## 5. 工程步骤 (加速: 1.5 天)

| # | Agent | 任务 | 预估 |
|---|-------|------|------|
| 1 | Engine | 接入真实 Tools + DeepSeek API | 1h |
| 2 | Engine | System Prompt 优化 + cards 填入 | 2h |
| 3 | Eval | 路径回归 10 条用例编写 | 2h |
| 4 | Eval | 惊艳度 LLM-Judge + 兜底测试 | 1.5h |
| 5 | 联调 | Engine+Eval 联调 + 录屏 | 1.5h |

---

## 6. 风险

| 风险 | 缓解 |
|------|------|
| DeepSeek API 不稳定 → eval 偶发失败 | relaxed 模式 + 重试 |
| System Prompt 调优耗时 → 惊艳度不达标 | baseline 优先，polish 留 S7 |
