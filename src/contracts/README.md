# Contracts — HireAgent 契约层

> **Owner**: 林品臣(Spec Agent) — 独家 review，其他 Agent 禁止直接修改。
> **Last updated**: 2026-05-25

## 设计原则

1. **上游优先** — Engine 依赖 Tools 的 `ToolSpec`，UI 依赖 Cards 的 schema，Eval 依赖 Events。契约是单向箭头。
2. **最小完备** — 只定义跨 Agent 接口必需的字段，不预埋 "可能用到" 的扩展。
3. **字段注释即文档** — 每个字段旁必须有 JSDoc 注释解释「谁用 / 什么时候有值 / 默认值」。
4. **空/错态强制** — Cards 的 `emptyHint` / `errorHint` 字段是必填的（ADR-007），不允许 undefined。

## 文件说明

| 文件 | 内容 | 消费者 |
|------|------|--------|
| `tools.ts` | 12 个工具的 ToolSpec + ToolResult\<T\> | Engine, Tools |
| `cards.ts` | 10 类卡片 schema（含四态） | UI, Engine |
| `memory.ts` | 三层记忆 schema | Engine, UI(C9 卡片) |
| `events.ts` | 埋点事件 schema | Eval, Self-Improve |
| `index.ts` | 统一导出 + 类型守卫 | 全部 Agent |

## 修改流程

1. 非 Spec Agent 发现契约不够用 → 写 issue 给林品臣
2. 林品臣 24h 内裁决 → 修改 contracts + 通知受影响 Agent
3. 受影响 Agent 在各自分支适配

## 禁止事项

- ❌ 私自修改任何 contracts 文件
- ❌ 在 contracts 中引用 `src/types/*`（contracts 是底层，types 是 UI 层）
- ❌ 使用 `any` 类型
