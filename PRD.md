# HireAgent 产品设计文档 v1.2
> **定位**：AI Native 招聘智能体的「想象力 Demo」 · **版本**：v1.2 · **日期**：2026-05-24 · **状态**：替代 v1.0，作为多 Agent 并行开发的 Single Source of Truth

> 💡 **注意**
> 这不是一份 MVP PRD，而是一份「想象力 Demo」的产品规格。读者请优先理解 Part 1（产品哲学），所有后续章节都是在这三个公理之下展开的工程化落地。

---

## Part 0 · 文档说明
### 0.1 文档定位
本文档是 HireAgent 项目的 **Single Source of Truth**，同时服务于三类读者：

| 读者 | 关心什么 | 优先阅读 |
| --- | --- | --- |
| 林品臣（PM/架构师） | 战略对齐、范围控制、决策记录 | Part 1 / 6 / 9 |
| 看 Demo 的老板与观众 | AI Native 是什么、惊艳在哪 | Part 1 / 3.1 演示路径 |
| Coding / Eval Agents | 明确的接口契约与验收物 | Part 3 / 4 / 7 |

### 0.2 版本与变更原则
- 每次重大决策（架构/范围/范式）必须更新 ADR 列表（附录 B）并写入变更日志（附录 D）
- 契约层（Part 7.0）的任何修改必须由林品臣本人 review，不允许任何 Coding Agent 自行变更
- 本文档使用 v1.x 表示 Demo 阶段的迭代版本；v2.x 才代表生产化版本
### 0.3 术语速查
完整术语见附录 A。本节仅列影响阅读的高频术语：

| 术语 | 定义 |
| --- | --- |
| AI Native | 以 LLM 为操作系统的产品形态，人是决策者；与「ATS + AI 功能」相对 |
| Function Calling Loop | LLM 自主决策何时调用工具、何时回复的极简编排范式，本项目的唯一架构范式 |
| Self-Improve | 系统自动收集对话样本，反向迭代 system prompt / few-shot / 工具描述的闭环 |
| DSP（Demo Showcase Path） | 演示路径，本项目的最小验收单元，详见 3.1 |
| 演示型工具（Demo-Mode Tool） | 返回精心构造 mock 数据的工具，与「真实工具」并行存在，用于演示效果 |

---

## Part 1 · 产品哲学
### 1.1 一句话定位
> 💡 **注意**
> HireAgent 是 **AI Native 招聘智能体的可演示形态**——通过 5 条高密度演示路径，让看 demo 的人在 10 分钟内理解「招聘的下一代形态长什么样」。

### 1.2 三大公理（Axioms）
本项目所有设计决策都必须可以回溯到下面三条公理之一。任何与公理冲突的设计提案在评审时直接 reject。

| 编号 | 公理 | 含义 |
| --- | --- | --- |
| A1 | **LLM 上限 > 工具下限** | 永远给 LLM 兜底发挥的空间。当工具无法满足意图时，LLM 必须能用自身知识接管，而非返回"未找到"。Workflow 编排会把 LLM 的上限锁死在工具的下限上，因此本项目不采用。 |
| A2 | **演示路径优先** | 5 条 DSP 必须惊艳、稳定、可复现；非 DSP 路径可以摆烂。所有工程资源在两者冲突时一律向 DSP 倾斜。 |
| A3 | **优雅失败** | 失败也要演得像一个 10 年经验的资深招聘合伙人。返回堆栈、报错码、JSON 异常一律视为产品事故；用人话兜底是基本素养。 |

### 1.3 AI Native 判别标准（vs ATS+AI vs Workflow Agent）

| 维度 | ATS + AI 功能 | Workflow Agent | **HireAgent（AI Native）** |
| --- | --- | --- | --- |
| 交互入口 | 表单 + 按钮 | 表单 + 部分对话 | **全对话** |
| 编排范式 | 规则引擎 | DAG / 状态机 | **LLM Loop** |
| 失败处理 | 报错 | 降级到默认分支 | **LLM 用知识接管** |
| 个性化 | 规则配置 | 用户分层 | **Memory + Self-Improve** |
| 能力扩展 | 开发新功能 | 新增节点 | **新增工具描述** |

### 1.4 Non-goals（显式不做的事）
下列内容在 v1.x Demo 阶段一律 **不做**，任何 Coding Agent 提议都应被驳回：
1. **生产级准确率**：不追求长尾意图的全准，不做工具调用准确率的硬指标
1. **全量数据**：不接入真实人才库、岗位库、HRIS
1. **Workflow 编排**：不引入 DAG / 状态机 / 规则路由，唯一编排范式是 Function Calling Loop
1. **合规与隐私体系**：不做 PII 脱敏、Adversarial 防御、偏见检测、漂移监控
1. **真实排程与触达**：不接入飞书日历、邮件、短信；面试排程仅作 UI 呈现
1. **AI 面试的「芯」**：AI 面试做壳不做芯，详见 3.1 DSP-4 与 3.5 演示型工具
1. **账号体系与多租户**：不做登录、权限、企业空间隔离
1. **性能优化**：不做 p95 延迟、并发、降级、限流（v2.0 再考虑）
### 1.5 目标用户与首发场景

| 角色 | 首发场景 | 对应 DSP |
| --- | --- | --- |
| 用人经理 | 新 HC 启动 + 候选人筛选与对比 | DSP-1、DSP-2 |
| 招聘 HR / 合伙人 | 长程跟进 + 周报洞察 | DSP-3、DSP-5 |
| 候选人 / 面试官 | 面试包与评分卡（壳层） | DSP-4 |

---

## Part 2 · 现状基线（v0.1 Demo As-Is）
### 2.1 已验证的产品假设

| 编号 | 假设 | 验证结果 | 对 v1.2 的指导 |
| --- | --- | --- | --- |
| H1 | 纯对话即可完成多角色招聘场景的关键操作 | ✅ 成立 | v1.2 继续 All-Chat，不退回表单 |
| H2 | Function Calling Loop 足够支撑 80% 招聘意图 | ✅ 成立 | v1.2 砍掉 Workflow 方案的设想 |
| H3 | LLM 在「库外岗位」可以用领域知识接管 | ✅ 成立（BSP 案例） | 升级为 DSP-1 的核心路径 |
| H4 | 22 种卡片能覆盖大部分回复形态 | ⚠️ 过多 | v1.2 精简到 ~10 类 |
| H5 | JSON + localStorage 足以撑住 Demo | ✅ 成立 | v1.2 不升级到 DB/向量库 |

### 2.2 暴露出的天花板（v1.2 必须突破）

