# CHECKPOINT — design-systems pass

**Last updated:** 2026-08-03 (session close — clean handoff to a new session)
**Branch:** `main`, in sync with `origin/main`. Working tree clean.
**Predecessor journals** (all closed, all under `docs/journal/archive/`):
`2026-07-28-cv-work-integration`, `2026-08-02-site-rot-sweep`,
`2026-08-03-design-sync-css-parity`.

## To resume — read in this order

1. This file.
2. `docs/journal/HANDOFF.md` — the ordered work queue, and this pass's
   decisions. Items 0 and 1 are closed; item 2 (radiate the seam) is done for
   SectionBreak / both PullQuotes / AuthorCoda. **The live next task is the
   astrolabe chrome — item 2 of "Next task" below.**

## What shipped this session

| Commit | What |
| --- | --- |
| `e0b65d4` | Constellation light mode actually reaches the sky (4 theme-blind literals) |
| `83b9362` | Brush-stroke seam on SectionBreak; last two CDN fonts self-hosted |
| `f1991c5` | Seam on both PullQuotes + AuthorCoda; `Seam.astro` extracted |
| `83e1725` | Swept every stale-palette / dead-fallback site (24 across 14 files) |
| `3b5d2f1` | Cormorant SC added; editorial.css / SignalHero / Tailwind / atkinson orphans retired |

All pushed. At close: `npm run check` 39 pages · `npm run test` 194 ·
`npm run docs:check` clean, zero warnings.

## Standing state

- **Three design systems, deliberately.** Kintsugi = site-wide palette
  (`--teal #5CCFCF`, `--coral #F07178`, `--gold #cda24e`, plus seam tokens).
  Cipher Gothic = one system deployed here, not the whole site (`--cg-*` type/
  space/motion + the `/cipher-gothic/` specimen). Haven/Ink = light mode, wired
  and live. `/artifacts/*` are self-contained and outside all three.
  **Not yet written into CLAUDE.md** — item 4 of HANDOFF.md.
- **The seam** lives in `src/components/Seam.astro` — one source for the
  geometry, `orientation="horizontal|vertical"`. Consumed by `SectionBreak`,
  both `PullQuote`s, `AuthorCoda`. Reference original: the `.seam` rules in
  `public/intentional-fragility/index.html`.
- **Zero third-party font requests** anywhere in `dist/`.
- **Two standing invariants**, both enforced by `check-docs-drift.sh` (§8, §9):
  every `url(*.woff2)` resolves, and no CDN font fetch outside `/artifacts/*`.

## Next task — astrolabe chrome over derived geometry

Agreed with mazze; not started. **Keep the derived node geometry**
(`decay.ts`/`layout.ts` — position means something: erasure→signal by age and
seal state) and adopt the astrolabe's *chrome*: limb, graduated ring, rete
overlay, labelled ecliptics. Do not replace the constellation with the flat
astrolabe plate — that swaps meaningful geometry for decorative.

Inputs mazze supplied:
- `~/Desktop/mazze-fully-cooked-landing.html` — the astrolabe markup. Its
  palette already matches Kintsugi. **Its copy is comp copy and explicitly not
  in mazze's voice — ship none of it.** It pulls Cormorant SC and Martian Mono
  from Google Fonts, CSP-blocked outside `/artifacts/*`; Cormorant SC is now
  self-hosted, Martian Mono is not.
- A reference image (orbital/gravitational — planets on gold geometry), closer
  in spirit to the existing gold-gravity-well constellation than to a flat plate.
- `~/Public/Design/lightmode-proto.html` — the Haven/Ink brush source. Its
  "instrument module" section (ink axes, waveform curves, ink-wash regions) is
  the nearest precedent for drawing the chrome.

## Deferred / needs a decision

1. **Design-sync parity is now stale.** The `2026-08-03-design-sync-css-parity`
   journal closed asserting `uploads/global.css` and `uploads/editorial.css` in
   the claude.ai/design project matched local. Since then this session rewrote
   `global.css` substantially and **retired `editorial.css` entirely**. That
   remote pair is out of date and one of them no longer has a local counterpart.
   Nothing re-checks this automatically. Re-sync or retire the remote copies.
2. **Three unused blog components.** `blog/Triptych`, `blog/MentorQuote`,
   `blog/VerseBlock` are imported by zero posts. Unlike what was retired this
   session they are *usable library surface*, not rot, so they were left alone —
   but `blog/Triptych` is the only consumer of `--font-caps`/Cormorant SC. Keep
   as library, or retire them and the font together.
3. **Martian Mono** — named by the landing proto, absent from the site.
4. **`--home-gold` reads circular** in the light block (maps to
   `--gold-seam-deep`, redefined in the same block). Resolves correctly; worth a
   comment or a direct hex.
5. **`docs/mazze-leczzare-cv.pdf`** duplicates `public/mazze-leczzare-cv.pdf`.
   Only `public/` ships.
6. **`/cipher-gothic` specimen** should read `var(--teal)`/`var(--coral)` rather
   than its page-local aliases, so the next palette change reaches it.

## Non-actions (explicit)

- Nothing deleted this session. Every retirement was a `git mv` into
  `docs/archive/retired-2026-08-03/`, documented in that directory's README.
- The three unused `blog/*` components were **not** retired — that is a library
  decision for mazze, not rot to clear unilaterally.
- No changes to `functions/`, to content, or to the constellation's derived
  geometry.
