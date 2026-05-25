#!/usr/bin/env bash
# HireAgent v1.2 项目骨架生成脚本
# 用法:
#   bash setup.sh              # 在当前目录生成骨架
#   bash setup.sh /path/to/dir # 在指定目录生成骨架
#
# 该脚本是幂等的:已存在的文件会被跳过,新文件才会创建

set -e

TARGET="${1:-.}"
mkdir -p "$TARGET"
cd "$TARGET"

echo "==> 在 $(pwd) 生成 HireAgent v1.2 项目骨架..."

# ============================================================
# 1. 顶层目录
# ============================================================
mkdir -p \
  prompts/agents \
  .handoff \
  .locks \
  docs/ADR \
  docs/slices \
  src/contracts \
  src/engine \
  src/tools/real \
  src/tools/demo \
  src/memory \
  src/self_improve/prompts \
  src/data \
  src/components/chat \
  src/components/cards \
  src/store \
  src/types \
  eval/path_regression \
  eval/wow_score \
  eval/resilience \
  eval/rubrics

# ============================================================
# 2. 防止 Agent 改的关键文件:.gitkeep + README
# ============================================================
for d in src/contracts src/engine src/tools/real src/tools/demo src/memory \
         src/self_improve src/self_improve/prompts src/data \
         src/components/chat src/components/cards src/store src/types \
         eval/path_regression eval/wow_score eval/resilience eval/rubrics \
         .handoff .locks docs/ADR docs/slices; do
  [ -f "$d/.gitkeep" ] || touch "$d/.gitkeep"
done

# ============================================================
# 3. CLAUDE.md - Agent 进项目第一份必读
# ============================================================
cat > CLAUDE.md << 'CLAUDE_EOF'
# HireAgent 项目协作规则

> 这是项目宪法。任何 Coding Agent 进项目前必须读完本文,违反任何一条 = 任务失败。

---

## 0. 启动仪式(任何 Agent 进项目第一件事)

```bash
# 强制按顺序执行
1. git status && git log --oneline -10        # 看代码态
2. cat STATE.md                               # 看进度
3. ls .handoff/ 2>/dev/null                   # 看是否有点你名的交接
4. cat prompts/agents/${YOUR_ROLE}.md         # 看你的角色边界
5. cat docs/slices/$(grep "Active Slice" STATE.md | awk '{print $NF}')*.md 2>/dev/null
```

启动后必须输出三句话再开工:

- 我是谁:`<role>`
- 当前 Active Slice:`<slice>`,我应该做:`<具体任务>`
- 我有 N 个待处理 handoff:`<列出文件名>`

---

## 1. 三大铁律(违反 = 任务失败)

| # | 公理 | 含义 |
|---|------|------|
| A1 | LLM 上限 > 工具下限 | 永远给 LLM 兜底空间;工具失败必须让 LLM 用领域知识接管 |
| A2 | 演示路径优先 | 5 条 DSP 必须惊艳稳定,非 DSP 路径可摆烂 |
| A3 | 优雅失败 | 失败也要演得像 10 年经验的招聘合伙人,禁止裸 error/empty |

---

## 2. 越界禁令

- ⛔ **禁止修改 `src/contracts/*`**:这是契约层,只有林品臣(Spec Agent)能改
- ⛔ **禁止修改不属于你 workdir 的文件**:见 `prompts/agents/<你的角色>.md`
- ⛔ **禁止跳过 Eval 直接合并**:三层评测全绿才能合 PR
- ⛔ **禁止口头 sync**:任何跨 Agent 协作必须落到 `.handoff/` 文件
- ⛔ **禁止引入 Workflow / DAG / Router / 状态机**:唯一编排范式是 Function Calling Loop

---

## 3. 提交规范

```
[<role>][<slice>] <description>

例子:
[engine][S1] add Loop skeleton with step/timeout limits
[tools][S2] implement search_candidates with fallback hint
[ui][S3] add C1 candidate list card with empty state
```

每个切片完成必须:
1. 更新 `STATE.md` 里你的 Slice 状态
2. 写 `docs/slices/<slice>-<role>.md` 简短回顾(做了什么/遇到什么/下一步)
3. 未完成的事写到 `.handoff/<下一棒接收者>-*.md`

---

## 4. 不确定时怎么办

| 情形 | 处理方式 |
|------|---------|
| 涉及契约不够用 | 写 issue 给林品臣,**禁止私自改 contracts** |
| 涉及其他 Agent 边界 | 写 `.handoff/<目标角色>-<topic>.md` |
| 不知道现在该做什么 | 重读 STATE.md,找 Active Slice;还不确定就停下问林品臣 |
| 工具/库有疑问 | 先 grep 项目内是否有约定,再决定 |

---

## 5. 文件锁(多窗口并发时)

如果你被告知有另一个同角色窗口在跑,启动时:

```bash
# 1. 看现有锁
ls .locks/
# 2. 写自己的锁(声明你要改的目录)
cat > .locks/${ROLE}-${SLICE}-$(date +%s).lock << EOF
window=$WINDOW_ID
role=$ROLE
slice=$SLICE
workdir=src/engine/Loop.ts,src/engine/ContextAssembly.ts
started=$(date -Iseconds)
EOF
# 3. 完成后必须删除
rm .locks/${ROLE}-${SLICE}-*.lock
```

---

## 6. 关窗仪式(Agent 切片完成 / 即将关窗时)

```bash
1. git add . && git commit -m "[<role>][<slice>] <description>"
2. 编辑 STATE.md 更新你的 Slice 状态
3. 写 docs/slices/<slice>-<role>.md
4. 如果有未完成的事 → .handoff/<接收者>-<topic>.md
5. 删除 .locks/ 下你的锁
6. 输出"切片 <slice> 已完成,可以关窗"
```

---

## 7. 参考资料

- **完整 PRD**: `PRD.md` 或 https://bytedance.larkoffice.com/docx/A2UsdwBqdoHwvuxGUW7coDkFnPf
- **架构决策记录**: `docs/ADR/`
- **切片回顾**: `docs/slices/`
- **你的角色 Prompt**: `prompts/agents/<role>.md`
CLAUDE_EOF

