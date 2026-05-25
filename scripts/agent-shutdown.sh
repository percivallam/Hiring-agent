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
