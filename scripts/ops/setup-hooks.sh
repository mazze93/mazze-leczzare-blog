#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.githooks"
POST_COMMIT="$HOOKS_DIR/post-commit"

mkdir -p "$HOOKS_DIR"

cat > "$POST_COMMIT" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail

# Post-commit hooks must not mutate tracked files.
echo "INFO: context cache is not auto-updated on commit (by design)."
echo "Run: scripts/ops/update-context-cache.sh"
HOOK

chmod +x "$POST_COMMIT"
git -C "$REPO_ROOT" config core.hooksPath .githooks
git -C "$REPO_ROOT" config alias.ctx '!scripts/ops/update-context-cache.sh'

echo "Git hooks enabled via core.hooksPath=.githooks"
echo "post-commit is non-mutating by design (no tracked file writes)."
echo "Use 'git ctx' or scripts/ops/update-context-cache.sh for explicit refresh."
