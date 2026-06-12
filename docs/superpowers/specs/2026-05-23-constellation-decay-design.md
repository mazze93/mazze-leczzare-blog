# Constellation Decay — Design

**Status:** Approved direction; pending author review of this spec
**Author:** Mazze Leczzare (with Claude)
**Date:** 2026-05-23
**Scope:** mazzeleczzare.com — the homepage hero becomes a navigable, decaying constellation of project-nodes backed by Cloudflare KV.

**Supersedes:** Subsystems 2–4 of `2026-05-13-constellation-architecture-design.md`. Subsystem 1 (the Compass) **stands** — it is built and load-bearing. This spec replaces the post-node / authored-zone / static-grid model of the original Subsystem 2 with an emergent project-node / decay-driven / navigable-canvas model.

---

## Context

The site already ships:

- A three-zone breathing canvas hero (`src/components/BreathingHero.astro`) — decorative, `aria-hidden`, three zones positioned by horizontal thirds (Zone 1 noise / Zone 2 emergence / Zone 3 signal), with DARK/LIGHT palettes, mouse-pull, breathing nodes, and `prefers-reduced-motion` fallback.
- The Compass nav mark (`Compass.astro`, `CompassLink.astro`, `compass.css`) — Subsystem 1 of the original Constellation spec.
- A `/signal` content collection with a CRT-terminal `TransmissionFeed` reading experience.
- A `/blog` index with a featured-post + archive-list layout.

The original Constellation spec proposed turning `/blog` into a static three-column grid of **post-nodes** whose zone was **authored** in frontmatter. The vision has since evolved. The stronger idea: the **homepage hero itself** becomes the navigable surface, nodes represent **projects** (not individual posts), and a node's zone is **computed from how recently the work was touched** — so the site tells the story of progress. Neglected work drifts toward erasure; sealed work is immune. The studio is public — the bench is part of the story.

---

## Vision Summary

The homepage is not an introduction to the work — it **is** the work, in its current state. Each project is a node in a breathing field. Active projects glow in the center (experiment). Sealed, finished projects rest at the right (signal). Projects you stop touching drift left and dim, decaying toward the left edge (undefined / erasure). Clicking a node navigates to that project's page. A public `/studio` shows the same nodes as an activity-sorted worklist — the operator's bench, visible to all.

The arc **Erasure → Signal** is no longer a tagline. It is a force the site exerts on its own contents over time.

---

## Relationship to the 2026-05-13 Spec

| Element | 2026-05-13 (Constellation) | This spec (Constellation Decay) |
| --- | --- | --- |
| Subsystem 1 — Compass | Built | **Unchanged. Stands.** |
| Node granularity | one post = one node | one **project** = one node (emergent) |
| Zone assignment | authored in frontmatter | **computed from recency** + `committed` pin |
| Field surface | static CSS-grid 3 columns at `/blog` | navigable **DOM layer over the homepage canvas** |
| Backend | none (KV/DO deferred) | **Cloudflare KV** (read store), DO upgrade path |
| Studio | not present | public **`/studio`** activity lens |
| Zone vocabulary | `undefined / experiment / signal` | **same** — inherited deliberately |
| Reading pane (Sub 3) | glassmorphic pane | **deferred** — not in this spec's scope |
| Shatter/traces (Sub 4) | Voronoi shatter | **deferred** — not in this spec's scope |

The zone vocabulary (`undefined / experiment / signal`) and the two-amber color contract are inherited verbatim from the original spec (see Color Tokens below).

---

## Architecture Overview

```
Content files (frontmatter: project slug · updatedDate · committed?)
      │
      ▼ deploy
Deploy-time writer  ──▶  Cloudflare KV
  (per project: lastTouched, title, count, pieces[], committed)
      │
      ▼ per request
/api/nodes  (Pages Function)
  reads all node:* from KV
  computes zone = f(now − lastTouched, committed)
  returns JSON
      │
      ├──▶ Homepage canvas island  →  interactive DOM node layer over BreathingHero
      └──▶ /studio                  →  activity-sorted worklist (same data, different lens)

/project/[slug]  →  static page: the project's pieces, zone-tinted reading register
/blog            →  unchanged featured + archive list (the linear reading view)
```

