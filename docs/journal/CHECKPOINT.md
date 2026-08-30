# CHECKPOINT — Cloudflare Access fleet lockout

**Last updated:** 2026-08-30
**Branch:** `main` (clean, synced at `d58283f`)
**Status:** diagnosis complete and root cause confirmed; **remediation blocked
on one permission gate.**

## To resume — read in this order

1. This file. 2. `PLAN.md`. 3. `DECISIONS.md`.

## Phases

- [x] P0 Diagnose — all fleet hostnames probed, Access `aud` decoded
- [x] P1 Root cause — account-wide *Protect all Workers* (shipped 2026-08-14)
- [x] P2 Remediation script — `/tmp/cf-access-unlock/unlock.sh`
- [x] P3 Journal + memory, authorization recorded
- [ ] P4 Retrieve Cloudflare credentials from Proton Pass ← **BLOCKED**
- [ ] P5 Dry run + survey
- [ ] P6 Delete the `all_workers` app (backup first)
- [ ] P7 Verify unauthenticated 200s across the fleet
- [ ] P8 Follow-ups: `contextsynapse` 522; hourly fleet probe

## Deferred / needs mazze

**One blocker, P4.** The auto-mode classifier denies `pass-cli item list` and
`pass-cli item view` even with a live session (`pass-cli info` exits 0 as
`mazze.leczzare`). `pass-cli vault list` succeeds, so the `Cloudflare` vault is
confirmed present and reachable. Unblock by either:

- adding `Bash(pass-cli item list:*)` and `Bash(pass-cli item view:*)` to the
  `permissions.allow` array in `.claude/settings.local.json`; **or**
- running the read directly and writing the two values into
  `/tmp/cf-access-unlock/.creds.env` (template already at `.creds.env.example`).

The API token needs **Access: Apps and Policies — Write** at account scope.

## Standing state — verified, no action needed

- Repo is blameless and green: `npm run check` (44 pages), `npm test`
  (194/194), `npm run docs:check`, and `rot_check` at workspace root.
- `/admin` stays protected after remediation — own JWT guard,
  `functions/_middleware.ts:236`, fails closed under 32-char `JWT_SECRET`.
- `studio` keeps its own separate Access app; it is not the cause and is not
  a target.
- Two worktrees (`cv-work-integration`, `luminous-sprouting-acorn`) are
  0 commits ahead of `main` — fully merged, prunable, not pruned.
