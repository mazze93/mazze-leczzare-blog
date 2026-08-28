# CHECKPOINT — agent/bot standards compliance sweep + infra/revenue cleanup

**Last updated:** 2026-08-24 (reopened in the primary checkout after the
worktree session closed — see "Second pass" below)
**Branch:** `worktree-luminous-sprouting-acorn` (this session's isolated
worktree), rebased onto and pushed straight to `origin/main` after each
phase — no branch protection encountered.
**Predecessor journal** (open, not finished — set aside, not lost):
`docs/journal/archive/2026-08-03-design-systems-pass/` — next task there was
"astrolabe chrome over derived geometry". **Still not started this pass —
see "Explicitly deferred" below.**

## To resume — read in this order

1. This file.
2. `PLAN.md` — scope and phase list.
3. `DECISIONS.md` — why each judgment call was made, in commit order.

## What shipped this session

| Commit | What |
| --- | --- |
| `8effa58` | `/.well-known/agent-card.json` — A2A Agent Card |
| `86b510e` | `/.well-known/http-message-signatures-directory` (Web Bot Auth JWKS) + signs the contact webhook |
| `92c9ae5` | `/auth.md` — Auth.md agent-authentication disclosure |
| `4e02334` | Journal: archived the interrupted design-systems pass, scaffolded this one |
| `fc3caaf` | `wrangler.toml` repaired (broken `[[ratelimits]]` parse error, wrong project `name`, both KV `preview_id` TODOs resolved); "Book" link added to main nav + homepage airlock |
| *(next)* | Stub-comment rename in `about.astro`; this checkpoint update |

All pushed to `origin/main`. Every deploy confirmed live via
`wrangler pages deployment list` and/or direct curl. `npm run check`,
`npm test` (194/194), and `npm run docs:check` all green as of the last
commit.

## Standing state — confirmed working, no action needed

- **CI runs vitest.** `.github/workflows/ci.yml`'s `Test` step is
  `npm test` (the 194-test vitest suite), placed before build. Confirmed
  green on the last several pushes via `gh run list`.
- **Auto-deploy on push to main is real and working**, not assumed —
  `wrangler pages deployment list --project-name mazzeleczzare` shows a
  Production deployment for every one of this session's 5 pushes,
  each within ~90s–2min of the push.
- **`wrangler.toml` now parses** (it silently didn't before — every
  `wrangler` invocation was failing config validation, which is *why*
  `wrangler pages secret put` needed `--project-name` explicitly earlier
  this session). `name` now matches the real Cloudflare Pages project.
  Both KV `preview_id` TODOs resolved with real namespaces.
- `WEB_BOT_AUTH_PRIVATE_KEY` is set as a Cloudflare Pages secret (confirmed
  via `wrangler pages secret list`). Contact webhook deliveries should now
  carry `Signature-Agent`/`Signature-Input`/`Signature` headers — **not yet
  verified with an actual live contact-form submission**, only with a local
  Node WebCrypto sign/verify round-trip using the real key material.
- **The book (`/gay-wandering/`) now has a path from the homepage
  (AirlockStrip) and the main site nav (every full-header page).** It did
  not before this session.

## Explicitly deferred — not started, not silently dropped

- **Astrolabe chrome design pass.** Genuinely large (SVG chrome work,
  external design references at `~/Desktop/💻 DEV/mazze-fully-cooked-landing.html`
  — moved out of `~/Desktop/` since the brief was written, path corrected
  2026-08-24 — and `~/Public/Design/lightmode-proto.html`, real visual-design
  judgment).
  Full brief preserved at
  `docs/journal/archive/2026-08-03-design-systems-pass/CHECKPOINT.md` under
  "Next task". Did not attempt given critical budget — a rushed version
  would cost real tokens and still need redoing.
- ~~**Uncommitted content edits in the primary checkout**~~ **RESOLVED
  2026-08-24 in `106bd51`** — see "Second pass" above. Original note:
  (`/Users/daedalus/Projects/blog/mazze-leczzare-blog`, *not* this
  worktree) — 10 modified blog posts + an untracked `README.txt`, present
  at this session's start. This worktree-isolated session cannot read or
  touch that other working directory (tooling refuses `git -C` against it
  by design). **Mazze: these need review from a session actually in that
  checkout, or from you directly** — they read as in-progress prose edits,
  which per your CREATIVE posture shouldn't be auto-committed by an agent
  regardless.
