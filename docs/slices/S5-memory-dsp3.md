# Slice S5 — Memory + DSP-3 闭环

**Owner**: Engine Agent + Eval Agent
**PM Agent**: 调度决策
**前置依赖**: S0-S4 ✅
**预计工期**: 1 天 (加速模式)
**对应 PRD**: Part 3.4 Memory & Self-Improve, Part 3.1 DSP-3

---

## 0. 前置检查

- T9/T10 memory 工具已完成 (commit `6b212e9`)
- C9 记忆唤醒卡已完成 (S3, 含呼吸金边动画)
- 张三 (res_007) 黄金数据已预埋: "薪资敏感,正在比较 OPPO offer"

---

## 1. 目标

打通 DSP-3 跨会话记忆唤醒: 用户在第二次会话提及张三 → Memory 召回之前的备注 → 展示 C9 记忆唤醒卡。

---

## 2. 范围

### 已完成 (S5 前半段)
- ✅ T9 memory_recall 真实实现
- ✅ T10 memory_write 真实实现
- ✅ InMemoryStorage + MemoryManager
- ✅ 张三黄金数据预埋

### 待完成
- Engine: Context Assembly 注入 Memory 召回结果
- Eval: DSP-3 跨会话回归 (5-10 条场景)
- 联调验证

### 非范围
- ❌ BrowserStorage 切换 (留给后续)
- ❌ Self-Improve (S7)

---

## 3. DSP-3 行为规格

**场景**: 用户第二次对话提及张三

**语料**: "上次聊到张三，他那个薪资的问题现在有进展吗？"

**预期**:
1. Engine 在 Context Assembly 阶段调用 memory_recall(layer='candidate', query='张三薪资', candidate_id='res_007')
2. 召回 3 条预埋备注
3. System Prompt 尾部注入记忆摘要: "你之前记住关于张三的信息: ..."
4. LLM 引用记忆内容回复，如"根据我们之前的记录，张三薪资敏感，期望 55k+，当时正在比较 OPPO 60k 的 offer"
5. cards 包含 C9 (记忆唤醒卡)

---

## 4. 验收 (DoD)

- [ ] T9/T10 单测通过
- [ ] DSP-3 路径回归 5/5 通过
- [ ] 跨会话记忆召回准确率 ≥ 95%
- [ ] C9 记忆唤醒卡正确渲染
- [ ] `tsc --noEmit` + `git tag s5-done`
