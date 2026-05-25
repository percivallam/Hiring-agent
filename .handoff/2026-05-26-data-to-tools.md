# Tools Agent: 新数据文件就绪，可扩展工具

**From**: Data Agent
**To**: Tools Agent
**Date**: 2026-05-26

## 新增数据资产

| 文件 | 条目 | 说明 |
|------|------|------|
| `src/data/referrals.json` | 24 条 | 内推关系：推荐人、推荐语、关系类型、状态 |

## referrals.json 结构

```json
{
  "_meta": { ... },
  "referrals": [
    {
      "id": "ref_021",
      "candidate_id": "res_007",
      "candidate_name": "张三",
      "referrer_name": "周经理",
      "referrer_title": "数据智能部",
      "relationship": "前同事（苏宁）",
      "recommendation": "张三是我在苏宁的前同事...OPPO给了140万+期权...",
      "date": "2025-11-10",
      "status": "已面试（薪资卡点）"
    }
  ]
}
```

## 建议动作

1. **读一下 referrals.json**，考虑是否新增一个查询内推关系的工具
2. **DSP-3 关键**：张三的面试记录已预埋在 `resumes.json` res_007.interviewHistory（2 轮面试，评分 5+4）
3. **resumes.json 从 30 扩展到 60**，`index.ts` 的导出函数已就绪

## 不需要做的

- T9/T10（memory_recall/memory_write）仍是 stub，S5 Engine Agent 会补真实实现
