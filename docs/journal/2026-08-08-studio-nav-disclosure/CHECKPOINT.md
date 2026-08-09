# CHECKPOINT — studio-nav-disclosure

**Last updated:** 2026-08-08 (Phase 5 in progress)
**Branch:** `feat/studio-nav-disclosure` (renamed from `chore/retire-tesserae-trim-nav`,
which described a plan that was reversed on evidence).
**Working clone:** a plain `git clone` of `main`, not a worktree — the repo's `prepare`
script (`cp hooks/pre-push .git/hooks/pre-push`) fails in a linked worktree because
`.git` is a file there.

> **Note for whoever picks this up.** This is a *concurrent* pass. The live
> `CHECKPOINT.md`/`HANDOFF.md` in `docs/journal/` root belong to the design-systems
> pass, whose item 2 is still open. Do not archive them on this pass's behalf.

## To resume — read in this order

1. This file.
2. `PLAN.md` — phases and the verification gate.
3. `DECISIONS.md` — why Tesserae was kept rather than retired, and why the menu is a
   button.

## Phases

- [x] Phase 1 — inventory what exists
- [x] Phase 2 — prove the tesserae surface builds (probe tile, then removed)
- [x] Phase 3 — Studio disclosure in `Header.astro`
- [x] Phase 4 — footer parity (Studio + Tesserae)
- [x] Phase 5 — journal scaffold (this) + CLAUDE.md corrections
- [ ] Phase 6 — rename branch, squash `auto:` commits, re-verify, open PR

## Verification status

Re-run green at end of Phase 5: `npm run check` 44 pages + tsc · `npm test` 194 passed ·
`npm run docs:check` no drift.

## CLAUDE.md corrections made (Phase 5)

Two entries had drifted, both found by reading rather than by the drift script — which
checks that documented *paths* exist, not that prose describing them is still true:

- **`BreathingHero.astro`** described a hero that no longer exists. It documented a
  display headline and a `.breathing-hero__sub` bridge paragraph; #165 replaced all of it
  with the Stratum/Stele product cards.
- **`Header.astro` and `Footer.astro`** were filed under "Standard structural (no
  non-obvious behaviour)". Header now carries a keyboard-operable disclosure menu, which
  is squarely non-obvious. Both moved to a new **Navigation** subsection.

## What changed so far

| File | Change |
| --- | --- |
| `src/components/Header.astro` | Studio becomes a disclosure parent; Signal and Tesserae move inside it alongside "The bench" (`/studio/`). Adds `.nav-group`/`.nav-disclosure`/`.nav-menu` styles and a keyboard-operable toggle in the existing `<script>`. |
| `src/components/Footer.astro` | Added `/studio/` and `/tesserae/` beside the existing `/signal/` link. |

## Standing state

- **Tesserae is built but unwritten.** 0 tiles, `.gitkeep` only. Every other part exists:
  schema, both routes, constellation aggregation, and an ingest endpoint. Until the first
  tile lands, every build prints `The collection "tesserae" does not exist or is empty` —
  documented in CLAUDE.md as expected, and confirmed this pass to clear on the first tile.
- **Publishing a tile** needs `INGEST_SECRET` (≥32 chars) and `GITHUB_INGEST_TOKEN` (fine-
  grained PAT, Contents read+write, this repo only) set as Cloudflare Pages secrets, plus
  the `INGEST_RATE_LIMIT` binding. The endpoint fails closed without both. Not configured
  this pass — reported only.
- **An auto-commit hook is active** in this repo and commits edits as `auto: <file> [HH:MM]`.
  Phase 6 squashes those into one intentional commit.

## Deferred / needs Mazze

- Writing the first tesserae tiles — authorial, not mine to ghostwrite.
- Whether to run the full `bootstrap.sh` for the shared skills repo, which would overwrite
  three locally-divergent skill directories (`cloudflare`, `cloudflare-one`, `web-perf`).
- `HANDOFF.md` item 4 — the three design systems still aren't in CLAUDE.md.
