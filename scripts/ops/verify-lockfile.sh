#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if [ ! -f package-lock.json ]; then
  echo "❌ package-lock.json missing — run npm install to generate it"
  exit 1
fi

npm ci --dry-run >/dev/null 2>&1 || {
  echo "❌ package-lock.json is out of sync with package.json — run npm install"
  exit 1
}

echo "✅ lockfile valid"