Five moving parts, each with one responsibility:

1. **Content** — any blog/signal piece carries a `project` slug, `updatedDate`, and optional `committed` flag.
2. **Deploy-time writer** — on each deploy, aggregates content by project slug and writes node state to KV.
3. **`/api/nodes`** — a Pages Function that reads KV and computes each node's zone *fresh per request* from elapsed time. This is what makes decay advance continuously between deploys.
4. **Homepage canvas island** — progressive enhancement over the static hero: fetches `/api/nodes`, renders an accessible interactive node layer positioned by zone.
5. **`/studio`** — a public page reading the same `/api/nodes`, presented as a worklist sorted by activity / proximity-to-decay.

### Why render-time zone computation (not a cron)

Zone is computed in `/api/nodes` per request from `now − lastTouched`. A scheduled Worker that writes zone daily would double the infra and add a staleness failure mode between runs. Render-time computation means the only stored value is `lastTouched` (a fact), and zone (a derivation) is always current. Decay advances every second without anything having to run.

### Static-first preserved

The homepage stays static HTML. The headline, tagline, and CTAs ship in the initial response (good for SEO, fast first paint, and the no-JS fallback). The node layer is **progressive enhancement** — a client island that hydrates the interactive nodes after fetching `/api/nodes`. No `prerender = false` on the homepage; only `/api/nodes` is dynamic.

---

## Zone Model

A node's zone is a pure function of two inputs: whether the project is sealed, and how long since its most recent piece was touched.

```
if committed         → signal      (pinned; immune to decay — sealed, done)
else if age < 30d    → experiment  (active; full glow)
else if age < 180d   → drifting    (interpolated leftward, dimming)
else                 → undefined   (erasure; faded, near-gone, still clickable)
```

