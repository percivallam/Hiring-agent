# ADR-006: 契约层由林品臣独家 review

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

多 Agent 并行最大风险是接口契约漂移: A 改了 search_candidates 返回字段,B 写的卡片就废了。
按文件夹划边界不够,必须有"契约权威"。

## 决策

`src/contracts/*` 是契约层,只有林品臣(Spec Agent)能改。其他 Agent 想改契约必须先提 issue,林品臣 24h 内裁决。

## 替代方案

- 各 Agent 自由改: 必然漂移
- Tools Agent 兼任: 利益相关,容易自肥

## 后果

- ✅ 接口稳定
- ⚠️ 林品臣成为瓶颈 → 通过 24h SLA 兜底
