# 模型 API 集成

## 支持的模型

| 提供商 | 模型示例 | 说明 |
|--------|----------|------|
| OpenAI | gpt-4o, gpt-4o-mini | 需要 OpenAI API Key |
| Claude | claude-3-opus, claude-3-sonnet | 需要 Anthropic API Key |
| Moonshot | moonshot-v1-8k | 月之暗面，国内可用 |
| DeepSeek | deepseek-chat | DeepSeek，国内可用 |

## 快速开始

```typescript
import { createModelClient } from '@/model';

// 1. 创建模型客户端
const client = createModelClient({
  provider: 'openai',
  apiKey: 'your-api-key',
  model: 'gpt-4o-mini',
  temperature: 0.7
});

// 2. 普通对话
const response = await client.chat([
  { role: 'system', content: '你是招聘助手' },
  { role: 'user', content: '帮我找几个推荐系统工程师' }
]);

// 3. 流式对话
await client.chatStream(messages, {
  onContent: (chunk) => console.log(chunk),
  onComplete: (response) => console.log('完成')
});

// 4. 结构化输出（返回卡片数据）
const structured = await client.chatWithStructuredOutput(messages);
// 返回: { thinking, text, cards, quickActions }
```

## 环境变量配置

在项目根目录创建 `.env` 文件：

```
VITE_OPENAI_API_KEY=your-openai-key
VITE_CLAUDE_API_KEY=your-claude-key
VITE_MOONSHOT_API_KEY=your-moonshot-key
```

## 提示词工程

模型被设计为返回结构化 JSON，包含：
- `thinking`: 思考过程
- `text`: 纯文本回复
- `cards`: 卡片数组（候选人列表、图表等）
- `quickActions`: 快捷操作按钮
