# Slice S1 — Engine Loop 回顾

**Owner**: Engine Agent
**完成日期**: 2026-05-25
**耗时**: ~2h

---

## 做了什么

1. **`src/engine/AIEngine.ts`** — 完整重写（230→499 行）
   - 实现 Function Calling Loop：LLM → tool → LLM → tool → ... → final
   - 四件套止损：max_steps(8) / max_tool_calls(12) / timeout(30s) / loop_detected(3)
   - 严格事件 emit：user_message → llm_round → tool_call → tool_result → ... → agent_message
   - LLM Client / ToolExecutor 注入式设计
   - 向后兼容桩（构造函数重载 + 旧方法 stub）保证 S3 迁移期不崩
   - System Prompt 动态从 TOOL_SPECS 生成工具表

2. **`src/engine/stop_guards.ts`** — 72 行纯函数止损模块

3. **`src/engine/events.ts`** — 182 行事件构建函数，含 roleToEnum 中文→英文映射

4. **`src/engine/__mocks__/mockTools.ts`** — 206 行 Mock ToolExecutor + 测试辅助

5. **`src/engine/__mocks__/mockLLM.ts`** — 97 行场景驱动 MockLLMClient

6. **`src/engine/index.ts`** — 更新导出，保留旧版引擎兼容

7. **`test/engine.test.ts`** — 261 行，7 个单测覆盖 E1-E7

## 遇到什么

- **tsx 可用**：v4.21.0，无测试框架，用 Node `assert` 跑 7 个单测
- **ChatView.tsx 旧 API 不兼容**：S1 新 AIEngine 构造器签名不同，通过向后兼容桩解决
- **tsc noUnusedParameters**：旧版构造器存根参数加 `_` 前缀
- **mockTools 路径**：`__mocks__/mockTools.ts` 需要 `../../contracts/tools` 而非 `../contracts/tools`

## 下一步（给下一棒）

- Tools Agent (S2)：可基于 `ToolExecutor` 接口实现真实 tool 替换 mock
- UI Agent (S3)：需将 ChatView.tsx 从旧 API 迁移到 `new AIEngine({ llmClient, toolExecutor })` → `engine.chat(input)`
- Eval Agent (S4)：事件流已就绪，可基于 `TrackedEvent[]` 做路径校验
- Self-Improve (S7)：事件流包含 LLMRoundEvent / ErrorEvent / ToolResultEvent，正负样本分类可直接消费

## 已知 TODO

- prompt 工程未优化（baseline 跑通即可）
- System Prompt 中角色中文名来自 `ChatInput.role`，不通过 contracts
- `ChatInput.memory` 字段为 `unknown`，S5 再定接口
