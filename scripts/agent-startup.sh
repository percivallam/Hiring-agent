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