| 编号 | 问题 | v1.2 应对 |
| --- | --- | --- |
| G1 | 无记忆：跨会话用户偏好与候选人跟进信息全丢 | 引入 Memory Spec（3.4） |
| G2 | 无自迭代：每次失败都是孤立事件，无沉淀 | 引入 Self-Improve 闭环（3.4.3） |
| G3 | LLM 偶发工具调用链过长，导致响应慢且发散 | Loop 终止条件 + 失控保护（3.2.4） |
| G4 | 失败兜底不优雅（"未找到候选人"裸返回） | Behavior Spec 专家接管话术（3.3.3） |
| G5 | 评测只覆盖单轮意图，不衡量"惊艳度" | 三层 Eval：路径回归 + 惊艳度 + 兜底（Part 4） |
| G6 | 22 种卡片散乱，缺空态/错误态 | Card Spec 精简到 ~10 类，强制空态规范（3.7） |
| G7 | 面试侧完全缺失，端到端故事不闭环 | DSP-4 + 演示型工具（3.5.4） |

### 2.3 现有资产的处置原则
> 💡 **注意**
> v0.1 Demo 的代码 **不作为 v1.2 的继承资产**，仅作为**行为契约的参考实现**。Coding Agents 默认按 v1.2 spec 重写，避免被 v0.1 的实现细节带偏。

| v0.1 资产 | v1.2 处置 | 说明 |
| --- | --- | --- |
| 8 个工具的入参/出参形态 | 参考行为 | Tool Spec 重写，但保留关键字段语义 |
| 15 简历 + 5 岗位的数据形态 | 重构 | 升级为 Golden Dataset（3.6） |
| 22 种卡片 | 归并到 ~10 类 | 详见 3.7 |
| 12 条评测用例 | 融入 Eval 三层 | 详见 Part 4 |
| localStorage + JSONL 持久化 | 保留并扩展为 Self-Improve 数据源 | 详见 3.4.3 |
| 3 角色对话切换 | 保留 | UI 层不动 |

---

## Part 3 · 目标态产品规格（v1.2 Demo Target）
### 3.1 五条演示路径（Demo Showcase Paths）
DSP 是本项目的**最小验收单元**。每条 DSP 都是一段可以从 0 演给老板看的完整故事，必须满足：开场白自然、关键转折点惊艳、记忆调用点合理、兜底优雅、收尾卡片漂亮。
#### DSP-1 · 库外岗位的专家级澄清（黄金路径）

| **触发语料** | "我想要一个 BSP 工程师"（库里压根没有） |
| --- | --- |
| **预期行为** | ① 工具调用：list_jobs / search_candidates 双双返空 ② **不返回"未找到"**，转而调用领域知识，主动提供：市场容量、薪酬区间、主要来源公司、典型难点 ③ 给出 2-3 个澄清问题（新 HC vs 类似背景 vs 市场分析） ④ 用户选定后，给出可直接采用的**岗位画像建议**（含 P 级、技能栈、薪酬带、风险提示） |
| **记忆调用** | 读取用户偏好（语气：直接/委婉）；写入本次画像到会话记忆 |
| **惊艳时刻** | "我结合 10 年科技招聘经验 + 市场感知直接给你输入"——LLM 用自身知识承接了工具的失败 |
| **收尾卡片** | 「岗位画像建议卡」+ 下一步动作按钮（找类似背景人才 / 起草 JD / 看市场报告） |
| **成功判据** | 5 个变体语料全部稳定走通，工具失败接管率 100%，惊艳度 LLM-Judge ≥ 4.5/5 |

#### DSP-2 · 一句话需求到候选人排序对比（核心找人闭环）

| **触发语料** | "帮我找在字节做过推荐系统、5 年以上、最好在北京" |
| --- | --- |
| **预期行为** | ① 解析多维约束（公司/方向/年限/地点） ② 调用 search_candidates 拿到候选池 ③ 智能排序并展示 Top 5 卡片 ④ 用户挑 2-3 个 → 自动出对比卡（雷达图 / 优劣势表 / 推荐结论） |
| **记忆调用** | 读取该用户历史筛选偏好（如"只看 985+ 大厂背景"） |
| **惊艳时刻** | 对比卡里的"推荐结论"是带判断的（"如果你看重落地能力选 A，看重创新潜力选 B"） |
| **收尾卡片** | 「候选人对比卡」+ "约面试" / "薪酬对标" 后续动作 |
| **成功判据** | Top 5 排序合理性 LLM-Judge ≥ 4.0/5；对比结论非套话率 100% |

#### DSP-3 · 候选人长程跟进与记忆唤醒（Memory 卖点）

| **触发语料** | 第一次会话："候选人张三聊过了，对薪资有顾虑，他还在比较 OPPO 的 offer" 第二次会话（隔天）："张三那边什么情况？" |
| --- | --- |
| **预期行为** | ① 第一次：自动写入候选人长期画像（薪资敏感 / 比较 OPPO offer） ② 第二次：主动调用记忆，给出"张三目前在比较 OPPO offer，建议本周内推进薪酬对标 + 加快终面安排" ③ 提供"生成 Sell 方案"快捷动作 |
| **记忆调用** | 跨会话候选人长期记忆（核心演示点） |
| **惊艳时刻** | 第二次会话用户根本没说背景，Agent 自动"想起来"了 |
| **收尾卡片** | 「候选人状态卡」（含上次对话摘要 + 当前阻塞 + 建议动作） |
| **成功判据** | 跨会话记忆调用准确率 ≥ 95%（基于 10 个固定场景） |

#### DSP-4 · AI 模拟面试与面试包（壳层演示）

| **触发语料** | "给候选人张三准备一个面试包" "我想试试 AI 模拟面试这个功能" |
| --- | --- |
| **预期行为** | ① 工具调用 interview_kit_prepare（演示型，返回精心构造的 mock） ② 输出「面试包卡片」：候选人简历亮点 / 5 个定制问题 / 评分维度 / 追问决策树 ③ AI 模拟面试入口：点击进入伪交互界面，呈现"AI 面试官"和"候选人回答示例"，无真实多轮对话 |
| **壳层边界** | ✅ 卡片样式、流程串联、状态流转 全做 ❌ 真实生成定制问题、真实多轮面试对话、真实排程、真实评分 |
| **惊艳时刻** | 面试包的"追问决策树"卡片样式，让人感受到产品的完整度 |
| **收尾卡片** | 「面试包卡」+ 「评分模板卡」+ 「面试报告卡」（点击可预览空白模板） |
| **成功判据** | 5 个 mock 面试包视觉完整度评审通过；老板看后能描述出"完整闭环" |

