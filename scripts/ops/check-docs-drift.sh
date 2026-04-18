#!/usr/bin/env bash
# check-docs-drift.sh
# Compares documented items in CLAUDE.md against actual filesystem state.
# Run manually or wire into CI / a pre-push hook.
# Exit 0 = clean. Exit 1 = drift detected.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CLAUDE_MD="$REPO_ROOT/CLAUDE.md"
ERRORS=0

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
warn()  { printf '\033[0;33m%s\033[0m\n' "$*"; }
info()  { printf '\033[0;36m%s\033[0m\n' "$*"; }

fail() { red "  ✗ $*"; ERRORS=$((ERRORS + 1)); }
pass() { green "  ✓ $*"; }

echo ""
info "=== CLAUDE.md drift check ==="
echo ""

# ── 1. Pages ──────────────────────────────────────────────────────────────────
info "── Pages (src/pages/) ──"
DOCUMENTED_PAGES=(
  "src/pages/index.astro"
  "src/pages/blog/index.astro"
  "src/pages/blog/[...slug].astro"
  "src/pages/contact.astro"
  "src/pages/about.md"
  "src/pages/work.astro"
  "src/pages/security.astro"
  "src/pages/roadmap.md"
  "src/pages/login.astro"
  "src/pages/admin/index.astro"
  "src/pages/rss.xml.js"
)
for f in "${DOCUMENTED_PAGES[@]}"; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    pass "$f"
  else
    fail "$f — documented but missing"
  fi
done

# Detect undocumented pages (flat + one level deep)
while IFS= read -r actual; do
  rel="${actual#$REPO_ROOT/}"
  found=0
  for doc in "${DOCUMENTED_PAGES[@]}"; do
    [[ "$rel" == "$doc" ]] && found=1 && break
  done
  [[ $found -eq 0 ]] && warn "  ? $rel — exists but not documented in CLAUDE.md"
done < <(find "$REPO_ROOT/src/pages" -maxdepth 2 \
  \( -name "*.astro" -o -name "*.md" -o -name "*.js" -o -name "*.ts" \) \
  | grep -v "__" | sort)

echo ""

# ── 2. Functions ──────────────────────────────────────────────────────────────
info "── Cloudflare Functions (functions/api/) ──"
DOCUMENTED_FUNCTIONS=(
  "functions/api/contact.ts"
  "functions/api/share-event.ts"
  "functions/api/login.ts"
  "functions/api/logout.ts"
)
for f in "${DOCUMENTED_FUNCTIONS[@]}"; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    pass "$f"
  else
    fail "$f — documented but missing"
  fi
done

while IFS= read -r actual; do
  rel="${actual#$REPO_ROOT/}"
  found=0
  for doc in "${DOCUMENTED_FUNCTIONS[@]}"; do
    [[ "$rel" == "$doc" ]] && found=1 && break
  done
  [[ $found -eq 0 ]] && warn "  ? $rel — exists but not documented in CLAUDE.md"
done < <(find "$REPO_ROOT/functions/api" -maxdepth 1 -name "*.ts" 2>/dev/null | sort)

echo ""

# ── 3. Key components ─────────────────────────────────────────────────────────
info "── Key components (src/components/) ──"
DOCUMENTED_COMPONENTS=(
  "src/components/BreathingHero.astro"
  "src/components/SignalHero.astro"
  "src/components/AuthorCoda.astro"
  "src/components/BlogPost.astro"
  "src/components/HomepageLayout.astro"
  "src/components/PostQuoteShare.tsx"
  "src/components/ContactForm.tsx"
  "src/components/ThemeToggle.tsx"
  "src/components/Verse.astro"
  "src/components/PullQuote.astro"
  "src/components/Triptych.astro"
  "src/components/Colophon.astro"
  "src/components/blog/PullQuote.astro"
  "src/components/blog/Triptych.astro"
  "src/components/blog/MentorQuote.astro"
  "src/components/blog/VerseBlock.astro"
)
# BlogPost and HomepageLayout live in layouts/, not components/ — skip existence check for those
LAYOUT_EXCEPTIONS=("src/components/BlogPost.astro" "src/components/HomepageLayout.astro")
for f in "${DOCUMENTED_COMPONENTS[@]}"; do
  skip=0
  for ex in "${LAYOUT_EXCEPTIONS[@]}"; do
    [[ "$f" == "$ex" ]] && skip=1 && break
  done
  [[ $skip -eq 1 ]] && continue
  if [[ -f "$REPO_ROOT/$f" ]]; then
    pass "$f"
  else
    fail "$f — documented but missing"
  fi
