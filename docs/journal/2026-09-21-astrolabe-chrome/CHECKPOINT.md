# CHECKPOINT — astrolabe chrome

**Opened:** 2026-09-21. **Branch:** `astrolabe-chrome` (not `main`).
**Predecessor:** `docs/journal/archive/2026-08-03-design-systems-pass/` — this is
that pass's "Next task", open since 2026-08-03 and untouched by three sessions.

## Why this is on a branch

`/constellation` is a public HIGH-posture surface and this is visible design, so
the milestone is mazze liking the render, not the build passing. Pushing `main`
deploys; the branch gets a Cloudflare Pages preview instead. It merges when
mazze says the plate looks right.

## Increment 1 — shipped to the branch

`src/components/constellation/AstrolabeChrome.astro`, mounted in both static
views of `/constellation` (landscape 1200×640, portrait 620×1080):

- **Limb** — a double-ruled band inset from the plate edge, ticked every 5% of
  the axis.
- **Graduated scale** — majors at the real thresholds: the archive seam (13%),
  full erasure (28% — where `ERASURE_DAYS` puts a node), the fresh-experiment
  edge (66% — `DRIFT_START_DAYS`), and the sealed signal band (78%). Only the
  two day figures carry type; the plate's existing captions already name the
  zones.
- **Ecliptics** — three bowed arcs at 25 / 50 / 75% drift. A node at drift *d*
  sits at `base − d·(base − 28)` for `base ∈ [40, 66]`, so constant drift is a
  **band**, not a line — the arcs are drawn at their true spread rather than as
  a crisp line that would overstate the instrument's precision.
- **Alhidade** — the rule, drawn from the mater at plate centre to the gravity
  well. The well is itself derived (heaviest live signal node), so the arm is a
  reading, not an ornament.

**Geometry untouched.** `decay.ts` / `layout.ts` / `nodes.ts` are unmodified and
all 194 tests pass without amendment — the brief's line is that the chrome may
read the derived geometry but never replace it.

## Verified

`npm run check` (48 pages) · `npm test` (194/194) · `npm run docs:check` ·
`check-docs-drift.sh` — green. Rendered in a browser on the dev server, theme
seeded in `localStorage` **before** load (setting it after is overwritten by
`BaseHead`'s inline script — the broken-probe lesson from 2026-08-03):

| State | Result |
| --- | --- |
| Landscape dark | Limb, scale, arcs and rule all read; gold arm to the well |
| Landscape light | Inverts correctly on Haven paper — no literal left behind |
| Portrait | Vertical limb, labels rotated in the left band, arcs bow across — **verified by forcing `.sky--portrait` to display, not by a real portrait viewport.** `resize_window` did not change the captured viewport, so the `(orientation: portrait) and (max-width: 820px)` query was never actually matched. The markup and the rotated label transforms are proven; the media query is not. |

**The arcs were probed, not eyeballed.** Looking at a curve cannot tell you
whether it encodes anything. A script re-derived `computeZone` → `nodePosition`
for the real manifest and for the band extremes, and checked each node's axis
position falls inside the arc pair bracketing its drift ratio:

```
decision-telemetry   drift=0.572  x=43.77  band=[33.14, 44.28]  INSIDE
synthetic d=0.10  base 40/66 → 38.80 / 62.20   band=[38.80, 62.20]  INSIDE
synthetic d=0.25  base 40/66 → 37.00 / 56.50   band=[37.00, 56.50]  INSIDE
synthetic d=0.50  base 40/66 → 34.00 / 47.00   band=[34.00, 47.00]  INSIDE
synthetic d=0.75  base 40/66 → 31.00 / 37.50   band=[31.00, 37.50]  INSIDE
synthetic d=0.90  base 40/66 → 29.20 / 31.80   band=[29.20, 31.80]  INSIDE
```

Only one node is currently drifting, so the real-data half of that is thin —
the synthetic sweep covers the corridor the manifest doesn't.

## Next, if mazze approves the direction

1. Give the hero the `--c-*` token set (dark + Haven light), which both fixes
   the literal above and is a precondition for the chrome rendering correctly
   there, then consume the same component in `BreathingHero.astro` (the homepage hero has
   its own survey furniture already — captions, isolines, asterism, callsign —
   so the chrome should extend that vocabulary, not duplicate it).
2. Decide the open fork below.
3. Merge to `main` and let it deploy.

## Open fork for mazze

The limb graduations currently **mean** something: they mark the decay
thresholds the zones are computed from. The alternative is a purely decorative
even scale (every 10%, unlabelled), which is quieter but says nothing. The
brief's thesis — meaningful geometry over decoration — points at the first, so
that is what is built; say the word if the plate reads too busy and the
decorative version is wanted instead.

## Outstanding — found in this pass, not fixed

**The homepage hero has a theme-blind gold literal.**
`ConstellationNodes.tsx` builds its `cn-well-glow` radial gradient from three
`stopColor="#e8b64c"` literals. `/constellation` draws the same gradient from
`var(--c-gold)`; the hero does not, so its gold bloom stays dark-mode-coloured
on Haven paper — the exact bug class `e0b65d4` fixed on the sky and that
`CLAUDE.md` now warns about.

It is **not a one-line fix**, which is why it is named here rather than
patched: the `--c-*` tokens are declared only on
`body[data-layout="constellation"]` and `.cn-page`, and the hero lives on `/`
under `data-layout="homepage"`, where `var(--c-gold)` resolves to nothing. The
honest fix is to give the hero the token set, which is increment 2's work
anyway — it is listed there.

## Not done

- Nothing from the landing proto's copy was used (it is comp copy, explicitly
  not in mazze's voice).
- Martian Mono is still absent and was not introduced — the type is DM Mono,
  self-hosted. A CDN font on this path would be CSP-blocked at runtime with no
  build error.