#### DSP-5 · 招聘看板与周报洞察（老板视角）

| **触发语料** | "这周招聘进展怎么样？" |
| --- | --- |
| **预期行为** | ① 调用 analyze_pipeline 拿到全局漏斗 ② 自动生成「周报卡」：核心数字 + 3 个洞察 + 2 个风险 + 下周建议 ③ 洞察必须带判断（不是描述统计，而是"算法岗推荐通过率从 28% 跌到 19%，建议复盘画像"） |
| **记忆调用** | 读取用户角色（HR / 用人经理 / 老板）→ 调整周报视角 |
| **惊艳时刻** | 洞察像一个资深 HRBP 写的，不像一个 SQL 报表 |
| **收尾卡片** | 「周报卡」 + 一键导出飞书文档（复用已有飞书集成） |
| **成功判据** | 洞察非套话率 ≥ 90%；老板视角下"是否带判断" LLM-Judge ≥ 4.0/5 |

### 3.2 Agent 架构
#### 3.2.1 唯一范式：Function Calling Loop
> 💡 **注意**
> 本项目的**唯一编排范式**是 Function Calling Loop。不引入 Workflow、DAG、状态机、规则路由器。任何"我们是不是该做个 router"的提议都应回到公理 A1：LLM 上限 > 工具下限。

```plaintext
┌──────────────────────────────────────────────────┐
│ 用户消息                                          │
└──────────────┬───────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────┐
│ Context Assembly                                  │
│  · System Prompt（含 Persona）                    │
│  · Memory 注入（用户偏好 + 候选人长期画像）       │
│  · Tool Schemas                                   │
│  · Few-shot（来自 Self-Improve 闭环）             │
└──────────────┬───────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────┐
│           LLM Function Calling Loop               │
│                                                   │
│   while not done:                                 │
│     resp = llm(messages, tools)                   │
│     if resp.tool_calls:                           │
│        results = parallel_execute(resp.tool_calls)│
│        messages.append(results)                   │
│     else:                                         │
│        done = True                                │
│                                                   │
│   止损：max_steps=8 / max_tool_calls=12 /         │
│        timeout=30s                                │
└──────────────┬───────────────────────────────────┘
               ▼
┌──────────────────────────────────────────────────┐
│ Response Rendering                                │
│  · 卡片解析（<card type="..." data="..."/>）       │
│  · 打字机流式输出                                  │
│  · Memory 写入（异步）                            │
│  · Self-Improve 样本收集（异步）                  │
└──────────────────────────────────────────────────┘
```

#### 3.2.2 系统提示词设计原则
1. **Persona 优先**：第一句必须立人设（"你是 HireAgent，一位有 10 年科技招聘经验的合伙人"）
1. **原则少而硬**：不超过 7 条核心原则，每条都是可被 Eval 检验的
1. **兜底显式**：当工具返空 / 失败时必须接管的话术模板写进 prompt
1. **禁止口头禅**：明确禁止"作为一个 AI 模型"、"建议您"、"我可以帮您"等套话
1. **留出余白**：不把所有判断硬编码进 prompt，给 LLM 自由发挥的空间
#### 3.2.3 工具调用失败的兜底策略（A1 公理落地）

| 失败场景 | 错误做法（v0.1 的坑） | 正确做法（v1.2 必须） |
| --- | --- | --- |
| 工具返空 | "未找到符合条件的候选人" | LLM 用领域知识接管，给出市场判断+替代建议 |
| 工具报错 | 抛 stack trace | LLM 转述为"我这边数据暂时拿不到，但根据 XX 行情我先给你..." |
| 意图模糊 | 反复追问 | 给出 2-3 个选项的快捷澄清，自己先做合理假设 |
| 跨工具结果矛盾 | 原样抛给用户 | LLM 给出"数据不完全对口，但..."的专业转述 |

#### 3.2.4 Loop 终止条件与失控保护
- **正常终止**：LLM 不再产生 tool_calls，输出 final response
- **步数止损**：max_steps = 8（一次会话最多 8 轮 LLM 调用）
- **工具止损**：max_tool_calls = 12（单次会话最多 12 次工具调用）
- **时间止损**：timeout = 30s
- **循环检测**：相同 (tool_name, args_hash) 连续出现 ≥ 3 次 → 强制 break + LLM 反思后回复
- 触发任何止损 → 调用 LLM 做一次"基于已有信息的最佳回复"，不允许直接报错
### 3.3 Behavior Spec
#### 3.3.1 招聘合伙人 Persona
> "你是 HireAgent，一位有 10 年科技公司招聘经验的合伙人。你见过 200 人到 2000 人公司的所有招聘形态，主攻技术岗位，对算法、后端、前端、底层、芯片方向都有判断。你的工作方式是：先听清楚需求，再给专业输入；当数据不全时，用经验顶上；当用户跑偏时，敢委婉推翻；不说套话，不堆话术。"

#### 3.3.2 主动性边界（什么时候问，什么时候做）

| 情形 | 策略 | 例子 |
| --- | --- | --- |
| 意图清晰、参数足够 | 直接执行，不问 | "找北京的推荐算法工程师" |
| 意图清晰、参数缺关键项 | 给 2-3 选项快捷澄清 | "BSP 工程师" → 新 HC / 类似背景 / 市场分析 |
| 意图模糊 | 先做合理假设并执行，再问"是这个意思吗？" | "看看候选人" → 先 list_jobs 默认展示，再问"你想看哪个岗位的？" |
| 用户给了明显不合理的输入 | 委婉推翻，给替代方案 | "找 P5 的 BSP" → "P5 这个方向几乎没有，建议看 P6" |

#### 3.3.3 数据缺失/越界的专家接管话术
下列话术模板必须写入 System Prompt，且作为 Eval 的判分依据：
- 工具返空 → "我这边搜下来没有完全匹配的，但根据 [领域判断]，我建议..."
- 库外岗位 → "这个方向我有点经验，先给你点输入：[市场容量][薪酬带][主要来源][典型难点]"
- 数据矛盾 → "两个数据不完全对口，没关系，我结合经验直接给你判断..."
- 用户跑偏 → "可以做，但我先 push 你一下：[理由]，要不要先 [替代方案]？"
- 越权请求（如要求 PII） → "这个我们不能直接给，但你可以通过 [合规路径]"
#### 3.3.4 Reasoning 外显策略
- **默认外显**：让用户看到"我在想什么"，但不是 raw chain-of-thought，而是结构化的"工作步骤"
- **展示形态**：进度条 + 当前步骤文字（如"正在搜索候选人..." → "正在排序..." → "正在生成对比..."）
- **禁止暴露**：不暴露 system prompt、tool 内部错误、原始 JSON
- **失败外显**：工具失败要外显（"我搜了一遍没有，转用市场经验..."），让用户理解 Agent 在做什么
### 3.4 Memory & Self-Improve Spec
#### 3.4.1 三层记忆模型