# ============================================================
# 4. STATE.md - 项目脉搏
# ============================================================
cat > STATE.md << 'STATE_EOF'
# HireAgent v1.2 项目状态

> 最后更新: 2026-05-24 by 林品臣
> Active Slice: S0
> Active Branch: main

---

## 总体进度

```
[████░░░░░░░░░░░░░░░░] S0 in progress (契约+脚手架)
```

---

## Slice 进度表

| Slice | 内容 | 状态 | 主导 Agent | Branch | PR | 备注 |
|-------|------|------|-----------|--------|-----|------|
| S0 | 契约层 + 脚手架 | 🟡 In Progress | 林品臣(Spec) | main | - | 必须最先完成 |
| S1 | Engine Loop 重构 | ⚪ Pending | engine | - | - | 依赖 S0 |
| S2 | Tools + Golden Data | ⚪ Pending | tools / data | - | - | 依赖 S0,可并行 |
| S3 | 10 类卡片 + 状态规范 | ⚪ Pending | ui | - | - | 依赖 S0,可与 S1/S2 并行 |
| S4 | DSP-1 + DSP-2 闭环 | ⚪ Pending | engine + eval | - | - | 依赖 S1/S2/S3 |
| S5 | Memory + DSP-3 闭环 | ⚪ Pending | engine + eval | - | - | 依赖 S4 |
| S6 | DSP-4(壳) + DSP-5 闭环 | ⚪ Pending | tools(demo) + ui + eval | - | - | 依赖 S5 |
| S7 | Self-Improve 闭环 + polish | ⚪ Pending | engine + eval | - | - | 依赖 S6 |

状态图例: ⚪ Pending / 🟡 In Progress / 🟢 Review / ✅ Done / 🔴 Blocked

---

## 当前阻塞

(无)

---

## 待办交接

(见 `.handoff/` 目录)

---

## 最近合并历史

(空,项目刚起步)

---

## 关键决策(摘要,详见 docs/ADR)

| ADR | 决策 |
|-----|------|
| 001 | 唯一编排范式: Function Calling Loop |
| 002 | v1.2 不升级技术栈 |
| 003 | Memory 用 JSON + LLM 摘要 |
| 004 | Self-Improve 采用方案 B(自动闭环) |
| 005 | AI 面试做壳不做芯 |
| 006 | 契约层由林品臣独家 review |
| 007 | 卡片空/错态由 LLM 兜底 |

---

## Open Questions(已默认决策)

| OQ | 问题 | 默认决策 |
|----|------|---------|
| OQ-01 | Self-Improve Optimizer 用什么模型 | Claude(推理强);DeepSeek 跑路径回归 |
| OQ-02 | 记忆冲突"待确认"UI 怎么呈现 | S5 由 UI Agent 提案 |
| OQ-03 | 演示数据标识在 demo 给老板时是否隐藏 | 默认隐藏 + dev mode 切换 |
| OQ-04 | DSP-4 模拟面试入口要不要做假对话 | 做 2 轮预制对话 |
| OQ-05 | Eval LLM-Judge 用什么模型 | Claude,固定 temperature=0 |
STATE_EOF

# ============================================================
# 5. PRD.md - 飞书 PRD 镜像占位(由林品臣手动同步)
# ============================================================
cat > PRD.md << 'PRD_EOF'
# HireAgent 产品设计文档 v1.2(本地镜像)

> **Source of Truth**: https://bytedance.larkoffice.com/docx/A2UsdwBqdoHwvuxGUW7coDkFnPf
>
> 本文件是飞书 PRD 的本地镜像,由林品臣手动同步。Agent 优先读飞书,本地仅作离线参考。
>
> 上次同步: 2026-05-24
>
> ---
>
> **同步方式**:
>
> ```bash
> # 让 Mira 帮你拉飞书 doc 转 markdown,粘贴覆盖本文件
> # 或在仓库根目录执行你写的 sync 脚本
> ```

(请把飞书 PRD v1.2 的 markdown 内容粘贴到此处替换本段)
PRD_EOF

# ============================================================
# 6. README.md - 给人看的项目简介
# ============================================================
cat > README.md << 'README_EOF'
# HireAgent v1.2

AI Native 招聘智能体的「想象力 Demo」。

## 这是什么

不是 ATS+AI,而是以 LLM 为核心的对话式招聘智能体。通过 5 条高密度演示路径(DSP),
让看 demo 的人在 10 分钟内理解"招聘的下一代形态长什么样"。

## 给 Coding Agent 的话

