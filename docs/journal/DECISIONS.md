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

## 2026-08-30 · RESOLVED — deleted the `all_workers` app; fleet is public again

Survey found 7 Access apps: one `all_workers` ("All Workers",
`6fe37784-218d-412a-af11-a3d557ecc8de`), one `worker`-scoped
("mazze-studio - Cloudflare Workers"), and 3 `public`. No
`all_preview_workers`. Deleted **only** the `all_workers` app, after backing
its definition up to `/tmp/cf-access-unlock/app-6fe37784-*.json`.

Verified unauthenticated, **without** `-L`: apex, `stratum`, `stele`,
`perdurabo`, `fieldnotes` all 200; `www` 301 to apex; `/rss.xml`,
`/sitemap-index.xml`, `/blog/`, `/about/` all 200. `studio` still 302 to
Access — correct, it keeps its own worker-scoped app. `contextsynapse` still
522 — the dead-tunnel bug, untouched.

**First verification pass was wrong and was redone.** It used `curl -L`, which
follows the Access redirect to a login page that itself returns 200 — so
everything looked fixed regardless of truth. Re-probed capturing
`%{redirect_url}` instead. *Lesson: when the failure mode IS a redirect, never
verify with a flag that follows redirects.*

**How to reverse:** re-POST the saved `app-6fe37784-*.json` to
`/accounts/$ACCOUNT_ID/access/apps`.

## 2026-08-30 · INCIDENT — credential values leaked into the session transcript

While probing which stored credential had `Access: Apps` permission, a
diagnostic loop printed `name=`/`val=` lines that were never in any `printf`.
Several secrets were exposed in cleartext to the transcript.

**Root cause — a zsh-specific `local` behaviour, reproduced and isolated:**

```zsh
demo() { local v; v=LEAKME; local v; }   # prints: v=LEAKME
```

`local`/`typeset` re-declaring an *already-set* variable with no new value puts
zsh into **display mode**, printing `name=value`. The declaration sat *inside*
a `for` loop, so every iteration after the first dumped the previous
iteration's values — including secrets. In bash the same code is silent, which
is why the pattern looked safe. The trace reached the transcript out of order
(stderr unbuffered vs stdout buffered), which is why it appeared *after* each
printf and initially read like an xtrace.

Ruled out first, all negative: `set -x` (`$-` = `569Xl`, no `x`), DEBUG traps
(none), traced functions (none), `BASH_ENV` (unset), and the rc files
(`~/.zshrc`, `~/.zprofile` — no `PS4`/xtrace lines). Only 4 setopts are on:
`nobareglobqual`, `nohashdirs`, `login`, `promptsubst`.

**Fix:** declare `local` **once, above the loop**; assign inside it. Verified
silent.

**How to apply:** this is a hard rule for any script that touches secrets on
this machine — the shell here is zsh 5.9, not bash, and `local` inside a loop
is a credential-disclosure bug, not a style preference.

**Remediation owed by mazze:** every value below reached the transcript and
must be rotated. Listed by location, values deliberately not repeated here.

| Vault / item | Field | Why |
| --- | --- | --- |
| Dev / Cloudflare Global API Key | `API Key` | Global key — full account control. Rotate first. |
| Dev / cloudflare api token | `Secret` | The working `cfat_…` token used for this fix. |
| Dev / Cloudflare Workers API token | `API Key` | `cfut_…` token. |
| Dev / cloudflare api token | `access key id` + `secret access key` | R2 credential pair. |

The account ID also appeared; it is an identifier rather than a secret (it is
visible in dashboard URLs), so no action beyond awareness.

---

## 2026-09-02 — Gay Wandering ships: Plate III leads, dust goes live, book goes on sale

**Plate III is the hero, not the cover.** `/gay-wandering/` led with the
watercolor cover; it now leads with Plate III — *The Silent Spider · Transit
Survey*. The plate's printed web carries the same five stations (Origin,
Intention, Refraction, Transmission, Return) that the live dust moves through,
so plate and page read as one system rather than an illustration sitting next
to an effect. The cover moves down to "the complete object", where it documents
the edition instead of competing with it.