| 层级 | 生命周期 | 内容 | 注入位置 |
| --- | --- | --- | --- |
| 会话短期记忆 | 本次会话内 | 当前需求画像、当前候选人池、上下文实体 | 每轮 messages 自带 |
| 跨会话用户记忆 | 跨会话长期 | 用户偏好（语气/卡片偏好/筛选习惯）、用户角色历史 | System Prompt 末尾 |
| 跨会话候选人记忆 | 跨会话长期 | 候选人长期画像、沟通历史、阻塞状态、跟进时间线 | 按需注入（提到该候选人时） |

#### 3.4.2 写入策略
- **自动写入**：LLM 在 final response 后调用 memory_write 工具（隐式），由 LLM 自己决定写什么
- **用户可见**：UI 右侧抽屉显示"我记住了：XXX"，用户可一键删除
- **冲突解决**：新写入与已有记忆冲突时，标记为"待确认"，下次相关对话中主动询问用户
- **过期机制**：候选人状态记忆 30 天无更新自动归档，避免污染当前判断
#### 3.4.3 Self-Improve 闭环（核心新增）
> 💡 **注意**
> Self-Improve 是 v1.2 与 v0.1 的根本区别。我们用**自动收集的正负样本**，反向迭代 system prompt 与 few-shot，让 Agent 越用越懂。这条闭环已在简历评估、AI 面试场景验证过有效，复用到 HireAgent。

**闭环四步：**
1. **样本收集（自动）**：每轮对话异步落盘，含 input/messages/tool_calls/output/user_feedback
1. **正负样本分类（自动）**：
- 正：用户点了"赞" / 主动追问深化 / 直接执行了 Agent 建议
- 负：用户点了"踩" / 重复问相同问题 / 修正了 Agent 的判断 / 触发了止损
- 中性：其余
1. **反向迭代（自动 + 人工 review）**：
- 每天 / 每 100 条新样本 → LLM-as-Optimizer 分析负样本聚类
- 产出"建议的 prompt 修改 / few-shot 新增"草案
- 林品臣 review 后一键合入下次会话
1. **回归验证（自动）**：
- 每次 prompt 更新触发全量 DSP 回归 + 历史负样本回放
- 不允许回归通过率下降
**演示价值**：在 demo 现场可以展示"昨天 Agent 答得不好，今天我们已经自动修复了"的能力——这是 AI Native 区别于 ATS+AI 的最强卖点。
#### 3.4.4 Memory & Self-Improve 的最小可行实现

| 能力 | v1.2 实现 | 不做（留到 v2） |
| --- | --- | --- |
| 记忆存储 | JSON 文件 + localStorage | 向量数据库 |
| 记忆检索 | 关键词匹配 + LLM 摘要 | 语义检索 |
| 样本收集 | JSONL 追加 | 实时数据管道 |
| Optimizer | LLM 离线分析脚本 | 自动训练 SFT/DPO |
| Prompt 版本 | Git 管理 prompts/ | 在线热更新 |

### 3.5 Tool Spec
#### 3.5.1 设计原则
- **少而精**：v1.2 目标 8-12 个工具，宁缺勿滥
- **正交**：工具之间职责不重叠，避免 LLM 选择困难
- **原子**：单个工具一个职责，不打包多步操作
- **描述胜过实现**：工具描述（description）比实现更重要，是 LLM 决策的唯一依据
- **失败可读**：所有错误必须返回 LLM 可理解的人话描述，不返回 stack trace
#### 3.5.2 工具清单（v1.2 目标）

| # | 工具名 | 职责 | 类型 | 对应 DSP |
| --- | --- | --- | --- | --- |
| T1 | list_jobs | 列出岗位 | 真实 | DSP-2/5 |
| T2 | get_job_detail | 查岗位详情 | 真实 | DSP-2/4 |
| T3 | search_candidates | 搜候选人 | 真实 | DSP-2/3 |
| T4 | get_candidate_profile | 查候选人画像 | 真实 | DSP-2/3/4 |
| T5 | compare_candidates | 多候选人对比 | 真实 | DSP-2 |
| T6 | market_analysis | 市场容量/薪酬/竞品 | 真实 | DSP-1 |
| T7 | salary_benchmark | 薪酬对标 | 真实 | DSP-1/3 |
| T8 | analyze_pipeline | 漏斗分析 | 真实 | DSP-5 |
| T9 | memory_recall | 调用跨会话记忆 | 真实 | DSP-3 |
| T10 | memory_write | 写入跨会话记忆 | 真实 | DSP-3 |
| T11 | interview_kit_prepare | 生成面试包 | 演示型 | DSP-4 |
| T12 | generate_report | 周报/招聘报告 | 真实 | DSP-5 |

#### 3.5.3 工具契约模板
```typescript
// 所有工具必须符合此契约（写入 contracts/tools.ts）
interface ToolSpec {
  name: string;
  description: string;       // 给 LLM 看的，必须包含「什么时候用」+「典型例子」
  parameters: JSONSchema;    // 入参 schema
  returns: JSONSchema;       // 出参 schema（含 success / fallback_hint）
  mode: 'real' | 'demo';     // 真实 or 演示型
  fallback_hint?: string;    // 失败时给 LLM 的接管提示
}

// 出参统一格式
interface ToolResult<T> {
  ok: boolean;
  data?: T;
  hint?: string;             // 失败时给 LLM 的接管提示（人话）
  meta?: { mode: 'real' | 'demo'; latency_ms: number };
}
```

#### 3.5.4 演示型工具规范
- 演示型工具在 returns.meta.mode 中标记为 'demo'，UI 上可显示"演示数据"标识
- 返回的 mock 必须故事化构造（参考 3.6.3 黄金候选人），不能是随机生成
- 演示型工具不进入 Self-Improve 闭环（避免污染样本）
- v1.2 默认演示型工具：T11 interview_kit_prepare
### 3.6 Data Spec（演示数据策略）
#### 3.6.1 原则：不求全，求"演示路径上每个节点都有惊艳数据"
v1.2 不接入任何真实数据源。所有数据都是**故事化构造**，以撑住 5 条 DSP 为唯一目标。
#### 3.6.2 五个核心实体

