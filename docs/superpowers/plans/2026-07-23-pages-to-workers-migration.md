# Cloudflare Pages → Workers Migration — Scope & Session Handoff

> **Status:** scoped, not started. Authored 2026-07-23.
> **Owner decision:** migrate the blog (primary publication surface) from
> Cloudflare Pages to Cloudflare Workers — deliberately, on a branch, with a
> preview deploy tested before cutover. Do **not** rush it to silence CI.

This document is the concentrated scope for the next focused session. It carries
the migration plan **plus** the anti-patterns, gotchas, out-of-scope items, and
tech debt observed in the 2026-07-22/23 dependency-and-a11y sweep, so nothing has
to be re-derived.

---

## 1. Why migrate

- Cloudflare's platform investment is on **Workers**. Workers Static Assets was
  built to absorb the Pages use case; new capabilities (versioned + gradual
  deploys, richer observability, Cron Triggers, Durable Objects) land on Workers
  first. Pages is stable but effectively feature-frozen.
- The blog is the **primary publication surface** — being on the actively
  developed platform is the right long-term bet.
- Migrating unlocks **Workers Builds** as real CI, replacing the currently broken
  half-connection (see §5).

## 2. Current architecture (facts to migrate)

| Layer | Today | Migration implication |
|---|---|---|
| Framework | Astro `output: "static"` (SSG), **no** `@astrojs/cloudflare` adapter | Add the adapter in Workers mode, or serve `dist/` via Workers Static Assets |
| Dynamic edge | **6 Pages Functions**, file-routed under `functions/` | Rewrite as a single Worker with an explicit router — this is the bulk of the work |
| `functions/_middleware.ts` | Runs on every request: JWT auth guard for `/admin/*` (HMAC-SHA256 vs `JWT_SECRET`, optional `JWT_REVOCATION_LIST` KV) + Markdown-for-Agents (`Accept: text/markdown` → HTMLRewriter strip) | Becomes Worker middleware / router `.use()` — fails **closed** today; preserve that |
| `functions/api/contact.ts` | Same-origin, honeypot + timing + field validation, forwards to webhook | Port as route |
| `functions/api/login.ts` | Signs 24h HS256 JWT, sets `__Host-auth_token` cookie, constant-time password compare | Port as route |
| `functions/api/logout.ts` | Verifies JWT, writes `revoked:{jti}` to KV, clears cookie | Port as route |
| `functions/api/ingest.ts` | Auth'd machine ingest; **commits `.md` to `main` via GitHub Contents API** (a Function has no FS). `.md` only, never `.mdx`; frontmatter schema is a `.strict()` duplicate of `content.config.ts` | Port as route; keep the security posture verbatim |
| `functions/api/share-event.ts` | Same-origin quote telemetry → `SHARE_ANALYTICS` KV, 204 | Port as route |
| Bindings | KV `JWT_REVOCATION_LIST`, `SHARE_ANALYTICS`; secrets `ADMIN_PASSWORD`, `JWT_SECRET`, `CONTACT_WEBHOOK_URL`, `INGEST_SECRET`, `GITHUB_INGEST_TOKEN` | Carry over unchanged (same `wrangler.toml` shape) |
| Headers/redirects | `public/_headers`, `public/_redirects` (Pages conventions) | **Pages-specific** — must be re-expressed (Workers Static Assets `_headers`/`_redirects` support differs; verify or move into the Worker) |
| Deploy | Cloudflare **Pages** Git integration (the passing "Cloudflare Pages" check) | Replace with Workers deploy + Workers Builds |

## 3. Migration plan (phased)

Each phase ends on a **preview deploy**, verified before proceeding. Nothing
touches production DNS/routes until Phase 5.

1. **Adapter + static serving.** Add `@astrojs/cloudflare`; decide Workers Static
   Assets vs adapter SSR. Keep `output: "static"` if the site stays SSG. Build a
   `dist/` served by a Worker. Preview: every static route renders.
2. **Router skeleton + middleware.** Stand up the Worker entry + router (Hono is
   the pragmatic choice) and port `_middleware.ts` — JWT guard (fail closed on
   `JWT_SECRET` < 32 chars) + Markdown-for-Agents. Preview: `/admin/*` redirects
   to `/login` unauth'd; `Accept: text/markdown` returns stripped markdown.
3. **Port the 5 API routes** one at a time with parity tests (see §7). Wire KV +
   secrets in `wrangler.toml`. Preview: each endpoint behaves byte-for-byte like
   Pages (esp. `ingest` — it writes to the repo; test against a throwaway path).
4. **Headers / redirects / discovery.** Re-express `_headers`, `_redirects`, and
   the `.well-known/*` agent-discovery Link headers under the Workers model.
   Preview: security headers + agent discovery intact.
5. **Cutover.** Point the domain at the Worker, enable Workers Builds, retire the
   Pages project + the stray Workers service. Flip the `CLAUDE.md` contract line
   ("Deployment platform is Cloudflare Pages — not Workers") and the ci/deploy
   docs in the **same commit**. Watch first prod deploy.