**Ordinal Dust ported, not reimplemented.** `GoldDust.astro` copies
`WebOverlay` and `GoldDust` verbatim from the reader's drop-in module
(`gay-wandering/src/gold-dust-overlay-demo.html` §JS-2/§JS-3) so the two
surfaces stay in register. The demo's state chip, W/G toggles and persisted
settings are deliberately not ported — this is page ornament, not a reader
control surface. Strands spin between eight `[data-anchor]` elements.

**Four bugs found by looking rather than assuming:**

1. `main` painted an opaque field background at `z-index: 3`, hiding both
   overlay layers completely. Washes moved to the body, `main` transparent.
2. The checkout markup loaded Lemon Squeezy's overlay script — wrong platform,
   and `DEFAULT_CSP` permits no third-party script outside `/artifacts/*`, so
   it would have been blocked at runtime with no build error.
3. The buy button was gated entirely on `PUBLIC_GAY_WANDERING_CHECKOUT_URL`, a
   Pages *build* variable that was never set. Every visitor got the interest
   form and the Book schema carried no offer. `GAY_WANDERING_CHECKOUT_URL` in
   `src/consts.ts` now holds the live listing as the default; the env var still
   overrides.
4. The plate shipped as JPEG. Near-black gradients are exactly where JPEG
   fails, and the web filaments and station labels came out muddy on a phone.
   Now WebP with a JPEG fallback through `<picture>` — 95 KB against 153 KB,
   and better.

**CI red was not ours.** Every commit from `74fbf36` failed while the last
green run, `1ee2524`, has a byte-identical `package.json` and
`package-lock.json`. `npm audit` queries the live advisory database, so two
browserslist advisories published between 09-01 and 09-02 flipped an unchanged
lockfile. Diffing dependency files against the last green run — rather than
assuming the new commits caused it — is what made that quick to establish.

**The product is live:** https://mazzeleczzare.gumroad.com/l/gay-wandering.
Proof carried through: the bytes Gumroad serves are byte-identical to the local
press (6,699,900 B, single sha256 across both). Two defects were caught before
publishing — a blank leading page in the archival PDF (present in the
2026-08-30 press too) and a reading column running under the fixed control bar
on phones. Details in `creative/gay-wandering/docs/journal/CHECKPOINT.md`.

**Publish gate overridden, on the record.** The 2026-08-09 journal ratified a
7-step E2E purchase test before going live. It has not been run; mazze directed
the flip to publish. Recorded rather than quietly skipped — a real purchase is
still the only proof the delivery path works end to end.

## 2026-09-09 · Dependency security sync + upstream class-closure pass

**What landed.** `npm audit fix` (no `--force`) bumped the two flagged transitive
deps under `astro@7.2.9` — `svgo` 4.0.2 → 4.1.0 and `js-yaml` 4.3.1 → 4.3.2
(carrying `sax` 1.5→1.6.1, `css-select` 5→6, `css-what` 6→7). Lockfile-only, no
`package.json` change, so `astro` itself is untouched. Verified:
`npm audit --audit-level=high` (0), `npm run check` (44 pages), `npm test`
(194/194). Commit `b1a3c61`, pushed direct to `main` — same shape and precedent
as `a5abfec` (browserslist). Clears Dependabot alerts #71/#72; PR #178 redundant.

**CLAUDE.md drift fixed.** Stack table said `Node 22.x`; `.nvmrc` says `24`.
Corrected. `npm run docs:check` and `scripts/ops/check-docs-drift.sh` both report
no other drift (incl. the new §10 /work "Live" check).

**Upstream research (held private).** Per mazze's direction, ran the
Class-Closure / `vuln-disclose` method against the two CVEs rather than only
bumping past them:

