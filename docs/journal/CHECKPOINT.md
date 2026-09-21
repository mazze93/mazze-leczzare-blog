# CHECKPOINT — current resume point

**Last updated:** 2026-09-21
**Branch:** `main`, clean, in sync with `origin/main` at `1119b57`.
**Standing checks, all green as of this update:** `npm run check` (48 pages),
`npm test` (194/194), `npm run docs:check`, `scripts/ops/check-docs-drift.sh`
("no drift detected").

## To resume — read in this order

1. This file. 2. `PLAN.md` (open threads). 3. `DECISIONS.md` (append-only, newest
   at the bottom). 4. `BUILD_JOURNAL.md` at the repo root for the burst workflow.

## There is no open burst

The last four commits shipped and were verified, but closed without journal
entries; that gap is what this update closes (see `DECISIONS.md`, 2026-09-21).

| Commit | Date | What shipped |
| --- | --- | --- |
| `f4a4c4f` | 2026-09-09 | Constellation graph fed — `project`/`committed` frontmatter on 5 posts so the node field spans every zone |
| `1eaae77` | 2026-09-09 | `STORE_ANNOUNCE_ENABLED` flipped **true**, announce + roadmap copy tightened |
| `92553cd` | 2026-09-09 | `/work` links the live `contextsynapse.mazzeleczzare.com` |
| `1119b57` | 2026-09-09 | Stratum build-journal workflow scaffolded (`BUILD_JOURNAL.md`, `.stratum-log`, `scripts/burst-summary.sh`, `scripts/stratum-link.sh`) |

## Earlier journals still holding open items

Neither is archived, because each still owns work:

- `docs/journal/2026-08-09-gay-wandering-ship-and-pivot/` — the 7-step E2E
  purchase test (still unrun) and the secure-pride pivot HANDOFF.
- `docs/journal/2026-08-08-studio-nav-disclosure/` — `/api/ingest` secrets not
  configured in Cloudflare Pages; first tesserae tiles unwritten; the three
  design systems still absent from `CLAUDE.md`.

The 2026-08-30 Cloudflare Access lockout burst is **closed** and archived to
`docs/journal/archive/2026-08-30-cloudflare-access-lockout/`. Outcome: the fleet
is public again, an hourly unauthenticated probe runs via LaunchAgent, and the
`contextsynapse` 522 resolved 2026-09-09.

## Deferred / needs Mazze

1. **Stratum is scaffolded but not activated** — no `~/.config/stratum/config.json`
   on this machine, so `stratum decide` / `tessera` return `✗ unauthorized`.
   One-time: `stratum init --token <TOKEN> --log mazze-leczzare-blog --agent claude`,
   then the genesis decision at the bottom of `BUILD_JOURNAL.md`. Until then the
   git half of the burst workflow works and the ledger half does not.
2. **Gay Wandering 7-step E2E purchase test** — a real transaction, so it is
   mazze's to run. Byte-verified delivery is not a completed purchase.
3. **svgo advisory** still needs a manual private submit to svg/svgo; the
   `53e6318` history exposure of the mechanism can't be scrubbed under branch
   protection.
4. **`launch/_design/png/x-banner.png`** sits untracked in the
   `creative/gay-wandering` repo (2146×733, 3.1 MB, created 2026-09-10, nothing
   references it). Left in place — keep/commit/relocate is mazze's call, since a
   3 MB binary in history is only reversible by force-push.
5. **Account merger (`daedalus` + `mazze` macOS accounts)** — named in the
   gay-wandering journal as the next highest order of business. Sensitive and
   destructive-adjacent; not started.
