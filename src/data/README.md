# src/data/ — 黄金数据文档 v2

> Data Agent · S2.1 交付 · 2026-05-26

## 文件清单

| 文件 | 条目 | 结构 | 用途 |
|------|------|------|------|
| resumes.json | **60 条** | `{ _meta, data: [...] }` | 候选人简历 + 面试记录 + 内推备注 |
| jobs.json | 10 条 | `{ _meta, data: [...] }` | 岗位信息（故意不含 BSP） |
| pipeline.json | 10 个岗位 | `{ _meta, jobs: {...} }` | 招聘管道数据 + 周趋势 |
| market.json | 15 个方向 | `{ _meta, ...directions }` | 市场分析（含 BSP 方向） |
| salary.json | 12 个岗位 | `{ _meta, ...positions }` | 薪酬对标（含 BSP） |
| **referrals.json** | **24 条** | `{ _meta, referrals: [...] }` | **内推关系 × 推荐语 × 关系类型** |

## v2 变更（2026-05-26）

- **resumes.json**: 30 → **60** 条（新增 30 个候选人，覆盖安全/自动驾驶/编译器/芯片/游戏等方向）
- **interviewHistory**: 7 位候选人有面试记录（评分 1-5 + 结构化反馈）
- **notes 深化**: 每条黄金候选人补内推来源、离职动机、薪酬博弈信息
- **referrals.json**: 新建 24 条内推关系，含推荐人、推荐语、关系类型（前同事/猎头/导师/校友等）

## DSP 黄金故事点索引

### DSP-1 — BSP 工程师在库中故意为 0

| 数据文件 | 关键条目 |
|----------|---------|
| **jobs.json** | 全部 10 岗位**不含** BSP/嵌入式 |
| **market.json** | `bsp_firmware_engineer` + `embedded_iot` |
| **salary.json** | `bsp_engineer` + `embedded_iot` |
| **resumes.json** | res_026 潘越、res_027 钟志强、res_044 袁思琪、res_047 任志远、res_056 熊昊天、res_058 池明轩（DSP-1 跨界家族） |

### DSP-2 — 候选人鲜明对比

| 角色 | 候选人 | 特征 |
|------|--------|------|
| 稳健型 | res_001 张明远 | 阿里 8 年、CTR+12%、管理 8 人 |
| 潜力型 | res_012 林佳怡 | 字节+快手、成长快、管理弱 |
| 风险型 | res_021 钱一鸣 | 初创负责人、2 年 3 家公司 |
| 电商型 | res_031 郭子豪 | 小米 7 年、偏业务方向 |

### DSP-3 — 张三回访 Memory 唤醒

| 数据文件 | 关键条目 |
|----------|---------|
| resumes.json res_007 | lastActive=2025-11-20, notes 含 OPPO+薪资敏感 |
| resumes.json res_007 | interviewHistory: 2 轮面试（2025-11-15/18），评分 5+4 |
| **referrals.json ref_021** | 张三内推记录：周经理推荐，明确提到"薪资卡在 130 万，OPPO 给 140 万+期权" |

### DSP-4 — 张三面试包定制

| 数据文件 | 关键条目 |
|----------|---------|
| resumes.json res_007 | careerHistory: 苏宁电商→腾讯视频（场景转型）+ 多目标融合线上事故 |
| resumes.json res_007 | projects: A/B 实验平台从 0 搭建 |

### DSP-5 — 算法岗通过率下降

| 数据文件 | 关键条目 |
|----------|---------|
| pipeline.json job_001 | weekly_history: 28%→25%→22%→19%（4 周） |
| pipeline.json overallSummary | "建议复盘候选人画像" |