- **`age`** = `now − lastTouched`, where `lastTouched` = the maximum `updatedDate` (falling back to `pubDate`) across all pieces tagged with that project.
- **Sealing** (`committed: true` on any piece in the project, or on the project's canonical piece) pins the node to **signal** permanently. Finished work is *done*, not abandoned — it does not rot.
- **The drift band (30–180d)** maps `age` to a horizontal position and opacity between experiment and undefined, so a node visibly migrates as it ages rather than snapping between zones.
- You push a node rightward by **working** (a new `updatedDate`). You seal it with `committed`. Neglect pulls it left. This is the story of progress, told honestly.

Thresholds (30d / 180d) are starting values — tunable, surfaced for review below.

---

## Content Schema Extension

`src/content.config.ts` — add to **both** the `blog` and `signal` schemas:

```ts
// ── constellation fields ──
project:   z.string().optional(),   // slug — joins/creates a node. Singular for v1.
committed: z.boolean().optional(),  // true → node pinned to signal, immune to decay
```

- `project` is **singular** for v1 (`string`, not `string[]`). A piece that spans themes picks its dominant project. Multi-project membership is deferred.
- All fields optional → every existing post stays valid. A piece with no `project` simply has no node (it still lives in `/blog`).
- `updatedDate` already exists in both schemas and is the decay clock. No new date field needed.
- No `zone` field — zone is **never authored**; it is always derived. This is the core inversion from the 2026-05-13 spec.

---

## The Navigable Canvas (Homepage)

The interactive nodes are **real DOM elements layered over the decorative canvas**, not painted on it. The existing `<canvas>` stays `aria-hidden` ambiance. Hit-testing and accessibility on a `<canvas>` are hostile; a DOM layer is keyboard-navigable, focusable, and screen-reader-legible for free.

**Structure:**

- A new island (`ConstellationNodes`) mounts over `.breathing-hero`, absolutely positioned, `z-index` between the canvas (low) and the headline content (high).
- On mount it fetches `/api/nodes`, then renders one `<a href="/project/{slug}">` per node.
- Each node `<a>` is positioned by **zone → horizontal band** (undefined = left third, experiment = center, signal = right third) with seeded vertical jitter (seed = slug) for stable, non-grid placement.
- Node visual reflects zone: size, glow color (zone token), and opacity (drift band dims toward undefined). A label (project title) is visible on hover/focus and always present to assistive tech via the link text.
- The existing hero headline / tagline / CTAs **remain** as the layer beneath — they are the fallback for no-JS, keyboard-first, and screen-reader users, and remain useful for everyone.

**Accessibility (HIGH posture — non-negotiable):**

- Each node is a real `<a>` with descriptive text (`"{project title} — {zone} zone"`); tab order runs undefined → experiment → signal.
- Visible focus ring; 44×44px minimum hit target (the glow halo, not just the core dot).
- `prefers-reduced-motion`: the decorative canvas already hides itself; nodes render in static positions with no entry animation.
- No-JS: the static hero with its CTAs is fully functional; nodes are enhancement only.
- The node layer must not introduce CLS — reserve its space or mount it without shifting the headline.

**Mobile is a real concern, not a footnote.** 10–20 absolutely-positioned nodes on a 375px full-viewport hero will be cramped. The mobile interaction strategy (stacked list per zone? a zone-switcher? pinch-zoom?) is **to be detailed in the plan**, not forced into this spec. v1 must at minimum degrade to a legible, tappable list on narrow viewports.

---

## Decay Mechanics (KV + `/api/nodes`)

**KV store** — one entry per project node:

```
key:   node:{slug}
value: {
  slug:       string,
  title:      string,         // project display name
  lastTouched: string,        // ISO — max updatedDate across pieces
  committed:  boolean,
  count:      number,         // pieces in this project
  pieces:     [{ id, title, type: "blog"|"signal", pubDate }]
}
```

**Deploy-time writer** — a build/deploy step aggregates `getCollection('blog')` + `getCollection('signal')` by `project` slug and upserts each `node:{slug}` to KV. `lastTouched` is sourced from frontmatter at deploy. (If wrangler/KV write integration proves heavy for v1, the fallback is emitting a bundled `nodes-manifest.json` the Function reads instead — same shape, no live mutability. Primary path is KV, for the DO upgrade path.)

**`/api/nodes` Pages Function:**

- Reads all `node:*` from KV.
- For each, computes `zone` and a `driftRatio` (0–1 within the 30–180d band) from `now − lastTouched`, honoring the `committed` pin.
- Returns `{ nodes: [{ slug, title, zone, driftRatio, committed, count, pieces }] }`.
- CORS: same-origin only — no wildcard. HTTPS only (Cloudflare default).
- No secrets in the Function; KV binding via `env`.

**Upgrade path to Durable Objects (deferred, not v1):** a "touch" action from `/studio` that resets a node's `lastTouched` without a git commit would write to a DO (or KV via authenticated mutation). v1 has no mutation endpoint — touching = committing = deploying. The KV-as-read-store design makes this a clean later addition.

---

## Project Pages — `/project/[slug]`

A static page per project slug (generated via `getStaticPaths` from the union of project slugs across collections):

- Lists every piece tagged with that project, newest first.
- Inherits its **zone's visual register**: a signal project reads crisp and fully rendered; an undefined/erasure project reads faded, degraded, low-contrast-but-still-WCAG-AA — the decay is a reading experience, not just a canvas state.
- Real URL: shareable, bookmarkable, crawlable. This is why we chose navigation over an inline dialog — accessibility and SEO both win.
- Zone here is computed at **build time** from frontmatter (static page); the live drift lives on the canvas. A project page showing yesterday's zone is acceptable; the canvas is the live surface.

---

## Studio — `/studio`

A public page: the operator's bench, made visible.

- Reads the same `/api/nodes` data.
- Presents nodes as a **worklist sorted by activity** — most recently touched first, with each row showing: project title, current zone, last-touched date, piece count, and proximity-to-decay ("12 days until drift", "sealed", "in erasure").
- It is a **lens on the same nodes**, not a separate content store. Spatial view (homepage) and list view (studio) read identical data.
- Public by design — the messy middle is part of the site's story, not hidden from it.

---

## `/blog` Disposition

`/blog` stays as the existing **featured-post + archive-list** layout — the linear, chronological reading view. The canvas is the *spatial* view; `/blog` is the *temporal* view. No structural change in v1. (Static HTML artifacts under `src/pages/blog/*.html` continue to live here and are **canvas-less for v1** — they have no frontmatter, thus no project slug, thus no node. A sidecar-JSON / git-last-modified path to give them nodes is deferred.)

---

## Color Tokens

**Inherited verbatim from the 2026-05-13 spec — do not collapse.** The two ambers are deliberately distinct:

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--zone-undefined` | `#f2f4f8` @ low op | `#161410` @ low op | Erasure nodes — drift, fade |
| `--zone-experiment` | `#2bd3c6` (teal) | `#2bd3c6` | Active nodes — emergence. BreathingHero signature. |
| `--zone-signal` | `#f4a261` (amber) | `#f4a261` | Sealed nodes — **content-type amber, locked grammar** |
| `--gold` | `#d4a574` | `#8a6a3a` | **Brand/compass amber — warmer, NOT interchangeable with zone-signal** |

`--zone-signal` (#f4a261) marks *content state*; `--gold` (#d4a574) marks *brand*. A rewrite must preserve both — merging them is a silent regression.

---

## Out of Scope

**Deferred to later cycles (good ideas, not now):**

- The glassmorphic reading pane (original Subsystem 3) and Voronoi shatter/traces (Subsystem 4).
- Durable Objects + a `/studio` "touch" mutation action (the DO upgrade path).
- Multi-project membership (`projects: string[]`).
- Canvas nodes for static HTML artifacts (sidecar JSON / git-last-modified).
- A bespoke mobile constellation interaction beyond a legible degraded list.

**Permanently out of scope (Praxis posture):**

- Algorithmic recommendations. Connections/projects are authored, never engagement-optimized.
- localStorage for any state. (KV server-side; no client personalization store.)
- Wildcard CORS in production.

---

## Open Questions for Author Review

1. **Decay thresholds.** 30d → start drift, 180d → full erasure. Do these match your sense of how fast neglected work should fade?
2. **What seals a node?** `committed: true` on *any* piece in a project, or only on a designated canonical piece? (Default assumed: any piece seals the whole node.)
3. **Project page zone — build-time vs. live.** Spec'd as build-time (static page shows zone as of last deploy); only the canvas is live. Acceptable, or do you want project pages edge-rendered too?
4. **KV vs. manifest for v1.** Primary path writes to KV (DO-upgradeable). Fallback is a bundled `nodes-manifest.json` (simpler, no live mutability — but decay still advances since `/api/nodes` computes `now − lastTouched`). Prefer KV from the start, or ship the manifest and add KV with the DO work?
5. **Studio scope for v1.** Read-only worklist (no touch action). Confirmed?

---

## Verification (after implementation)

| Check | Command / method | Threshold |
| --- | --- | --- |
| Type + build | `npm run check` | passes |
| Visual smoke | `npm run dev` → exercise `/`, `/studio`, `/project/[slug]` | manual pass |
| Decay correctness | seed nodes at varied `lastTouched`; verify zone via `/api/nodes` | matches model |
| Lighthouse | `lhci autorun` (in CI) | a11y ≥ 95, perf ≥ 85 on `/` |
| Reduced motion | OS toggle → reload | no animation; all nodes navigable |
| Keyboard nav | Tab through homepage nodes | full coverage, visible focus, 44px targets |
| No-JS | disable JS | static hero + CTAs functional; `/blog` and `/project` navigable |
| CLS | Lighthouse / field | no layout shift from node-layer mount |

---

## Critical Files Reference

- `src/components/BreathingHero.astro` — decorative canvas; node layer mounts over it
- `src/content.config.ts` — schema extension (`project`, `committed`)
- `src/consts.ts` — any new shared constants
- `src/styles/global.css` — color tokens (preserve both ambers)
- `2026-05-13-constellation-architecture-design.md` — Subsystem 1 (Compass) reference; Subsystems 2–4 superseded by this doc

Files to create:

- `src/components/constellation/ConstellationNodes.{astro,tsx}` — the interactive node layer island
- `functions/api/nodes.ts` (or Astro endpoint) — the `/api/nodes` Pages Function
- `src/pages/project/[slug].astro` — project pages
- `src/pages/studio.astro` — the studio worklist
- deploy-time KV writer (build script or Astro integration hook)
- `src/styles/constellation.css` — node layer + zone token styling
