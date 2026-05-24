# Slice S0: 契约层 + 脚手架

**主导**: 林品臣(Spec Agent)
**依赖**: 无
**预计**: 3 天

## 目标

完成项目脚手架,定义所有跨 Agent 接口契约。这是后续所有 Agent 启动的前置条件。

## 任务清单

- [ ] `src/contracts/tools.ts` — 12 个工具的 ToolSpec / ToolResult 定义
- [ ] `src/contracts/cards.ts` — 10 类卡片 schema(含 actions / hints / mode 字段)
- [ ] `src/contracts/memory.ts` — 三层记忆 schema
- [ ] `src/contracts/events.ts` — 埋点事件 schema(给 Eval / Self-Improve 用)
- [ ] 项目可 `npm install` + `npm run dev` 跑空白页
- [ ] CI 跑通(lint + tsc + 空 eval)
- [ ] PRD.md 同步飞书最新版

## DoD

- [ ] contracts/* 全部定义,有 README 解释每个字段
- [ ] 任意一个 Agent cd 进项目执行启动仪式 5 步,30s 内能输出"我是谁/做什么/有哪些 handoff"
- [ ] STATE.md 更新 S0 → ✅ Done

## 阻塞依赖

- 无(这是项目第一片)