| 实体 | 规模 | 关键字段（v1.2） |
| --- | --- | --- |
| Resume | 30 | id / name / current_company / years / level / skills[] / education / location / status（active/passive）/ highlights / risks |
| Job | 10 | id / title / level / department / must_have[] / nice_to_have[] / salary_range / status |
| Pipeline | 50 条 | job_id / candidate_id / stage / stage_history[] / blockers[] |
| Market | 15 方向 | direction / talent_pool_size / hot_companies[] / salary_band / difficulty / trend |
| Memory | 动态 | user_preferences{} / candidate_long_profiles[] / open_questions[] |

#### 3.6.3 黄金数据构造（Golden Dataset）
每条 DSP 必须有**至少 1 组黄金数据**，使得演示路径不仅能跑通，还能跑出"哇"的效果：

| DSP | 黄金数据特征 | 故事点 |
| --- | --- | --- |
| DSP-1 | BSP 工程师在库中故意为 0 | 触发 LLM 用领域知识接管 |
| DSP-2 | 3 位候选人各有鲜明优劣势（一个稳健、一个潜力、一个有风险） | 对比卡的"推荐结论"能写出真判断 |
| DSP-3 | 张三的画像里预埋"薪资敏感+正在比较 OPPO offer" | 第二次会话 Memory 唤醒亮眼 |
| DSP-4 | 张三简历有 2-3 个面试官最关心的点（如开源项目 / 大厂资历） | 面试包的定制问题显得"懂候选人" |
| DSP-5 | 算法岗推荐通过率本周从 28% → 19% | 周报洞察能写出"建议复盘画像"的判断 |

#### 3.6.4 数据形态与存储
- 数据形态：JSON 文件，置于 src/data/
- 不上 PostgreSQL、不上 Pinecone、不上 Redis
- 每个数据文件附 README 说明"这份数据为哪条 DSP 服务、关键故事点是什么"
- 修改数据需触发 DSP 回归验证
### 3.7 UI/Card Spec
#### 3.7.1 卡片归并（22 → 10）

| # | 卡片类型 | 触发场景 | 关键元素 |
| --- | --- | --- | --- |
| C1 | 候选人列表卡 | search_candidates 返回 | 头像/姓名/标签/匹配度/操作按钮 |
| C2 | 候选人画像卡 | 查看单个候选人 | 简历摘要/亮点/风险/沟通历史 |
| C3 | 候选人对比卡 | compare_candidates 返回 | 雷达图/优劣势表/推荐结论 |
| C4 | 岗位卡 | list_jobs / get_job_detail | JD 摘要/HC 状态/已有候选人数 |
| C5 | 岗位画像建议卡 | DSP-1 新 HC 接管 | P 级/技能栈/薪酬/风险/下一步动作 |
| C6 | 市场分析卡 | market_analysis 返回 | 容量/薪酬带/热门公司/趋势 |
| C7 | 漏斗/周报卡 | DSP-5 | 核心数字/洞察/风险/建议 |
| C8 | 面试包卡 | DSP-4 | 定制问题/评分维度/追问树 |
| C9 | 记忆唤醒卡 | DSP-3 | 上次摘要/当前阻塞/建议动作 |
| C10 | 引导/澄清卡 | 意图模糊时的快捷选项 | 2-3 个选项按钮 + 自由输入 |

#### 3.7.2 通用状态规范（所有卡片必须支持）
- **Loading 态**：骨架屏 + 当前步骤文字（如"正在搜索候选人..."）
- **空态**：禁止"暂无数据"裸文案；必须由 LLM 生成接管话术（A3 公理）
- **错误态**：禁止裸 error；必须由 LLM 转述为人话 + 给出下一步建议
- **演示态**：演示型工具返回的卡片右上角小标"演示数据"标识
#### 3.7.3 交互动作（每个卡片需声明）
所有卡片必须声明可触发的**下一步动作**（按钮 / 快捷指令），点击后等价于用户发出一条对应消息，进入下一轮 Loop。这是"对话即操作"的关键落地。
---

## Part 4 · 评测协议（Demo 级）
### 4.1 唯一目标
> 💡 **注意**
> Demo 阶段评测的**唯一目标**是：5 条 DSP 路径稳定可复现 + 惊艳度达标。砍掉所有生产级评测（Adversarial / PII / 漂移 / 性能）。

### 4.2 三层评测体系
#### 4.2.1 第一层：路径回归（Path Regression）

| **覆盖范围** | 5 条 DSP × 每条 3-5 个语料变体 = 15-25 条用例 |
| --- | --- |
| **判分方式** | 结构化断言：工具调用顺序 / 必出卡片类型 / 关键字段非空 |
| **合格线** | 100% 通过 |
| **触发时机** | 每次 PR + 每次 Self-Improve prompt 更新 |

#### 4.2.2 第二层：惊艳度评测（Wow Score）

| **覆盖范围** | 5 条 DSP 的"惊艳时刻"片段 |
| --- | --- |
| **判分方式** | LLM-as-Judge（用 Claude 或 GPT-4 评分），1-5 分，rubric 见下 |
| **合格线** | 各 DSP 均分 ≥ 4.0，DSP-1 (黄金路径) ≥ 4.5 |
| **评分 rubric** | ① 是否带专业判断（非套话） ② 是否优雅兜底 ③ 是否唤起 Memory ④ 卡片是否完整 ⑤ 整体"哇"程度 |

#### 4.2.3 第三层：兜底测试（Resilience）

| **覆盖范围** | 故意打偏意图（库外岗位 / 模糊请求 / 矛盾输入 / 无效约束）≥ 20 条 |
| --- | --- |
| **判分方式** | LLM-as-Judge 判断"是否优雅接管"（A3 公理） |
| **合格线** | ≥ 90% 优雅接管，0% 裸返回 error/empty |

### 4.3 砍掉清单
下列评测在 v1.2 一律不做：Adversarial Prompt Injection / PII 检测 / 偏见检测 / 数据漂移 / p95 延迟 / 并发压测 / 多语言。
### 4.4 PR 合并门禁
- 路径回归 100% 通过 → 必须
- 惊艳度评测达标 → 必须
- 兜底测试达标 → 必须
- 三者全绿才允许合并；任意一项红 → block 合并
### 4.5 评测数据与 Self-Improve 的串接
评测产出的失败样本自动进入 Self-Improve 闭环（3.4.3），形成"Eval 暴露问题 → Self-Improve 修复 → Eval 回归验证"的飞轮。这条飞轮是 v1.2 的核心研发节奏。
---

