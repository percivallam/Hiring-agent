# src/data/ — 黄金数据文档

> Data Agent · S2 交付 · 2026-05-25

## 文件清单

| 文件 | 条目 | 结构 | 用途 |
|------|------|------|------|
| resumes.json | 30 条 | `{ _meta, data: [...] }` | 候选人简历 |
| jobs.json | 10 条 | `{ _meta, data: [...] }` | 岗位信息 |
| pipeline.json | 10 个岗位 | `{ _meta, jobs: {...} }` | 招聘管道数据 |
| market.json | 15 个方向 | `{ _meta, ...directions }` | 市场分析数据 |
| salary.json | 12 个岗位 | `{ _meta, ...positions }` | 薪酬对标数据 |

## DSP 黄金故事点索引

### DSP-1 — BSP 工程师在库中故意为 0

> 触发 LLM 领域知识接管，基于 market 数据反推岗位画像。

| 数据文件 | 关键条目 | 故事埋点 |
|----------|---------|----------|
| **jobs.json** | 全部 10 个岗位 | **故意不含** "BSP工程师 / 嵌入式底层 / 固件开发" 等关键词 |
| **market.json** | `bsp_firmware_engineer` | BSP 人才市场全貌：人才池 2,000-3,000 人、华为/大疆/小米/蔚来主力、P50=65 万 |
| **market.json** | `embedded_iot` | 嵌入式/IoT 补充数据：5,000-8,000 人、车联网推动增长 |
| **salary.json** | `bsp_engineer` | BSP 薪酬对标：华为/大疆/小米/蔚来/海康威视 |
| **salary.json** | `embedded_iot` | 嵌入式薪酬对标：车规级溢价 30% |
| **resumes.json** | res_026 潘越、res_027 钟志强 | 两位 BSP/底层候选人背景，搜索时可命中 |

**验收 Query**: "BSP 工程师怎么招" → T7 返回空 → T5 命中 `bsp_firmware_engineer` → C5 岗位画像建议卡接管

---

### DSP-2 — 3 位候选人鲜明对比

> 对比卡推荐结论能写真实判断。

| 数据文件 | 关键条目 | 故事埋点 |
|----------|---------|----------|
| **resumes.json** | **res_001 张明远**（稳健型） | 阿里 8 年、CTR 提升 12%、管理 8 人团队。优点：经验深厚/领导力；风险：可能 overqualified、薪资预期高 |
| **resumes.json** | **res_012 林佳怡**（潜力型） | 字节 4 年 + 快手 1 年、精排全链路、成长快。优点：年轻/可塑性/快手+字节双背景；风险：管理经验不足 2 年 |
| **resumes.json** | **res_021 钱一鸣**（风险型） | 初创公司算法负责人、近 2 年换 3 家公司。优点：全栈/hands-on/0-1 能力；风险：稳定性差、每段停留 <1 年 |

**验收 Query**: "对比候选人 res_001 和 res_021" → T3 compare_candidates → C3 对比卡含 recommendation

---

### DSP-3 — 张三回访 Memory 唤醒

> 第二次会话时 Memory 唤醒"薪资敏感 + 正在比较 OPPO offer"。

| 数据文件 | 关键条目 | 故事埋点 |
|----------|---------|----------|
| **resumes.json** | **res_007 张三** | lastActive = "2025-11-20"，status = "passive" |
| res_007 → notes | 第 1 条 | "二面后流程暂停（2025-11-20），当时薪资期望 130 万超出预算。" |
| res_007 → notes | 第 2 条 | "已知正在比较 OPPO 推荐架构组的 offer（OPPO 给到 140 万+期权）。" |
| res_007 → notes | 第 4 条 | "DSP-3 锚点：二次会话时 Memory 唤醒薪资谈判窗口。" |

**验收 Query**: 首次会话 → 查看张三 → 流程暂停。S5 后二次会话 → Memory 唤醒 → C9 MemoryRecallCard 展示

---

### DSP-4 — 张三面试包定制

> 面试包能生成"懂候选人"的定制问题。

| 数据文件 | 关键条目 | 故事埋点 |
|----------|---------|----------|
| **resumes.json** | **res_007 张三** → careerHistory | 腾讯(推荐精排) → 苏宁(电商推荐) |
| careerHistory[1] → highlights | 第 3 条 | "主导推荐场景从电商到内容化的转型（短视频商品推荐）" → 面试题："为什么从电商跳短视频？场景差异？" |
| careerHistory[0] → highlights | 第 3 条 | "在一次线上事故中 15 分钟定位到多目标权重配置错误" → 面试题："讲一下那次事故的排查路径" |
| projects[1] | A/B 实验平台 | "从 0 到 1 搭建推荐算法 A/B 实验系统" → 面试题考察设计能力 |
| **jobs.json** | **job_001** 高级推荐算法工程师 | 与张三的技能高度匹配 |

**验收 Query**: "给候选人 res_007 准备一面" → T2(get_candidate_profile) + T11(interview_kit_prepare) → C8 面试包卡片含个性化问题

---

### DSP-5 — 算法岗通过率下降趋势

> 周报洞察能写出"建议复盘画像"的判断。

| 数据文件 | 关键条目 | 故事埋点 |
|----------|---------|----------|
| **pipeline.json** | **job_001** → weekly_history | 4 周通过率: W17=28% → W18=25% → W19=22% → W20=19% |
| W19 notes | | "候选人质量明显下降，大模型方向分流" |
| W20 notes | | "本周通过率最低，竞品同期密集发 offer" |
| pipeline.json | overallSummary | "建议复盘候选人画像是否偏离实际市场供应" |

**验收 Query**: "算法岗最近怎么样" → T4(analyze_pipeline) → C7 PipelineReportCard 含下降趋势洞察

---

## 数据生成说明

- 现有 20 条简历（S0 脚手架产物）保留其中 19 条（移除原 res_007 周睿）
- 新增 11 条简历：res_007(张三) + res_021~030
- 5 个岗位（S0 产物）保留并扩展字段（requirements / nice_to_have / salary_range / status），新增 5 个岗位
- 5 个岗位的 pipeline 快照保留，新增 5 个岗位的 pipeline 数据
- 3 个市场方向保留，新增 12 个方向
- 5 个薪酬对标保留，新增 7 个岗位对标
- 所有文件新增 `_meta` 元数据字段，含 `dsp_hooks` 可反查
