# HireAgent v1.2 项目状态

> 最后更新: 2026-05-26 by PM Agent
> Active Slice: S5
> Active Branch: main

---

## 总体进度

```
[████████████████░░░░] S0-S4 ✅ Done → S5 可启动
```

---

## Slice 进度表

| Slice | 内容 | 状态 | 主导 Agent | Branch | PR | 备注 |
|-------|------|------|-----------|--------|-----|------|
| S0 | 契约层 + 脚手架 | ✅ Done | 林品臣(Spec) | main | - | contracts/* 全部落地，tsc + build 通过 |
| S1 | Engine Loop 重构 | ✅ Done | engine | - | - | 依赖 S0 ✅，含向后兼容桩 |
| S2 | Tools + Golden Data | ✅ Done | tools / data | - | - | 依赖 S0 ✅ |
| S3 | 10 类卡片 + 状态规范 | ✅ Done | ui | - | - | 依赖 S0 ✅ |
| S4 | DSP-1 + DSP-2 闭环 | ✅ Done | engine + eval | main | - | eval 29/32, brilliance 5.0/5 |
| S5 | Memory + DSP-3 闭环 | 🟡 In Progress | engine + eval | - | - | 依赖 S4 ✅ |
| S6 | DSP-4(壳) + DSP-5 闭环 | ⚪ Pending | tools(demo) + ui + eval | - | - | 依赖 S5 |
| S7 | Self-Improve 闭环 + polish | 🟡 In Progress | engine + eval | - | - | Engine: collector/classifier/optimizer ✅ |

状态图例: ⚪ Pending / 🟡 In Progress / 🟢 Review / ✅ Done / 🔴 Blocked

---

## S0 交付清单

- ✅ `src/contracts/tools.ts` — 12 个工具的 ToolSpec + ToolResult\<T\> + 参数 schema
- ✅ `src/contracts/cards.ts` — 10 类卡片 schema（含四态字段 + actions + hints）
- ✅ `src/contracts/memory.ts` — 三层记忆 schema（session/user/candidate）
- ✅ `src/contracts/events.ts` — 7 类埋点事件 schema
- ✅ `src/contracts/index.ts` — 统一导出 + TOOL_SPECS 常量注册表 + 工具函数
- ✅ `src/contracts/README.md` — 契约层使用说明
- ✅ `tsc --noEmit` 零错误
- ✅ `npm run build`（tsc + vite build）通过
- ✅ PRD.md 同步飞书 v1.2 最新版（2026-05-24）

---

## 当前阻塞

(无)

---

## 待办交接

(见 `.handoff/` 目录)

---

## 最近合并历史

| 日期 | 提交 | 说明 |
|------|------|------|
| 2026-05-25 | [spec][S0] contracts 层全部落地 | tools/cards/memory/events 契约定义完成 |

---

## 关键决策(摘要,详见 docs/ADR)

| ADR | 决策 |
|-----|------|
| 001 | 唯一编排范式: Function Calling Loop |
| 002 | v1.2 不升级技术栈 |
| 003 | Memory 用 JSON + LLM 摘要 |
| 004 | Self-Improve 采用方案 B(自动闭环) |
| 005 | AI 面试做壳不做芯 |
| 006 | 契约层由林品臣独家 review |
| 007 | 卡片空/错态由 LLM 兜底 |

---

## Open Questions(已默认决策)

| OQ | 问题 | 默认决策 |
|----|------|---------|
| OQ-01 | Self-Improve Optimizer 用什么模型 | Claude(推理强);DeepSeek 跑路径回归 |
| OQ-02 | 记忆冲突"待确认"UI 怎么呈现 | S5 由 UI Agent 提案 |
| OQ-03 | 演示数据标识在 demo 给老板时是否隐藏 | 默认隐藏 + dev mode 切换 |
| OQ-04 | DSP-4 模拟面试入口要不要做假对话 | 做 2 轮预制对话 |
| OQ-05 | Eval LLM-Judge 用什么模型 | Claude,固定 temperature=0 |
