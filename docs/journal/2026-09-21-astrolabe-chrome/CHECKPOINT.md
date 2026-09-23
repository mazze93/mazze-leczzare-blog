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

## Increment 1.5 — materiality rebuild (2026-09-23), still on the branch

**Mazze's read on increment 1's render:** liked the direction, not the
execution — "amateur," "childish," "lacking in design," reads as a prototype,
none of the editorial polish the rest of the site (and `BreathingHero`
specifically) carries. Diagnosed as a materiality problem, not a geometry
one — the derived positions were always correct; the chrome drawing them was
flat 1px strokes at uniform low opacity, a dashed-line boundary (the web's
default "here's an edge" affordance), and an 18px/10px card-radius limb that
matched no other radius on the site (`--radius-sm` is 3px, `global.css:124`).
Loaded `distinctive-frontend-design` before touching it.

Rebuilt on the same untouched geometry, borrowing techniques already proven
elsewhere on the site rather than inventing a fourth design system:

- **Gold gradient, not flat gold** — the majors, arcs, and alhidade now paint
  from the site-wide `--gold-seam-deep/bright/deep` ramp (`global.css`), the
  same stops `Seam.astro` paints the kintsugi crack with. Already carries its
  own light-mode override, so this ties the chrome's gold into the same gold
  as the rest of the site instead of a second, unrelated one.
- **Ecliptic arcs are solid with a glow underlayer**, not dashed — a dashed
  stroke is the single most generic "boundary" tell in web design. Each arc is
  now two paths: a wide blurred glow copy (`feGaussianBlur`) under a crisp
  gradient-stroked line.
- **The alhidade is a filled tapered blade**, not a stroked `<line>` — a
  straight-sided polygon, wide at the mater and filed to a point at the
  sighted end, deliberately geometric (as opposed to `Seam.astro`'s organic
  bezier taper: a ruled edge is machined, a seam is brushed). A faceted
  diamond pivot sits in a radial glow (`ConstellationNodes`' own
  `cn-well-glow` technique, reused) with a small sighting vane at the tip — the
  diamond motif repeats at both ends so the rule reads as one drafted object.
- **Sharp 3px corners with drafted register marks**, not an 18px card radius —
  `--radius-sm` value, plus small L-shaped crop-mark brackets at the four
  limb corners, the fastest legible signal that this frame was drafted rather
  than boxed.
- **Type hierarchy** — major labels bumped to 10.5px/500-weight with a
  stroke-based halo (`paint-order: stroke`, matching `.svyReadout`'s existing
  technique) so they hold against the busier arcs and star field; minor ticks
  thinned to 0.6px/0.4 opacity so they recede rather than compete.

**Not changed:** node geometry, the open fork below, increment 2's scope.
This is purely how increment 1's chrome is drawn.

**Verified:** `npm run check` (48 pages, tsc clean) · `npm test` (194/194) ·
`npm run docs:check` · `check-docs-drift.sh` — all green. Screenshotted via
`chrome-devtools` MCP (the `claude-in-chrome` extension would not return a
screenshot for this tab in this session — navigated fine, screenshot calls
errored "couldn't determine which page this action targets" across two fresh
tabs; switched tool rather than burn more turns on it) at 1400×900 landscape
and 500×1000 with `.sky--portrait` forced visible, both themes. Confirmed: no
dashing anywhere, gradient/glow render in both themes (no dark-literal
leftover), alhidade sight vane lands precisely on the gold node, portrait
labels rotate and hold their halo, and the `@media (max-width: 640px)`
declutter rule still fires (ecliptic labels and fine ticks drop at phone
width; major labels and the rule stay).

## Increment 2 — interaction + node glyph rebuild (2026-09-23), still on the branch

Two more rounds of direct feedback on the same render, in sequence:

