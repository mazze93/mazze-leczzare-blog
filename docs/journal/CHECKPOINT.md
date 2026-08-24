# CHECKPOINT — agent/bot standards compliance sweep

**Last updated:** 2026-08-24
**Branch:** `worktree-luminous-sprouting-acorn` (this session's isolated
worktree), rebased onto and pushed straight to `origin/main` after each
phase — no branch protection encountered.
**Predecessor journal** (open, not finished — set aside, not lost):
`docs/journal/archive/2026-08-03-design-systems-pass/` — next task there was
"astrolabe chrome over derived geometry".

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

All three pushed to `origin/main` and confirmed live (HTTP 200, correct
content-type, byte-matching JSON/Markdown) via curl against
`mazzeleczzare.com` after each deploy. `npm run check` and
`npm run docs:check` both green after every commit.

## Standing state

- `WEB_BOT_AUTH_PRIVATE_KEY` is set as a Cloudflare Pages secret on the
  `mazzeleczzare` project (confirmed via `wrangler pages secret list`).
  Contact webhook deliveries should now carry `Signature-Agent`/
  `Signature-Input`/`Signature` headers — **not yet verified with an actual
  live contact-form submission**, only with a local Node WebCrypto
  sign/verify round-trip using the real key material.
- Two `.well-known` OAuth files (`oauth-authorization-server`,
  `oauth-protected-resource`) predate this session and describe `/admin`'s
  real cookie-based login, not an agent-consumable Bearer flow. Left
  unmodified; `/auth.md` explains the discrepancy rather than the files
  pretending otherwise. Not a defect introduced this pass — a pre-existing
  condition, documented not fixed.

## Deferred / needs a decision

- **`wrangler.toml`'s `name` field is wrong** (`mazze-leczzare-blog`, should
  be `mazzeleczzare` to match the real Cloudflare Pages project). Flagged to
  the user, not changed — confirm no other tooling depends on the current
  value before renaming.
- No further agent/bot standard has been requested yet. If one is, resume
  this same PLAN.md/DECISIONS.md rather than re-scaffolding.

## Non-actions (explicit)

- Did not sign `functions/api/ingest.ts`'s outbound GitHub Contents API
  calls with Web Bot Auth — see DECISIONS.md for why (GitHub doesn't verify
  it; those calls are token-authenticated infra, not agent outreach).
- Did not add an `agent_auth`/`register_uri` block to `/auth.md` — no real
  registration endpoint exists to point to; see DECISIONS.md.
- Did not fix the pre-existing OAuth metadata files or the `wrangler.toml`
  name mismatch — both flagged, neither touched.