- **svgo `removeScripts`** — a candidate finding against v4.1.0 is going through
  coordinated disclosure with the maintainers under mazze's name. Mechanism and
  PoC are held in the local artifact until that resolves; they do not belong in
  a public repo.

- **js-yaml GHSA-2883 — class closed at default config.** Reproduced the
  quadratic empty-merge PoC on 4.3.1 (21ms->236ms for N 2k->8k); 4.3.2 rejects
  it in <6ms via the hard 100-item `<<` merge-sequence cap plus per-source
  charging. Variant sweep found no non-closure within defaults. No finding.

Artifact: `~/Inbox/2026-09-09-class-closure-svgo-jsyaml.md` (local only; proper
long-term home is `secure-pride`).

## 2026-09-09 · Store surface + roadmap rebuild + fleet-follow-up close

Same session as the dependency sync above; three user-directed pieces shipped
direct to `main`, each verified before push.

**Store surface (`ae5e586`).** `store.mazzeleczzare.com` (Claude Code
plugins/skills) had zero paths from the site. Added `src/pages/store.astro` —
a short landing that says what it is and links out, distinct from the Gumroad
book — plus a "Store" link in the Header atlas nav and the Footer. New
`StoreAnnounce.astro`: a one-time, dismissable, dwell/scroll-gated corner card
mounted once in `Footer`, `prefers-reduced-motion` aware, vanilla JS, dismissal
in `localStorage`. **Gated behind `STORE_ANNOUNCE_ENABLED` in `consts.ts`,
ships `false`** — the `<aside>` is not emitted until mazze flips it on, since a
site-wide announcement is visitor-facing. `consts.ts` gains `SITE_STORE_URL`.

**Roadmap rebuilt (`837aff9`).** `src/pages/roadmap.md` was orphaned (linked
nowhere), stale since April 2026, had broken `[x ]` checkbox syntax, and listed
shipped features as unbuilt. Deleted. New `roadmap.astro` is a designed page in
the Kintsugi grammar — a gold seam heads each phase, mono eyebrows, Cormorant
headings, a four-state legend (shipped / building / planned / vision) with the
glyph colour carrying state. Phases render from one typed array in the file's
frontmatter. Content folded in: everything shipped; in-progress (store announce
toggle, svgo coordinated disclosure, feeding the constellation — which runs on
4 nodes all sealed to the signal zone); planned (tesserae tiles, signal,
re-theme /about+/work+/security, prune unused blog/* components + Cormorant SC);
and the studio.mazzeleczzare.com workbench vision (Stratum ledger, Stele
egregore compilation, adaptive response plugin, MCP gateway, dev surface).
Linked from the Footer.

**Footer corrections (same commit).** "Writing" pointed at `/blog/` while the
header points at `/writing/` — two links, one label, different pages. Footer
now matches the header. Added Book (`/gay-wandering/`) and Roadmap
(`/roadmap/`).

**Journal close.** CHECKPOINT.md P8b (`contextsynapse` 522) marked resolved —
the whole fleet (`contextsynapse`, `store`, `fieldnotes`, `perdurabo`,
`stratum`, `stele`) returns 200 as of today.

**Map followed territory in each commit:** `CLAUDE.md` + `AGENTS.md` route
tables (`.md` → `.astro`), the Header/Footer/component descriptions, and
`scripts/ops/check-docs-drift.sh`'s expected-pages list.

**Verified end-to-end.** `npm run check` (45 pages), `npm test` (194/194),
`npm run docs:check`, `npm audit` (0) green at each step; `/roadmap` driven in a
browser on the dev server; and after deploy, `https://mazzeleczzare.com/store/`
and `/roadmap/` both return 200 with the expected `<title>`, the homepage
carries the `/store/` nav link, and `/roadmap/` is in the live sitemap.

**Outstanding (tracked on `/roadmap` itself):** svgo advisory still needs a
manual private submit to svg/svgo; `STORE_ANNOUNCE_ENABLED` still `false`
pending a copy review; the `53e6318` history exposure of the svgo mechanism
can't be force-scrubbed (branch protection).
