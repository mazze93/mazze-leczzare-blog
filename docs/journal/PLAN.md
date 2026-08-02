# PLAN — site-rot-sweep

**Started:** 2026-08-02
**Branch:** `main`
**Prior task:** `docs/journal/archive/2026-07-28-cv-work-integration/` (closed,
shipped `534d84e`). Its final CHECKPOINT line names the one open item this task
picks up: mirror the Cipher Gothic Design System's fonts into the site.

## Request (restated)

Fix the documentation-drift issues surfaced by the CLAUDE.md audit, then read
the journal for unfinished website work and implement it. Don't let rot linger:
where a reference is wrong, make it right rather than routing around it. Prefer
commenting out over deleting. Move autonomously; surface real questions.

## Files in scope

| Path | Why |
| --- | --- |
| `src/styles/global.css` | `--cg-font-sans` (Inter) declared but never self-hosted |
| `public/fonts/` | 8 of 24 referenced font files are missing → production 404s |
| `public/intentional-fragility/index.html` | references 8 font files, 8 missing |
| `public/writing/what-i-can-stand-by/index.html` | references 6 font files, 6 missing |
| `public/essays/the-breakthrough-artifact.html` | Google-Fonts CDN under `font-src 'self'` → CSP-blocked |
| `src/pages/blog/the_breakthrough_artifact.html` | byte-identical duplicate of the above, publishes a 2nd URL |
| `src/styles/editorial.css` | imported by nothing; header comment tells you to add a Google Fonts `<link>` |
| `tailwind.config.mjs` + `package.json` | Tailwind installed, configured, and wired to nothing |
| `CLAUDE.md` | Astro/TS versions, Tailwind, fonts, component list all drifted |
| `scripts/ops/check-docs-drift.sh` | passed clean through every one of the above — coverage gap |
| `package.json` / `package-lock.json` | uncommitted `@astrojs/sitemap` caret change from a prior session |

## Load-bearing assumption + verification

**Assumption:** the unreferenced files in `public/fonts/` are orphans safe to
treat as dead weight (what I told the user at the end of the audit turn).

**Verified — and it was wrong, in the more urgent direction.** `git log --
public/fonts` traces them to `7525613 feat(artifacts): publish the
tessera-claude-anchor session record`. They are not orphans: they serve the
standalone HTML pages under `public/`, which my earlier grep missed because it
was scoped to `src/`. Re-running the scan across `public/` shows those pages
reference **24** font files while the directory holds **13**, under a different
naming convention. The defect is the inverse of what I reported: not unused
files to prune, but **missing files that 404 in production**.

Recorded as the first DECISIONS.md entry.

## Phases

- **Phase 1 — scaffold.** Archive the closed cv-work-integration journal set,
  scaffold this one, commit.
- **Phase 2 — fonts: vendor the missing files.** Fix the 404s in
  `/intentional-fragility/` and `/writing/what-i-can-stand-by/`. Six of the
  fourteen are already on disk in `node_modules/@fontsource/`; the rest need
  packages added.
- **Phase 3 — fonts: resolve `--cg-font-sans`.** The journal's open item.
  Self-host Inter so the Cipher Gothic sans token stops falling through to the
  system stack. Inter is already in `public/fonts/`.
- **Phase 4 — CSP: stop shipping CDN-font pages outside `/artifacts/`.**
  `font-src 'self'` blocks `fonts.gstatic.com` everywhere except `/artifacts/*`.
  Two pages violate this; one of them is a duplicate route.
- **Phase 5 — dead config.** Tailwind (installed, wired to nothing) and
  `editorial.css` (imported by nothing, with actively misleading instructions
  in its header). Comment out / quarantine, never delete.
- **Phase 6 — CLAUDE.md + drift-script coverage.** Truth up the doc, and extend
  `check-docs-drift.sh` so the classes of drift found here fail CI next time
  instead of passing green.
- **Phase 7 — close.** `npm run check`, `npm run test`, `npm run docs:check`,
  push.

## Constraints

- `npm run check` before every commit (repo standard).
- The `pre-push` hook refuses to push while `public/` holds untracked files —
  every font file added in Phase 2 must be `git add`ed in the same commit.
- Prefer commenting out to deleting (user instruction, this session).
- Commit + push at every phase boundary (global CLAUDE.md).
