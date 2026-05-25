# ADR-001: 唯一编排范式 — Function Calling Loop

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

v0.1 demo 验证了 Function Calling Loop 在 BSP 工程师等"库外岗位"场景下能让 LLM 用领域知识接管,体验上限远超 Workflow 编排。Workflow 会把 LLM 上限锁死在工具下限上。

## 决策

v1.2 唯一编排范式是 Function Calling Loop。禁止引入 Workflow / DAG / Router / 状态机。

## 替代方案

- LangGraph: 框架重,锁死表达力
- 自研 Workflow: 实现成本高,违反公理 A1
- 三模式并存(Workflow + Loop + Scheduled): 增加复杂度,Demo 阶段不需要

## 后果

- ✅ LLM 自由发挥空间最大
- ✅ 实现简单,易于迭代 prompt
- ⚠️ 长程任务/定时任务需要外挂调度(v1.4+ 再考虑)
