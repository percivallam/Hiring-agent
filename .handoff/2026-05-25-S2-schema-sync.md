# S2 Schema Sync — Mock Schema 共识

**日期**: 2026-05-25
**参与方**: Tools Agent (tools) + Data Agent (data)
**协议**: Data Agent 出 schema 草案 → Tools Agent 30 分钟内 review → 不超过 2 回合 → 超时升级 Spec Owner

---

## 一、Tools Agent 开工自检（§7 四个必答）

### Q1: 12 个工具的实现顺序

按 S2 spec 建议顺序，映射到 contracts 工具名：

| 顺序 | S2 Spec T# | 工具名 | 数据源 | 说明 |
|------|-----------|--------|--------|------|
| 1 | T7 | `list_jobs` | jobs.json | 最简单：读文件、过滤、返回数组 |
| 2 | T8 | `get_job_detail` | jobs.json | 单条查询，依赖 T7 试水完成 |
| 3 | T1 | `search_candidates` | resumes.json | 核心搜索，需要 fuzzy match utils |
| 4 | T2 | `get_candidate_profile` | resumes.json | 详情查询 |
| 5 | T3 | `compare_candidates` | resumes.json | 多人对比矩阵 |
| 6 | T4 | `analyze_pipeline` | pipeline.json | 聚合分析 |
| 7 | T5 | `market_analysis` | market.json | 市场数据查询 |
| 8 | T6 | `salary_benchmark` | salary.json | 薪酬对标 |
| 9 | T9/T10 | `memory_recall` / `memory_write` | stub | S5 替换，现返回空 |
| 10 | T11 | `interview_kit_prepare` | resumes + jobs | 演示型，精心 mock |
| 11 | T12 | `generate_report` | pipeline.json + jobs | 报告聚合 |

### Q2: 参数与 contracts/tools.ts 是否完全符合？列出出入

逐个工具对照：

| 工具 | Contracts 参数 | 校验结果 |
|------|---------------|---------|
| `list_jobs` | `department?`, `status?` | ✅ 完全一致 |
| `get_job_detail` | `job_id` | ✅ 完全一致 |
| `search_candidates` | `query`, `experience_min?`, `experience_max?`, `education?`, `location?`, `limit?`, `sort_by_match?` | ✅ 完全一致 |
| `get_candidate_profile` | `candidate_id` | ✅ 完全一致 |
| `compare_candidates` | `candidate_ids: [string, string]` | ✅ 完全一致 |
| `analyze_pipeline` | `job_id?` | ✅ 完全一致 |
| `market_analysis` | `position`, `location?` | ✅ 完全一致 |
| `salary_benchmark` | `position`, `level?`, `location?` | ✅ 完全一致 |
| `memory_recall` | `layer`, `query`, `candidate_id?`, `limit?` | ✅ 完全一致（stub） |
| `memory_write` | `layer`, `entity_id?`, `content` | ✅ 完全一致（stub） |
| `interview_kit_prepare` | `candidate_id`, `job_id` | ✅ 完全一致（demo） |
| `generate_report` | `report_type`, `department?` | ✅ 完全一致 |

**结论**: contracts/tools.ts 是权威源，所有 12 工具的入参完全对齐，无需整改。

### Q3: 共享 utils 计划放哪些函数

| 函数 | 用途 | 被哪些工具使用 |
|------|------|-------------|
| `fuzzyMatch(text, query)` | 中文分词 + 模糊匹配（含 skill 同义词映射） | T3, T7, T8 |
| `scoreCandidates(candidates, query)` | 匹配度评分 0-100 | T3 |
| `loadJSON(path)` | 统一 JSON 读取 + 错误包装 | 全部 |
| `wrapResult(data, mode, hint?)` | 构造 `ToolResult<T>` 统一返回 | 全部 |
| `sortByField<T>(arr, field, order)` | 通用排序 | T3, T7 |
| `filterByFields<T>(arr, filters)` | 通用多字段过滤 | T3, T7 |
| `extractHighlights(candidate, query)` | 提取匹配亮点 | T3 |
| `extractGaps(candidate, query)` | 提取差距点 | T3 |

