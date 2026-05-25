# Hiring Agent Demo - 项目上下文文档

> 用于跨会话恢复项目上下文。本文档记录当前项目的核心架构、已完成改动、部署状态和配置信息。

---

## 一、项目背景

**核心目标**：构建一个覆盖 **88 个 Session 意图** 的 AI 招聘助手，支持三种角色（用人经理/HR/候选人）的完整招聘场景。

**已完成状态**：
- ✅ 88 个意图全部覆盖（Mock 数据模式 + 模型 API 模式）
- ✅ 20 种 UI 卡片类型（候选人列表、人才档案、对比分析、风险评估、市场分析、薪酬对标、Pipeline 总览、面试排程、Offer 方案、团队诊断、入职计划、人脉图谱、消息模板等）
- ✅ 部署到线上公网（通过 Cloudflare Tunnel）
- ✅ API Key 已内置（火山引擎 ark-code-latest）

---

## 二、技术架构

### 目录结构
```
src/
├── types/index.ts              # 20 种 MessageType + 数据接口
├── engine/
│   ├── SmartConversationEngine.ts   # 主引擎：意图匹配 + 响应生成
│   ├── intentMap.ts                 # 88 个意图定义 + 关键词匹配
│   └── mockData.ts                  # 所有意图的 Mock 数据
├── model/
│   ├── BaseClient.ts           # BASE_SYSTEM_PROMPT + STRUCTURED_OUTPUT_SCHEMA
│   ├── OpenAIClient.ts         # OpenAI 协议兼容（含火山引擎路径修正）
│   └── types.ts                # 模型接口类型
├── components/cards/           # 20 个卡片组件
└── components/chat/            # ChatView + MessageList + MessageBubble
```

### 关键文件清单
| 文件 | 职责 |
|------|------|
| `src/model/BaseClient.ts` | **System Prompt** 定义处。已重写为资深招聘专家角色，覆盖 88 意图矩阵 |
| `src/engine/intentMap.ts` | 88 个 IntentPattern 定义，包含 keywords/roles/messageTypes/thinkingSteps |
| `src/engine/mockData.ts` | 所有卡片类型的 Mock 数据工厂 |
| `src/engine/SmartConversationEngine.ts` | 意图路由 + Mock 响应生成器（1600+ 行，每个意图有独立 handler） |
| `proxy-server.cjs` | **同域代理服务器**：解决浏览器 CORS，转发 `/api/proxy/*` → 火山引擎 |

---

## 三、System Prompt 核心设定

**角色**：HireAgent，10年+招聘行业经验的 AI 招聘合伙人（猎头顾问 + 用人经理智囊 + HR 运营专家 + 候选人职业导师）

**响应策略**：
- 能用卡片展示结构化数据的 → 优先卡片 + 文字解读
- 咨询建议/解释说明类 → 专业文本回复 + 快捷操作
- **绝对禁止**：只返回 quick_actions 而不给任何文本

**角色差异化**：
- `hm`：直接、结果导向、有业务视角
- `hr`：专业、数据支撑、全局视角
- `candidate`：友好、鼓励性、有同理心

---

## 四、API 配置

**当前内置默认配置**（`src/components/chat/ChatView.tsx`）：
```js
{
  provider: 'openai',
  apiKey: 'c4c02b33-1ee0-455b-82ef-0b899e521f08',
  model: 'ark-code-latest',
  baseUrl: '/api/proxy/api/coding/v3',
  temperature: 0.7,
  maxTokens: 4000
}
```

**端点**：火山引擎 ARK API（OpenAI 协议兼容）
- 原始端点：`https://ark.cn-beijing.volces.com/api/coding/v3`
- 代理路径：`/api/proxy/api/coding/v3`

**重要**：OpenAIClient.ts 已修正路径逻辑——检测到 `volces.com` 域名时，自动使用 `/chat/completions` 而非 `/v1/chat/completions`。

---

## 五、部署方式

**当前部署**：Cloudflare Quick Tunnel（临时公网地址）

**启动命令**（在项目根目录执行）：
```bash
# 1. 构建
npm run build

# 2. 启动代理服务器（同时托管静态文件 + API 代理）
node proxy-server.cjs

# 3. 创建公网隧道（新开终端）
cloudflared tunnel --url http://localhost:3456
```

**代理服务器说明**（`proxy-server.cjs`）：
- 端口：3456
- 静态文件：`dist/` 目录
- API 代理：`/api/proxy/*` → `https://ark.cn-beijing.volces.com/*`
- 已配置 CORS headers

---

## 六、模型配置面板

**文件**：`src/components/ModelConfigPanel.tsx`

- 模型选择已改为 **可输入的文本框**（非下拉框），支持任意模型名称
- provider 选择：openai / claude / moonshot / deepseek
- 火山引擎需选 **openai** provider + 自定义 baseUrl

---

## 七、已知问题 & 注意事项

1. **Cloudflare Tunnel 是临时的** → 每次重启会更换 URL，需要重新分享
2. **maxTokens 已提升到 4000** → 支持更长的 System Prompt 和结构化输出
3. **System Prompt 很长** → 约 18KB，每次请求都会携带，注意 token 消耗
4. **模型不支持 JSON mode** → `ark-code-latest` 在 `chatWithStructuredOutput` 中已自动跳过 `response_format: { type: 'json_object' }`
5. **OpenAIClient 错误处理增强** → 非 JSON 响应（如 HTML 404）现在会给出清晰的 `HTTP 404: xxx` 提示

---

## 八、快速恢复检查清单

如需继续开发，请确认：
- [ ] `npm run build` 能成功构建
- [ ] `node proxy-server.cjs` 能启动（端口 3456）
- [ ] `cloudflared tunnel --url http://localhost:3456` 能创建公网 URL
- [ ] 前端页面右上角显示 **"AI 模式"**（表示 API 配置生效）

---

## 九、88 意图速查（按角色）

### 用人经理（hm）- 59个
A1 找人(10): 特定人名查找、模糊检索、简历调取、动态追踪、深度调研、画像Sourcing、对标克隆、内部流动、被动触达、人脉图谱
A2 市场(7): 岗位对标、人才分布、供需分析、薪酬对标、难度预判、趋势洞察、Title对标
A3 JD(6): JD生成、JD优化、竞品JD对标、画像修正、能力模型、多语言发布
A4 评估(8): 简历筛选、候选人对比、疑点分析、风险评估、历史对标、录用决策、可解释性、历史记录
A5 面试(7): AI面试、面试题、报告解读、评价代写、校准会、一致性分析、偏差检测
A6 流程(7): 进度总览、老化预警、瓶颈诊断、跨角色催办、面试排程、节点查询、周期预测
A7 Offer(6): Sell方案、薪酬评估、竞争情报、Offer生成、Loss分析、沟通函
A8 团队(5): 能力诊断、影响模拟、优先级、HC规划、历史复盘
A9 闭环(3): 质量回溯、Onboarding、渠道分析

### 招聘HR（hr）- 16个
60 Pipeline监控、61 风险预警、62 滞留检测、63 报告生成、64 渠道分析、65 供应商评估、66 体验监控、67 合规检查、68 催办通知、69 人才复用、70 根因分析、71 成本核算、72 汇报材料、73 体验分析、74 批量操作、75 竞对动态

### 候选人（candidate）- 13个
76 岗位推荐、77 岗位搜索、78 进度查询、79 面试预期、80 模拟面试、81 团队信息、82 薪酬咨询、83 岗位匹配、84 简历优化、85 面试改期、86 入职引导、87 内推入口、88 反馈解释