## Part 5 · 技术架构演进
### 5.1 技术栈决策
> 💡 **注意**
> **核心决策**：v1.2 保持 v0.1 技术栈不变。唯一升级是把 AIEngine 重构得更纯粹、更接近 Loop 上限，新增 Memory 与 Self-Improve 模块。

| 层级 | v1.2 技术选型 | vs v0.1 | v2.0 规划（不在本文范围） |
| --- | --- | --- | --- |
| 前端框架 | React 18 + TS + Vite + Tailwind | 保持 | Next.js |
| 状态管理 | Zustand | 保持 | 保持 |
| LLM | DeepSeek V4 Flash + Function Calling | 保持 | 多模型路由 |
| 编排 | 自研极简 Loop（无框架） | 升级 | 评估 LangGraph |
| 数据 | JSON 文件 + localStorage | 保持 | Postgres + Pinecone |
| Memory | JSON 文件 + LLM 摘要 | 新增 | 向量记忆 |
| Self-Improve | JSONL + 离线 Optimizer 脚本 | 新增 | 实时管道 |
| 评测 | TS 脚本 + LLM-as-Judge | 扩展 | 评测平台 |
| 部署 | 本地 dev server + Vite 代理 | 保持 | Vercel |

### 5.2 模块边界与目录结构
```plaintext
src/
├── contracts/                  # 契约层（Spec Agent 独家维护）
│   ├── tools.ts                #   工具 Schema
│   ├── cards.ts                #   卡片 Schema
│   ├── memory.ts               #   记忆 Schema
│   └── events.ts               #   埋点事件 Schema
├── engine/
│   ├── Loop.ts                 # 唯一 Function Calling Loop
│   ├── ContextAssembly.ts      # System Prompt + Memory + Tools 装配
│   ├── ToolExecutor.ts         # 并行 + 止损 + 兜底
│   └── ResponseRenderer.ts     # 流式 + 卡片解析
├── tools/
│   ├── real/                   # 真实工具
│   └── demo/                   # 演示型工具
├── memory/
│   ├── store.ts                # 三层记忆存取
│   ├── writer.ts               # 自动写入策略
│   └── recall.ts               # 注入策略
├── self_improve/
│   ├── collector.ts            # 样本收集
│   ├── classifier.ts           # 正负分类
│   ├── optimizer.ts            # LLM-as-Optimizer
│   └── prompts/                # Prompt 版本管理（Git tracked）
├── data/
│   ├── resumes.json
│   ├── jobs.json
│   ├── pipeline.json
│   ├── market.json
│   └── README.md
├── components/
│   ├── chat/                   # 对话主界面
│   └── cards/                  # 10 类卡片组件
├── store/
│   └── chatStore.ts
└── types/
    └── index.ts                # 从 contracts/ 派生

eval/
├── path_regression/            # 第一层
├── wow_score/                  # 第二层
├── resilience/                 # 第三层
└── run.ts                      # 统一入口
```

### 5.3 关键架构决策（ADR）

| ADR | 决策 | 替代方案 | 选择理由 |
| --- | --- | --- | --- |
| 001 | 唯一编排范式：Function Calling Loop | LangGraph / 自研 Workflow | 公理 A1：不锁死 LLM 上限 |
| 002 | v1.2 不升级技术栈 | Next.js + Postgres + Pinecone | Demo 阶段不需要生产能力 |
| 003 | Memory 用 JSON + LLM 摘要 | 向量数据库 | 故事点足够，向量化是 v2 再做 |
| 004 | Self-Improve 采用方案 B（自动闭环） | 方案 A（仅样本收集） | 这是 v1.2 的核心演示卖点 |
| 005 | AI 面试做壳不做芯 | 真实生成题/真实多轮 | 资源向 DSP-1/2/3 倾斜 |
| 006 | 契约层由林品臣独家 review | 各 Agent 自行修改 | 防止多 Agent 接口漂移 |
| 007 | 所有卡片空态/错误态由 LLM 兜底 | 前端默认 "暂无数据" | 公理 A3：失败也要专业 |

---

## Part 6 · 路线图（3 天切片）
### 6.1 切片原则
- **时间盒**：每切片 3 天，超时不延期，直接调范围
- **独立验收**：每切片必须能独立 demo（视频/截图）
- **对应 Agent 轨道**：每切片明确归属哪些 Agent 轨道（Part 7）
- **阻塞前置**：依赖契约层的切片必须排在契约稳定之后
### 6.2 切片计划（共 7 个，约 3 周）

