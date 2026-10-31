#!/bin/bash
cd ~/TaleemOS-Hub-v5
if [ -f src/modules/DashboardModule.backup_before_smart.tsx ]; then
  cp src/modules/DashboardModule.backup_before_smart.tsx src/modules/DashboardModule.tsx
  lsof -ti:3012 | xargs kill -9 2>/dev/null
  PORT=3012 npm run dev -- --host 0.0.0.0 --port 3012 --force &
  echo "✅ Reverted to previous - http://localhost:3012"
else
  echo "❌ Backup not found"
fi
