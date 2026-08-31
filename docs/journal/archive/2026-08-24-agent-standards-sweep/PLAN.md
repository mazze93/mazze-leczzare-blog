# PLAN — agent/bot standards compliance sweep

**Request:** implement and ship a series of agent-discovery / bot-authentication
standards for mazzeleczzare.com, one skill/command at a time (`/ship`-driven),
each validated by hitting `POST https://isitagentready.com/api/scan` in spirit
(not actually called this session — no outbound scan was run) and by curling
the live endpoint after each Cloudflare Pages deploy.

**Scope:** `public/.well-known/*`, `public/_headers`, `public/auth.md`,
`functions/api/contact.ts`, `functions/utils/webBotAuth.ts`, and this repo's
`CLAUDE.md` (kept in sync in the same commit as each shipped feature, per this
repo's map-and-territory rule).

**Not in scope this pass:** the pre-existing `astrolabe chrome` design-system
task from the previous (now-archived) pass —
`docs/journal/archive/2026-08-03-design-systems-pass/`. That work is still
open; it was not touched or lost, just set aside because this session did
unrelated work instead of resuming it.

## Phases

1. **A2A Agent Card** — `/.well-known/agent-card.json`. ✅ done, `8effa58`.
2. **Web Bot Auth** — JWKS directory + outbound request signing. ✅ done,
   `86b510e`. Deferred: private key handoff to Cloudflare secret (see
   CHECKPOINT.md).
3. **Auth.md agent registration discovery** — `/auth.md`. ✅ done, `92c9ae5`.
4. *(open-ended)* Further standards, if/when the user runs another
   `/ship <standard>` command in this line of work.

## Known constraints

- This is a single-operator personal site — no real OAuth client
  registration, no agent self-service. Every discovery doc shipped this pass
  says so honestly rather than fabricating capability (see DECISIONS.md).
- `wrangler.toml`'s `name` field (`mazze-leczzare-blog`) doesn't match the
  actual Cloudflare Pages project (`mazzeleczzare`) — flagged as drift, not
  fixed (see DECISIONS.md and CHECKPOINT.md deferred list).
- All shipped work went straight to `main` (no branch protection encountered)
  from the worktree branch `worktree-luminous-sprouting-acorn`, rebasing onto
  `origin/main` before each push.
