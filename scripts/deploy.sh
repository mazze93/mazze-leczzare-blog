#!/usr/bin/env bash
# deploy.sh — build, verify, and ship mazze-leczzare-blog to Cloudflare Pages
set -euo pipefail

SITE_URL="https://mazzeleczzare.com"
PROJECT_NAME="mazze-leczzare-blog"
MAX_RETRIES=3
RETRY_DELAY=10

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $*"; }
info() { echo -e "${CYAN}→${NC} $*"; }
warn() { echo -e "${YELLOW}!${NC} $*"; }
fail() { echo -e "${RED}✗${NC} $*" >&2; exit 1; }

# ── 1. Pre-flight: Cloudflare token ───────────────────────────────────────────
preflight_token() {
  info "Verifying Cloudflare API token scopes..."

  if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    fail "CLOUDFLARE_API_TOKEN is not set. Export it or add it to .dev.vars."
  fi

  local verify_resp
  verify_resp=$(curl -sf -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" 2>&1) || fail "Token verification API call failed."

  local status
  status=$(echo "$verify_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('status','unknown'))" 2>/dev/null)

  if [[ "$status" != "active" ]]; then
    fail "Token is not active (status: ${status}). Rotate it in the Cloudflare dashboard."
  fi

  ok "Token is active."

  # Check for Pages permission via a lightweight Pages project list
  local pages_resp
  pages_resp=$(curl -sf -X GET "https://api.cloudflare.com/client/v4/accounts" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" 2>&1) || fail "Could not list accounts — token may be missing Account:Read permission."

  local account_id
  account_id=$(echo "$pages_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'])" 2>/dev/null) || fail "Could not extract account ID — check token scopes."

  local pages_check
  pages_check=$(curl -sf -X GET "https://api.cloudflare.com/client/v4/accounts/${account_id}/pages/projects" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" 2>&1) || {
      warn "Could not list Pages projects — token may be missing 'Cloudflare Pages: Edit' permission."
      warn "Required scopes: Cloudflare Pages: Edit, Account: Workers KV Storage: Edit, Zone: DNS: Edit"
      fail "Token missing required Pages permission. Add it at dash.cloudflare.com → My Profile → API Tokens."
    }

  ok "Token has Pages access."
  echo "$account_id"
}

# ── 2. Build ──────────────────────────────────────────────────────────────────
build() {
  info "Installing dependencies..."
  npm ci --prefer-offline 2>&1 | tail -3

  info "Running check (astro build + tsc)..."
  npm run check || fail "Build/type check failed — fix errors before deploying."
  ok "Build passed."
}

# ── 3. Deploy with retry ──────────────────────────────────────────────────────
deploy_with_retry() {
  local attempt=1
  while [[ $attempt -le $MAX_RETRIES ]]; do
    info "Deploy attempt ${attempt}/${MAX_RETRIES}..."
    if npx wrangler pages deploy dist --project-name "$PROJECT_NAME" 2>&1; then
      ok "Deployed successfully."
      return 0
    fi
    warn "Deploy attempt ${attempt} failed."
    if [[ $attempt -lt $MAX_RETRIES ]]; then
      info "Waiting ${RETRY_DELAY}s before retry..."
      sleep "$RETRY_DELAY"
    fi
    ((attempt++))
  done
  fail "Deployment failed after ${MAX_RETRIES} attempts."
}

# ── 4. Post-deploy health check ───────────────────────────────────────────────
health_check() {
  info "Running health check against ${SITE_URL}..."
  local max_wait=60
  local elapsed=0
  local interval=5

  while [[ $elapsed -lt $max_wait ]]; do
    local http_code
    http_code=$(curl -so /dev/null -w "%{http_code}" --max-time 10 "$SITE_URL" 2>/dev/null || echo "000")
    if [[ "$http_code" == "200" ]]; then
      ok "Health check passed — ${SITE_URL} returned HTTP 200."
      return 0
    fi
    warn "Got HTTP ${http_code} — waiting ${interval}s (${elapsed}s elapsed)..."
    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  fail "Health check timed out after ${max_wait}s. Site may still be propagating."
}

# ── Main ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo -e "${CYAN}  mazze-leczzare-blog deploy pipeline${NC}"
echo -e "${CYAN}══════════════════════════════════════════${NC}"
echo ""

ACCOUNT_ID=$(preflight_token)
info "Account ID: ${ACCOUNT_ID}"
echo ""

build
echo ""

deploy_with_retry
echo ""

health_check
echo ""

ok "Pipeline complete. ${SITE_URL} is live."
