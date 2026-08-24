# DECISIONS — agent/bot standards compliance sweep

Append-only. Newest at the bottom.

**2026-08-24 · Archived the design-systems pass instead of continuing it ·**
The top-level `docs/journal/{CHECKPOINT,HANDOFF}.md` described an unfinished
pass (open item: "astrolabe chrome over derived geometry") when this session
started unrelated work (A2A/Web Bot Auth/auth.md). Per this repo's own
precedent — `HANDOFF.md` documents a prior session doing exactly this — moved
both files to
`docs/journal/archive/2026-08-03-design-systems-pass/` rather than overwriting
or silently dropping the open item. *Reverse:* `git mv` them back to
`docs/journal/`.

**2026-08-24 · A2A `supportedInterfaces` field name confirmed against
`specification/a2a.proto` in `a2aproject/A2A`, not the (partial/unreliable)
prose docs ·** WebFetch against `a2a-protocol.org/latest/specification/`
returned truncated/uncertain answers about field names. Pulled the actual
`.proto` via `gh api` instead — `main` matches the current `v1.0.1` tag, and
`supported_interfaces` (camelCase `supportedInterfaces`) is confirmed exact,
along with `AgentInterface{url, protocolBinding, tenant, protocolVersion}` and
`AgentSkill{id, name, description, tags, examples, inputModes, outputModes}`.
*How to apply:* if this ever needs re-verifying, go straight to the proto via
`gh api repos/a2aproject/A2A/contents/specification/a2a.proto`, not prose
fetches of the docs site.

**2026-08-24 · Web Bot Auth: only the contact webhook gets signed, not the
GitHub Contents API calls in `ingest.ts` ·** The spec's "bot/agent" framing is
about crawlers and agents making requests a *receiving site* can verify.
GitHub doesn't verify web-bot-auth signatures, and ingest.ts's calls are
token-authenticated infra plumbing, not agent outreach in the spirit of the
spec. Kept scope to the one outbound call that's genuinely "this site's bot
talking to another service." *Reverse:* extend `signOutboundRequest` calls
into `githubCommitFile`/`githubFileExists` in `functions/api/ingest.ts` if
this framing turns out to be too narrow.

**2026-08-24 · Web Bot Auth private key handed to the user directly, not
committed or set via `wrangler` by this session ·** Setting a Cloudflare
Pages secret is a production-infra action; per this repo's/user's global
instructions (ask before hard-to-reverse or shared-system actions), the value
was relayed in chat for the user to set themselves with
`wrangler pages secret put WEB_BOT_AUTH_PRIVATE_KEY --project-name
mazzeleczzare`. *Status: confirmed set* — `wrangler pages secret list
--project-name mazzeleczzare` shows `WEB_BOT_AUTH_PRIVATE_KEY: Value
Encrypted` alongside the other production secrets. The contact webhook now
signs outbound requests in production (not verified by an actual live send —
no test submission was made this session).

**2026-08-24 · Discovered `wrangler.toml`'s `name` doesn't match the real
Cloudflare Pages project ·** `wrangler.toml` says `name = "mazze-leczzare-blog"`;
`wrangler pages project list` shows the real project is `mazzeleczzare`
(serving mazzeleczzare.com). This is why `wrangler pages secret put` 403'd
without `--project-name`. Flagged to the user, not fixed — renaming touches
deploy config the user should confirm has no other dependents first.
*Reverse/fix:* update `wrangler.toml`'s `name` field to `mazzeleczzare` once
confirmed safe, or add a comment there documenting the mismatch so it stops
surprising people.

**2026-08-24 · `/auth.md` deliberately omits an `agent_auth`/`register_uri`
block despite the skill's checklist calling for one "when Authorization
Server metadata is available" ·** AS metadata *files* exist
(`/.well-known/oauth-authorization-server`), but they don't back a real
agent-consumable flow — `/api/login` sets an HttpOnly cookie, not an
Authorization-header Bearer token, and there's no client registration
endpoint at all. Fabricating a `register_uri` would mislead any agent or
scanner that tried to use it. Chose honesty over checklist-completeness.
*How to apply:* if this site ever gains real OAuth dynamic client
registration for agents, revisit — the omission was a judgment call about
present reality, not a permanent policy.
