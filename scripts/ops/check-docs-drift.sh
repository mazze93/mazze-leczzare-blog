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
  "src/pages/about.astro"
  "src/pages/work.astro"
  "src/pages/security.astro"
  "src/pages/roadmap.md"
  "src/pages/login.astro"
  "src/pages/admin/index.astro"
  "src/pages/writing/index.astro"
  "src/pages/studio.astro"
  "src/pages/constellation.astro"
  "src/pages/cipher-gothic.astro"
  "src/pages/support.astro"
  "src/pages/rss.xml.js"
  "src/pages/nodes-manifest.json.ts"
  "src/pages/signal/index.astro"
  "src/pages/tesserae/index.astro"
  "src/pages/blog/artifacts.astro"
  "src/pages/blog/dispatches.astro"
  "src/pages/blog/field-notes.astro"
  "public/essays/the-breakthrough-artifact.html"
  "public/intentional-fragility/index.html"
  "public/writing/what-i-can-stand-by/index.html"
  "public/artifacts/tessera-claude-anchor.html"
  "src/pages/project/[slug].astro"
  "src/pages/signal/[...slug].astro"
  "src/pages/tesserae/[...slug].astro"
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
  \( -name "*.astro" -o -name "*.md" -o -name "*.js" -o -name "*.ts" -o -name "*.html" \) \
  | grep -v "__" | sort)
# *.html added 2026-08-02: Astro publishes .html files in src/pages/ as routes,
# but this scan omitted the extension, so src/pages/blog/the_breakthrough_artifact.html
# sat there publishing an undocumented duplicate of /essays/the-breakthrough-artifact.html
# and every drift run reported clean.

echo ""

# ── 2. Functions ──────────────────────────────────────────────────────────────
info "── Cloudflare Functions (functions/api/) ──"
DOCUMENTED_FUNCTIONS=(
  "functions/api/contact.ts"
  "functions/api/share-event.ts"
  "functions/api/login.ts"
  "functions/api/logout.ts"
  "functions/api/ingest.ts"
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

# ── 3. Layouts ────────────────────────────────────────────────────────────────
info "── Layouts (src/layouts/) ──"
DOCUMENTED_LAYOUTS=(
  "src/layouts/BlogPost.astro"
  "src/layouts/HomepageLayout.astro"
)
for f in "${DOCUMENTED_LAYOUTS[@]}"; do
  if [[ -f "$REPO_ROOT/$f" ]]; then
    pass "$f"
  else
    fail "$f — documented but missing"
  fi
done

echo ""

# ── 4. Key components ─────────────────────────────────────────────────────────
info "── Key components (src/components/) ──"
DOCUMENTED_COMPONENTS=(
  "src/components/BreathingHero.astro"
  "src/components/AuthorCoda.astro"
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
  "src/components/blog/ArtifactEmbed.astro"
  "src/components/Compass.astro"
  "src/components/CompassLink.astro"
  "src/components/SectionBreak.astro"
  "src/components/TransmissionFeed.astro"
  "src/components/constellation/AirlockStrip.astro"
  "src/components/constellation/ConstellationNodes.tsx"
)
for f in "${DOCUMENTED_COMPONENTS[@]}"; do
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
  "src/styles/compass.css"
  "src/styles/constellation-pages.css"
  "src/styles/haven-ink.tokens.css"
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
  "SITE_TWITTER"
  "SITE_REPO_URL"
  "SITE_DEFAULT_OG_IMAGE"
  "COMPASS_LABEL"
  "TURNSTILE_SITE_KEY"
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
  "author"
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

# ── 8. Static asset references resolve ────────────────────────────────────────
# Added 2026-08-02. Every font a standalone page under public/ asks for must
# actually exist at the URL it asks for. This is a *resolver*, not a grep: URLs
# are resolved against the referring page's own URL, because the pages disagree
# about convention — /artifacts/tessera-claude-anchor.html uses root-absolute
# `/fonts/…` while /intentional-fragility/ uses relative `./fonts/…` into its own
# sibling directory. Grepping for the string "/fonts/" matches both and tells
# you nothing; it substring-matches "./fonts/" and silently resolves to the
# wrong file. That mistake was made twice in one session, in both directions
# (phantom orphans, then phantom 404s), which is why this check exists.
info "── Static asset references (public/**.html → fonts) ──"
REF_TOTAL=0
REF_BAD=0
while IFS= read -r page; do
  pagerel="${page#$REPO_ROOT/public}"
  pagedir="$(dirname "$pagerel")"
  while IFS= read -r url; do
    [[ -z "$url" ]] && continue
    REF_TOTAL=$((REF_TOTAL + 1))
    if [[ "$url" == /* ]]; then
      target="$REPO_ROOT/public$url"
    else
      target="$REPO_ROOT/public$pagedir/${url#./}"
    fi
    if [[ ! -f "$target" ]]; then
      fail "$pagerel → $url (resolves to a file that does not exist)"
      REF_BAD=$((REF_BAD + 1))
    fi
  done < <(grep -oE 'url\(["'"'"']?[^)"'"'"']+\.woff2?["'"'"']?\)' "$page" 2>/dev/null \
             | sed -E 's/^url\(["'"'"']?//; s/["'"'"']?\)$//')
done < <(find "$REPO_ROOT/public" -name "*.html" | sort)
[[ $REF_BAD -eq 0 ]] && pass "$REF_TOTAL font reference(s) resolve"

echo ""

# ── 9. No third-party font requests outside /artifacts/ ───────────────────────
# Added 2026-08-02. functions/_middleware.ts grants the relaxed ARTIFACT_CSP
# (which permits fonts.googleapis.com / fonts.gstatic.com) only to /artifacts/*.
# Everywhere else gets `style-src 'self' 'unsafe-inline'; font-src 'self'`, so a
# CDN font link on any other path is blocked by the browser and the page renders
# in fallback typefaces — silently, with no build error. That is exactly how
# /essays/the-breakthrough-artifact.html shipped broken.
info "── Third-party font requests (CSP compliance) ──"
CDN_BAD=0
while IFS= read -r page; do
  pagerel="${page#$REPO_ROOT/}"
  case "$pagerel" in
    public/artifacts/*) continue ;;   # ARTIFACT_CSP permits CDN fonts here
  esac
  # Only <link>/@import that actually fetch — prose and comments mentioning the
  # hostname are fine (a blog post about self-hosting fonts legitimately does).
  if grep -qE '<link[^>]+fonts\.(googleapis|gstatic)\.com|@import[^;]*fonts\.googleapis\.com' "$page" 2>/dev/null; then
    fail "$pagerel — fetches CDN fonts, but CSP outside /artifacts/ is font-src 'self' (self-host instead)"
    CDN_BAD=$((CDN_BAD + 1))
  fi
done < <(find "$REPO_ROOT/public" "$REPO_ROOT/src/pages" -name "*.html" 2>/dev/null | sort)
[[ $CDN_BAD -eq 0 ]] && pass "no CSP-blocked font requests outside /artifacts/"

echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
if [[ $ERRORS -eq 0 ]]; then
  green "=== All documented items verified — no drift detected ==="
else
  red "=== $ERRORS drift error(s) found — update CLAUDE.md or restore missing files ==="
  exit 1
fi
