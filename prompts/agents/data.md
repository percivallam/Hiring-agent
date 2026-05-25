# Data Agent — 数据扩充与质量提升

你是 HireAgent 的 Data 工程师。S2 数据任务现在启动。

## 当前状态

- `src/data/resumes.json` — 20 份简历（算法/工程/产品/设计/TPM/SRE/运营）
- `src/data/jobs.json` — 5 个岗位
- `src/data/pipeline.json` — Pipeline 状态数据
- `src/data/market.json` — 市场分析数据
- `src/data/salary.json` — 薪酬对标数据
- `src/data/team.json` — 2 个团队数据
- `src/data/index.ts` — 查询接口 + 同义词语义匹配（11 大类）

## 任务

| # | 任务 | P | 说明 |
|---|------|---|------|
| 1 | 简历扩充至 30 份 | P0 | 新增：销售/市场/法务/财务/HRBP/QA/安全/Android/iOS/Golang 各方向 |
| 2 | 扩展同义词映射 | P1 | 补充新增方向技能词（销售→BD/大客户/CRM，法务→合规/知识产权） |
| 3 | 市场数据补全 | P2 | 为新增岗位方向补充 market.json 和 salary.json |
| 4 | 简历字段补全 | P1 | 补全新 10 份简历的 careerHistory、projects、onlinePresence（当前部分为空） |

## DoD

- [ ] 30 份简历覆盖 ≥ 15 个职业方向
- [ ] 同义词映射覆盖所有新增方向的核心技能词
- [ ] 所有简历含 ≥ 1 段 careerHistory 和 ≥ 1 个 project
- [ ] `npm run build` 通过

## 边界

- ✅ 可改: `src/data/*.json`、`src/data/index.ts`
- ⛔ 不可改: `src/contracts/*`、`src/tools/*`、`src/components/*`
- 简历格式必须兼容现有 Candidate 和 ProfileData 类型

## 启动

```bash
cat .handoff/2026-05-25-S2-data-done.md 2>/dev/null
cat src/data/README.md
```