- **Two pre-existing `.well-known` OAuth files**
  (`oauth-authorization-server`, `oauth-protected-resource`) describe
  `/admin`'s real cookie-based login, not an agent-consumable Bearer flow.
  Attempted to delete them (the honest fix, since `/auth.md` already
  supersedes them) — **blocked by the permission classifier** as a risky
  deletion of public-facing files. Left as-is; `/auth.md` already discloses
  the discrepancy. If you want them gone, that now needs your explicit
  go-ahead on the specific `git rm`.

## The one blocker only you can clear: the book's real checkout

`/gay-wandering/`'s buy button is driven by
`PUBLIC_GAY_WANDERING_CHECKOUT_URL` (a build-time env var, read in
`src/pages/gay-wandering/index.astro`). It is **not set** in Cloudflare
Pages right now (confirmed — the live button currently falls back to "Join
the first-edition list" → `/contact/?subject=Gay%20Wandering`, not a real
Lemon Squeezy checkout). Nothing this session did can fix that — it needs
your real Lemon Squeezy product checkout URL, set as a **Pages build
environment variable** (Cloudflare dashboard → mazzeleczzare project →
Settings → Environment variables → Production; this is a *build-time*
Astro var, distinct from the Function runtime secrets `wrangler pages
secret put` manages, so it won't show in that list). Until that's set, the
new nav links route interested readers to an interest-list form, not a
sale. **This is very likely the highest-leverage single action left for
actual revenue** — higher than any of the code work above.

## Second pass — 2026-08-24, primary checkout

Picked up in `/Users/daedalus/Projects/blog/mazze-leczzare-blog`, which was 37
commits behind `origin/main` when this leg started. Fast-forwarded, then:

| Commit | What |
| --- | --- |
| `106bd51` | The deferred frontmatter backfill, committed (see below) |
| `311a342` | Light mode repaired end to end — five defects |
| `d40bb06` | This journal |

**The deferred content edits are resolved.** The item below said they needed
review from a session actually in that checkout; this was that session. They
were frontmatter-only — `category`, `tags`, and five `heroImage`/`heroImageAlt`
pairs across ten posts, no prose touched — not the in-progress prose the
worktree session reasonably guessed from the outside. Committed with the
staging note folded into DECISIONS.md.

**Light mode is now verified, not assumed.** A headless sweep over 11 routes ×
{stored dark, stored light, system dark, system light} is the standing check:
zero unintended dark surfaces in light mode, correct `theme-color` in both
themes, live response to an OS theme change, code blocks styled in both. The
audit script is disposable; the four states it covers are the thing worth
re-running after any palette work.

**Still deliberately dark, both reported to mazze rather than changed:**
`/gay-wandering/` (its own `--gw-*` palette) and the `.cg-page` specimen
ground. Neither is a bug; both are one-decision-away from theme-aware using
the token pattern now in `BreathingHero.astro`.

**Open and now measured: blog/MDX typography reads flat.** Body is DM Mono
400, `strong` is DM Mono 500 (that family ships nothing heavier), headings are
Cormorant Garamond 400 — the whole page is one weight with a single 500
accent. Authored in `7bc06121`, not a regression, so it was left for mazze's
call. Cormorant Garamond 600 is imported and unused if a heavier heading is
wanted.

**Astrolabe chrome: still not started.** Note the brief's input path has
rotted — `~/Desktop/mazze-fully-cooked-landing.html` moved to
`~/Desktop/💻 DEV/mazze-fully-cooked-landing.html`. The archived brief and the
deferred item below both still cite the old path.

## Non-actions (explicit, from earlier phases — still true)

- Did not sign `functions/api/ingest.ts`'s outbound GitHub Contents API
  calls with Web Bot Auth — GitHub doesn't verify it; those calls are
  token-authenticated infra, not agent outreach (see DECISIONS.md).
- Did not add an `agent_auth`/`register_uri` block to `/auth.md` — no real
  registration endpoint exists to point to (see DECISIONS.md).
