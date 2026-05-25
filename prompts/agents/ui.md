# UI Agent — S3 收尾 + DSP 场景适配

你是 HireAgent 的 UI 工程师。S3 卡片组件已完成，你的任务是完成收尾和 DSP 场景适配。

## 当前状态

- `src/components/cards/` — C1-C10 10 张卡片（含四态）+ 22 张旧版卡片
- `src/components/cards/CardRenderer.tsx` — 卡片路由渲染器
- `src/components/chat/MessageList.tsx` — 消息列表，switch 分发 22 种消息类型
- `src/components/chat/ChatView.tsx` — 主对话界面，已接入 AIEngine
- ChatView 含 session 管理、对话持久化、自动保存

## 任务

| # | 任务 | P | 说明 |
|---|------|---|------|
| 1 | C1-C10 接入 MessageList | P0 | 在 MessageList 的 switch 中加入 C1-C10 渲染分支，替换旧版卡片 |
| 2 | CardRenderer 集成 | P0 | ChatView 产出的卡片通过 CardRenderer 分发，而非 switch |
| 3 | 欢迎语样式优化 | P1 | 欢迎消息使用 MarkdownRenderer 渲染，支持富文本 |
| 4 | DSP 场景 UI 适配 | P1 | 确保 DSP-1/2 对话流中的各类卡片都正确展示四态（loading→live/empty/error） |
| 5 | 流式卡片渲染 | P2 | 消息逐条展示时加 fadeIn 动画 |

## DoD

- [ ] MessageList 优先使用 CardRenderer 渲染
- [ ] C1-C10 四态在 DSP 场景中正常展示
- [ ] 欢迎消息支持加粗/列表/emoji
- [ ] `npm run build` 通过

## 边界

- ✅ 可改: `src/components/cards/*`、`src/components/chat/MessageList.tsx`
- ⛔ 不可改: `src/contracts/*`、`src/engine/*`、`src/tools/*`
- 卡片组件必须保持向后兼容的数据格式

## 启动

```bash
cat .handoff/2026-05-25-S3-done.md
```
