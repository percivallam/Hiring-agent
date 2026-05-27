# src/data/ — 人才库数据文档 v3

> Data Agent · simulation refresh · 2026-05-28

## 文件清单

| 文件 | 条目 | 结构 | 用途 |
|------|------|------|------|
| resumes.json | **100 条** | `{ _meta, data: [...] }` | 默认人才库：接近线上真实分布的仿真候选人简历 |
| resumes-simulated-100.json | **100 条** | `{ _meta, data: [...] }` | 100 份仿真人才库源文件，研发/产品/运营/销售 = 30/20/20/30 |
| resumes-golden-60.json | **60 条** | `{ _meta, data: [...] }` | 旧版 DSP 黄金人才库备份 |
| resume-simulation-preview.json | **2 条** | `{ _meta, data: [...] }` | 仿真数据风格预览样例 |
| jobs.json | 10 条 | `{ _meta, data: [...] }` | 岗位信息（故意不含 BSP） |
| pipeline.json | 10 个岗位 | `{ _meta, jobs: {...} }` | 招聘管道数据 + 周趋势 |
| market.json | 15 个方向 | `{ _meta, ...directions }` | 市场分析（含 BSP 方向） |
| salary.json | 12 个岗位 | `{ _meta, ...positions }` | 薪酬对标（含 BSP） |
| **referrals.json** | **24 条** | `{ _meta, referrals: [...] }` | **内推关系 × 推荐语 × 关系类型** |

## v3 变更（2026-05-28）

- **resumes.json**: 60 → **100** 条，切换为更接近线上真实分布的仿真人才库
- **分布**: 研发 30、产品 20、运营 20、销售 30
- **研发技术栈**: 覆盖后端、前端、数据、算法、SRE、云原生、客户端、测试、安全、嵌入式、数据库、AI 平台、音视频等方向
- **备份**: 旧版 60 条 DSP 黄金人才库已保存为 `resumes-golden-60.json`

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
| **resumes-golden-60.json** | res_026 潘越、res_027 钟志强、res_044 袁思琪、res_047 任志远、res_056 熊昊天、res_058 池明轩（DSP-1 跨界家族） |

### DSP-2 — 候选人鲜明对比

| 角色 | 候选人 | 特征 |
|------|--------|------|
| 稳健型 | resumes-golden-60.json res_001 张明远 | 阿里 8 年、CTR+12%、管理 8 人 |
| 潜力型 | resumes-golden-60.json res_012 林佳怡 | 字节+快手、成长快、管理弱 |
| 风险型 | resumes-golden-60.json res_021 钱一鸣 | 初创负责人、2 年 3 家公司 |
| 电商型 | resumes-golden-60.json res_031 郭子豪 | 小米 7 年、偏业务方向 |

### DSP-3 — 张三回访 Memory 唤醒

| 数据文件 | 关键条目 |
|----------|---------|
| resumes-golden-60.json res_007 | lastActive=2025-11-20, notes 含 OPPO+薪资敏感 |
| resumes-golden-60.json res_007 | interviewHistory: 2 轮面试（2025-11-15/18），评分 5+4 |
| **referrals.json ref_021** | 张三内推记录：周经理推荐，明确提到"薪资卡在 130 万，OPPO 给 140 万+期权" |

### DSP-4 — 张三面试包定制

| 数据文件 | 关键条目 |
|----------|---------|
| resumes-golden-60.json res_007 | careerHistory: 苏宁电商→腾讯视频（场景转型）+ 多目标融合线上事故 |
| resumes-golden-60.json res_007 | projects: A/B 实验平台从 0 搭建 |

### DSP-5 — 算法岗通过率下降

| 数据文件 | 关键条目 |
|----------|---------|
| pipeline.json job_001 | weekly_history: 28%→25%→22%→19%（4 周） |
| pipeline.json overallSummary | "建议复盘候选人画像" |
