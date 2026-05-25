# HireAgent - AI 招聘助手 Demo

一个基于 React + TypeScript + Vite 的对话式智能招聘系统前端 Demo。

## 功能特性

- 🤖 **对话式交互**: 支持自然语言对话完成招聘全流程
- 👥 **多角色支持**: 用人经理(HM)、招聘HR、候选人三种角色
- 🎨 **9种消息卡片**: 文本、候选人卡片、列表、数据分析、JD、评估、快捷操作、时间线、思考中
- ✨ **打字机效果**: Agent 消息逐字显示
- 🔄 **思考动画**: 展示 AI 处理步骤
- 📱 **响应式设计**: 支持桌面和移动端

## 技术栈

- React 18 + TypeScript
- Vite (构建工具)
- TailwindCSS + Shadcn/UI (样式)
- Zustand (状态管理)
- Framer Motion (动画)
- Recharts (图表)
- Lucide Icons (图标)

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 使用指南

### 角色切换
点击顶部导航栏的角色切换器，可在「用人经理」、「招聘HR」、「候选人」之间切换。

### Demo 交互场景

1. **找人**
   - 输入: "帮我找几个做推荐系统的人"
   - 展示候选人卡片列表

2. **修正搜索**
   - 输入: "太偏算法了，我要能落地的"
   - 展示调整后的推荐

3. **查看招聘报告**
   - 输入: "我的招聘进度怎么样了"
   - 展示数据分析卡片(指标网格 + 漏斗图)

4. **写JD**
   - 输入: "帮我写个JD"
   - 展示 JD 预览卡片

5. **候选人查进度**
   - 切换至候选人角色
   - 输入: "我投的岗位到哪了"
   - 展示进度时间线

### 快捷指令
在输入框中输入 `/` 可查看快捷指令菜单。

## 项目结构

```
src/
├── components/
│   ├── layout/          # 布局组件
│   │   ├── TopNav.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatusBar.tsx
│   ├── chat/            # 聊天组件
│   │   ├── ChatView.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── InputArea.tsx
│   │   └── ThinkingIndicator.tsx
│   ├── cards/           # 消息卡片
│   │   ├── CandidateCard.tsx
│   │   ├── CandidateList.tsx
│   │   ├── AnalyticsCard.tsx
│   │   ├── FunnelChart.tsx
│   │   ├── MetricGrid.tsx
│   │   ├── JDCard.tsx
│   │   ├── EvaluationCard.tsx
│   │   ├── TimelineCard.tsx
│   │   └── QuickActionBar.tsx
│   └── shared/          # 共享组件
│       ├── Avatar.tsx
│       ├── MatchScoreBar.tsx
│       ├── TagGroup.tsx
│       └── MarkdownRenderer.tsx
├── engine/              # 对话引擎
│   ├── conversationEngine.ts
│   └── mockData.ts
├── store/               # Zustand Store
│   ├── userStore.ts
│   ├── chatStore.ts
│   └── sessionStore.ts
├── types/               # TypeScript 类型
│   └── index.ts
├── lib/                 # 工具函数
│   └── utils.ts
├── App.tsx
└── main.tsx
```

## License

MIT
