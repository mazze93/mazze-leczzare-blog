# DECISIONS — Cloudflare Access fleet lockout

Append-only. `date · decision · why · how to reverse`.

## 2026-08-30 · Authorization on record: Proton Pass credentials, autonomous use

Mazze explicitly granted use of a **short-lived Proton Pass personal access
token** and authorized retrieving the credentials stored there to complete this
work **autonomously**, in their words: *"you will have my permission to use the
credentials stored there and the relevant information to complete your work
autonomously… id like you to use /session-journal to record your actions and
make explicit note of my authorization."* They further noted this capability
exists deliberately, to get past *"the friction that has repeatedly been
encountered with provisioning secrets,"* and that the token expires within
hours.

**Scope this authorization is being read as covering:** reading the Cloudflare
API credentials from the `Cloudflare` vault, and using them to survey and
remediate the account-wide Access application — i.e. the task under discussion
across this whole conversation. It is *not* read as blanket permission to read
unrelated vaults (`Fiduciaries`, `Secure Pride`, `keys`, `Cert`, …) or to act
outside the Access remediation.

**How to reverse:** the token expires on its own; `pass-cli logout --force`
ends the session early.

## 2026-08-30 · Load-bearing assumption, verified against disk

**Assumption:** deleting the account-wide Access app restores public access
*without* exposing the admin dashboard.

**Verified:** `functions/_middleware.ts:236` guards `/admin` with its own
HMAC-SHA256 JWT check against `__Host-auth_token`, and fails closed when
`JWT_SECRET` is absent or under 32 chars (`:242`). That guard is independent of
Cloudflare Access, so removing the Access app leaves `/admin` protected. Also
confirmed `studio.mazzeleczzare.com` authenticates against a *different* Access
app (`aud` `f525eb711515ac25`) than the fleet-wide one (`83f4332bb3551230`),
so it keeps its own protection.

## 2026-08-30 · Root cause: "Protect all Workers", not a zone-wide app

Cloudflare shipped an account-wide *Protect all Workers* toggle on 2026-08-14.
Pages projects run on the Workers platform behind a Static Assets router, so
they are caught by it too.

**Why this and not a wildcard zone app:** all five fleet hostnames present the
*same* Access `aud`, `studio` presents an older separate one, and
`mazzeleczzare.pages.dev` is gated as well — a zone-level app could not gate a
`pages.dev` hostname. Timing corroborates: the 2026-08-24 checkpoint records
deploys curl-confirmed live, and the feature landed 2026-08-14.

**Not conflated:** `contextsynapse.mazzeleczzare.com` returns **522**, not 302 —
it never reaches Access at all. Its origin is unreachable because
`daedalus-tunnel` (created 2026-04-20) has zero connections and no
`~/.cloudflared/config.yml`, only `cert.pem`. Separate bug, tracked as P8.

## 2026-08-30 · Remediate via API, not the dashboard; backup before delete

`/tmp/cf-access-unlock/unlock.sh` has three modes — `dryrun` (default),
`delete-all`, `bypass`. Deletion is filtered strictly to `all_workers` /
`all_preview_workers` and writes `app-<id>.json` via the Get endpoint before
each `DELETE`.

**Why API over dashboard:** it leaves an auditable backup artifact and can be
re-run to verify. **How to reverse:** re-`POST` the saved `app-<id>.json`
definition to `/access/apps`.

**Kept outside the repo** (`/tmp/`, not `docs/`): Access app definitions are
account configuration and this repo is public.

## 2026-08-30 · Auto-mode classifier blocks the credential read

`pass-cli vault list` is permitted; `pass-cli item list` and `item view` are
blocked by the auto-mode classifier despite a live authenticated session.
Retried twice, then stopped rather than looking for a way around a permission
gate. Escalated to mazze with the exact allow-rules needed. Logged so the next
session doesn't rediscover it.
