# PLAN — open threads

**Rewritten 2026-09-21.** The previous `PLAN.md` was the 2026-08-30 Cloudflare
Access lockout plan; it closed and moved to
`docs/journal/archive/2026-08-30-cloudflare-access-lockout/`.

No burst is open. These are the threads a next burst can pick up, each small
enough to finish and checkpoint on its own per `BUILD_JOURNAL.md`.

## Unblocked — pick one and make it a burst

1. **Document the three design systems in `CLAUDE.md`** — carried open from the
   2026-08-08 nav burst (HANDOFF item 4).
2. **Astrolabe chrome** — the live next task of the design-systems pass; see
   the 2026-08-09 burst's notes on the design-systems HANDOFF.
3. **Journal hygiene for the two older burst dirs** — each still owns real open
   items, so they stay live until those items land or move; revisit once one of
   the threads above closes.

## Blocked — see `CHECKPOINT.md` "Deferred / needs Mazze"

Stratum activation token · the 7-step E2E purchase test · the svgo private
submit · the untracked `x-banner.png` · the macOS account merger.

## Standing constraints for any burst here

- `npm run check` (48 pages), `npm test` (194), `npm run docs:check`, and
  `scripts/ops/check-docs-drift.sh` must be green before a commit.
- Touch the map when you touch the territory: any structural change updates
  `CLAUDE.md`/`AGENTS.md` route tables and `check-docs-drift.sh` in the same commit.
- Resolve file references against their base and `stat` them; never conclude
  from a grep substring.
- Commit and push together.
