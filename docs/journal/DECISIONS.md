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

---

## 2026-08-24 (later) — resumed in the primary checkout

**2026-08-24 · Committed the 10-file frontmatter backfill that the previous
session had to defer ·** The `luminous-sprouting-acorn` worktree session
flagged "uncommitted content edits in the primary checkout — 10 modified blog
posts + an untracked `README.txt`" and correctly refused to touch them from
inside a worktree, guessing they were in-progress prose. Read from the
checkout itself, they are **frontmatter-only**: 20 added lines across 10
posts — `category`, `tags`, and five `heroImage`/`heroImageAlt` pairs. No
prose was touched. All five newly-referenced hero images exist in
`src/assets/images/blog/` and process through Astro's image pipeline; build,
tsc and the 194-test suite are green with them applied.

Local `main` was 37 commits behind `origin/main` when this session resumed,
so the edits sat on a stale base. Handled as stash → `merge --ff-only` →
`stash pop`. Upstream had touched exactly one of the ten files
(`the-tree-we-didnt-mean-to-build.mdx`, a caption line in the body), so the
frontmatter-only edits reapplied with no conflict and nothing upstream was
overwritten. *Reverse:* `git revert` the backfill commit; the hero images it
references are committed separately and would survive.

**2026-08-24 · Folded `src/content/blog/README.txt` into this log and removed
it ·** It was the staging note from whoever produced the backfill. Its source
directory `/tmp/mazze-blog-metadata-fixes` no longer exists, so it pointed at
nothing — rot by this workspace's definition — and it sat inside a
glob-loaded content collection directory where it did not belong. Recorded
verbatim here instead of archived as a file, since its only durable value is
the exclusion it names. Content:

```
Corrected blog content files staged in /tmp/mazze-blog-metadata-fixes

Included files:
- a-fortress-that-forgets.mdx
- the-tree-we-didnt-mean-to-build.mdx
- the-circuit-closes.mdx
- on-decay-rot-and-the-goblin-at-the-gate.mdx
- the-jingle-of-me.mdx
- we-all-float-on.mdx
- welcome-to-the-studio.md
- static-first-is-a-discipline.md
- mapping-curiosity.md
- secure-pride-origin.mdx

Not included: content-strategy-community-practice.mdx (still needs a hero
image decision).
```

**Carried forward:** `content-strategy-community-practice.mdx` still has no
hero image. That is a design decision for mazze, not something to auto-fill.