1. **"no reactivity, no movement, no polish... dead... powerpoint slide with
   no transitions clicking through the pages."** Every navigation was a hard
   reload. Fix: `<ClientRouter />` (Astro View Transitions) added sitewide
   via `BaseHead.astro`, plus a `gravityPull` custom transition
   (`src/transitions/gravityPull.ts`) — a constellation node and its landing
   project page's `<h1>` share a `view-transition-name` and collapse/emerge
   through their own centre instead of the default crossfade. Nodes also
   grow and brighten on hover/focus now, so a node reads as reactive before
   the click. Verified with `document.getAnimations()` in a real browser
   that `::view-transition-new(node-maestro)` actually runs the custom
   `gravity-emerge` keyframe, not just Astro's default fade.

   **A real regression shipped internally before this was caught.** The
   first attempt to make `/constellation`'s own compass-dispatch script
   re-run on every SPA arrival added a bare `data-astro-rerun` attribute to
   eight component/page `<script>` tags. Any attribute other than `src`
   makes Astro treat a `<script>` as `is:inline` (unprocessed) — this shipped
   raw TypeScript straight into `dist/index.html` (`interface NoiseParticle`,
   `querySelector<HTMLElement>`, literally present in the built HTML) and
   broke the homepage breathing canvas and the header compass on every page.
   advisor() caught it before commit by reasoning from the exact console
   error (`SyntaxError ... replaceWith ... Unexpected token ':'`) back to its
   cause, rather than accepting my own read of it as devtools/tooling noise
   (which I'd talked myself into after it reproduced on totally vanilla,
   unrelated navigations — true, but for the wrong reason: Header is on
   every page, so "vanilla" navigations were never actually vanilla once
   Header's script was broken). Reverted all eight; the one script that
   genuinely needed to re-run (`/constellation`'s) was fixed the idiomatic
   way instead — wrapped in `document.addEventListener('astro:page-load', …)`.
   Confirmed via `grep` that no raw-TS markers remain in `dist/`, and via a
   real browser check that the homepage canvas repaints and the compass
   mounts again. Committed only after that was green (`217d27a`).

   Also fixed in the same pass, both surfaced by ClientRouter's
   `swapRootAttributes` (which replaces `<html>`'s whole attribute set on
   every navigation): a themeless flash mid-transition (`data-theme` set on
   the *incoming* document in `astro:before-swap`, not only reapplied
   after), and a stale-`localStorage`-read bug that would have silently
   replayed a mid-session theme toggle backward on the next navigation.

2. **"these basic circles for nodes have no depth or character. why not use
   the wealth of svg compass mark components i already built... youre not
   thinking with enough creativity."** `/constellation`'s nodes now render as
   the brand mark itself — `CompassMark.astro` (the seven glyph layers,
   extracted out of `Compass.astro` so there's one source, not a second
   hand-copied one) placed via `constellation/CompassNode.astro`, styled by
   the SAME `compass.css` state choreography the header mark uses. Zone →
   compass state is a real correspondence read off compass.css's own written
   meaning, not chosen to look good: `undefined`→`idle`, `experiment`→`focus`,
   `signal`→`engaged`, `resolved`→`complete` ("beam becomes dashed trail,
   pattern persists" — literally what an archive is). Resolved nodes no
   longer need a separate rect/diamond shape; the `complete` state carries
   that meaning on the same glyph now.

   **Also caught before shipping:** the zone-colour overrides and hover/focus
   rules initially did nothing — Astro scopes component `<style>` blocks per
   file, and a selector written in `constellation.astro` never matches an
   element rendered by `CompassNode.astro` (a different component) without
   `:global()`. Screenshotted before the fix (every node gold regardless of
   zone) and after (trace/teal/cream/gold correctly distinct, both themes)
   rather than assuming the CSS "obviously" worked because it built clean.

**Not done, scoped out on purpose:** the homepage hero (`ConstellationNodes.tsx`)
still draws nodes as plain CSS-circle `<span>`s and hard-navigates without
the gravity-pull morph on the SVG-name side (it does get `view-transition-name`
and so the browser's *default* crossfade-resize, just not the custom easing —
`transition:animate`'s custom keyframe pairing is an Astro compile-time
directive with no JSX/React equivalent). Same fix as increment 1, different
surface (React, not inline SVG) — a separate change, not a dropped thread.

**Verified, this increment:** `npm run check` (48 pages, tsc clean),
`npm test` (194/194), `docs:check`, `check-docs-drift.sh` — all green, checked
fresh after each fix, not just once. Both commits (`217d27a` interaction
layer, `86a62cc` node glyphs) pushed to the branch.

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
