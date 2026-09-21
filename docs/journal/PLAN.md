# PLAN — open threads

**Rewritten 2026-09-21.** The previous `PLAN.md` was the 2026-08-30 Cloudflare
Access lockout plan; it closed and moved to
`docs/journal/archive/2026-08-30-cloudflare-access-lockout/`.

No burst is open. These are the threads a next burst can pick up, each small
enough to finish and checkpoint on its own per `BUILD_JOURNAL.md`.

## Unblocked — pick one and make it a burst

1. ~~**Document the three design systems in `CLAUDE.md`**~~ — **DONE 2026-09-21.**
   `CLAUDE.md` carries a `## Design Systems` section; the design-systems
   HANDOFF item 4 is closed in place.
2. **Astrolabe chrome** — **IN PROGRESS 2026-09-21**, journalled in
   `docs/journal/2026-09-21-astrolabe-chrome/`. Built on a branch, not `main`:
   it is visible design on a HIGH-posture public surface, so it waits on mazze
   liking the render before it merges.
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