done

echo ""

# ── 4. Styles ─────────────────────────────────────────────────────────────────
info "── Styles (src/styles/) ──"
DOCUMENTED_STYLES=(
  "src/styles/global.css"
  "src/styles/homepage.css"
  "src/styles/editorial.css"
)
for f in "${DOCUMENTED_STYLES[@]}"; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    pass "$f"
  else
    fail "$f — documented but missing"
  fi
done

while IFS= read -r actual; do
  rel="${actual#$REPO_ROOT/}"
  found=0
  for doc in "${DOCUMENTED_STYLES[@]}"; do
    [[ "$rel" == "$doc" ]] && found=1 && break
  done
  [[ $found -eq 0 ]] && warn "  ? $rel — exists but not documented in CLAUDE.md"
done < <(find "$REPO_ROOT/src/styles" -maxdepth 1 -name "*.css" 2>/dev/null | sort)

echo ""

# ── 5. Consts ─────────────────────────────────────────────────────────────────
info "── Site constants (src/consts.ts) ──"
DOCUMENTED_CONSTS=(
  "SITE_TITLE"
  "SITE_DESCRIPTION"
  "SITE_URL"
  "SITE_AUTHOR"
  "SITE_EMAIL"
  "SITE_GITHUB_URL"
  "SITE_REPO_URL"
  "SITE_RSS_URL"
  "SITE_DEFAULT_OG_IMAGE"
)
CONSTS_FILE="$REPO_ROOT/src/consts.ts"
for c in "${DOCUMENTED_CONSTS[@]}"; do
  if grep -q "export const $c" "$CONSTS_FILE" 2>/dev/null; then
    pass "$c"
  else
    fail "$c — documented in CLAUDE.md but not exported from consts.ts"
  fi
done

# Detect undocumented exports
while IFS= read -r line; do
  const_name=$(echo "$line" | grep -oE 'export const [A-Z_]+' | awk '{print $3}')
  [[ -z "$const_name" ]] && continue
  found=0
  for doc in "${DOCUMENTED_CONSTS[@]}"; do
    [[ "$const_name" == "$doc" ]] && found=1 && break
  done
  [[ $found -eq 0 ]] && warn "  ? $const_name — exported from consts.ts but not documented in CLAUDE.md"
done < <(grep 'export const' "$CONSTS_FILE" 2>/dev/null)

echo ""

# ── 6. Ops scripts ────────────────────────────────────────────────────────────
info "── Ops scripts (scripts/ops/) ──"
DOCUMENTED_SCRIPTS=(
  "scripts/ops/update-context-cache.sh"
  "scripts/ops/prune-context-cache.sh"
  "scripts/ops/session-handoff.sh"
  "scripts/ops/setup-hooks.sh"
  "scripts/ops/verify-docs-integrity.sh"
  "scripts/ops/verify-lockfile.sh"
  "scripts/ops/check-docs-drift.sh"
)
for f in "${DOCUMENTED_SCRIPTS[@]}"; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    pass "$f"
  else
    fail "$f — documented but missing"
  fi
done

while IFS= read -r actual; do
  rel="${actual#$REPO_ROOT/}"
  found=0
  for doc in "${DOCUMENTED_SCRIPTS[@]}"; do
    [[ "$rel" == "$doc" ]] && found=1 && break
  done
  [[ $found -eq 0 ]] && warn "  ? $rel — exists but not documented in CLAUDE.md"
done < <(find "$REPO_ROOT/scripts/ops" -maxdepth 1 -name "*.sh" 2>/dev/null | sort)

echo ""

# ── 7. Content schema ─────────────────────────────────────────────────────────
info "── Content schema (src/content.config.ts) ──"
CONFIG_FILE="$REPO_ROOT/src/content.config.ts"
DOCUMENTED_SCHEMA_FIELDS=(
  "title"
  "description"
  "pubDate"
  "updatedDate"
  "heroImage"
  "subtitle"
  "category"
  "tags"
  "readingTime"
  "heroImageOG"
  "heroImageAlt"
  "featured"
  "slug"
  "draft"
)
for field in "${DOCUMENTED_SCHEMA_FIELDS[@]}"; do
  if grep -q "$field:" "$CONFIG_FILE" 2>/dev/null; then
    pass "schema field: $field"
  else
    fail "schema field: $field — documented but not found in content.config.ts"
  fi
done

echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
if [[ $ERRORS -eq 0 ]]; then
  green "=== All documented items verified — no drift detected ==="
else
  red "=== $ERRORS drift error(s) found — update CLAUDE.md or restore missing files ==="
  exit 1
fi
