#!/usr/bin/env bash
# Runs the two repo-standard validation gates and prints only signal, not the
# full astro build / image-optimization / route-listing noise (~150 lines of
# it for a 40-page site) that a bare `npm run check` dumps into the terminal.
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

check_log=$(mktemp)
docs_log=$(mktemp)
trap 'rm -f "$check_log" "$docs_log"' EXIT

echo "Running npm run check (astro build + tsc)..."
if npm run check >"$check_log" 2>&1; then
  echo "PASS: npm run check"
else
  echo "FAIL: npm run check"
  echo "--- relevant lines (errors, excluding the expected empty-tesserae warning) ---"
  grep -iE "error" "$check_log" | grep -v "tesserae" || tail -n 40 "$check_log"
  exit 1
fi

echo "Running npm run docs:check..."
if npm run docs:check >"$docs_log" 2>&1; then
  echo "PASS: npm run docs:check"
else
  echo "FAIL: npm run docs:check"
  tail -n 40 "$docs_log"
  exit 1
fi

echo "Both gates passed."
