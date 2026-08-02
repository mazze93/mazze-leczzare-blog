# CHECKPOINT — site-rot-sweep

**Last updated:** 2026-08-02 (Phase 7 — closed)
**Branch:** `main`, pushed through `origin/main`. Session start `47ddc8b`.

## To resume

Task is complete. If picking up the loose ends, read the deferred list below;
`docs/journal/DECISIONS.md` has the reasoning for every choice made here,
including two reversals.

## Phase status

- [x] **Phase 1 — scaffold.** `7ccb263`. Closed cv-work-integration journal
      archived to `docs/journal/archive/2026-07-28-cv-work-integration/`.
- [x] **Phase 2 — VOID.** Premised on font 404s that do not exist. 14 vendored
      files removed, tree restored, reversal logged. Kept in the plan so the
      mistake stays legible.
- [x] **Phase 3 — fonts: `--cg-font-sans` resolved.** `a39ac54`. Inter
      self-hosted via `@font-face` against the already-deployed
      `/fonts/inter-*.woff2`; closes the item `8e0d6ae` left open. Also
      documented the `--cg-sans` / `--cg-font-sans` naming trap in
      `cipher-gothic.astro`.
- [x] **Phase 4 — CSP + duplicate route.** `c5a5f6c`. The Breakthrough artifact
      was fetching CDN fonts under `font-src 'self'` (blocked → rendering in
      fallback typefaces) and publishing at two URLs. Fonts self-hosted (8 cuts
      vendored), duplicate archived to `docs/archive/` with 301s. 40 → 39 pages.
- [x] **Phase 5 — dead config labelled.** `02b0c02`. `tailwind.config.mjs` and
      `editorial.css` both marked inert in place, with their misleading
      instructions corrected. No behaviour change.
- [x] **Phase 6 — CLAUDE.md + drift coverage.** `7ad7769`. Two new checks in
      `check-docs-drift.sh` (§8 asset-reference resolver, §9 CDN-font/CSP),
      both verified by reintroducing the defect and confirming exit 1. `*.html`
      added to the page scan. Manifests filled; run is now clean of warnings as
      well as errors.
- [x] **Phase 7 — close.** This entry.

## Verification state

- `npm run check` ✓ — 39 pages, tsc clean.
- `npm run test` ✓ — 194 tests, 6 files.
- `npm run docs:check` ✓ — exit 0, zero warnings.
- Font references resolved (not grepped) across `public/` and `dist/`: 98
  references in `dist`, 0 broken.
- No CDN font request anywhere outside `/artifacts/`.
- All five commits pushed to `origin/main`.

## Deferred / needs user

1. **`/cipher-gothic` palette divergence.** The page documenting the Cipher
   Gothic system uses page-local `--cg-accent` `#5CCFCF` / `--cg-coral`
   `#F07178` and Space Grotesk / Crimson Pro, while the shared tokens are
   `--teal` `#34c3b9` / `--coral` `#e85a4a` and Cormorant / DM Mono. Nothing
   overrides anything (different names), so this is not a bug — but the design
   system's own showcase page not matching the design system is a real
   question. Commented in place, not changed.
2. **`tailwindcss` devDependency.** Config is inert and labelled; the package is
   still installed. Keep (in case Tailwind gets wired up) or `npm rm tailwindcss`
   and delete the config.
3. **`public/fonts/atkinson-{bold,regular}.woff`.** The only two genuinely
   unreferenced font files in the repo — legacy `.woff` from
   `0063889 source repo import`, superseded by the `atkinsonhyperlegible-*.woff2`
   that `/intentional-fragility/` ships locally. Left in place.
4. **CDN fonts remaining under `/artifacts/`.** `tree-of-knowledge.html` and
   `publication-surface-v1.2.2.html` fetch from fonts.googleapis.com. Permitted
   by `ARTIFACT_CSP` and rendering fine, so not a defect — but they are the last
   third-party requests on a site that otherwise makes none.
5. **Uncommitted `@astrojs/sitemap` `3.7.3` → `^3.7.3`.** Predates this session;
   left exactly as found. Resolved version unchanged, so no effect either way.

## Non-actions (explicit)

- Nothing deleted. The duplicate route was archived to a tracked directory; both
  dead-config files remain on disk.
- `functions/` untouched — the CSP was satisfied by fixing the page, not by
  widening middleware.
- No dependencies added or removed. The 8 vendored woff2 came from `npm pack`
  tarballs and `node_modules`, following the convention `7525613` set.
