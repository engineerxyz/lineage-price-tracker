#!/usr/bin/env bash
set -euo pipefail

cd /Users/munjuyeong/.openclaw/workspace/lineage-price-tracker

/Users/munjuyeong/.nvm/versions/node/v24.13.0/bin/node collect.js
/Users/munjuyeong/.nvm/versions/node/v24.13.0/bin/npm run build >/dev/null

rm -rf docs
cp -R out docs

git add docs data/history.json data/latest.json || true
if ! git diff --cached --quiet; then
  git commit -m "chore: update price snapshot"
  git push
fi
