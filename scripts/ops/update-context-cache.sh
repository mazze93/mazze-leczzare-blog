#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CACHE_DIR="$REPO_ROOT/docs/operations/memory/context-cache"
LATEST="$CACHE_DIR/latest.md"
STAMP="$(date -u +"%Y-%m-%dT%H%M%SZ")"
SNAPSHOT="$CACHE_DIR/${STAMP}.md"

mkdir -p "$CACHE_DIR"

BRANCH="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo unknown)"
LAST_COMMIT="$(git -C "$REPO_ROOT" log --oneline -1 2>/dev/null || echo none)"

{
  echo "# Context Cache Snapshot"
  echo
  echo "Generated: $(date -u +"%Y-%m-%d %H:%M:%SZ")"
  echo "Branch: $BRANCH"
  echo "Last Commit: $LAST_COMMIT"
  echo
  echo "## Git Status (short)"
  git -C "$REPO_ROOT" status --short || true
  echo
  echo "## Ahead/Behind"
  git -C "$REPO_ROOT" status --short --branch | sed -n '1p' || true
  echo
  echo "## Recent Commits"
  git -C "$REPO_ROOT" log --oneline -5 || true
} > "$LATEST"

cp "$LATEST" "$SNAPSHOT"
echo "Context cache updated: $LATEST"
echo "Snapshot saved: $SNAPSHOT"
