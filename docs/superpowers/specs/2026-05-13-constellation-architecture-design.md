# Constellation Architecture — Design

> **⚠ Subsystems 2–4 superseded (2026-05-23)** by `2026-05-23-constellation-decay-design.md`.
> The post-node / authored-zone / static-grid model below was replaced by an emergent
> project-node / recency-decay / navigable-canvas model. **Subsystem 1 (the Compass) STANDS** —
> it is built and load-bearing. Read this doc only for Subsystem 1 and the color system; the
> field/pane/shatter sections are historical.

**Status:** Subsystem 1 shipped. Subsystems 2–4 superseded — see note above.
**Author:** Mazze Leczzare (with Claude)
**Date:** 2026-05-13 (refined 2026-05-14)
**Scope:** mazzeleczzare.com — full site re-architecture from chronological blog to navigable constellation

**Refinements (2026-05-14):**

- The compass **is** the brand logo. It replaces the legacy cyan-blue "M" favicon entirely: update `public/favicon.svg` to the compass mark and remove all references to the old favicon for consistency.
- Glyphs (the SITE_TITLE wordmark, the body typography) remain — compass + glyph live side-by-side in the header. The compass leads, the wordmark follows. Both elements must be accessible to screen readers and keyboard navigation, and visually balanced for all users.
- Brand light and dark modes both supported. Reference: the user-supplied compass behavior/scalability sheet (see `/design/compass-behavior-scalability.pdf` in the repo or ask Mazze for the latest version).
- All animation, tessellation, fragment physics, and SVG drawing are **hand-coded**. No external libraries beyond what is already in `package.json`. The cost of the abstraction is higher than the cost of writing it. **Any future additions to dependencies must be strictly justified and reviewed as an explicit architectural exception.**
- Color system refined — see _Color System_ section below. Gold on obsidian / gold on deep navy is primary; deep indigo and burnt wine are accent; purple (magenta) is used sparingly and only in transient states (e.g., Voronoi shard tint for cross-zone resonance).

---

## Context

The site presently ships a refined three-zone breathing canvas hero (`src/components/BreathingHero.astro`) that establishes a complete visual grammar: noise → emergence → signal, nodes that breathe darkness outward via radial pulsation, lines of connection that form progressively over time, and cursor-pull interaction that draws nearby nodes toward the reader. The grammar collapses the moment the hero ends. The blog listing is a chronological list; posts open as standalone documents with no awareness of their place in a larger network; the visual register changes register entirely.

The vision is that the hero is not the introduction to the site — **it is the site's operating logic, made visible**. The arc _Erasure → Signal_ is not a tagline but an ontology. Every piece of content is a lighthouse that lives in one of three zones (`undefined`, `experiment`, `signal`), holds an internal thesis (a one-sentence burning core), and has authored resonances with other nodes. Navigation is not a header — it is a **compass**: a living SVG mark with five behavior states (Origin, Intention, Refraction, Transmission, Return) and five micro-interactions (Idle, Hover, Focus, Engaged, Complete), scaling from 16px favicon to hero element. Reading happens inside **glassmorphic stained-glass panes** that rise from a node and **shatter on exit**, leaving low-opacity afterimage traces in the constellation field. The field becomes a palimpsest of what the reader has moved through.

This document specifies the full system as four sequential subsystems, each independently shippable.

---

## Vision Summary

> A living, breathing collection of nodes where each represents a complete solarium of thought, experiment, code, project, discourse, essay, prose, art, history, music — a constellation that revels in Faulknerian brooding darkness but which holds internally a light that refuses to burn out. Constellations of lighthouses that speak across their disparate waters and guide whoever is among them from within into and towards another, navigated by a compass that stays true to the north that it remembers and refuses to bend to the hegemonic constraints of the substrate of the sky that tries to contain it. From erasure, to signal, and breathing, like the landing already designed, in three segments from undefined, to experiment, to signal.

Operative translations:

- **Constellation** → spatial collection view with zone-based positioning + authored connection lines.
- **Lighthouse / internal light** → `internalLight` field on each node: one sentence, the burning core.
- **Compass / true north** → SVG navigation mark replacing the wordmark; it is the favicon, the header logo, the loading indicator. Its behavior states _are_ the site's interaction language.
- **Faulknerian brooding darkness** → deep navy (`#0b0d12`) as substrate, never broken — even the reading pane is glassmorphic over the same field.
- **Refuse the hegemonic substrate** → the compass and zone system are user-authored taxonomies, not engagement-optimized recommendations. No "you might also like." Only resonances Mazze has declared.
- **Three segments** → the schema is `'undefined' | 'experiment' | 'signal'`. This is permanent and load-bearing for layout, color, animation timing, and trace color.
- **Breathing** → all motion in the system respects `prefers-reduced-motion` with a static fallback that preserves the dark register.

