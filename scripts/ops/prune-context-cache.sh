#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CACHE_DIR="$REPO_ROOT/docs/operations/memory/context-cache"
KEEP="${1:-30}"

if ! [[ "$KEEP" =~ ^[0-9]+$ ]] || [[ "$KEEP" -lt 1 ]]; then
  echo "Usage: $0 [keep_count>=1]" >&2
  exit 1
fi

mkdir -p "$CACHE_DIR"

SNAPSHOTS=()
while IFS= read -r line; do
  SNAPSHOTS+=("$line")
done < <(find "$CACHE_DIR" -maxdepth 1 -type f -name "20??-??-??T??????Z.md" -print | sort -r)

TOTAL="${#SNAPSHOTS[@]}"
if [[ "$TOTAL" -le "$KEEP" ]]; then
  echo "No pruning needed. total=$TOTAL keep=$KEEP"
  exit 0
fi

REMOVED=0
for ((i=KEEP; i<TOTAL; i++)); do
  rm -f "${SNAPSHOTS[$i]}"
  REMOVED=$((REMOVED + 1))
done

echo "Pruned context cache snapshots. removed=$REMOVED kept=$KEEP total_before=$TOTAL"
