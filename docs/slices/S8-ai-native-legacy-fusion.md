# S8 light CUI task drawer redesign

## 做了什么

- 在分支 `codex/light-cui-task-drawer-redesign` 上交付一版浅色 AI-native CUI shell。
- 保留老 Demo 完整入口：访问 `/classic` 仍然渲染原来的 `Sidebar + TopNav + ChatView`。
- 新 shell 复用现有能力：
  - `AIEngine.processInput`
  - `MessageList`
  - `CardRenderer`
  - `useSessionStore`
  - `useChatStore`
  - `hireagent-sessions`
  - `hireagent-msgs-*`
  - `hireagent-current-session`
- 新 shell 信息架构：
  - 左侧：对话、项目、命令面板、设置和 `/classic` 回退入口。
  - 中间：CUI-first 对话流，所有招聘目标先从自然语言输入进入。
  - 右侧：按任务触发的抽屉组件，只在招聘意图需要结构化承载时出现。
- 扩展右侧 drawer 覆盖多重招聘意图：
  - 候选人搜索
  - 候选人简历
  - 职位描述
  - 招聘漏斗
  - 推荐诊断
  - 薪酬对标
  - 面试包
  - 沟通模板
  - 候选人对比
- 新增 CUI 交互：
  - `/` 指令菜单
  - `⌘K` 命令面板
  - `⌘\` 开关 drawer
  - `⌘,` 打开设置
  - `⌘B` 收起左侧会话 rail
  - `Esc` 关闭 overlay / drawer
- 新 shell 的设置区只从左下角进入，不进入主导航。
- 视觉系统收敛到浅色招聘工作台：
  - 背景、卡片、drawer、settings overlay 使用白底、细边框、低阴影。
  - 主操作和选中态为 `#3370ff`。
  - 旧卡片在 `.ai-native-shell` 作用域内统一适配为浅色招聘卡片语言。
- 增加 drawer payload 兼容：
  - 支持 Engine 返回字段在顶层或 `data` 下。
  - 兼容 `salary_range` / `salaryRange`、`market_median` / `marketMedian`、`candidate_a` / `candidateA` 等命名。
  - 多意图输入时先打开最相关任务窗，LLM/tool 结果返回后再由卡片类型补正。

## 未改动边界

- 没有修改 `src/contracts/*`。
- 没有修改 `src/engine/*`。
- 没有修改 `src/tools/*`。
- 没有修改 localStorage key 格式。
- 没有清空或迁移既有历史消息。
- 没有引入 Workflow / DAG / Router / 状态机；主流程仍由 `AIEngine` 的 Function Calling Loop 和工具调用驱动。

## 影响清单

| 区域 | 影响 | 风险 | 缓解 |
| --- | --- | --- | --- |
| 默认入口 | `/` 从老 Demo shell 改为 AI-native shell | 线上若直接合并会改变首屏 | 当前在独立 preview 分支；`/classic` 可回退 |
| 消息渲染 | `MessageList` 新增可选 drawer 回调 | 老版可能被额外 click 包裹影响 | `/classic` 不传回调；现有卡片行为保留 |
| C1 候选人列表 | 候选人行可键盘/点击打开 drawer | 行内点击与后续动作可能重叠 | 仅新增 optional `onCandidateOpen`，actions 仍走 `onActionClick` |
| CardRenderer | 向 C1 透传 optional `onCandidateOpen` | 其他卡片收到未知 prop | React 自定义组件可忽略未知 prop；构建通过 |
| 样式 | `.ai-native-shell` scoped tokens 适配旧卡片 | 旧卡片在新壳内颜色被收敛到浅色招聘工作台和蓝色选中态 | 仅 scoped 于新 shell；`/classic` 不受影响 |
| 默认主题 | 新 shell 默认浅色 | 已习惯暗色预览的人会感知明显变化 | 这是本轮明确方向 |
| drawer 视觉 | 右侧 drawer 从黑色 terminal 面板变成白底 canvas | 视觉更接近传统业务工作台，可能弱化终端感 | 信息架构不变，drawer 仍只由结果触发 |
| 数据详情 | drawer 通过现有 `getResumeById/getJobs/getPipelineData` 补全 | 部分卡片 payload 不完整时只显示 fallback | UI adapter 已兼容顶层/data 两种 payload，后续 engine agent 可提供更完整结构化 payload |

## 给 Engineering Agent 的后续接线建议

1. 把 drawer payload 从 UI fallback 升级为 Engine 结构化输出：
   - candidate drawer：优先返回完整 `candidate_profile`
   - jd drawer：返回 `job_detail` + 改写 diff chunks
   - pipeline drawer：返回可拖拽 kanban 的 stage/candidate 列表
   - diagnosis drawer：返回 attribution + funnel/channel metrics
2. 保持 Function Calling Loop，不引入 workflow/router/state machine。
3. 如果需要把老 Demo 卡片统一 drawer 化，不要改 `src/contracts/*`，先在 UI adapter 里做兼容映射。
4. 上线前需要做历史兼容测试：
   - 有旧 `hireagent-sessions` 时刷新后仍加载当前会话
   - 老 `hireagent-msgs-*` 消息仍能渲染
   - `/classic` 能完整跑旧 Demo
5. 上线策略建议：
   - preview 分支先内部评审
   - 通过后再 merge
   - 合并前保留 `/classic` 至少一个版本周期作为回退入口

## 验证

- `npm run build` 通过（2026-06-01）。
- `npx vitest run` 通过：22 个 card snapshot 测试通过。
- `npx tsx eval/suite/runner.ts --validate-cases` 通过：110 个 eval case schema 校验通过。
- `git diff --check` 通过。
- 本地浏览器 smoke：
  - `http://127.0.0.1:4175/` 页面标题为 `HireAgent - AI 招聘助手`。
  - 默认入口存在 `.ai-native-shell`、左侧 `.hai-left-rail`、输入区 `.hai-composer`。
  - 页面无 React error 文本。
  - 已恢复已有会话内容，未用空数组覆盖历史消息。
- 本地路由 smoke：
  - `http://127.0.0.1:4175/` 返回 `200`。
  - `http://127.0.0.1:4175/classic` 返回 `200`。
- 构建提示：
  - Vite CJS Node API deprecation warning，非本次引入。
  - bundle size warning，老项目已有体量问题，后续可做 code split。
- 代码边界复核：
  - 本轮未修改 `src/contracts/*`、`src/engine/*`、`src/tools/*`。
  - 本轮未修改 `hireagent-sessions` / `hireagent-msgs-*` / `hireagent-current-session` 的读写格式。
  - `deploy.sh` 固定 `git push origin main`，本分支不直接运行该脚本，避免影响主线。

## 仍需人工看的一点

新 shell 的主轴保持 CUI-first，右侧 drawer 由任务结果触发。后续若要进一步提高真实感，应该重点补 drawer 内容真实性和 Engine 结构化 payload，而不是继续加传统 ATS 导航。
