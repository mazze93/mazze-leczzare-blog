#!/usr/bin/env zsh
# ============================================================================
# burst-summary.sh — list what's changed since the last Stratum-referenced
# commit, so it can be folded into one deliberate `stratum decide` covering
# the batch. Read-only: prints, records nothing, calls no network endpoint.
#
# The auto-commit hook (~/.claude/scripts/auto-commit.sh, if present on this
# machine) already checkpoints every file save at the git level. This
# script's only job is to surface that trail at burst-close time so the
# *why* doesn't get lost between commits.
#
# Usage: scripts/burst-summary.sh [--log <log-id>]
#   Log id defaults to the contents of .stratum-log in the repo root, or the
#   repo's directory name if that file doesn't exist.
# ============================================================================
set -euo pipefail

REPO=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "not a git repo" >&2; exit 1; }
cd "$REPO"

LOG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --log) LOG="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done
if [[ -z "$LOG" ]]; then
  if [[ -f .stratum-log ]]; then LOG=$(<.stratum-log); else LOG=$(basename "$REPO"); fi
fi

LAST_REF=$(git log --grep='Ref: dec-' -n 1 --format='%H' 2>/dev/null || true)

if [[ -z "$LAST_REF" ]]; then
  echo "No prior commit references a Stratum decision — showing full history."
  RANGE=""
else
  echo "Since last Stratum-referenced commit ($LAST_REF):"
  RANGE="${LAST_REF}.."
fi

echo
echo "── commits ──────────────────────────────────────────────────────────"
git log ${RANGE} --oneline --no-merges || echo "(none)"

echo
echo "── files touched ────────────────────────────────────────────────────"
git diff --stat ${LAST_REF:+"$LAST_REF"} HEAD 2>/dev/null || git diff --stat HEAD

echo
echo "── next step ────────────────────────────────────────────────────────"
echo "Review the above, then record ONE decision covering this burst:"
echo
echo "  stratum decide \"…what this burst actually did/decided…\" \\"
echo "    --log ${LOG} --shadow \"…why this approach, what was rejected, certainty…\""
echo
echo "Add --pending to the decide call ONLY if you intend to back it with real"
echo "evidence afterward (a script run, a test, a live check) — that's what"
echo "makes scripts/stratum-link.sh's verify step legal (asserted decisions"
echo "can't be verified directly, only ratified by a human or disputed)."
echo
echo "Then, if --pending was used, link it to the commit that closes the burst:"
echo "  scripts/stratum-link.sh <dec-id-from-above>"
