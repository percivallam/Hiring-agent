#!/bin/bash
cd /Users/bytedance/hiring-agent-demo
npm run build || exit 1
git add -A
git commit -m "[deploy] auto-deploy $(date '+%Y-%m-%d %H:%M')" || true
git push origin main
echo "✅ 已推送，Vercel 自动部署中..."
