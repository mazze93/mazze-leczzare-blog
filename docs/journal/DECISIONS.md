# DECISIONS — design-sync-css-parity

Append-only. Format: `date · decision · why · how to reverse`.

## 2026-08-02

- **Archived the `site-rot-sweep` journal instead of appending to it.** Why:
  that journal's Phase 7 was already closed with a full deferred list logged;
  the live work in this session (design-sync CSS parity, FieldFigure) is a
  distinct task with no relationship to font/CSP/route rot. Reverse: `git mv`
  the three files back from `docs/journal/archive/2026-08-02-site-rot-sweep/`
  to `docs/journal/`.

- **Built FieldFigure as a React island (`client:visible`) rather than editing
  the existing static SVG in place.** Why: only the live Astro site supports
  React hydration; the uploaded reference HTML (`publicationsurfacev1_1_1.html`)
  is a static artifact and can't host pointer-interaction or draw-in animation.
  Mounted on `/work` — the live page closest in structure to that artifact's
  masthead. Reverse: revert commit `3d7385e` on `main` (or the pre-rebase
  commit `7048b64` on this branch), removing `src/components/work/FieldFigure.*`
  and the `work.astro` mount/CSS.

- **Added `"plate-bleed"` as a raw unhashed class string in `FieldFigure.tsx`,
  alongside the CSS-module classes.** Why: `work.astro`'s scoped `<style>`
  block needs a stable, predictable selector to target from outside the
  module (`:global(.plate-bleed)` for full-bleed positioning); CSS-module
  hashes aren't visible/stable from the consuming page. Reverse: remove the
  string from the `cls` array in `FieldFigure.tsx` and the corresponding
  `:global()` rule in `work.astro`.

- **Deferred the design-sync CSS parity push — no `write_files` call made
  yet.** Why: `finalize_plan`/`write_files` are permission-gated and the full
  diff set (all three files) wasn't yet assembled; pushing `global.css` alone
  without `editorial.css`/`homepage.css` checked would leave the remote in a
  partially-synced, ambiguous state. Reverse: n/a — no write has happened.
