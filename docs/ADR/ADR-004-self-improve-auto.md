# ADR-004: Self-Improve 采用方案 B(自动闭环)

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

讨论过两个方案:
- A: 仅样本收集,人工迭代 prompt
- B: 自动用样本反向调 prompt/few-shot

简历评估、AI 面试场景验证 B 方案有效,有显著效果提升。

## 决策

采用方案 B: 失败样本 → LLM-as-Optimizer 分析负样本聚类 → 产出 prompt 修改草案 → 林品臣 review → 一键合入 → 全 DSP 回归。

## 替代方案

- A 方案: 工程量小但不够"AI Native",失去关键演示卖点

## 后果

- ✅ Demo 现场可演"昨天的负样本今天已修复",震撼
- ⚠️ 工程量增加,有 prompt 跑飞风险 → 通过强制 DSP 回归门禁兜底
