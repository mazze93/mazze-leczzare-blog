#!/usr/bin/env zsh
# ============================================================================
# stratum-link.sh — attach a git commit as CHECKED evidence on a Stratum
# decision (dec-… → validated), and print a line to paste into the commit
# message body if you want the reverse reference too.
#
# This is the one place this project makes a live Stratum call outside of an
# explicit `stratum decide`/`foreclose` — it's deliberate and manual, never
# triggered by an auto-commit hook.
#
# Usage: scripts/stratum-link.sh <dec-id> [commit-ish] [--log <log-id>]
#   commit-ish defaults to HEAD
#   Log id defaults to the contents of .stratum-log in the repo root, or the
#   repo's directory name if that file doesn't exist.
#
# PRECONDITION: the decision must have been created with `stratum decide
# --pending` (birth status pending_evidence). A plain `decide` starts
# "asserted" and the contract's transition guard will refuse verify on it —
# asserted only reaches ratified (human-only) or disputed, never validated
# directly. Use --pending when recording anything you intend to later back
# with real evidence (this script, a test run, a live check); leave it off
# for decisions that are just recorded reasoning, not open claims.
# ============================================================================
set -euo pipefail

REPO=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "not a git repo" >&2; exit 1; }
cd "$REPO"

[[ $# -ge 1 ]] || { echo "usage: $0 <dec-id> [commit-ish] [--log <log-id>]" >&2; exit 1; }
DEC_ID="$1"; shift

COMMIT="HEAD"
LOG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --log) LOG="$2"; shift 2 ;;
    *) COMMIT="$1"; shift ;;
  esac
done
if [[ -z "$LOG" ]]; then
  if [[ -f .stratum-log ]]; then LOG=$(<.stratum-log); else LOG=$(basename "$REPO"); fi
fi

HASH=$(git rev-parse --short "$COMMIT")
SUBJECT=$(git log -1 --format='%s' "$COMMIT")
REPO_NAME=$(basename "$REPO")

REF="${REPO_NAME}@${HASH} — ${SUBJECT}"
echo "Verifying ${DEC_ID} against ${REF}"

stratum verify "$DEC_ID" --ref "$REF" --kind git_commit --log "$LOG"

echo
echo "Commit message cross-reference (add if not already present):"
echo "  Ref: ${DEC_ID}"
