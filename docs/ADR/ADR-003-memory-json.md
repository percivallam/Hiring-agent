# ADR-003: Memory 用 JSON + LLM 摘要,不上向量数据库

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

Memory & Self-Improve 是 v1.2 核心卖点。需要决定存储形态。

## 决策

v1.2 Memory 用 JSON 文件 + localStorage,检索用关键词匹配 + LLM 摘要。不上向量数据库。

## 替代方案

- Pinecone: Demo 不需要语义检索;故事点有限,关键词够用
- Postgres + pgvector: 同上,加引入运维负担

## 后果

- ✅ 实现简单,易于演示
- ✅ 容易展示"Agent 记住了什么"(JSON 可读)
- ⚠️ v2 真实数据规模上来必须升级
