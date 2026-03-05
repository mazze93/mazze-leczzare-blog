#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.githooks"
POST_COMMIT="$HOOKS_DIR/post-commit"

mkdir -p "$HOOKS_DIR"

cat > "$POST_COMMIT" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
"$REPO_ROOT/scripts/ops/update-context-cache.sh" >/dev/null 2>&1 || true
"$REPO_ROOT/scripts/ops/prune-context-cache.sh" 30 >/dev/null 2>&1 || true
HOOK

chmod +x "$POST_COMMIT"
git -C "$REPO_ROOT" config core.hooksPath .githooks

echo "Git hooks enabled via core.hooksPath=.githooks"
echo "post-commit now refreshes docs/operations/memory/context-cache/latest.md"
echo "post-commit now prunes context-cache snapshots to latest 30 timestamped files"