**决策**: 不引入 lodash，全部用 native JS。已存在于 `src/data/index.ts` 的 `tokenize`/`computeMatchScore`/`expandTokens`/`SKILL_SYNONYMS` 将迁移到 `src/tools/utils/`。

### Q4: 疑问（3 条）

1. **tools 文件命名**：S2 spec §4.3 的 T 编号与 contracts/tools.ts 的 T 编号不一致（spec T1=search_candidates vs contracts T1=list_jobs）。建议文件名用工具英文名（如 `src/tools/list_jobs.ts`），不用 T 编号，避免歧义。

2. **现有 `src/data/` JSON 与 contracts 字段名不匹配** — resumes.json 用 camelCase（`currentCompany`），contracts 用 snake_case（`current_company`）。需要在这份 handoff 中与 Data Agent 达成一致：谁改、改到什么程度。

3. **现有 `src/tools/index.ts` 是旧版 516 行的单体文件**，使用旧 `ToolDefinition`（OpenAI function calling 格式）。直接删除重写为 `TOOL_REGISTRY` + 各工具导入。

---

## 二、Mock Schema 共识（两人合答）

### 现状：Data 文件 vs Contracts 字段名差距

#### resumes.json → contracts CandidateProfile / CandidateSummary

| 数据文件字段 | Contracts 类型字段 | 差距 |
|-------------|-------------------|------|
| `id` | `id` | ✅ |
| `name` | `name` | ✅ |
| `currentCompany` | `current_company` | ❌ camelCase → 需改 snake_case |
| `currentTitle` | `current_title` | ❌ |
| `experience` | `experience_years` | ❌ |
| `skills[]` | `skills[]` | ✅ |
| `careerHistory[]` | `career[]` | ❌ 字段名 + 内部 `techStack` vs `tech_stack` |
| `projects[]` | `projects[]` | ❌ 内部字段 `techStack` → `tech_stack` |
| `onlinePresence` | `online_presence` | ❌ |
| `lastActive` | `last_active` | ❌ |
| `status` | `active_status` | ⚠️ 值域 ok，但字段名不同 |
| `tags[]` | `tags[]` (CandidateSummary) | ✅ |
| — | `interview_history[]` | ❌ resume 中完全缺失 |
| — | `expected_salary` | ❌ resume 有 `salary` 但不是 expected |
| — | `email`, `phone` | ❌ resume 有但 contracts profile 是可选 |
| — | `location` | ❌ resume 有但 contracts profile 是可选 |

#### jobs.json → contracts JobSummary / JobDetail

| 数据文件字段 | Contracts 类型字段 | 差距 |
|-------------|-------------------|------|
| `id`, `title`, `department`, `level` | 同名 | ✅ |
| `openDays` | `open_days` | ❌ camelCase |
| `targetCount` | — (不在 JobSummary) | ❌ 额外字段 |
| — | `status` | ❌ 缺失 |
| — | `pipeline_counts` | ❌ 缺失 |
| — | `requirements[]` | ❌ 缺失 |
| — | `nice_to_have[]` | ❌ 缺失 |
| — | `salary_range` | ❌ 缺失 |
| — | `pipeline[]` | ❌ 缺失 |

#### pipeline.json → contracts PipelineAnalysisData

当前是 `{ jobs: { job_001: {...}, ... }, overallSummary }` 字典嵌套。
Contracts 期望 `{ title, jobs: PipelineJobSnapshot[], summary }` 数组 + 内字段 snake_case。

#### market.json → contracts MarketAnalysisData

当前是 `{ recommendation_engineer: {...}, llm_engineer: {...} }` 字典，每个 role 有 `totalCandidates` 字符串、`salaryRange` 对象。
Contracts 期望 `{ title, analysis_type, data: MarketDataPoint[], insights[] }`。

