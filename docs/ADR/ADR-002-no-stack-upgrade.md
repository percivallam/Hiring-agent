# ADR-002: v1.2 不升级技术栈

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

v0.1 stack: React 18 + TS + Vite + Tailwind + DeepSeek + JSON 数据 + localStorage。
原 v1.0 PRD 提议升级到 Next.js + Postgres + Pinecone + Redis + BullMQ。

## 决策

v1.2 保持 v0.1 技术栈不变。唯一升级是 AIEngine 重构 + Memory + Self-Improve 模块。

## 替代方案

- 全栈升级: 资源全砸基础设施,DSP 故事点没人写
- 部分升级(Postgres only): 收益小,迁移成本不低

## 后果

- ✅ 资源全部投向 5 条 DSP 与 Self-Improve 闭环
- ✅ Demo 阶段技术栈足够撑住故事
- ⚠️ v2.0 上线前必须完成栈升级
