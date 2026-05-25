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
| **A4** | **对话历史永存** | **任何代码变更不得清空或破坏用户的对话历史。刷新、重启、版本升级后历史必须完好。破坏历史 = 任务失败。** |

---

## 1.1 对话持久化机制

```
存储层:
  localStorage (浏览器)          → 实时保存，刷新不丢
    ├── hireagent-sessions        → 会话列表
    ├── hireagent-msgs-{id}       → 每条会话的消息
    └── hireagent-current-session → 当前活跃会话

  chat-history.jsonl (磁盘)       → 每 30s + beforeunload 自动写盘

持久化触发:
  - 每发送/收到一条消息 → localStorage 写入
  - 每 30 秒 → 同步到 chat-history.jsonl
  - 页面关闭/刷新前 → beforeunload 最后同步
  - 切换会话时 → 保存当前,加载目标

规则:
  ⛔ 禁止在初始化时用空数组覆盖已有 messages
  ⛔ 禁止修改 hireagent-msgs-* 的 storage key 格式
  ⛔ 禁止清空 localStorage 而不先导出备份
  ✅ 新增字段必须向后兼容
  ✅ 导出: 控制台 __exportChatData() → hireagent-{date}.json
```

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