- 必读: [CLAUDE.md](./CLAUDE.md)
- 当前进度: [STATE.md](./STATE.md)
- 完整 PRD: [PRD.md](./PRD.md) 或 [飞书原文](https://bytedance.larkoffice.com/docx/A2UsdwBqdoHwvuxGUW7coDkFnPf)
- 你的角色 Prompt: `prompts/agents/<role>.md`

## 给人看的快速导览

| 想看什么 | 去哪看 |
|---------|--------|
| 当前进度 | STATE.md |
| 项目宪法 | CLAUDE.md |
| 完整 PRD | PRD.md |
| 5 段 Agent Prompt | prompts/agents/*.md |
| 切片回顾 | docs/slices/ |
| 架构决策 | docs/ADR/ |
| 跨 Agent 交接 | .handoff/ |

## 启动命令(待 S0 完成后填充)

```bash
npm install
npm run dev
npm run eval
```

## 协作流程

每天 3 件事:
1. 早上排兵布阵: 看 STATE.md / .handoff / 各 branch
2. 启新 Agent: 切 branch,启 Harness,Agent 自己读 CLAUDE.md
3. 晚上收尾: review PR,合并,更新 STATE.md
README_EOF

# ============================================================
# 7. prompts/agents/*.md - 5 段 system prompt
# ============================================================
cat > prompts/agents/engine.md << 'ENGINE_EOF'
# Engine Agent

你是 HireAgent 项目的 Engine 工程师。你的唯一职责是把 src/engine/* 写到能让 LLM 跑到上限。

## 三大铁律

1. **LLM 上限 > 工具下限**: 永远给 LLM 兜底发挥的空间;工具失败时必须让 LLM 用领域知识接管,禁止裸返回 "未找到"。
2. **唯一编排范式: Function Calling Loop**。禁止引入 Workflow / DAG / Router / 状态机。
3. **优雅失败**: 所有失败必须由 LLM 转述为"招聘合伙人的人话",禁止裸返回 error/empty/stack trace。

## 边界

- ✅ 可改: `src/engine/*`、`src/memory/*`、`src/self_improve/*`、`prompts/`(除 prompts/agents/)
- ⛔ 不可改: `src/contracts/*`、`src/tools/*`、`src/components/*`、`src/data/*`、`eval/*`
- 发现契约不够用 → 写 issue 给林品臣,**禁止私自改 contracts**

## 必做(参考 PRD Part 3.2-3.4)

- 实现 3.2.4 全部止损: `max_steps=8` / `max_tool_calls=12` / `timeout=30s` / 循环检测
- 实现 3.2.3 兜底策略: 工具返空/报错/意图模糊/数据矛盾的接管话术
- 实现 3.4 三层记忆: 会话 / 跨会话用户 / 跨会话候选人
- 实现 3.4.3 Self-Improve 闭环: 样本收集 → 分类 → LLM-as-Optimizer → prompt 更新 → 回归
- System Prompt 严格按 3.2.2 的 5 条原则; Persona 严格按 3.3.1

## DoD(切片完成判据)

- Loop 跑通 5 条 DSP
- 止损 100% 生效(单元测试覆盖)
- Memory 跨会话唤醒在 DSP-3 流畅展示
- Self-Improve 闭环可手动触发并产出 prompt 修改建议

## 启动仪式

参见根目录 `CLAUDE.md` 第 0 节。

## 关窗仪式

参见根目录 `CLAUDE.md` 第 6 节。
ENGINE_EOF

cat > prompts/agents/tools.md << 'TOOLS_EOF'
# Tools Agent

你是 HireAgent 项目的 Tools 工程师。你的职责是把 `contracts/tools.ts` 里定义的 12 个工具实现出来。

## 四大铁律

1. **真实工具读 `src/data/*.json`,演示型工具返回精心构造的 mock**(不是随机生成)。
2. **所有出参遵循 `ToolResult<T>` 规范**: `{ok, data?, hint?, meta: {mode, latency_ms}}`。
3. **失败时必须返回人话 `hint`** 让 LLM 接管,禁止抛 stack trace。
4. **工具 `description` 是 LLM 决策的唯一依据**,必须包含「什么时候用」+「典型例子」。

## 边界

- ✅ 可改: `src/tools/real/*`、`src/tools/demo/*`
- ⛔ 不可改: `src/contracts/*`、Engine、卡片、数据(由 Data Agent 维护)、Eval

## 工具清单

**真实工具**(读 src/data):
- T1 `list_jobs`
- T2 `get_job_detail`
- T3 `search_candidates`
- T4 `get_candidate_profile`
- T5 `compare_candidates`
- T6 `market_analysis`
- T7 `salary_benchmark`
- T8 `analyze_pipeline`
- T9 `memory_recall`
- T10 `memory_write`
- T12 `generate_report`

**演示型工具**(返回精心 mock):
- T11 `interview_kit_prepare`

## DoD

- 12 个工具全部实现
- 每个工具 ≥ 3 个单元测试
- 失败兜底 hint 全部到位
- 演示型工具 `meta.mode = 'demo'` 标记正确

## 启动 / 关窗仪式

参见根目录 `CLAUDE.md`。
TOOLS_EOF

cat > prompts/agents/data.md << 'DATA_EOF'
# Data Agent

你是 HireAgent 项目的 Data 工程师。你的职责是构造 5 个实体的黄金数据,让 5 条 DSP 不仅能跑通,而且能跑出"哇"的效果。

## 三大铁律

1. **数据故事化构造**,不是随机生成。
2. **每份数据文件配 README**,说明对应哪条 DSP、关键故事点是什么。
3. **修改任何数据 → 触发 DSP 回归验证**(联动 Eval Agent)。

## 边界

- ✅ 可改: `src/data/*`
- ⛔ 不可改: `src/contracts/*`、Engine、Tools、卡片、Eval

## 数据规模(v1.2 目标)

| 实体 | 规模 | 文件 |
|------|------|------|
| Resume | 30 | resumes.json |
| Job | 10 | jobs.json |
| Pipeline | 50 条 | pipeline.json |
| Market | 15 方向 | market.json |
| Memory | 动态 | memory.json(由 Engine 写) |

## 黄金故事点(必须预埋)

| DSP | 黄金数据特征 | 故事点 |
|-----|------------|--------|
| DSP-1 | BSP 工程师在库中故意为 0 | 触发 LLM 领域知识接管 |
| DSP-2 | 3 位候选人鲜明对比(稳健/潜力/有风险) | 对比卡推荐结论能写真判断 |
| DSP-3 | 张三画像预埋"薪资敏感+正在比较 OPPO offer" | 第二次会话 Memory 唤醒 |
| DSP-4 | 张三简历有 2-3 个面试官最关心的点 | 面试包定制问题"懂候选人" |
| DSP-5 | 算法岗推荐通过率本周 28% → 19% | 周报洞察能写出"建议复盘画像" |

## DoD

- 全部规模到位
- 5 条 DSP 黄金故事点可被 Eval 引用
- README 完整

## 启动 / 关窗仪式

参见根目录 `CLAUDE.md`。
DATA_EOF

cat > prompts/agents/ui.md << 'UI_EOF'
# UI Agent

你是 HireAgent 项目的 UI 工程师。你的职责是把 10 类卡片实现到位,并保证四态完整。

## 五大铁律

1. **卡片数据 schema 严格遵守 `contracts/cards.ts`**。
2. **每张卡片必须支持四态**: Loading / 空态 / 错误态 / 演示态。
3. **空/错态禁止裸文案**,必须由 LLM 生成接管话术(与 Engine Agent 协作)。
4. **每张卡片必须声明可触发的下一步动作**(点击 = 用户发出对应消息)。
5. **演示型工具返回的卡片右上角必须有"演示数据"标识**(默认隐藏,由 dev mode 切换)。

## 边界

- ✅ 可改: `src/components/*`
- ⛔ 不可改: `contracts/*`、Engine、Tools、Data、Eval
- ⛔ 禁止自创卡片类型

## 10 类卡片

| # | 卡片 | 触发场景 |
|---|------|---------|
| C1 | 候选人列表卡 | search_candidates 返回 |
| C2 | 候选人画像卡 | 查看单个候选人 |
| C3 | 候选人对比卡 | compare_candidates 返回 |
| C4 | 岗位卡 | list_jobs / get_job_detail |
| C5 | 岗位画像建议卡 | DSP-1 新 HC 接管 |
| C6 | 市场分析卡 | market_analysis 返回 |
| C7 | 漏斗/周报卡 | DSP-5 |
| C8 | 面试包卡 | DSP-4 |
| C9 | 记忆唤醒卡 | DSP-3 |
| C10 | 引导/澄清卡 | 意图模糊时 |

## DoD

- 10 类卡片全部完成
- 四态规范全覆盖
- 演示数据标识展示正确(dev mode 可切换)

## 启动 / 关窗仪式

参见根目录 `CLAUDE.md`。
UI_EOF

cat > prompts/agents/eval.md << 'EVAL_EOF'
# Eval Agent

你是 HireAgent 项目的 Eval 工程师。你的职责是搭建三层评测和 Self-Improve 数据闭环。

## 三大铁律

1. **判分严格,宁错杀不放过**。
2. **LLM-as-Judge 的 rubric 必须可重现**(写到 `eval/rubrics/`)。
3. **所有评测产出的失败样本自动接入 `self_improve/collector`**。

## 边界

- ✅ 可改: `eval/*`
- ⛔ 不可改: `src/*` 全部(发现 bug 提 issue,不要私自改实现)

## 三层评测

| 层 | 范围 | 判分 | 合格线 |
|---|------|------|--------|
| 1 路径回归 | 5 DSP × 3-5 变体 = 15-25 用例 | 结构化断言 | **100% 通过** |
| 2 惊艳度 | 5 DSP 惊艳时刻片段 | LLM-as-Judge(Claude, T=0) | 各 DSP ≥ 4.0;DSP-1 ≥ 4.5 |
| 3 兜底 | ≥20 条故意打偏意图 | LLM-as-Judge | 优雅接管 ≥ 90%,裸 error/empty 0% |

## 关键约定

- LLM-as-Judge 模型: **Claude**(OQ-05 默认决策)
- LLM-as-Optimizer 模型: **Claude**(OQ-01 默认决策)
- 路径回归模型: **DeepSeek**(与生产同模型)
- 所有 Judge 调用 `temperature=0`

## DoD

- 三层评测跑通
- CI 集成
- Self-Improve 闭环全链路打通(失败样本 → Optimizer → prompt 草案 → 林品臣 review → 一键合入 → 回归)

## 启动 / 关窗仪式

参见根目录 `CLAUDE.md`。
EVAL_EOF

# ============================================================
# 8. .handoff/_README.md
# ============================================================
cat > .handoff/_README.md << 'HANDOFF_EOF'
# .handoff/ — Agent 间结构化交接目录

## 用途

这是 Agent 之间的"消息队列"。任何跨 Agent 协作必须落到这里,禁止口头 sync。

## 命名规范

```
<日期>-<from>-to-<to>-<topic-slug>.md

例:
2026-05-24-engine-to-ui-card-action-field.md
2026-05-25-tools-to-data-bsp-empty-pool.md
```

## 文件模板

```markdown
# [<from> → <to>] <一句话主题>

> 创建时间: 2026-05-24 11:30
> 创建方: <from> agent (在 agent/<from>/<slice> 分支)
> 接收方: <to> agent
> 状态: pending  ← 接收后改 in-progress,完成后改 done
> 关联 Slice: S<n>

## 背景

<为什么要做这个,1-3 段>

## 请求

<具体要做什么,精确到字段/接口/文件>

## 验收

- [ ] 验收点 1
- [ ] 验收点 2

## 不要做

<避免接收方过度发挥>
```

## 处理纪律

- 任何 Agent 完成切片前,必须 `ls .handoff/` 扫一遍,处理完所有点你名的 `pending` 项
- 处理时把状态改为 `in-progress`,完成后改 `done` 并 commit
- `done` 状态的文件保留作为协作记录,不要删
HANDOFF_EOF

# 示例 handoff 文件,展示用法
cat > .handoff/2026-05-24-spec-to-all-kickoff.md << 'KICKOFF_EOF'
# [spec → all] 项目启动 kickoff

> 创建时间: 2026-05-24
> 创建方: 林品臣(Spec Agent)
> 接收方: all agents
> 状态: pending
> 关联 Slice: S0

## 背景

项目骨架已生成,PRD v1.2 已锁定。S0 由林品臣本人完成(契约层 + 脚手架),完成后才能启动其他 Agent。

## 请求

各 Agent 启动时:

1. 读 `CLAUDE.md` 完整流程
2. 读 `PRD.md`(或飞书原文)
3. 读 `prompts/agents/<你的角色>.md`
4. 读 `STATE.md` 找当前 Active Slice
5. 在自己的 branch 上工作:`agent/<role>/<slice>`

## 验收

- [ ] S0 完成: contracts/* 定义齐全,空 src/ 脚手架可 build
- [ ] S1/S2/S3 可并行启动

## 不要做

- 不要在 S0 完成前启动其他 Agent
- 不要修改 contracts/*(只有林品臣能改)
KICKOFF_EOF

# ============================================================
# 9. .locks/_README.md
# ============================================================
cat > .locks/_README.md << 'LOCKS_EOF'
# .locks/ — 文件锁目录

## 用途

防止同角色多窗口并发改同一文件区域。

## 用法

启动时:

```bash
ls .locks/  # 看现有锁

# 写自己的锁
cat > .locks/${ROLE}-${SLICE}-$(date +%s).lock << EOF
window=$WINDOW_ID
role=$ROLE
slice=$SLICE
workdir=src/engine/Loop.ts,src/engine/ContextAssembly.ts
started=$(date -Iseconds)
EOF
```

完成后必须 `rm` 删除自己的锁。

## 冲突处理

- 发现已有锁覆盖你要改的文件 → 写 .handoff/ 通知该窗口,等其完成
- 24h 以上未更新的锁视为僵尸锁,可由林品臣清理
LOCKS_EOF

# ============================================================
# 10. docs/ADR/*.md - 7 条架构决策记录
# ============================================================
cat > docs/ADR/_README.md << 'ADR_README_EOF'
# Architecture Decision Records

每条 ADR 描述一个关键架构决策。被推翻时必须新增一条 ADR 引用旧条,**禁止删除旧 ADR**。

模板:
```
# ADR-XXX: <决策标题>

**日期**: YYYY-MM-DD
**状态**: Accepted / Superseded by ADR-YYY / Deprecated

## 上下文
<为什么要做这个决策>

## 决策
<决定做什么>

## 替代方案
<考虑过的其他方案及为什么不选>

## 后果
<这个决策带来的影响>
```
ADR_README_EOF

cat > docs/ADR/ADR-001-loop-only.md << 'ADR1_EOF'
# ADR-001: 唯一编排范式 — Function Calling Loop

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

v0.1 demo 验证了 Function Calling Loop 在 BSP 工程师等"库外岗位"场景下能让 LLM 用领域知识接管,体验上限远超 Workflow 编排。Workflow 会把 LLM 上限锁死在工具下限上。

## 决策

v1.2 唯一编排范式是 Function Calling Loop。禁止引入 Workflow / DAG / Router / 状态机。

## 替代方案

- LangGraph: 框架重,锁死表达力
- 自研 Workflow: 实现成本高,违反公理 A1
- 三模式并存(Workflow + Loop + Scheduled): 增加复杂度,Demo 阶段不需要

## 后果

- ✅ LLM 自由发挥空间最大
- ✅ 实现简单,易于迭代 prompt
- ⚠️ 长程任务/定时任务需要外挂调度(v1.4+ 再考虑)
ADR1_EOF

cat > docs/ADR/ADR-002-no-stack-upgrade.md << 'ADR2_EOF'
# ADR-002: v1.2 不升级技术栈

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

v0.1 stack: React 18 + TS + Vite + Tailwind + DeepSeek + JSON 数据 + localStorage。
原 v1.0 PRD 提议升级到 Next.js + Postgres + Pinecone + Redis + BullMQ。

## 决策

v1.2 保持 v0.1 技术栈不变。唯一升级是 AIEngine 重构 + Memory + Self-Improve 模块。

## 替代方案

- 全栈升级: 资源全砸基础设施,DSP 故事点没人写
- 部分升级(Postgres only): 收益小,迁移成本不低

## 后果

- ✅ 资源全部投向 5 条 DSP 与 Self-Improve 闭环
- ✅ Demo 阶段技术栈足够撑住故事
- ⚠️ v2.0 上线前必须完成栈升级
ADR2_EOF

cat > docs/ADR/ADR-003-memory-json.md << 'ADR3_EOF'
# ADR-003: Memory 用 JSON + LLM 摘要,不上向量数据库

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

Memory & Self-Improve 是 v1.2 核心卖点。需要决定存储形态。

## 决策

v1.2 Memory 用 JSON 文件 + localStorage,检索用关键词匹配 + LLM 摘要。不上向量数据库。

## 替代方案

- Pinecone: Demo 不需要语义检索;故事点有限,关键词够用
- Postgres + pgvector: 同上,加引入运维负担

## 后果

- ✅ 实现简单,易于演示
- ✅ 容易展示"Agent 记住了什么"(JSON 可读)
- ⚠️ v2 真实数据规模上来必须升级
ADR3_EOF

cat > docs/ADR/ADR-004-self-improve-auto.md << 'ADR4_EOF'
# ADR-004: Self-Improve 采用方案 B(自动闭环)

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

讨论过两个方案:
- A: 仅样本收集,人工迭代 prompt
- B: 自动用样本反向调 prompt/few-shot

简历评估、AI 面试场景验证 B 方案有效,有显著效果提升。

## 决策

采用方案 B: 失败样本 → LLM-as-Optimizer 分析负样本聚类 → 产出 prompt 修改草案 → 林品臣 review → 一键合入 → 全 DSP 回归。

## 替代方案

- A 方案: 工程量小但不够"AI Native",失去关键演示卖点

## 后果

- ✅ Demo 现场可演"昨天的负样本今天已修复",震撼
- ⚠️ 工程量增加,有 prompt 跑飞风险 → 通过强制 DSP 回归门禁兜底
ADR4_EOF

cat > docs/ADR/ADR-005-interview-shell-only.md << 'ADR5_EOF'
# ADR-005: AI 面试做壳不做芯

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

AI 面试涉及多角色 / 排期 / 视频 / 合规,是另一个产品规模。但完全砍掉会让 demo 端到端故事不闭环。

## 决策

v1.2 AI 面试只做演示资产: 卡片样式 + 流程串联 + 状态流转 + 2 轮预制对话(OQ-04)。
不做: 真实生成定制问题、真实多轮 AI 对话、真实排程、真实评分。

## 替代方案

- 全砍: 端到端故事不闭环,影响 DSP-4 演示
- 全做: 资源被吸走,DSP-1/2/3/5 没人做

## 后果

- ✅ 端到端故事完整
- ✅ 资源向核心 DSP 倾斜
- ⚠️ 演示数据标识必须明确(由 dev mode 切换)
ADR5_EOF

cat > docs/ADR/ADR-006-contract-layer-owned.md << 'ADR6_EOF'
# ADR-006: 契约层由林品臣独家 review

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

多 Agent 并行最大风险是接口契约漂移: A 改了 search_candidates 返回字段,B 写的卡片就废了。
按文件夹划边界不够,必须有"契约权威"。

## 决策

`src/contracts/*` 是契约层,只有林品臣(Spec Agent)能改。其他 Agent 想改契约必须先提 issue,林品臣 24h 内裁决。

## 替代方案

- 各 Agent 自由改: 必然漂移
- Tools Agent 兼任: 利益相关,容易自肥

## 后果

- ✅ 接口稳定
- ⚠️ 林品臣成为瓶颈 → 通过 24h SLA 兜底
ADR6_EOF

cat > docs/ADR/ADR-007-llm-fallback-empty.md << 'ADR7_EOF'
# ADR-007: 卡片空态/错误态由 LLM 兜底

**日期**: 2026-05-24
**状态**: Accepted

## 上下文

v0.1 demo 中"未找到候选人"等裸文案是体验最大伤口。

## 决策

所有卡片的空态、错误态禁止裸文案,必须由 LLM 生成接管话术(公理 A3)。
UI 组件接收 `emptyHint: string` / `errorHint: string` 字段,由 Engine Agent 在工具失败时生成。

## 替代方案

- 前端默认 "暂无数据": 体验崩盘
- 多语言资源包: 没法体现"招聘合伙人"语气

## 后果

- ✅ 失败也"演得专业"
- ⚠️ Engine + UI 协作要求高 → 通过 contracts/cards.ts 强制 hint 字段
ADR7_EOF

# ============================================================
# 11. docs/slices/*.md - 切片说明书
# ============================================================
cat > docs/slices/_README.md << 'SLICE_README_EOF'
# Slice Records

每个 Slice 一份 spec(目标 / DoD / 阻塞依赖) + 一份回顾(由完成它的 Agent 写)。

## 文件命名

- `S<n>-<topic>.md`: 切片 spec(由林品臣写,在切片启动前)
- `S<n>-<role>-retro.md`: 切片回顾(由 Agent 写,在切片完成后)
SLICE_README_EOF

cat > docs/slices/S0-contracts.md << 'S0_EOF'
# Slice S0: 契约层 + 脚手架

**主导**: 林品臣(Spec Agent)
**依赖**: 无
**预计**: 3 天

## 目标

完成项目脚手架,定义所有跨 Agent 接口契约。这是后续所有 Agent 启动的前置条件。

## 任务清单

- [ ] `src/contracts/tools.ts` — 12 个工具的 ToolSpec / ToolResult 定义
- [ ] `src/contracts/cards.ts` — 10 类卡片 schema(含 actions / hints / mode 字段)
- [ ] `src/contracts/memory.ts` — 三层记忆 schema
- [ ] `src/contracts/events.ts` — 埋点事件 schema(给 Eval / Self-Improve 用)
- [ ] 项目可 `npm install` + `npm run dev` 跑空白页
- [ ] CI 跑通(lint + tsc + 空 eval)
- [ ] PRD.md 同步飞书最新版

## DoD

- [ ] contracts/* 全部定义,有 README 解释每个字段
- [ ] 任意一个 Agent cd 进项目执行启动仪式 5 步,30s 内能输出"我是谁/做什么/有哪些 handoff"
- [ ] STATE.md 更新 S0 → ✅ Done

## 阻塞依赖

- 无(这是项目第一片)
S0_EOF

cat > docs/slices/S1-engine-loop.md << 'S1_EOF'
# Slice S1: Engine Loop 重构

**主导**: Engine Agent
**依赖**: S0
**预计**: 3 天

## 目标

实现极简 Function Calling Loop + ContextAssembly + ToolExecutor + ResponseRenderer + Memory 三层 + Self-Improve collector 骨架。

## 任务清单

- [ ] `src/engine/Loop.ts` — 主循环 + 全部止损
- [ ] `src/engine/ContextAssembly.ts` — System Prompt + Memory + Tools 装配
- [ ] `src/engine/ToolExecutor.ts` — 并行执行 + 失败兜底 hint
- [ ] `src/engine/ResponseRenderer.ts` — 流式 + 卡片解析
- [ ] `src/memory/{store,writer,recall}.ts`
- [ ] `src/self_improve/collector.ts` — JSONL 落盘
- [ ] `prompts/v1.md` — System Prompt v1(按 PRD 3.2.2 + 3.3.1)
- [ ] 单元测试: 止损 / 兜底 / Memory 注入

## DoD

- [ ] Loop 跑通(给一段对话能正确产出回复)
- [ ] 止损 100% 生效(单测覆盖 max_steps / timeout / 循环检测)
- [ ] Memory 跨会话唤醒 demo 跑通
- [ ] Self-Improve collector 能落盘样本

## 阻塞依赖

- 等 S0 完成
- 等 Tools Agent 在 S2 提供 stub 工具用于联调(可先用 mock)
S1_EOF

cat > docs/slices/S2-tools-data.md << 'S2_EOF'
# Slice S2: Tools 集 + Golden Data

**主导**: Tools Agent + Data Agent
**依赖**: S0
**预计**: 3 天(并行)

## 目标

12 个工具实现 + 5 个实体黄金数据。

## 任务清单(Tools)

- [ ] T1-T8 真实工具(读 src/data)
- [ ] T9-T10 memory_recall / memory_write 工具
- [ ] T11 interview_kit_prepare 演示型工具
- [ ] T12 generate_report 真实工具
- [ ] 每个工具 ≥ 3 单元测试

## 任务清单(Data)

- [ ] resumes.json (30 条,含黄金候选人张三)
- [ ] jobs.json (10 条,故意没有 BSP)
- [ ] pipeline.json (50 条,算法岗通过率 28%→19%)
- [ ] market.json (15 方向,含 BSP/嵌入式底层条目)
- [ ] data/README.md (说明黄金故事点)

## DoD

- [ ] 12 工具全部跑通
- [ ] 5 个 DSP 黄金故事点可被 Eval 引用
- [ ] 数据 README 完整

## 阻塞依赖

- 等 S0 contracts 锁定
S2_EOF

cat > docs/slices/S3-cards.md << 'S3_EOF'
# Slice S3: 10 类卡片 + 状态规范

**主导**: UI Agent
**依赖**: S0
**预计**: 3 天

## 目标

C1-C10 卡片组件,四态完整。

## 任务清单

- [ ] C1 候选人列表卡 / C2 画像卡 / C3 对比卡
- [ ] C4 岗位卡 / C5 岗位画像建议卡 / C6 市场分析卡
- [ ] C7 漏斗周报卡 / C8 面试包卡 / C9 记忆唤醒卡 / C10 引导澄清卡
- [ ] 四态: Loading 骨架屏 / 空态 LLM hint / 错误态 LLM hint / 演示态(右上小标,dev mode 可切)
- [ ] 每张卡片支持 `actions[]` 渲染与点击触发 onIntentTrigger

## DoD

- [ ] 10 类卡片故事书(Storybook 或 demo 页)全部可见
- [ ] 四态全覆盖
- [ ] dev mode 切换演示标识 OK

## 阻塞依赖

- 等 S0 contracts/cards.ts 锁定
S3_EOF

cat > docs/slices/S4-dsp12.md << 'S4_EOF'
# Slice S4: DSP-1 + DSP-2 闭环

**主导**: Engine Agent + Eval Agent
**依赖**: S1, S2, S3
**预计**: 3 天

## 目标

打通 DSP-1(库外岗位接管) + DSP-2(找人对比) 端到端闭环,通过路径回归 + 惊艳度 + 兜底三层 Eval。

## 任务清单

- [ ] DSP-1 路径回归 5 变体语料
- [ ] DSP-2 路径回归 5 变体语料
- [ ] 惊艳度 LLM-Judge rubric + 跑分
- [ ] 兜底测试 ≥ 10 条
- [ ] 第一次给老板看的 demo 录屏

## DoD

- [ ] DSP-1/2 路径回归 100% 通过
- [ ] 惊艳度 DSP-1 ≥ 4.5 / DSP-2 ≥ 4.0
- [ ] 兜底测试 ≥ 90%

## 阻塞依赖

- 等 S1 / S2 / S3 全部完成
S4_EOF

cat > docs/slices/S5-memory-dsp3.md << 'S5_EOF'
# Slice S5: Memory + DSP-3 闭环

**主导**: Engine Agent + Eval Agent + UI Agent(OQ-02)
**依赖**: S4
**预计**: 3 天

## 目标

跨会话候选人记忆唤醒(张三案例),DSP-3 通过。

## 任务清单

- [ ] Engine: Memory 写入策略 / 注入策略 / 冲突待确认机制
- [ ] UI: 记忆唤醒卡 + 待确认 UI(OQ-02)
- [ ] Eval: DSP-3 跨会话 10 个固定场景的回归
- [ ] 现场演示: "Agent 自动记得张三在比较 OPPO offer"

## DoD

- [ ] 跨会话记忆调用准确率 ≥ 95%
- [ ] DSP-3 三层 Eval 全绿

## 阻塞依赖

- 等 S4
S5_EOF

cat > docs/slices/S6-dsp45.md << 'S6_EOF'
# Slice S6: DSP-4(壳) + DSP-5 闭环

**主导**: Tools(demo) + UI Agent + Eval Agent
**依赖**: S5
**预计**: 3 天

## 目标

DSP-4 面试包壳层 + 2 轮预制对话(OQ-04) + DSP-5 周报洞察。

## 任务清单

- [ ] T11 interview_kit_prepare mock 数据(精心构造)
- [ ] C8 面试包卡完整渲染
- [ ] AI 模拟面试入口 + 2 轮预制对话
- [ ] T12 generate_report + C7 周报卡 + 洞察生成
- [ ] 第二次给老板看的 demo 录屏(5 DSP 全闭环)

## DoD

- [ ] DSP-4 视觉完整度评审通过
- [ ] DSP-5 周报洞察非套话率 ≥ 90%

## 阻塞依赖

- 等 S5
S6_EOF

cat > docs/slices/S7-self-improve.md << 'S7_EOF'
# Slice S7: Self-Improve 闭环 + 整体 polish

**主导**: Engine + Eval Agent
**依赖**: S6
**预计**: 3 天

## 目标

Self-Improve 全链路打通,作为最终演示亮点。

## 任务清单

- [ ] self_improve/classifier(正负样本自动分类)
- [ ] self_improve/optimizer(Claude 离线脚本,产出 prompt 草案)
- [ ] 林品臣 review UI(简单 CLI 即可)
- [ ] 一键合入 + 全 DSP 回归
- [ ] 现场演示"昨天的负样本今天已修复"
- [ ] 第三次给老板看的 demo 录屏

## DoD

- [ ] 全 DSP 三层 Eval 绿
- [ ] Self-Improve 闭环现场可演
- [ ] STATE.md 全部 ✅,项目交付

## 阻塞依赖

- 等 S6
S7_EOF

# ============================================================
# 12. .gitignore
# ============================================================
cat > .gitignore << 'GIT_EOF'
node_modules/
dist/
.DS_Store
.env
.env.local
*.log

# self-improve runtime data
src/self_improve/samples/*.jsonl
!src/self_improve/samples/.gitkeep

# memory runtime data
src/memory/runtime/*.json
!src/memory/runtime/.gitkeep

# locks (保留 README 但忽略锁本身)
.locks/*.lock
GIT_EOF

# ============================================================
# 13. package.json 占位(S0 由林品臣完善)
# ============================================================
cat > package.json << 'PKG_EOF'
{
  "name": "hiring-agent-demo",
  "version": "1.2.0-alpha",
  "private": true,
  "description": "HireAgent v1.2 — AI Native 招聘智能体的想象力 Demo",
  "scripts": {
    "dev": "echo 'TODO: configured in S0' && exit 1",
    "build": "echo 'TODO: configured in S0' && exit 1",
    "eval": "echo 'TODO: configured in S0/S4' && exit 1",
    "eval:path": "tsx eval/run.ts --layer path_regression",
    "eval:wow": "tsx eval/run.ts --layer wow_score",
    "eval:resilience": "tsx eval/run.ts --layer resilience"
  }
}
PKG_EOF

# ============================================================
# 14. 占位 contracts(S0 由林品臣完善)
# ============================================================
cat > src/contracts/_README.md << 'CONTRACTS_EOF'
# src/contracts/ — 契约层(只有林品臣可改)

⚠️ 这是项目唯一的"接口权威"。所有跨 Agent 协作通过这里的类型定义对齐。

## 文件清单

- `tools.ts` — 12 工具的 ToolSpec / ToolResult
- `cards.ts` — 10 类卡片 schema(含 actions / hints / mode)
- `memory.ts` — 三层记忆 schema
- `events.ts` — 埋点事件 schema

## 修改规则

1. 任何修改必须由林品臣 commit
2. 其他 Agent 想改 → 写 .handoff/<role>-to-spec-*.md,24h 内裁决
3. 修改后必须更新 docs/ADR(如果是架构级变更)

## 当前状态

⚪ 待 S0 实现
CONTRACTS_EOF

touch src/contracts/tools.ts src/contracts/cards.ts src/contracts/memory.ts src/contracts/events.ts

# 占位 src 子目录的 README
echo "# src/engine/ — Engine Agent 工作区(参见 prompts/agents/engine.md)" > src/engine/_README.md
echo "# src/tools/ — Tools Agent 工作区(参见 prompts/agents/tools.md)" > src/tools/_README.md
echo "# src/memory/ — Engine Agent 工作区(三层记忆实现)" > src/memory/_README.md
echo "# src/self_improve/ — Engine Agent 工作区(Self-Improve 闭环)" > src/self_improve/_README.md
echo "# src/data/ — Data Agent 工作区(参见 prompts/agents/data.md)" > src/data/_README.md
echo "# src/components/ — UI Agent 工作区(参见 prompts/agents/ui.md)" > src/components/_README.md
echo "# eval/ — Eval Agent 工作区(参见 prompts/agents/eval.md)" > eval/_README.md

# ============================================================
# 15. 仪式辅助脚本(可选,但很有用)
# ============================================================
mkdir -p scripts

cat > scripts/agent-startup.sh << 'STARTUP_EOF'
#!/usr/bin/env bash
# Agent 启动仪式辅助脚本
# 用法: bash scripts/agent-startup.sh <role>
#   role: engine | tools | data | ui | eval

ROLE="${1:?usage: agent-startup.sh <role>}"

echo "===== Agent 启动仪式 [$ROLE] ====="
echo ""
echo "--- 1. 代码态 ---"
git status --short 2>/dev/null || echo "(not a git repo yet)"
git log --oneline -10 2>/dev/null || echo "(no commits yet)"
echo ""
echo "--- 2. STATE.md ---"
cat STATE.md
echo ""
echo "--- 3. .handoff/ 中点你名的交接 ---"
ls .handoff/ 2>/dev/null | grep -E "to-${ROLE}|to-all" || echo "(no pending handoff)"
echo ""
echo "--- 4. 你的角色 Prompt ---"
cat "prompts/agents/${ROLE}.md"
echo ""
echo "===== 启动完成,请输出三句话再开工 ====="
echo "1. 我是: $ROLE"
echo "2. 当前 Active Slice: $(grep 'Active Slice' STATE.md | head -1 | awk '{print $NF}')"
echo "3. 待处理 handoff: $(ls .handoff/ 2>/dev/null | grep -cE "to-${ROLE}|to-all" || echo 0) 个"
STARTUP_EOF

cat > scripts/agent-shutdown.sh << 'SHUTDOWN_EOF'
#!/usr/bin/env bash
# Agent 关窗仪式辅助脚本
# 用法: bash scripts/agent-shutdown.sh <role> <slice> "<commit message>"

ROLE="${1:?usage: agent-shutdown.sh <role> <slice> <message>}"
SLICE="${2:?slice required}"
MSG="${3:?commit message required}"

echo "===== Agent 关窗仪式 [$ROLE / $SLICE] ====="
echo ""
echo "--- 1. git status ---"
git status --short
echo ""
read -p "确认提交? [y/N] " yn
if [ "$yn" != "y" ] && [ "$yn" != "Y" ]; then
  echo "abort"
  exit 1
fi

git add .
git commit -m "[$ROLE][$SLICE] $MSG"

echo ""
echo "--- 2. 请手动更新 STATE.md ---"
echo "  - 把 $SLICE 的状态改为 🟢 Review 或 ✅ Done"
echo ""
echo "--- 3. 请手动写切片回顾 ---"
echo "  - docs/slices/$SLICE-$ROLE-retro.md"
echo ""
echo "--- 4. 删除你的锁(如有) ---"
ls .locks/${ROLE}-* 2>/dev/null
read -p "删除? [y/N] " yn2
[ "$yn2" = "y" ] && rm -f .locks/${ROLE}-*.lock

echo ""
echo "===== 关窗完成,可以关闭窗口 ====="
SHUTDOWN_EOF

chmod +x scripts/agent-startup.sh scripts/agent-shutdown.sh

# ============================================================
# 16. 完成总结
# ============================================================
echo ""
echo "==> 完成! 项目骨架已生成在 $(pwd)"
echo ""
echo "目录结构:"
find . -maxdepth 2 -type d | sort
echo ""
echo "顶层文件:"
ls -1 *.md *.json .gitignore 2>/dev/null | sort
echo ""
echo "下一步:"
echo "  1. cd 进项目"
echo "  2. git init && git add . && git commit -m 'init: hireagent v1.2 scaffold'"
echo "  3. 把飞书 PRD v1.2 的 markdown 同步到 PRD.md"
echo "  4. 启动 S0: 由林品臣本人完成 contracts/* 与 npm 脚手架"
echo "  5. S0 完成后,启动 Engine / Tools / Data / UI Agent 并行"
