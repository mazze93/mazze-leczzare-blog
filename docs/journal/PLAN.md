# PLAN — Cloudflare Access fleet lockout: diagnosis and remediation

**Request (restated):** every public property on `mazzeleczzare.com` — the apex
blog, `stratum`, `stele`, `perdurabo`, `fieldnotes`, and the `pages.dev` origin —
is redirecting unauthenticated visitors to a Cloudflare Access login. Find the
cause and undo it end-to-end, restoring public access to the whole fleet.
Mazze has been fighting this alone for a week; speed matters more than ceremony.

**Scope — what this touches:**

- **Cloudflare account state** (the actual fix): Access applications under
  `/accounts/$ACCOUNT_ID/access/apps`. Nothing here lives in a repo.
- `/tmp/cf-access-unlock/` — remediation script + JSON backups (outside the
  repo on purpose: backups of Access app definitions are account config, and
  the repo is public).
- `docs/journal/` — this scaffold.
- `~/.claude/projects/…/memory/` — two memories written
  (`proton-pass-cli-credential-retrieval`, `cloudflare-access-fleet-lockout`).

**Not in scope:** no site source changes. The repo is blameless — build,
194 tests, `docs:check`, and `rot_check` were all green throughout.

## Phases

- [x] **P0 — Diagnose.** Probe every fleet hostname; decode the Access `aud`
      from redirect JWTs to distinguish one shared app from many.
- [x] **P1 — Identify root cause.** Confirmed against Cloudflare docs.
- [x] **P2 — Build the remediation script**, dry-run-first with a backup gate.
- [x] **P3 — Journal + memory**, incl. the authorization record below.
- [ ] **P4 — Retrieve credentials** from Proton Pass (`Cloudflare` vault).
      **BLOCKED** — see CHECKPOINT deferred list.
- [ ] **P5 — Dry run**: dump all apps, survey Worker-scoped destinations.
- [ ] **P6 — Delete** the `all_workers` (and `all_preview_workers`) app,
      backing up each app's JSON first.
- [ ] **P7 — Verify** unauthenticated 200s across all fleet hostnames.
- [ ] **P8 — Follow-ups:** `contextsynapse` 522 (dead tunnel); an hourly
      unauthenticated fleet probe so this can never run dark again.

## Constraints

- Delete **only** destination types `all_workers` / `all_preview_workers`.
  Hostname, SaaS, SSH and self-hosted apps are untouched — `studio` in
  particular has its own separate hostname app that must survive.
- Never delete an app before writing its JSON backup.
- Never echo a retrieved secret into the transcript.