## 4. Anti-patterns observed (do not repeat)

- **Diagnosing a CI failure from a keyword grep instead of the failing step.**
  The blog "Build & type-check" red was assumed to be the astro bump / tesserae
  noise; the real failing step was a separate `npm audit --audit-level=high`.
  Always: `gh run view <id> --json jobs --jq '.jobs[]|{name,steps:[.steps[]|select(.conclusion=="failure")|.name]}'`.
- **Verifying against warm local state.** `npm run check` passed locally (warm
  `.astro` cache; audit step not part of `check`) while CI failed. Reproduce CI
  conditions before claiming verified.
- **Scoping a fix from a partial failing-node list.** First a11y pass showed ~2
  nodes; the actual fault was a token (`--bone-faint`) failing across ~40. Pull
  the full list first.
- **Trusting Dependabot alert state as fix state.** Rescan lag keeps alerts
  "open" after a merged fix. Verify the merged **lockfile**.
- **Using `-d` / `--is-ancestor` to confirm a squash-merge landed.** Both report
  "not merged" for squash-merged branches. Verify by content.

## 5. Out of scope here / needs a dashboard (user-only)

- **Stray Workers service `mazze-leczzare-blog`** (id `e20b265e…`, created
  2026-05-04) is Git-connected and false-fails "Workers Builds" every PR. Until
  the migration, disconnect it: Cloudflare dashboard → Workers & Pages → that
  **Workers** service (not the Pages project) → Settings → Builds → disconnect
  repo (or delete the service). Can't be done from the repo or the Workers API.
- **`/about/` accessibility fixes** were handed off to fold into the in-progress
  visual pass (contrast on `.about-footer-note` via dropping `opacity:.85` +
  `--text-dim`; default `text-decoration:underline` on in-text links; drop/align
  the `aria-label="Primary contact CTA"` on the line-97 CTA). Lighthouse CI stays
  red until this lands (artifact page already fixed — PR #152).
- **GitHub PAT rotation** (from the container work) — user-only, still open.

## 6. Tech debt inventory (blog)

- **Empty `tesserae` content collection** (`src/content/tesserae/` = only
  `.gitkeep`). Prints non-fatal `collection "tesserae" does not exist or is empty`
  on every build and leaves `/tesserae`, `/studio`, `/constellation` thin. Either
  seed content or make the collection tolerate empty.
- **`.lighthouseci/` has tracked result artifacts** (`lhr-*.json/html`,
  `assertion-results.json`, `links.json`). Local `lhci autorun` overwrites/creates
  them — pollutes the working tree; restore with `git checkout -- .lighthouseci/
  && git clean -fd .lighthouseci/` after runs, or gitignore the generated ones.
- **SEO warnings** (`warn`-level, non-blocking today): `/blog/` 0.87, artifacts
  `tessera-claude-anchor` 0.83, `tree-of-knowledge` 0.75 (threshold 0.85). Not
  actioned; will surface if the assertion is ever raised to `error`.
- **`npm audit --audit-level=high` is a hard CI gate** with no scheduled bump
  cadence — transitive advisories (fast-xml-parser, js-yaml, sharp, svgo) began
  failing PRs the moment they published. Consider a periodic `npm audit fix` job.
- **Frontmatter schema duplication**: `functions/api/ingest.ts` keeps a `.strict()`
  copy of `content.config.ts` (the `astro:content` virtual module can't be
  imported in a Function). Migration to Workers does **not** remove this coupling
  — the schema still must be maintained in two places; note it during the port.
- **Node local (v26) vs `.nvmrc` (24)** drift — harmless here, but pin awareness.

## 7. Verification protocol for the migration

- **Parity harness for the 5 API routes**: capture request/response (status,
  headers, cookies, body) from the current Pages deployment and assert the Worker
  matches, endpoint by endpoint. `ingest` must be tested against a throwaway repo
  path — it commits to `main`.
- **Auth invariants**: `/admin/*` redirects to `/login` when unauth'd; login sets
  `__Host-auth_token` (HttpOnly, Secure, SameSite=Strict); logout revokes the
  `jti` in KV and clears the cookie even if KV is down; `JWT_SECRET` < 32 chars
  fails closed.
- **Markdown-for-Agents**: `Accept: text/markdown` returns `text/markdown` with
  `Vary: Accept` and strips nav/header/footer/script/style.
- **Static + Lighthouse**: all routes 200; accessibility ≥ 0.95 on every
  discovered URL (the CI gate is `error`, site-wide, **including static
  artifacts** — see PR #152 for the token-lift pattern).
- **Discovery**: `.well-known/*` + Link headers intact; `/rss.xml`, `/sitemap*`,
  `/nodes-manifest.json` present.
- Reproduce CI locally in clean conditions (`rm -rf node_modules .astro dist`)
  before declaring done — see §4.
