# CHECKPOINT — site-rot-sweep

**Last updated:** 2026-08-02 (Phase 1 — scaffold)
**Branch:** `main`, in sync with `origin/main` at session start (`47ddc8b`)

## To resume

1. Read `docs/journal/PLAN.md` — 7 phases, scope table, verified assumption.
2. Read `docs/journal/DECISIONS.md` — starts with a correction of the prior
   turn's font finding; read it before re-deriving anything about `public/fonts/`.
3. Continue at the first unchecked phase below.

## Phase status

- [x] **Phase 1 — scaffold.** Closed cv-work-integration journal archived to
      `docs/journal/archive/2026-07-28-cv-work-integration/`; this set created.
- [ ] **Phase 2 — fonts: vendor the missing files** (14 refs → 0 files).
- [ ] **Phase 3 — fonts: resolve `--cg-font-sans`** (journal's open item).
- [ ] **Phase 4 — CSP: CDN-font pages outside `/artifacts/`.**
- [ ] **Phase 5 — dead config** (Tailwind, `editorial.css`).
- [ ] **Phase 6 — CLAUDE.md + drift-script coverage.**
- [ ] **Phase 7 — close** (`check`, `test`, `docs:check`, push).

## Deferred / needs user

- (none yet)

## Verification state

- `npm run docs:check` passes — and passed clean through every defect in this
  plan. Extending its coverage is Phase 6, and is itself a finding.
- Working tree at session start carried an uncommitted `@astrojs/sitemap`
  `3.7.3` → `^3.7.3` change in `package.json` + `package-lock.json` from a prior
  session. Not mine; decide its fate at Phase 7 rather than sweeping it into an
  unrelated commit.
- `npm run check` / `npm run test` not yet run this session.

## Non-actions (explicit)

- Nothing under `src/`, `public/`, or `functions/` modified yet.
- No files deleted; the journal archive move was `git mv`.
