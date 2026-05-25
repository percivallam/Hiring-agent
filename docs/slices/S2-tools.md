# S2 Tools — 回顾

**角色**: Tools Agent
**日期**: 2026-05-25
**状态**: ✅ Done

## 做了什么

实现了 12 个工具，全部从 `src/data/*.json` 读取真实数据，返回符合 `contracts/tools.ts` 的 `ToolResult<T>`。

### 交付清单

| 文件 | 说明 |
|------|------|
| `src/tools/utils/loadData.ts` | 统一数据加载（Vite 静态导入）+ ok/err 结果构造 |
| `src/tools/utils/mappers.ts` | camelCase JSON → snake_case contracts 类型映射层 |
| `src/tools/utils/fuzzyMatch.ts` | 中文分词、同义词扩展、匹配评分、亮点/差距提取 |
| `src/tools/list_jobs.ts` | T1 — 列出所有岗位，支持部门/状态筛选 |
| `src/tools/get_job_detail.ts` | T2 — 岗位详情，含 pipeline 进度 |
| `src/tools/search_candidates.ts` | T3 — 候选人搜索，含 fuzzy match + 评分排序 |
| `src/tools/get_candidate_profile.ts` | T4 — 候选人完整画像 |
| `src/tools/compare_candidates.ts` | T5 — 两人多维度对比 |
| `src/tools/market_analysis.ts` | T6 — 市场分析（关键词→role key 映射） |
| `src/tools/salary_benchmark.ts` | T7 — 薪酬对标，支持 level 过滤 |
| `src/tools/analyze_pipeline.ts` | T8 — Pipeline 健康度分析 |
| `src/tools/memory_recall.ts` | T9 — Stub，返回空数组（S5 替换） |
| `src/tools/memory_write.ts` | T10 — Stub，返回 success（S5 替换） |
| `src/tools/interview_kit_prepare.ts` | T11 — Demo 模式，个性化面试包 |
| `src/tools/generate_report.ts` | T12 — 周报/月报聚合 |
| `src/tools/index.ts` | RealToolExecutor + TOOL_REGISTRY + 向后兼容类型 |
| `test/tools.test.ts` | 41 个单测（每个工具 ≥ 3 个） |

### 关键决策

1. **数据映射层**：Data Agent 同步更新了 data 文件为 `{_meta, data}` 包装结构 + snake_case 字段名。`loadData` 自动解包 `data` 字段，`mappers` 做精确 snake_case 映射（非通用递归转换）。

2. **文件命名**：使用工具英文名（`list_jobs.ts`），不用 T 编号，避免与 S2 spec 和 contracts 的 T 编号不一致。

3. **RealToolExecutor**：实现 Engine 的 `ToolExecutor` 接口，Engine 只需 `new RealToolExecutor()` 替换 `MockToolExecutor` 即可切换到真实工具。

4. **向后兼容**：保留 `ToolDefinition`/`ToolCall`/`ToolParameter` 类型导出，供 `src/model/OpenAIClient.ts` 使用。

## 遇到什么

- **Data Agent 与 Tools Agent 并行工作**：Data Agent 在工具实现过程中同步更新了 JSON 格式（加了 `_meta` 包裹），导致 `loadData` 需要适配解包逻辑。已配合修改。
- **res_007 改名**：从「周睿」变为「张三」，DSP-3 钩子已植入。
- **旧 tools/index.ts 重写**：从 516 行单体文件改为 84 行 `RealToolExecutor` + 12 个分文件。

## 下一步

- Engine Agent：可用 `createRealToolExecutor()` 替代 `MockToolExecutor`
- Data Agent：联调 `npx tsx test/tools/integration.test.ts`
- 联调完成 → tag `s2-done`