#### salary.json → contracts SalaryBenchmarkData

当前是 `{ recommendation_engineer: { position, benchmarks[], marketMedian, recommendation } }`。
Contracts 期望 `{ title, position, benchmarks: SalaryBenchmarkEntry[], market_median, recommendation }`。

**(字段名较接近，主要差 `marketMedian` → `market_median`)**

---

### Tools Agent 的提议（等 Data Agent 回应）

**方案 A（推荐）**：Data Agent 将 5 个 JSON 文件统一改为 contracts 的 snake_case 字段名 + 结构。Tools 层零映射，直接读原文。

**方案 B（备选）**：Data Agent 保持现有 camelCase，Tools 层在读取时统一做 `camelToSnake` 映射 + 结构适配。

**方案 C（折中）**：Data Agent 改 resumes/jobs/salary（字段名差异小），Tools 层适配 pipeline/market（结构差异大）。

**Tools Agent 倾向方案 A** — contracts 已是权威源，双重映射增加维护负担和调试成本。

---

### 数据条数确认

| 文件 | 当前条数 | Spec 要求 | 差距 |
|------|---------|----------|------|
| resumes.json | 20 条（res_001 ~ res_020，其中 res_016-020 为占位 stub） | 30 条（含 res_007 张三） | 需补 10 条 + res_007 改名 |
| jobs.json | 5 条（job_001 ~ job_005） | 10 条（故意不含 BSP 工程师） | 需补 5 条 |
| pipeline.json | 5 个岗位的 pipeline 快照（嵌套字典结构） | 50 条（待确认含义） | 需确认 + 结构改造 |
| market.json | 3 个方向（rec_engineer / llm_engineer / backend_architect） | 15 个方向（含 BSP/嵌入式） | 需补 12 个 |
| salary.json | 5 个方向（含 frontend_expert / data_platform_lead） | 按职级×城市 | 需确认 |

---

### DSP 钩子检查清单（Tools 侧需确认 Data 侧是否到位）

| DSP | 埋点要求 | 当前状态（grep 确认） |
|-----|---------|---------------------|
| DSP-1 | jobs.json 故意无 BSP，market.json 有 BSP 方向 | ❌ 全项目 grep `BSP\|bsp\|嵌入式`：**零匹配** |
| DSP-2 | resumes.json 有 5+ 推荐系统经验候选人 | ⚠️ 需 Data Agent 确认：张明远(res_001) 推荐系统 8 年，还需要 4+ 个推荐方向候选人 |
| DSP-3 | res_007 张三，last_interaction 2025-11-20 | ❌ **res_007 当前是「周睿」**（蚂蚁集团/后端/Java），不是张三 |
| DSP-4 | 有候选人×岗位匹配对供 T11 生成面试包 | ⚠️ 建议：张明远(res_001) × 高级推荐算法工程师(job_001) |
| DSP-5 | pipeline 算法岗通过率下降趋势 28→19% | ❌ 当前 pipeline.json 无逐周通过率数据，只有一个当前时间点快照 |

---

## 三、待 Data Agent 回应

请 Data Agent 在下方补充：

### Data Agent 开工自检（§7 四问）

1. 5 个 DSP 钩子的具体植入方案（每条数据怎么写，id 怎么编）：
2. 30 条 resume 怎么分布（职能 / 司龄 / 经验）才像真的：
3. 是否用脚本生成 + 手工微调 vs 纯手工：
4. 疑问 ≤ 3 条：

### 对 Schema 方案的回应
- [ ] 接受方案 A（全改 snake_case）
- [ ] 接受方案 B（全不改，Tools 层映射）
- [ ] 接受方案 C（部分改）
- [ ] 提出方案 D（自拟）

---

**签名**: Tools Agent, 2026-05-25
**状态**: 等待 Data Agent 回应
