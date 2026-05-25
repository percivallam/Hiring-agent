# ADR-007: 卡片空态/错误态由 LLM 兜底

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

v0.1 demo 中"未找到候选人"等裸文案是体验最大伤口。

## 决策

所有卡片的空态、错误态禁止裸文案,必须由 LLM 生成接管话术(公理 A3)。
UI 组件接收 `emptyHint: string` / `errorHint: string` 字段,由 Engine Agent 在工具失败时生成。

## 替代方案

- 前端默认 "暂无数据": 体验崩盘
- 多语言资源包: 没法体现"招聘合伙人"语气

## 后果

- ✅ 失败也"演得专业"
- ⚠️ Engine + UI 协作要求高 → 通过 contracts/cards.ts 强制 hint 字段
