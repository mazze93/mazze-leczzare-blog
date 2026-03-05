#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ACTIVE_CONTEXT="$REPO_ROOT/docs/operations/memory/ACTIVE_CONTEXT.md"
SESSION_LOG="$REPO_ROOT/docs/operations/memory/SESSION_LOG.md"
NOW_UTC="$(date -u +"%Y-%m-%d %H:%M:%SZ")"
DAY_UTC="$(date -u +"%Y-%m-%d")"
BRANCH="$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo unknown)"
LAST_COMMIT="$(git -C "$REPO_ROOT" log --oneline -1 2>/dev/null || echo none)"
STATUS_COUNT="$(git -C "$REPO_ROOT" status --short 2>/dev/null | wc -l | tr -d ' ')"

OBJECTIVE="Operational continuity update."
declare -a STATES=()
declare -a CONSTRAINTS=()
declare -a NEXTS=()
declare -a NOTES=()

usage() {
  cat <<'USAGE'
Usage:
  scripts/ops/session-handoff.sh [options]

Options:
  --objective "text"      Active objective for ACTIVE_CONTEXT
  --state "text"          Add a Current State bullet (repeatable)
  --constraint "text"     Add a Known Constraints bullet (repeatable)
  --next "command"        Add a Next Commands bullet (repeatable)
  --note "text"           Add a Session Log bullet (repeatable)
  -h, --help              Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --objective)
      OBJECTIVE="$2"
      shift 2
      ;;
    --state)
      STATES+=("$2")
      shift 2
      ;;
    --constraint)
      CONSTRAINTS+=("$2")
      shift 2
      ;;
    --next)
      NEXTS+=("$2")
      shift 2
      ;;
    --note)
      NOTES+=("$2")
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ "${#STATES[@]}" -eq 0 ]]; then
  STATES+=("Last commit: \`$LAST_COMMIT\`.")
  STATES+=("Working tree has $STATUS_COUNT pending path(s).")
fi

if [[ "${#CONSTRAINTS[@]}" -eq 0 ]]; then
  CONSTRAINTS+=("Avoid mixing unrelated changes into focused commits.")
fi

if [[ "${#NEXTS[@]}" -eq 0 ]]; then
  NEXTS+=("git status --short --branch")
  NEXTS+=("bash scripts/ops/update-context-cache.sh")
  NEXTS+=("bash scripts/ops/prune-context-cache.sh 30")
fi

if [[ "${#NOTES[@]}" -eq 0 ]]; then
  NOTES+=("Updated handoff context on branch \`$BRANCH\`.")
  NOTES+=("Active objective: $OBJECTIVE")
fi

mkdir -p "$(dirname "$ACTIVE_CONTEXT")"

TMP_ACTIVE="$(mktemp)"
{
  echo "# Active Context"
  echo
  echo "Last Updated: $NOW_UTC"
  echo
  echo "## Current Branch"
  echo "- \`$BRANCH\`"
  echo
  echo "## Active Objective"
  echo "- $OBJECTIVE"
  echo
  echo "## Current State"
  for item in "${STATES[@]}"; do
    echo "- $item"
  done
  echo
  echo "## Known Constraints"
  for item in "${CONSTRAINTS[@]}"; do
    echo "- $item"
  done
  echo
  echo "## Next Commands"
  for item in "${NEXTS[@]}"; do
    echo "- \`$item\`"
  done
} > "$TMP_ACTIVE"
mv "$TMP_ACTIVE" "$ACTIVE_CONTEXT"

TMP_SESSION="$(mktemp)"
{
  echo "# Session Log"
  echo
  echo "## $DAY_UTC ($NOW_UTC)"
  for note in "${NOTES[@]}"; do
    echo "- $note"
  done
  echo
  if [[ -f "$SESSION_LOG" ]]; then
    sed '1,2d' "$SESSION_LOG"
  fi
} > "$TMP_SESSION"
mv "$TMP_SESSION" "$SESSION_LOG"

"$REPO_ROOT/scripts/ops/update-context-cache.sh" >/dev/null 2>&1 || true
"$REPO_ROOT/scripts/ops/prune-context-cache.sh" 30 >/dev/null 2>&1 || true

echo "Updated:"
echo "- $ACTIVE_CONTEXT"
echo "- $SESSION_LOG"
