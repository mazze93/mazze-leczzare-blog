# PLAN — studio-nav-disclosure

**Repo/files in scope:** `src/components/Header.astro`, `src/components/Footer.astro`,
`CLAUDE.md`, and this journal directory. No content, route, or collection files are
touched — `/signal/` and `/tesserae/` keep their existing routes and schemas.

**Request:** Signal and Tesserae are both thin fragment surfaces — one transmission and
zero tiles between them — and the nav spent width on them out of proportion to their
content. The original ask was to pull them from the nav in favour of promoting the two
shipped products. That reversed twice on evidence (see DECISIONS): the products turned
out to already lead the homepage hero, and Tesserae turned out to be a fully-built
surface with no link pointing at it. The landing request is therefore: nest Signal and
Tesserae under a **Studio** disclosure in the header, make Tesserae reachable for the
first time, and record the result in CLAUDE.md.

**Constraint:** WCAG 2.1 AA is non-negotiable here, which rules out a hover-only menu —
those are unreachable by keyboard and unusable on touch. Astro islands discipline also
applies: React is reserved for `ThemeToggle`/`ContactForm`/`PostQuoteShare`, so the
disclosure is vanilla JS inside `Header.astro`'s existing `<script>` block rather than a
new island.

## Phases

- [x] **Phase 1 — establish what is actually built.** Content counts (blog 16, signal 1,
      tesserae 0), nav inventory, and every tesserae reference across the repo including
      `functions/api/ingest.ts` and `scripts/ops/check-docs-drift.sh`.
- [x] **Phase 2 — prove the tesserae surface works.** Dropped a probe tile in, built,
      confirmed the empty-collection warning cleared and both routes generated. Removed
      the probe.
- [x] **Phase 3 — build the disclosure.** Button + `aria-expanded` + `hidden` menu,
      chevron, Escape/click-outside/focus-out handling, ArrowDown-to-first-item, mobile
      right-pinning.
- [x] **Phase 4 — footer parity.** Added Studio and Tesserae alongside Signal.
- [ ] **Phase 5 — journal + CLAUDE.md.** This scaffold; then correct the two stale
      CLAUDE.md entries (`BreathingHero.astro`, `Header.astro`) and document the nav.
- [ ] **Phase 6 — tidy history and ship.** Rename the branch off its now-false name,
      squash the `auto:` commits into one intentional commit, re-verify, open a PR.

## Verification gate

`npm run check` (44 pages + tsc) · `npm test` (194) · `npm run docs:check` (no drift).
All three were green at the end of Phase 4 and must be green again before Phase 6 ships.

## Deliberately out of scope

- Writing tesserae tiles. The engineering is one nav line; the content is authorial and
  belongs to Mazze.
- `HANDOFF.md` item 4 — the three design systems still aren't written into CLAUDE.md.
  Pre-existing debt in the same file, flagged and left alone.
- Configuring the ingest secrets. Reported, not actioned.
