# S8 ai-native shell + legacy demo fusion

## 做了什么

- 在分支 `codex/ai-native-recruiting-shell-preview` 上把默认入口切到 AI-native CUI shell。
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
- 新增右侧 drawer：
  - 候选人简历
  - 职位描述对比
  - 招聘漏斗
  - 推荐诊断
- 新增 CUI 交互：
  - `/` 指令菜单
  - `⌘K` 命令面板
  - `⌘\` 开关 drawer
  - `⌘,` 打开设置
  - `⌘B` 收起左侧会话 rail
  - `Esc` 关闭 overlay / drawer
- 新 shell 的设置区只从左下角进入，不进入主导航。

## 未改动边界

- 没有修改 `src/contracts/*`。
- 没有修改 `src/engine/*`。
- 没有修改 `src/tools/*`。
- 没有修改 localStorage key 格式。
- 没有清空或迁移既有历史消息。
- 没有推送、没有部署。

## 影响清单

| 区域 | 影响 | 风险 | 缓解 |
| --- | --- | --- | --- |
| 默认入口 | `/` 从老 Demo shell 改为 AI-native shell | 线上若直接合并会改变首屏 | 当前只在 preview 分支，不上线；`/classic` 可回退 |
| 消息渲染 | `MessageList` 新增可选 drawer 回调 | 老版可能被额外 click 包裹影响 | `/classic` 不传回调；现有卡片行为保留 |
| C1 候选人列表 | 候选人行可键盘/点击打开 drawer | 行内点击与后续动作可能重叠 | 仅新增 optional `onCandidateOpen`，actions 仍走 `onActionClick` |
| CardRenderer | 向 C1 透传 optional `onCandidateOpen` | 其他卡片收到未知 prop | React 自定义组件可忽略未知 prop；构建通过 |
| 样式 | `.ai-native-shell` scoped tokens 适配旧卡片 | 旧卡片在新壳内颜色被收敛到 terminal green | 仅 scoped 于新 shell；`/classic` 不受影响 |
| 数据详情 | drawer 通过现有 `getResumeById/getJobs/getPipelineData` 补全 | 部分卡片 payload 不完整时只显示 fallback | 后续 engine agent 可提供结构化 drawer payload |

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

- `npm run build` 通过。
- 构建提示：
  - Vite CJS Node API deprecation warning，非本次引入。
  - CSS minify warning `Expected identifier but found "-"`，需后续单独定位，当前不阻塞构建。
  - bundle size warning，老项目已有体量问题，后续可做 code split。

## 仍需人工看的一点

新 shell 的主轴已经是 CUI-first，右侧 drawer 由任务结果触发。下一步应该重点做视觉审美细节和 drawer 内容真实性，而不是继续加传统 ATS 导航。