---

## Color System

The brand operates with **two intentional substrates** (obsidian and deep-navy, near-twins; obsidian is for the compass mark in isolation, deep-navy carries the BreathingHero forward to the rest of the site), a **single primary brand mark color** (warm gold), and a **deliberate accent triad** (deep indigo, burnt wine, ash-amber). Magenta from the original BreathingHero palette is **reduced to a transient role** — it appears only in cross-zone Voronoi shard tint and connection lines that span two zones. The full constellation field carries the existing zone colors (teal, amber, white) for nodes — those are locked because they are the BreathingHero's grammar.

**Brand palette tokens** (added to `src/styles/global.css` as CSS custom properties — light/dark adaptive):

```text
                          Dark mode value      Light mode value     Role
─────────────────────────────────────────────────────────────────────────────────────
--obsidian                #050406              #f4f1ea              Compass-only substrate (favicon, brand isolates).
                                                                    Darker than deep-navy. Pure absence.
--deep-navy               #0b0d12              #f0ede5              Site substrate. Inherited from BreathingHero.
                                                                    What every other surface sits on.
--gold                    #d4a574              #8a6a3a              Brand primary. The compass color. Warm, not yellow.
                                                                    Matches the user's compass reference image.
--gold-bright             #f4d29a              #b0865a              Compass beam / sparkle / engaged-state highlight.
                                                                    Used only in focus/engaged/complete states.
--gold-dim                #8a6a3a              #d4a574              Compass at rest, low intensity. Inversion of above
                                                                    so the mark remains legible in light mode.
--indigo-deep             #323c5a              #6b7a9a              Accent. Drowned indigo. Pull-quote rules, dividers,
                                                                    subtle connection lines in the constellation field.
--wine-burnt              #502838              #8a5a6a              Accent. Bruised wine. Used for emphasis ranges,
                                                                    hover state on type-tagged "essay" nodes.
--ash-amber               #8c6450              #b08570              Accent. Type-tagged "field-note" + "prose" nodes,
                                                                    secondary glow halo.
--moss-black              #3c4632              #6a7460              Accent. Type-tagged "code" + "experiment" nodes.
                                                                    Reserved for technical content.
--text                    #e6e0e9              #161410              Body text. (Dark-mode value carries warmth from
                                                                    --wine + --indigo cast — not pure white.)
--text-muted              #a18fa8              #6a6862              Subordinate text. Captions, labels, deck.
--text-faint              #5a4c5e              #b0aeab              Quaternary. Metadata, timestamps.

# Magenta is preserved but demoted:
--magenta-transient       #c04bb7 @ 0.18 max   #804077 @ 0.18 max   ONLY for: cross-zone connection lines,
                                                                    cross-zone Voronoi shard tint. Never as
                                                                    fill or border in static UI. Sparing.

# BreathingHero zone colors (locked — do not modify):
--zone-undefined          #f2f4f8 @ low op     #161410 @ low op     White particles, drift.
--zone-experiment         #2bd3c6              #2bd3c6              Teal. Emergence, becoming. ← Note: teal carries
                                                                    across themes; it is the BreathingHero's signature.
--zone-signal             #f4a261              #f4a261              Amber. (Distinct from --gold: zone-signal is the
                                                                    BreathingHero amber, kept for continuity.
                                                                    --gold is the compass-brand warmer cousin.)
```

**Two ambers, deliberately.** `--zone-signal` (`#f4a261`) is the BreathingHero's amber — established, in production, carried forward. `--gold` (`#d4a574`) is the compass-brand warm gold from your reference image — slightly cooler, slightly more muted. They are near-neighbors but **not interchangeable**: zone-signal marks node _content type_; gold marks the _brand_. The compass uses gold. Signal nodes use zone-signal.

