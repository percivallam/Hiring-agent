# AI 招聘 Agent Demo — Mock 数据 & 对话引擎集成指南

## 文件清单

| 文件 | 大小 | 说明 |
|------|------|------|
| `mockData.ts` | ~20KB | 完整 Mock 数据（候选人、职位、分析数据、市场洞察、评估模板） |
| `conversationEngine.ts` | ~70KB | 完整对话引擎（关键词匹配 + 卡片点击处理） |

## 快速集成步骤

### 1. 替换文件

将 `mockData.ts` 和 `conversationEngine.ts` 放到项目的 `src/` 目录下（或对应的源码目录），替换原有的 mock 数据和对话逻辑。

### 2. 在主组件中接入引擎

```tsx
import { createEngine, type UserRole, type AgentMessage } from './conversationEngine';

// 初始化引擎（根据当前角色）
const [role, setRole] = useState<UserRole>('hm');
const [engine] = useState(() => createEngine(role));

// 处理用户输入
function handleSend(text: string) {
  // 添加用户消息到 UI
  addUserMessage(text);
  // 引擎处理并返回 Agent 回复
  const responses: AgentMessage[] = engine.processInput(text);
  // 逐条展示 Agent 回复（可加打字机效果）
  responses.forEach(msg => addAgentMessage(msg));
}

// 处理卡片按钮点击
function handleCardAction(actionId: string, payload: any) {
  const responses = engine.handleCardClick(actionId, payload);
  responses.forEach(msg => addAgentMessage(msg));
}

// 角色切换
function switchRole(newRole: UserRole) {
  setRole(newRole);
  engine.setRole(newRole);
  engine.reset();
}
```

### 3. 渲染卡片组件

每个 `AgentMessage` 包含可选的 `cards` 数组，每张卡片有 `type`、`data`、`actions`。

```tsx
function renderCard(card: MessageCard) {
  switch (card.type) {
    case 'candidate_card':
      return <CandidateCard data={card.data} onAction={handleCardAction} />;
    case 'candidate_list':
      return <CandidateListCard data={card.data} onAction={handleCardAction} />;
    case 'comparison_table':
      return <ComparisonTable data={card.data} onAction={handleCardAction} />;
    case 'analytics_chart':
      return <AnalyticsChart data={card.data} onAction={handleCardAction} />;
    case 'schedule_card':
      return <ScheduleCard data={card.data} onAction={handleCardAction} />;
    case 'evaluation_form':
      return <EvaluationForm data={card.data} onAction={handleCardAction} />;
    case 'jd_preview':
      return <JDPreview data={card.data} onAction={handleCardAction} />;
    case 'market_insight':
      return <MarketInsight data={card.data} onAction={handleCardAction} />;
    case 'progress_tracker':
      return <ProgressTracker data={card.data} onAction={handleCardAction} />;
  }
}

// 卡片中的按钮渲染
function renderActions(actions: CardAction[]) {
  return actions.map(action => (
    <button
      key={action.id}
      onClick={() => handleCardAction(action.id, action.payload)}
    >
      {action.label}
    </button>
  ));
}
```

### 4. 上下文设置（可选）

```tsx
// 设置当前查看的岗位（影响推荐逻辑）
engine.setCurrentJob('j001');

// 设置当前讨论的候选人
engine.setCurrentCandidate('c001');
```

## 覆盖的对话场景

### HM（用人经理）— 12 个场景
| # | 场景 | 触发关键词示例 | 关联 Agent |
|---|------|---------------|------------|
| 1 | 找人推荐 | "帮我找推荐算法工程师" | Sourcing Agent |
| 2 | 定向搜索 | "有没有阿里/美团的博士" | Sourcing Agent |
| 3 | 候选人评估 | "这个人怎么样" | Screening Agent |
| 4 | 候选人对比 | "对比一下前三个人" | Decision Support |
| 5 | 安排面试 | "安排面试" | Interview Agent |
| 6 | 面试反馈 | "面试反馈表" | Evaluation Quality |
| 7 | JD 编写 | "写个JD" | Content & JD |
| 8 | 数据报表 | "看看招聘数据" | Analytics |
| 9 | 市场洞察 | "市场行情怎么样" | Market Intelligence |
| 10 | Offer 决策 | "给他发 Offer" | Decision Support |
| 11 | 候选人吸引 | "怎么吸引这个人" | Sell Agent |
| 12 | HC 规划 | "HC 编制情况" | Team & HC Planning |
| 13 | 进度跟踪 | "招聘进展到哪了" | Coordination |
| 14 | 深度背景 | "看看这个人的背景" | People Intelligence |

### HR（招聘人员）— 7 个场景
| # | 场景 | 触发关键词示例 | 关联 Agent |
|---|------|---------------|------------|
| 1 | Pipeline | "整体招聘进展" | Analytics |
| 2 | 渠道分析 | "渠道效率" | Analytics |
| 3 | 合规检查 | "背调/竞业" | Coordination |
| 4 | 批量操作 | "批量安排面试" | Coordination |
| 5 | 面试官管理 | "面试官表现" | Evaluation Quality |
| 6 | 周报/月报 | "本周招聘报告" | Analytics |
| 7 | 薪酬建议 | "薪酬定薪" | Decision Support |

### Candidate（候选人）— 7 个场景
| # | 场景 | 触发关键词示例 | 关联 Agent |
|---|------|---------------|------------|
| 1 | 职位查询 | "有什么在招" | Candidate Experience |
| 2 | 进度查询 | "我的进度" | Candidate Experience |
| 3 | 面试准备 | "怎么准备面试" | Candidate Experience |
| 4 | 团队介绍 | "团队介绍" | Candidate Experience |
| 5 | 福利待遇 | "福利待遇" | Candidate Experience |
| 6 | 入职相关 | "入职准备" | Candidate Experience |
| 7 | 地址交通 | "面试地点" | Candidate Experience |

### 卡片点击事件 — 20+ 种响应
包括：查看简历、安排面试、确认面试、联系候选人、拒绝候选人、对比候选人、调整筛选、导出、编辑JD、发布JD、AI优化JD、深度分析、竞对详情、薪酬对标、催办提醒、换面试官、换时间、查看评价历史、开始填写评价 等。

## 测试建议

以 HM 角色测试以下对话流：
1. "帮我找推荐算法工程师" → 看到候选人列表 → 点击"对比 Top3" → 点击"选择李明" → "安排面试" → 点击"确认安排"
2. "市场行情怎么样" → 点击"深度分析" → 点击"薪酬对标"
3. "写个JD" → 点击"AI 优化 JD" → 点击"发布 JD"
4. "招聘数据怎么样" → 点击"导出报告"

切换 HR 角色测试：
1. "看看整体 Pipeline" → "渠道分析" → "本周招聘报告"
2. "面试官表现怎么样" → "批量安排面试"

切换候选人角色测试：
1. "有什么在招" → "怎么准备面试" → "面试地点在哪"
2. "我的面试进度" → "团队介绍"
