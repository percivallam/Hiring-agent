# S3 回顾 — UI Agent

**Date**: 2026-05-25
**Status**: Done

---

## 做了什么

### 10 张卡片组件
全部按 `contracts/cards.ts` 的接口实现，每张支持四态（loading / empty / error / live）+ demo 模式：

- C1 候选人列表 — 排序/筛选按钮，候选人状态标签
- C2 候选人画像 — 头像渐变 + 匹配度环 + 工作/项目/面试时间线
- C3 候选人对比 — 三列表格 + 优势箭头 + LLM 推荐结论
- C4 岗位卡 — 需求/加分列表 + 招聘漏斗进度条
- C5 岗位画像建议 — 重要性色标（critical/important/nice_to_have）+ 搜索策略 blockquote
- C6 市场分析 — 水平数据条 + 图表类型标签 + insights 高亮
- C7 漏斗/周报 — 5 指标网格 + 漏斗条 + alerts + insights
- C8 面试包 — 折叠面板（默认展开前 2 个 category）+ 难度标签 + 模拟面试入口
- C9 记忆唤醒 — framer-motion 呼吸金边 + 三层记忆图标 + 时间线
- C10 引导澄清 — prompt + 选项列表

### 共享基础设施
- 4 个共享态组件（LoadingSkeleton / EmptyHint / ErrorHint / DemoBadge）
- CardRenderer（静态 map 路由 + C10 error fallback）
- /dev/cards storybook（hash 路由，支持单选卡片 + dev mode 切换）
- 20 个快照测试

---

## 遇到什么

1. contracts vs S3 文档的字段差异 — 以 contracts 为准，**已自行决策**（mode 而非 state，message 而非 intent）
2. 旧卡片共存 — 保留 24 个旧组件不删，新卡片用 `C{N}_` 前缀
3. tsc 未使用导入 — lib.dom 的 `structuredClone`、未使用的 `i` 索引、多个未使用 icon 导入

---

## 下一步

S4 可以由 Engine Agent 将 CardRenderer 接入 ChatView 的 MessageBubble，把工具返回的 `AgentCard` 对象渲染为对应卡片。