**Theme transitions.** The site already supports light/dark via `ThemeToggle.tsx` + `data-theme` on `<html>`. All compass and constellation tokens above must respond to `[data-theme="dark"]` and `[data-theme="light"]` selectors, with the dark variant as the default (matches the site's identity).

**Color-theory references** (drawn from `gay_wandering_rewritten.html` and the existing BreathingHero):

- The indigo-deep, wine-burnt, ash-amber triad comes directly from Gay Wandering's palette (drowned indigo `rgb(50,60,90)`, bruised wine `rgb(80,40,60)`, moss-black `rgb(60,70,50)`). Reusing that palette ties the editorial voice across mediums — poetry and essay share a chroma.
- The compass amber tone (`#d4a574`) was selected to match the user's compass reference sheet at the dark-mode preview tile; it is intentionally warmer than `#f4a261` so the brand mark reads as "gold" rather than "construction-cone orange."
- The obsidian/deep-navy near-pair allows the favicon to read as a pure-black tab icon while the site interior preserves the BreathingHero's subtle navy substrate. The 6-point lightness gap is intentional and not visible to the eye in normal viewing.

---

## Architecture Overview

Four subsystems. Each has a single responsibility and a defined interface to the next.

```
 ┌─────────────────┐     ┌──────────────────────┐     ┌────────────────┐     ┌─────────────────────┐
 │  1. COMPASS     │ ──▶ │  2. SCHEMA + FIELD   │ ──▶ │  3. PANE       │ ──▶ │  4. SHATTER+TRACES  │
 │  navigation     │     │  zone, light,        │     │  glassmorphic  │     │  voronoi shards +   │
 │  + favicon      │     │  connections,        │     │  reading       │     │  afterimage canvas  │
 │  (5 states)     │     │  spatial canvas      │     │  overlay       │     │  in sessionStorage  │
 └─────────────────┘     └──────────────────────┘     └────────────────┘     └─────────────────────┘
     load-bearing             requires #1                requires #2              requires #3
     for everything           data model                 to know what
     downstream                                          a node *is*
```

**Interface contracts** (each subsystem produces what the next consumes):

| Subsystem           | Produces                                                                                                                                 | Consumed by                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1. Compass          | `<Compass>` Astro component with `state` prop (`idle\|hover\|focus\|engaged\|complete`), favicon SVG, CSS state tokens                   | All later subsystems use the compass as nav, loading indicator, and pane corner mark |
| 2. Schema + Field   | Extended Zod schema (`zone`, `nodeType`, `internalLight`, `connections`); `<ConstellationField>` React island; `/blog` route replacement | Pane needs `internalLight`, `connections`, zone color tokens                         |
| 3. Pane             | `<ReadingPane>` overlay component, route adapter that intercepts node clicks, `pane:open` / `pane:close` custom events                   | Shatter system listens for `pane:close` and reads the pane's bounding rect           |
| 4. Shatter + Traces | Voronoi fragmenter, persistent canvas overlay, `sessionStorage`-backed trace registry                                                    | (Terminal — completes the loop)                                                      |

---

## Subsystem 1 — The Compass

The user has already designed the compass visually (see the behavior/micro-interaction reference image). It has:

**Five behavior states** (the philosophical arc — these are not separate icons, they are stages of a single mark animating through):

1. **Origin** — system in rest; potential contained. (Idle baseline.)
2. **Intention** — signal enters; alignment begins. (User attention detected.)
3. **Refraction** — truth bends through the lens of context. (Beam blooms diagonally.)
4. **Transmission** — pattern exits; system yields. (Beam fully expressed; sparkle at exit point.)
5. **Return** — the pattern continues; the loop remains open. (Beam dashed/trailing; restoration toward Origin.)

**Five micro-interaction states** (the UI surface — what the _user_ triggers):

- `idle` — Origin, slow ambient breath
- `hover` — Intention, beam start emerging
- `focus` — Refraction, full beam visible
- `engaged` — Transmission, sparkle active
- `complete` — Return, dashed trailing

**Anatomy** (SVG layer order, all in `currentColor` for light/dark adaptation):

- Outer broken ring (rotates very slowly at idle)
- Inner orbital arc with break
- Center vertical almond/petal (the "north" — never moves)
- Four cardinal spikes (the compass star)
- Diagonal transmission beam (opacity 0 at idle, blooms to 1 by `focus`)
- Convergence sparkle (opacity 0 except `engaged`)

**Scalability:** the SVG is authored at viewBox `0 0 64 64` with stroke widths defined via CSS custom properties keyed to size buckets (favicon 16/32, nav 32, hero 128–256). Stroke widths _do not_ scale linearly — they thicken at small sizes to preserve legibility.

**Files:**

| Action | Path                               | Responsibility                                                                                                                                                                                                                                          |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create | `src/components/Compass.astro`     | The SVG mark. Props: `size: number` (default 32), `state?: 'idle'\|'hover'\|'focus'\|'engaged'\|'complete'` (default `'idle'`), `aria-label?: string`. Renders inline SVG with `data-state` attribute.                                                  |
| Create | `src/components/CompassLink.astro` | Wraps `<Compass>` in an `<a>`, handles hover/focus state transitions in pure CSS (no JS), exposes `href` and `label` props.                                                                                                                             |
| Create | `src/styles/compass.css`           | Compass tokens (`--compass-stroke`, `--compass-glow`, `--compass-beam`), `@keyframes compass-idle-breath`, `[data-state]` selectors driving opacity/transform of inner SVG groups. Respects `prefers-reduced-motion`.                                   |
| Modify | `src/styles/global.css`            | `@import "./compass.css";` near the top of the custom-properties section. Add `--compass-amber: #f4a261;` and reference `--teal` (already defined).                                                                                                     |
| Modify | `public/favicon.svg`               | Replace the stylized-M with the static `idle`-state compass markup (16px-optimized stroke widths). Uses `currentColor` + `@media (prefers-color-scheme)` for dark/light adaptive.                                                                       |
| Modify | `src/components/Header.astro:6-19` | Replace the `<a class="wordmark">…</a>` line with `<CompassLink href="/" size={32} label={\`${SITE_TITLE} — home\`} />`. Keep the wordmark text alongside the compass in a `.brand` flex group so the word remains while the mark gains visual primacy. |
| Modify | `src/components/BaseHead.astro:63` | Keep `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` (path unchanged); add a secondary `<link rel="mask-icon" href="/favicon.svg" color="#f4a261" />` for Safari pinned-tab.                                                             |
| Modify | `src/consts.ts`                    | Add `COMPASS_LABEL = "Compass — true north"` for screen reader / aria-label use.                                                                                                                                                                        |

**Acceptance criteria:**

- The compass renders at 16/32/128/256 px without legibility loss (verify visually).
- Hovering the compass in the header advances the state through `idle → hover → focus` and back when the cursor leaves. Animation does not chatter on rapid in/out.
- `prefers-reduced-motion: reduce` disables the idle breath and all state transitions — the mark stays at `idle`'s pose.
- Favicon renders correctly in browser tabs in both light and dark OS themes.
- Lighthouse a11y score on the homepage stays ≥ 95.
- `npm run check` passes (build + tsc strict).

**Out of scope for Subsystem 1:** the `engaged` and `complete` states are _implemented_ but not yet wired to anything. They will fire from the reading pane and shatter system in Subsystems 3 and 4. Defining them now means later subsystems plug in without modifying the compass component.

---

## Subsystem 2 — Content Schema + Constellation Field

This subsystem teaches the site that content has a **position** (zone), a **type** (essay, code, art, music, field-note…), an **internal light** (the burning thesis), and **connections** (authored slugs of resonant pieces).

**Schema extension** (`src/content.config.ts`):

```ts
schema: ({ image }) => z.object({
  // ── existing fields preserved ──
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  heroImage: image().optional(),
  subtitle: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  heroImageOG: z.string().optional(),
  heroImageAlt: z.string().optional(),
  featured: z.boolean().optional(),
  slug: z.string().optional(),
  draft: z.boolean().optional(),

  // ── constellation fields ──
  zone: z.enum(["undefined", "experiment", "signal"]).default("undefined"),
  nodeType: z.enum([
    "essay", "code", "art", "music",
    "field-note", "experiment", "project", "prose"
  ]).default("essay"),
  internalLight: z.string().optional(),         // one sentence; the burning core
  connections: z.array(z.string()).default([]),  // slugs of resonating nodes
}),
```

All new fields except `zone` and `nodeType` are optional or defaulted, so existing posts remain valid. A migration step (Subsystem 2, Task N) authors `zone` and `internalLight` for the 11 existing posts.

**The constellation field** (`/blog` page replacement):

- New route handler at `src/pages/blog/index.astro` renders three column zones using CSS Grid. Each zone is a `<section>` with `data-zone="undefined|experiment|signal"`.
- Inside each zone, posts assigned to that zone render as `<NodeCard>` elements. Cards are not in chronological order within a zone — they are positioned via a deterministic seeded random layout (seed = `post.id`) so each card has a stable position across renders, with offsets in x and y to avoid grid-feel.
- A `<ConnectionsLayer>` React island (client-only, accessibility-degradable) renders an absolute-positioned `<canvas>` over the field that draws low-opacity lines between connected nodes. Lines are drawn from card center to card center using the same color palette as the BreathingHero (zone-2 teal, zone-3 amber, with magenta for cross-zone resonances).
- The page enters with the same `heroFadeIn` animation curve as the BreathingHero content, staggered per zone (undefined → experiment → signal arrives last, 200ms apart).

**Files:**

| Action  | Path                                                    | Responsibility                                                                                                                                                                                                    |
| ------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modify  | `src/content.config.ts`                                 | Extend Zod schema as above.                                                                                                                                                                                       |
| Create  | `src/components/constellation/NodeCard.astro`           | One node card: glow-dot, type label, title, internalLight (signal/experiment only), connection chips. Pure Astro — no JS. Zone color via CSS data attribute.                                                      |
| Create  | `src/components/constellation/ZoneColumn.astro`         | One zone column with label, divider, and slot for nodes. Handles seeded positional jitter via inline `style={\`transform: translate(…)\`}` per child.                                                             |
| Create  | `src/components/constellation/ConnectionsLayer.tsx`     | Canvas 2D React island. Receives `nodes: NodePosition[]` and `connections: [slug, slug][]`. Resizes on window resize. Skips render under `prefers-reduced-motion` (returns empty canvas — does not block layout). |
| Create  | `src/components/constellation/ConstellationField.astro` | Composes ZoneColumns + ConnectionsLayer. Reads `getCollection('blog')`, groups by zone, computes connection edges.                                                                                                |
| Replace | `src/pages/blog/index.astro`                            | Replace existing list with `<ConstellationField />` inside `BaseLayout`. Preserve `<BaseHead>`, `<Header>`, `<Footer>`.                                                                                           |
| Create  | `src/styles/constellation.css`                          | Zone color tokens, grid layout, card hover transitions, glow-dot keyframes (`@keyframes breatheDot` — same 2.5s curve as the BreathingHero's node breath).                                                        |
| Modify  | each MDX/MD post in `src/content/blog/*`                | Add `zone` and `nodeType`. Author `internalLight` where it earns its keep. Add `connections` where genuine resonance exists. (12 files total; an audit/migration task.)                                           |

**Zone color contract** (used by Subsystems 2, 3, and 4):

| Zone         | Token               | Hex                          | Source of meaning                                                   |
| ------------ | ------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `undefined`  | `--zone-undefined`  | `#f2f4f8` @ very low opacity | White particles from BreathingHero Zone 1 — drift, unfinished       |
| `experiment` | `--zone-experiment` | `#2bd3c6` (teal)             | Teal nodes from BreathingHero Zone 2 — emergence, becoming          |
| `signal`     | `--zone-signal`     | `#f4a261` (amber)            | Amber connections from BreathingHero Zone 3 — settled, transmitting |

**Acceptance criteria:**

- `/blog` renders the three-zone field; every existing post appears in its declared zone.
- Connection lines appear when JS loads; their absence does not break layout or readability.
- Cards are keyboard-navigable (tab order: undefined → experiment → signal, top-to-bottom within zone).
- Each card's link target is the existing `/blog/[slug]/` route — the pane (Subsystem 3) intercepts that click later; without the pane, the link still works as a normal page navigation.
- `npm run check` passes. Lighthouse a11y ≥ 95.

**Out of scope for Subsystem 2:** the `/about`, `/work`, `/security`, `/roadmap` pages remain unchanged. They'll be re-themed once the constellation grammar settles. Homepage layout below the BreathingHero is _not_ touched in this subsystem — the homepage still shows a list of recent posts. The constellation lives at `/blog` only, by design, so this subsystem can be merged and lived with before deciding how it should bleed into `/`.

---

## Subsystem 3 — Glassmorphic Reading Pane

When a reader enters a node, they should not leave the field. The pane rises _over_ the constellation; the field continues breathing behind it through `backdrop-filter: blur()`. The pane's edge highlights, border tint, and corner accents are zone-colored — reading a signal-zone essay glows amber at the edges; an experiment-zone piece glows teal.

**Interaction model:**

- Clicking a `<NodeCard>` calls `event.preventDefault()` and dispatches a `pane:open` custom event with `{ slug, zoneColor, originRect }`.
- A `<ReadingPaneRoot>` island mounted once at the layout level listens for `pane:open`, fetches the post content via `fetch('/blog/' + slug + '/?pane=1')`, and mounts the content inside the pane.
- URL updates via `history.pushState({ pane: slug }, '', '/blog/' + slug + '/')`. Popstate (back button) triggers `pane:close`.
- Pressing `Esc`, clicking the close button, or clicking outside the pane triggers `pane:close`.
- The pane has its own scroll. The constellation field is `aria-hidden="true"` while the pane is open. Focus is trapped inside the pane.

**Static site constraint:** the site is `output: "static"` (Astro SSG). The pane fetches the _static HTML_ of the target post page and extracts just the `.prose` block (the post body) via `DOMParser`. This means no server changes; the pane is purely a presentation layer over content that is already published. The query param `?pane=1` is a hint for future progressive enhancement (e.g., a server-rendered minimal HTML variant) but the MVP ignores it.

**Stained-glass aesthetic:** the pane background is a 4-stop linear gradient at 135° that blends the three zone colors at low opacity over a deep `rgba(11,13,18,0.7)` base. A pseudo-element `::before` layers a second gradient at the same angle with shifted color stops to create the prismatic edge-light effect visible in the brainstorm mockup. `backdrop-filter: blur(24px) saturate(140%)` does the heavy lifting; fallback for unsupported browsers is a solid `rgba(11,13,18,0.92)` background — still readable, just less luminous.

**Compass integration:** when the pane is open, the header compass advances to `state="focus"` (Refraction — truth bending through the lens of context). When the user is actively scrolling/engaged with content, brief promotion to `state="engaged"` then back to `focus`. Closure triggers a brief `complete` (Return) flash before returning to `idle`.

**Files:**

| Action | Path                                                     | Responsibility                                                                                                                                                                                                               |
| ------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create | `src/components/pane/ReadingPaneRoot.tsx`                | React island, mounted once. Listens for `pane:open`/`pane:close`. Owns the pane DOM, focus trap, history state, fetch logic.                                                                                                 |
| Create | `src/components/pane/PaneFrame.tsx`                      | The visual shell — glassmorphic background, zone-color edge tint, close button, breathing zone dot in header. Pure presentational.                                                                                           |
| Create | `src/components/pane/PaneContent.tsx`                    | Renders the fetched post HTML with sanitization. Mounts a mini `<PostQuoteShare>` instance scoped to the pane content (reuses existing component).                                                                           |
| Create | `src/components/pane/PaneConnections.tsx`                | At pane footer: "Resonates with" + chips for each connection. Clicking a chip dispatches `pane:open` for that slug — chained reading without leaving the pane.                                                               |
| Modify | `src/components/constellation/NodeCard.astro`            | Add `data-pane-target={post.id}` to the card link. A small inline script (or shared client directive) intercepts clicks and dispatches `pane:open` instead of navigating. Falls back to normal navigation if JS unavailable. |
| Modify | `src/layouts/BaseLayout.astro` or equivalent layout file | Mount `<ReadingPaneRoot client:load />` once.                                                                                                                                                                                |
| Create | `src/styles/pane.css`                                    | All pane styles. CSS custom properties keyed to `data-zone` on the pane root for zone-tinted edges.                                                                                                                          |
| Create | `src/utils/paneEvents.ts`                                | Typed event helpers: `dispatchPaneOpen(slug, originRect, zone)`, `onPaneClose(callback)`.                                                                                                                                    |

**Accessibility — non-negotiable per project posture (HIGH):**

- The pane is an `aria-modal="true"` `role="dialog"` with `aria-labelledby` pointing to the post title.
- Focus moves into the pane on open (first focusable: the close button).
- Focus is trapped within the pane while open (Tab cycles within; Esc closes).
- Focus returns to the originating node card on close.
- Background field is `aria-hidden="true"` while pane is open.
- Reduced motion: no scale/translate entry — pane fades in with opacity only.
- The close button has visible focus ring and 44×44px touch target.

**Acceptance criteria:**

- Clicking a node opens the pane with the post content within ~150ms (already cached static HTML).
- URL changes; browser back button closes the pane and restores the constellation scroll position.
- Esc + outside-click + close button + back button all converge on the same `pane:close` flow.
- Without JS, clicking a node performs a normal page navigation to `/blog/[slug]/` — site still works.
- `prefers-reduced-motion` users get opacity-only entry/exit.
- Lighthouse a11y stays ≥ 95.

**Out of scope for Subsystem 3:** the shatter exit animation. Subsystem 3 closes the pane with a clean fade. The shatter (Subsystem 4) replaces the fade.

---

## Subsystem 4 — Shattering + Afterimage Traces

This is the most novel and most performance-sensitive subsystem. It replaces the pane's exit fade with a fragmenting Voronoi shatter and deposits trace fragments into a persistent canvas overlay that survives navigation within the session.

**Shatter mechanics:**

1. On `pane:close`, the pane snapshots its rendered visual into an offscreen canvas via `html2canvas`-like serialization (we will implement a minimal version — only the pane background gradient + a tinted rectangle, not the prose; the prose simply fades during shatter).
2. A 2D Voronoi tessellation is computed within the pane's bounding rect. ~18–24 cells, seeded by current timestamp so each shatter is unique.
3. Each Voronoi cell becomes a `<canvas>`-painted shard, rendered as an absolutely-positioned element with `clip-path: polygon(...)` matching the cell. Each shard inherits the pane's gradient tint sampled at the cell's centroid.
4. Shards animate outward with physics-approximated CSS transforms: per-shard `--tx`, `--ty`, `--tr` (rotation), `--ts` (scale-down) custom properties drive a single shared keyframe `shardFall`. Easing: `cubic-bezier(0.2, 0, 0.8, 1)` — accelerate-then-decelerate. Duration: 1.2s with up to 0.3s per-shard delay for organic timing.
5. As shards fall and fade, they deposit fragments — low-opacity color samples — into the **trace canvas**.

**Trace canvas:**

- A single full-viewport `<canvas class="trace-layer">` sits absolutely-positioned behind the constellation field, in front of the page background. Stacking: `z-index: 1` (above background, below content).
- Fragment deposits are small filled polygons (the shard's clip path, scaled to 30–50% original size) painted at 8–18% opacity in the zone color of the piece just read.
- Trace data is serialized to `sessionStorage['constellation:traces']` as `Array<{ x, y, polygon: number[][], color: string, depositedAt: number }>`. On any page load, `<TraceCanvas>` deserializes and repaints the accumulated trace.
- Traces decay slowly: each repaint, fragments older than 30 minutes are dropped. (This is the Bayesian decay echo from Context-Synapse — passive forgetting.)
- `prefers-reduced-motion`: traces still deposit (they are static), but no shatter animation — pane simply fades, and a single static-trace deposit happens at the pane's bounding rect.

**Compass integration:** the shatter fires the compass `engaged` state (Transmission — pattern exits) during the fall, then `complete` (Return — the loop remains open) as traces settle, then back to `idle` after ~1.5s total.

**Files:**

| Action | Path                                      | Responsibility                                                                                                                                                                                                                   |
| ------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create | `src/components/shatter/voronoi.ts`       | Pure function: `tessellate(rect: DOMRect, count: number, seed: number): Cell[]`. Uses a Fortune's-algorithm port or a simple Lloyd-relaxation point-sampler. No external dependency.                                             |
| Create | `src/components/shatter/Shatter.tsx`      | React island. Subscribes to `pane:close`. Renders shards layer. Computes Voronoi, animates shards via CSS variables, dispatches `shatter:complete` when done.                                                                    |
| Create | `src/components/shatter/TraceCanvas.tsx`  | React island, mounted once on every page. Reads `sessionStorage['constellation:traces']` on mount, repaints the canvas. Listens for `shatter:complete` to append new deposits. Listens for `storage` events to sync across tabs. |
| Create | `src/utils/traces.ts`                     | Pure data helpers: `loadTraces()`, `saveTraces(traces)`, `appendTrace(deposit)`, `pruneOldTraces(traces, maxAgeMs)`.                                                                                                             |
| Modify | `src/components/pane/ReadingPaneRoot.tsx` | Replace the close fade with: dispatch `shatter:start` with pane rect + zone color, hide pane content immediately, the Shatter island handles the rest.                                                                           |
| Modify | `src/layouts/BaseLayout.astro`            | Mount `<TraceCanvas client:load />` and `<Shatter client:load />` alongside `<ReadingPaneRoot>`.                                                                                                                                 |
| Create | `src/styles/shatter.css`                  | `.shard` keyframes, `.trace-layer` positioning.                                                                                                                                                                                  |

**Performance constraints:**

- Shatter must hit 60fps on M-series and 30fps minimum on a 2018 MacBook (the project's `Lighthouse` workflow runs against modest hardware).
- The trace canvas redraws _only_ on appendage and on initial load — not on every frame.
- Max trace fragments retained: 60. If `sessionStorage` exceeds that, drop oldest first regardless of age.
- The canvas is rendered at `devicePixelRatio` resolution but capped at 2x to avoid 4K-display memory pressure.

**Acceptance criteria:**

- Closing the pane shatters cleanly without dropped frames on M-series.
- Reading 5+ pieces in a session results in a visible (but subtle) accumulation of color fragments in the constellation field background — readable as "where I've been."
- Refreshing the page within the same session preserves the traces.
- Opening a new tab to the site starts with a clean trace canvas (sessionStorage scoped per tab).
- `prefers-reduced-motion`: pane closes via fade, single static fragment appears at close location, no animation.
- `npm run check` passes. Lighthouse a11y ≥ 95. Lighthouse performance ≥ 85 on the blog index.

**Out of scope for Subsystem 4:** cross-device/cross-session trace sync (would require backend; deferred — the ephemerality is part of the design). The shatter sound/audio cue — deferred for a possible future audio subsystem.

---

## Build Order & Independence

| #   | Subsystem        | Independently shippable after | Estimated scope                                |
| --- | ---------------- | ----------------------------- | ---------------------------------------------- |
| 1   | Compass          | —                             | 1 plan, ~8 tasks                               |
| 2   | Schema + Field   | Subsystem 1 merged            | 1 plan, ~12 tasks (includes content migration) |
| 3   | Pane             | Subsystem 2 merged            | 1 plan, ~10 tasks                              |
| 4   | Shatter + Traces | Subsystem 3 merged            | 1 plan, ~10 tasks                              |

Each subsystem ends in a state where the site is fully functional and improved over the previous state. Between subsystems, the site is _not_ in a half-broken intermediate. Specifically:

- After **#1**: site looks the same except the header logo is now a compass mark that animates on hover and the favicon is updated. Everything else identical.
- After **#2**: `/blog` is a constellation field. All other pages unchanged. Clicking a node navigates normally to the post.
- After **#3**: clicking a node opens the pane. Direct URL access still works. Back button works.
- After **#4**: closing the pane shatters; traces accumulate; the field gains memory.

This means each subsystem can be deployed and lived with. If any one of them turns out to be wrong, it can be reverted without unwinding the others.

---

## Out of Scope (Permanent or Deferred)

**Permanently out of scope** (refused, per Praxis posture):

- Algorithmic "you might also like" recommendations. Resonance is authored.
- Engagement tracking beyond the existing first-party share telemetry. The field is for the reader, not for the operator.
- localStorage-based personalization. `sessionStorage` for traces is the maximum — it expires with the tab.

**Deferred to future cycles** (good ideas that don't belong here):

- Re-theming `/about`, `/work`, `/security`, `/roadmap` to the constellation grammar.
- Cross-device trace sync via Cloudflare Durable Object (would require auth).
- Audio layer for shatter / breathing.
- Constellation field on the homepage (below the BreathingHero) — once `/blog` lives with this design for a while, decide whether `/` should adopt or stay editorial-list.
- Mobile-specific layout for the constellation field (current spec assumes ≥768px; mobile falls back to a vertical stacked list per zone). A future cycle dedicates a plan to mobile constellation interaction.
- Adding new `nodeType` values (currently 8); reserved for when a piece of content genuinely doesn't fit existing types.

---

## Open Questions for Author Review

1. ~~**Compass placement in header.** Spec calls for compass + wordmark side-by-side. Alternative: compass _replaces_ the wordmark (mark only, no text). Which is correct for the brand voice?~~ **RESOLVED 2026-05-14**: compass + glyphs side-by-side. The compass leads (placed left of wordmark), the wordmark follows. Glyphs are part of the brand and remain everywhere they currently are.
2. **Connection symmetry.** If post A declares B in its connections, is the reverse implied or required? Spec assumes one-way authoring (A→B does not auto-create B→A); the field renders the line either way once one side exists. Confirm this is right.
3. **Zone defaults for existing 11 posts.** The migration step needs your call. Suggested initial mapping based on content:
   - `signal`: on-decay-rot, the-jingle-of-me, southern-gothic-queer-survival, we-all-float-on, the-lock-icon-is-not-security
   - `experiment`: static-first-is-a-discipline, concept-is-not-the-state, secure-pride-origin, content-strategy-community-practice
   - `undefined`: mapping-curiosity, welcome-to-the-studio
     These are starting points — you'll author the truth.
4. **Trace TTL.** 30 minutes feels right for a single reading session. Adjust if a longer or shorter "memory" feels truer.
5. **Pane width on widescreen.** Currently spec'd at 680px max-width to preserve reading column. On 4K monitors this leaves a lot of breathing room. Alternative: scale up to 800px with looser line-height. Preference?

---

## Verification (after each subsystem)

| Check             | Command                                                        | Threshold                                           |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------------- |
| Type + build      | `npm run check`                                                | passes                                              |
| Visual smoke test | `npm run dev` → open localhost:4321 → exercise affected routes | manual pass                                         |
| Lighthouse        | `lhci autorun` (already in CI)                                 | a11y ≥ 95, perf ≥ 85 on `/blog`                     |
| Reduced motion    | OS-level toggle, reload                                        | no animation; all routes still navigable            |
| Keyboard nav      | Tab through `/`, `/blog`, opened pane                          | full coverage, visible focus                        |
| JS disabled       | DevTools network panel → disable JS                            | site still navigable; pane falls back to direct nav |

---

## Critical Files Reference

Files that _every_ subsystem will touch (read these first when starting any plan):

- `src/components/BreathingHero.astro` — visual grammar source of truth
- `src/components/Header.astro` — primary nav surface
- `src/styles/global.css` — CSS custom properties; all token additions go here
- `src/content.config.ts` — schema
- `src/layouts/BlogPost.astro`, `src/layouts/HomepageLayout.astro` — layout integration points

Files referenced by name in this spec:

- `src/components/Compass.astro`, `CompassLink.astro` (Subsystem 1, create)
- `src/styles/compass.css`, `constellation.css`, `pane.css`, `shatter.css` (create across subsystems)
- `src/components/constellation/NodeCard.astro`, `ZoneColumn.astro`, `ConstellationField.astro`, `ConnectionsLayer.tsx` (Subsystem 2, create)
- `src/components/pane/ReadingPaneRoot.tsx`, `PaneFrame.tsx`, `PaneContent.tsx`, `PaneConnections.tsx` (Subsystem 3, create)
- `src/components/shatter/Shatter.tsx`, `TraceCanvas.tsx`, `voronoi.ts` (Subsystem 4, create)
- `src/utils/paneEvents.ts`, `src/utils/traces.ts` (create)
- `public/favicon.svg` (Subsystem 1, replace)
- `src/components/Header.astro:6-19`, `src/components/BaseHead.astro:63` (Subsystem 1, modify)
- `src/pages/blog/index.astro` (Subsystem 2, replace)
- All files in `src/content/blog/` (Subsystem 2, frontmatter migration)