| Slice | 主题 | DoD | 主导 Agent |
| --- | --- | --- | --- |
| S0 | 契约层与脚手架 | contracts/*.ts 全部定义；目录结构搭建完成；CI 跑通 | Spec Agent（林品臣） |
| S1 | Engine Loop 重构 | 极简 Loop 跑通；ContextAssembly 注入 Memory + Tools；止损生效 | Engine Agent |
| S2 | Tool 集 + Golden Data | T1-T8 真实工具上线；3 份黄金数据文件落地 | Tools + Data Agent |
| S3 | 10 类卡片 + 状态规范 | 10 类卡片组件 + Loading/空/错误/演示态完整 | UI Agent |
| S4 | DSP-1 + DSP-2 闭环 | 两条 DSP 路径回归 100% 通过；惊艳度 ≥ 4.0 | Engine + Eval Agent |
| S5 | Memory + DSP-3 闭环 | 三层记忆 + 跨会话唤醒；DSP-3 通过 | Engine + Eval Agent |
| S6 | DSP-4 (壳) + DSP-5 闭环 | 面试包卡片 + 周报卡 + 两条 DSP 通过 | Tools(demo) + UI + Eval Agent |
| S7 | Self-Improve 闭环 + 整体 polish | 样本收集→分类→Optimizer→prompt 更新→回归 全链路打通；全 DSP 回归 + 惊艳度 + 兜底 三绿 | Engine + Eval Agent |

### 6.3 演示节奏
- S4 结束：第一次给老板看 (DSP-1/2)
- S6 结束：第二次给老板看 (5 条 DSP 闭环)
- S7 结束：第三次给老板看 (Self-Improve 演示亮点)
---

## Part 7 · 任务-Agent 拆分
### 7.0 契约层（Contract Layer）
> 💡 **注意**
> 契约层是多 Agent 并行不撞车的**唯一保障**。所有跨轨道的接口都定义在 src/contracts/，由林品臣（Spec Agent）独家 review。任何 Coding Agent 想改契约必须先提 PR，禁止在自己轨道里"先用着、后再回头改契约"。

| **负责人** | 林品臣（Spec Agent） |
| --- | --- |
| **独家文件** | src/contracts/tools.ts / cards.ts / memory.ts / events.ts |
| **变更流程** | ① 需求方提 issue → ② 林品臣更新 contracts → ③ 所有依赖轨道同步 |
| **不可越界** | 任何其他 Agent 直接修改 contracts/* 视为越权，PR 直接 reject |

### 7.1 五条轨道总览

| 轨道 | 负责范围 | 关键产出 | 消费的契约 |
| --- | --- | --- | --- |
| Engine | src/engine/* + prompts/ | Loop / ContextAssembly / ToolExecutor / Renderer / System Prompt | tools / memory / events |
| Tools | src/tools/* | 12 个工具实现（真实+演示型） | tools |
| Data | src/data/* + data README | 5 实体的黄金数据 + 5 DSP 的故事点 | — |
| UI | src/components/* | 10 类卡片 + 状态规范 + 对话主界面 | cards / events |
| Eval | eval/* | 三层评测 + Self-Improve 闭环工具链 | tools / cards / events |

### 7.2 Engine Agent

| **System Prompt** | "你是 HireAgent 项目的 Engine 工程师。你的唯一职责是把 src/engine/* 写到能让 LLM 跑到上限。范式只有一个：Function Calling Loop。不引入 Workflow、Router、状态机。所有工具描述、卡片格式、记忆字段必须严格遵守 src/contracts/，不允许私自扩展。优先实现 3.2.4 的所有止损机制和 3.2.3 的兜底策略。" |
| --- | --- |
| **Inputs** | contracts/tools.ts / memory.ts / Part 3.2 / 3.3 / 3.4 |
| **Outputs** | src/engine/* + src/memory/* + src/self_improve/* + prompts/v*.md |
| **Anti-Scope** | 禁止改 contracts/* / tools 实现 / 卡片组件 / 数据文件 / 评测脚本 |
| **DoD** | Loop 跑通 5 条 DSP；止损 100% 生效；Memory 跨会话唤醒；Self-Improve 闭环可手动触发 |

### 7.3 Tools Agent

| **System Prompt** | "你是 Tools 工程师。你的职责是把 contracts/tools.ts 里定义的 12 个工具实现出来。真实工具读 src/data/*.json，演示型工具返回精心构造的 mock。每个工具必须遵循 ToolResult 出参规范，失败时返回人话 hint 给 LLM 接管，禁止抛 stack trace。工具描述（description）是 LLM 决策的唯一依据，必须包含「什么时候用」+「典型例子」。" |
| --- | --- |
| **Inputs** | contracts/tools.ts / Part 3.5 / Golden Data |
| **Outputs** | src/tools/real/* + src/tools/demo/* |
| **Anti-Scope** | 禁止改 contracts/* / Engine / 卡片 / 直接造数据（应由 Data Agent 维护） |
| **DoD** | 12 个工具全部实现；每个工具有 ≥ 3 个单元测试；失败兜底 hint 全部到位 |

### 7.4 Data Agent

| **System Prompt** | "你是 Data 工程师。你的职责是构造 5 个实体的黄金数据，目标是让 5 条 DSP 不仅能跑通，而且能跑出哇的效果。数据必须故事化构造（不是随机生成），每份数据文件必须配 README 说明对应哪条 DSP 和关键故事点。修改任何数据都必须触发 DSP 回归验证。" |
| --- | --- |
| **Inputs** | Part 3.6 / 5 条 DSP 描述 |
| **Outputs** | src/data/resumes.json / jobs.json / pipeline.json / market.json + data/README.md |
| **Anti-Scope** | 禁止改 contracts/* / Engine / 工具实现 / 评测 |
| **DoD** | 30 简历 + 10 岗位 + 50 pipeline 条目 + 15 市场方向 全部到位；每条 DSP 的黄金故事点可被 Eval 引用 |

### 7.5 UI Agent

| **System Prompt** | "你是 UI 工程师。你的职责是把 10 类卡片实现到位，并保证 Loading / 空 / 错误 / 演示态四态完整。卡片数据 schema 严格遵守 contracts/cards.ts。所有卡片必须声明可触发的下一步动作。空态和错误态不允许出现裸文案，必须由 LLM 生成接管话术（与 Engine Agent 协作约定）。" |
| --- | --- |
| **Inputs** | contracts/cards.ts / Part 3.7 |
| **Outputs** | src/components/chat/* + src/components/cards/* |
| **Anti-Scope** | 禁止改 contracts/* / Engine / 工具 / 数据；不允许自创卡片类型 |
| **DoD** | 10 类卡片全部完成；四态规范全部覆盖；演示型工具的"演示数据"标识展示正确 |

### 7.6 Eval Agent

| **System Prompt** | "你是 Eval 工程师。你的职责是搭建三层评测（路径回归 / 惊艳度 / 兜底）以及 Self-Improve 数据闭环。判分要严格，宁错杀不放过。LLM-as-Judge 的 rubric 必须可重现。所有评测产出的失败样本自动接入 self_improve/collector。" |
| --- | --- |
| **Inputs** | Part 4 / 5 条 DSP / contracts/events.ts |
| **Outputs** | eval/path_regression/* + eval/wow_score/* + eval/resilience/* + eval/run.ts |
| **Anti-Scope** | 禁止改 contracts/* / Engine / 工具 / 数据 / 卡片 |
| **DoD** | 三层评测全部跑通；CI 集成；Self-Improve 闭环全链路打通 |

### 7.7 Merge 协议 与 冲突仲裁
1. **分支策略**：每轨道独立 branch，命名 agent/<track>/<slice>
1. **合并顺序**：Spec → Data → Tools → Engine → UI → Eval（依赖正向）
1. **契约冲突**：发现契约不够用 → 提 issue → 林品臣 24h 内裁决
1. **实现冲突**：两个 Agent 改同一文件 → 后到者必须 rebase + 与先到者同步
1. **Daily Sync**：每天 1 次（林品臣执行），review 各轨道进展、阻塞、契约变更
1. **Eval Gate**：每个 PR 必须三层评测全绿才能合并
### 7.8 Harness 启动指令（可直接复制）
```plaintext
# Spec Agent（林品臣本人扮演，不通过 Harness 启动）
# 维护 src/contracts/*，是其他所有 Agent 的依赖源头

# Engine Agent
harness spawn engine \
  --system-prompt "$(cat prompts/agents/engine.md)" \
  --workdir src/engine,src/memory,src/self_improve,prompts \
  --read-only src/contracts,src/data,src/components,eval \
  --slice S1

# Tools Agent
harness spawn tools \
  --system-prompt "$(cat prompts/agents/tools.md)" \
  --workdir src/tools \
  --read-only src/contracts,src/data \
  --slice S2

# Data Agent
harness spawn data \
  --system-prompt "$(cat prompts/agents/data.md)" \
  --workdir src/data \
  --read-only src/contracts \
  --slice S2

# UI Agent
harness spawn ui \
  --system-prompt "$(cat prompts/agents/ui.md)" \
  --workdir src/components \
  --read-only src/contracts \
  --slice S3

# Eval Agent
harness spawn eval \
  --system-prompt "$(cat prompts/agents/eval.md)" \
  --workdir eval \
  --read-only src \
  --slice S4-S7
```

每个 Agent 的 system prompt 模板请保存到 prompts/agents/<agent>.md，内容即本节 7.2-7.6 的 System Prompt 段落。
---

## Part 8 · 指标体系
### 8.1 北极星（Demo 级）
> 💡 **注意**
> **北极星指标**：5 条 DSP 的「惊艳度」LLM-Judge 均分 ≥ 4.0/5.0（DSP-1 ≥ 4.5），且老板看完能用自己的话复述出至少 3 条 DSP 的核心价值。

### 8.2 过程指标（开发期）

| 指标 | 定义 | 采集方式 | 合格线 |
| --- | --- | --- | --- |
| DSP 回归通过率 | 15-25 用例全绿率 | eval/path_regression | 100% |
| 惊艳度均分 | LLM-Judge 平均分 | eval/wow_score | ≥ 4.0 |
| 兜底接管率 | 故意打偏意图下的优雅接管率 | eval/resilience | ≥ 90% |
| Loop 平均轮数 | 正常对话下 LLM 调用次数 | events 埋点 | ≤ 3 |
| 止损触发率 | 触发 max_steps/timeout 的比例 | events 埋点 | ≤ 5% |
| Self-Improve 回归提升 | 每次 prompt 更新后的负样本修复率 | self_improve/optimizer | ≥ 50% |

### 8.3 砍掉清单
v1.2 一律不追：招聘周期缩短率 / 一面通过率 / 候选人 NPS / 猎头费用占比 / p95 延迟 / 并发 QPS。这些是 v2.0 上线后的业务指标。
---

## Part 9 · 全局 Done of v1.2 Demo
### 9.1 Done 定义
v1.2 验收必须满足下面 **全部** 条件，缺一不可：
1. 5 条 DSP 全部能从 0 端到端跑通，每条 ≥ 3 个语料变体
1. 三层评测全绿（路径 100% / 惊艳度 ≥ 4.0 / 兜底 ≥ 90%）
1. Self-Improve 闭环全链路打通，可现场演示"昨天的负样本今天已修复"
1. 三层记忆全部生效，跨会话唤醒在 DSP-3 中流畅展示
1. 10 类卡片 + 四态全部到位，演示数据标识正确
1. 面试包壳层在 DSP-4 中视觉完整、不穿帮
1. 至少 1 次给老板的 Demo 完成，老板能用自己的话复述 ≥ 3 条 DSP 价值
### 9.2 Open Questions 索引

| 编号 | 问题 | 所在章节 | Owner | 状态 |
| --- | --- | --- | --- | --- |
| OQ-01 | Self-Improve 的 Optimizer 用 DeepSeek 还是 Claude？ | 3.4.3 | 林品臣 | open |
| OQ-02 | 记忆冲突时的"待确认"机制 UI 怎么呈现？ | 3.4.2 | UI Agent | open |
| OQ-03 | 演示数据标识在 demo 给老板看时是否要隐藏？ | 3.5.4 / 3.7.2 | 林品臣 | open |
| OQ-04 | DSP-4 的 AI 模拟面试入口点进去后是否要做 1-2 轮假对话？ | 3.1 DSP-4 | 林品臣 | open |
| OQ-05 | Eval 的 LLM-Judge 用哪个模型保证一致性？ | 4.2.2 | Eval Agent | open |

---

## 附录 A · 术语表

| 术语 | 定义 |
| --- | --- |
| AI Native | 以 LLM 为操作系统的产品形态，人是决策者 |
| ATS | Applicant Tracking System，传统招聘管理系统 |
| BSP 工程师 | Board Support Package 工程师，嵌入式底层方向 |
| DSP | Demo Showcase Path，演示路径，本项目最小验收单元 |
| Function Calling Loop | LLM 自主决策何时调工具、何时回复的极简编排范式 |
| Golden Dataset | 为支撑 DSP 故事点而精心构造的黄金数据集 |
| HC | Head Count，招聘名额 |
| LLM-as-Judge | 用另一个 LLM 给 Agent 输出打分的评测方式 |
| LLM-as-Optimizer | 用 LLM 分析负样本并产出 prompt 修改建议 |
| Self-Improve | 系统自动收集样本反向迭代 prompt / few-shot 的闭环 |
| Sell 方案 | 为候选人量身定制的吸引方案（薪酬+发展+文化） |
| 演示型工具 | 返回 mock 数据的工具，用于壳层演示 |

## 附录 B · ADR 列表
详见 5.3。每条 ADR 在被推翻或修订时必须新增一条 ADR 引用旧条。
## 附录 C · 参考资料
- 林品臣内部 Hiring Agent 项目（Workflow 编排经验）
- Eightfold AI Skill Graph 技术思路（Skill Taxonomy + Adjacency + Inference）
- 简历评估 / AI 面试场景的 Self-Improve 实践（已验证有效）
- BSP 工程师案例（详见 3.1 DSP-1，作为 Persona 范本）
## 附录 D · 变更日志

| 版本 | 日期 | 关键变更 |
| --- | --- | --- |
| v1.0 | 2026-05-24 | 初版，战略蓝图为主，附录含 v0.1 现状 |
| v1.2 | 2026-05-24 | 重构为「想象力 Demo」工程化 PRD：新增三公理 / 5 条 DSP / Behavior Spec / Memory & Self-Improve Spec / 三层 Eval / 5+1 轨道任务拆分 / Harness 启动指令；砍掉 Workflow / 生产级指标 / AI 面试芯层 |

## 附录 E · v1.3+ 预告
- v1.3：AI 面试做芯（真实题目生成 + 多轮模拟对话）
- v1.4：触达与排程接入飞书（真实可发）
- v2.0：技术栈升级到 Next.js + Postgres + Pinecone；接入企业 HRIS；生产化能力（合规 / 性能 / 多租户）
> AI Native 招聘智能体 | 面向全行业的 AI 找人 + AI 面试方案版本：v1.0 | 日期：2026-05-24

