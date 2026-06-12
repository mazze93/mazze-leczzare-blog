# /deploy

Deploy mazze-leczzare-blog to Cloudflare Pages.

## What this skill does

Runs the full ship pipeline in order:
1. **Pre-flight** — verifies `CLOUDFLARE_API_TOKEN` is set, active, and has `Cloudflare Pages: Edit` permission. Reports exactly which scopes are missing if it fails.
2. **Build** — runs `npm ci` then `npm run check` (astro build + tsc). Fails fast on type errors or build failures.
3. **Deploy** — runs `wrangler pages deploy dist --project-name mazze-leczzare-blog`. Retries up to 3 times with a 10s delay on failure; diagnoses before escalating.
4. **Health check** — polls `https://mazzeleczzare.com` for HTTP 200 up to 60s. Reports pass/fail.

## How to invoke

When the user types `/deploy`, run:

```bash
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" bash scripts/deploy.sh
```

If `CLOUDFLARE_API_TOKEN` is not in the environment, check `.dev.vars` for it first:

```bash
source .dev.vars 2>/dev/null || true
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN}" bash scripts/deploy.sh
```

## Token requirements

The `CLOUDFLARE_API_TOKEN` must have these permissions:

| Permission | Why |
|---|---|
| Cloudflare Pages: Edit | Deploy and manage Pages projects |
| Account: Workers KV Storage: Edit | KV bindings (JWT revocation list, share analytics) |
| Zone: DNS: Edit | Custom domain management (mazzeleczzare.com) |

Get or rotate tokens at: Cloudflare dashboard → My Profile → API Tokens.

## Pre-deploy checklist (run before `/deploy`)

- [ ] Is this a content change or a code change? Code changes must pass `npm run check` first.
- [ ] Are any secrets missing from the Cloudflare dashboard (ADMIN_PASSWORD, JWT_SECRET, CONTACT_TO_EMAIL)?
- [ ] Is the token scoped to the correct account?

## On failure

- **Token invalid/missing scopes** → output tells you exactly which permission is missing with the dashboard link.
- **Build fails** → fix TypeScript/Astro errors before retrying. Never skip `npm run check`.
- **Deploy fails 3× in a row** → report the last wrangler error verbatim to the user and stop.
- **Health check timeout** → warn but don't fail the pipeline; Cloudflare Pages propagation can take up to 2 min.
