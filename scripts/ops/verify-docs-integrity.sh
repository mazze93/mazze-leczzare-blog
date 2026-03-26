#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "[docs-integrity] validating documented npm scripts against package.json"

node <<'NODE'
const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = new Set(Object.keys(pkg.scripts || {}));

const files = [
  { path: 'README.md', pattern: /`npm run ([^`\s]+)`/g },
  { path: 'AGENTS.md', pattern: /`npm run ([^`\s]+)`/g },
  { path: '.github/copilot-instructions.md', pattern: /`npm run ([^`\s]+)`/g },
];

let hasError = false;
for (const file of files) {
  const text = fs.readFileSync(file.path, 'utf8');
  const found = new Set();
  for (const match of text.matchAll(file.pattern)) found.add(match[1]);

  for (const cmd of [...found].sort()) {
    if (!scripts.has(cmd)) {
      console.error(`[docs-integrity] ${file.path} references missing script: npm run ${cmd}`);
      hasError = true;
    }
  }
}

if (hasError) process.exit(1);
NODE

echo "[docs-integrity] validating deployment-mode wording"

if rg -n "@astrojs/cloudflare|wrangler deploy --dry-run|wrangler dev|platformProxy.enabled|Cloudflare Workers using" .github/copilot-instructions.md >/dev/null; then
  echo "[docs-integrity] .github/copilot-instructions.md still contains stale Workers adapter language"
  exit 1
fi

if ! rg -n "output:\s*\"static\"" astro.config.mjs >/dev/null; then
  echo "[docs-integrity] astro.config.mjs is no longer static; update docs-integrity checks"
  exit 1
fi

if ! rg -n "Cloudflare Pages" README.md >/dev/null; then
  echo "[docs-integrity] README.md should mention Cloudflare Pages deployment"
  exit 1
fi

echo "[docs-integrity] all checks passed"
