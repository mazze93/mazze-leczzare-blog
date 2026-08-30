# CHECKPOINT — Cloudflare Access fleet lockout

**Last updated:** 2026-08-30 (remediation complete)
**Branch:** `main` (clean, synced at `d58283f`)
**Status:** **RESOLVED — the fleet is public again.** One follow-up incident
(credential leak → rotation) and two deferred bugs remain.

## To resume — read in this order

1. This file. 2. `PLAN.md`. 3. `DECISIONS.md`.

## Phases

- [x] P0 Diagnose — all fleet hostnames probed, Access `aud` decoded
- [x] P1 Root cause — account-wide *Protect all Workers* (shipped 2026-08-14)
- [x] P2 Remediation script — `/tmp/cf-access-unlock/unlock.sh`
- [x] P3 Journal + memory, authorization recorded
- [x] P4 Retrieve Cloudflare credentials from Proton Pass (unblocked via permission rule)
- [x] P5 Dry run + survey
- [x] P6 Delete the `all_workers` app (backup first)
- [x] P7 Verify unauthenticated 200s across the fleet
- [ ] P8 Follow-ups: `contextsynapse` 522; hourly fleet probe

## Deferred / needs mazze

1. **ROTATE the four leaked credentials** — see DECISIONS.md, 2026-08-30
   incident entry, for the table. Highest priority is the Global API Key.
2. **`contextsynapse` 522** — origin unreachable; `daedalus-tunnel` has zero
   connections and no `~/.cloudflared/config.yml`.
3. **SSH signing key missing** — `~/.ssh` holds no keys but
   `commit.gpgsign=true`, so every commit fails until restored. Journal
   commits this session are unsigned. Try the Proton Pass `keys` vault.
4. **Hourly unauthenticated fleet probe** so a lockout can never run dark
   again. This one went unnoticed for days.

## Standing state — verified, no action needed

- Repo is blameless and green: `npm run check` (44 pages), `npm test`
  (194/194), `npm run docs:check`, and `rot_check` at workspace root.
- `/admin` stays protected after remediation — own JWT guard,
  `functions/_middleware.ts:236`, fails closed under 32-char `JWT_SECRET`.
- `studio` keeps its own separate Access app; it is not the cause and is not
  a target.
- Two worktrees (`cv-work-integration`, `luminous-sprouting-acorn`) are
  0 commits ahead of `main` — fully merged, prunable, not pruned.
