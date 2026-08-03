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
| `public/fonts/` | 2 genuine orphans (`atkinson-{bold,regular}.woff`); the other 11 serve `/artifacts/tessera-claude-anchor.html` |
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

**Checked twice, wrong twice, settled on the third pass.** See the two
DECISIONS.md entries — the honest version is that I got this wrong in both
directions before getting it right:

1. First pass (audit turn): grepped `src/` only → "13 orphans, dead weight."
2. Second pass (Phase 2): grepped `public/` for the literal `/fonts/` → "24
   refs, 13 files, 14 production 404s." Vendored 14 files on that basis.
   Wrong: the string `/fonts/` substring-matches `./fonts/`, and both pages
   carry their own populated sibling `fonts/` directory. Reverted.
3. Third pass: a resolver that parses every `url(...)` in every HTML file under
   `public/`, resolves relative URLs against each page's own URL, and stats the
   target → **25 references, 0 broken, 2 orphans**
   (`public/fonts/atkinson-{bold,regular}.woff`).

**Standing lesson for this repo:** a path is not a string. Anything that claims
a file reference is dead or broken must resolve and stat it. Phase 6 encodes
this as a CI check so the next pass can't repeat it.

## Phases

- **Phase 1 — scaffold.** Archive the closed cv-work-integration journal set,
  scaffold this one, commit.
- **Phase 2 — VOID.** Premised on font 404s that do not exist. Vendored files
  removed, tree restored. Kept in the plan rather than edited out, so the
  reversal is legible to whoever resumes.
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
