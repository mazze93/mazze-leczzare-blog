# Compass (Subsystem 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy cyan-blue "M" favicon and the text-only wordmark navigation with an animated SVG compass mark — five behavior states (Origin → Intention → Refraction → Transmission → Return) keyed to five micro-interactions (idle → hover → focus → engaged → complete) — that serves as the site's brand logo, favicon, and primary navigation orienter. The compass leads, the existing SITE_TITLE wordmark follows. Both the favicon and the in-page mark scale from 16px to 256px without legibility loss.

**Architecture:** A single Astro component (`Compass.astro`) renders the SVG with `data-state` and `data-size-bucket` attributes; a separate stylesheet (`compass.css`) owns all animation, state transitions, and scalability stroke-width math. A second component (`CompassLink.astro`) wraps `Compass` in an anchor and handles hover/focus state propagation in pure CSS — no JS. The favicon is the same SVG markup baked to `idle` state and saved to `public/favicon.svg`. Color tokens are added to `global.css` for both light and dark themes. Header.astro is modified to mount the new CompassLink alongside the existing wordmark text.

**Tech Stack:** Astro 6, vanilla SVG (hand-coded — no SVG library), CSS custom properties + keyframes, TypeScript 6 (strict). No new dependencies. The existing project uses `ThemeToggle.tsx` for light/dark — all tokens must respond to `data-theme="dark"` and `data-theme="light"` on `<html>`.

**Spec reference:** `docs/superpowers/specs/2026-05-13-constellation-architecture-design.md` — read the "Color System" and "Subsystem 1 — The Compass" sections before starting.

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/components/Compass.astro` | The SVG mark. Pure presentational. Props: `size: number = 32`, `state: 'idle'\|'hover'\|'focus'\|'engaged'\|'complete' = 'idle'`, `ariaLabel?: string`. Computes `data-size-bucket` from `size` (16/32/64/128/256). Inline SVG with `currentColor` strokes and named groups for each animated layer. |
| Create | `src/components/CompassLink.astro` | Wraps `<Compass>` in an `<a>` tag. Pure CSS `:hover` and `:focus-visible` selectors propagate state via attribute selectors and CSS custom property cascades — no JS. Props: `href: string`, `label: string`, `size?: number = 32`. |
| Create | `src/styles/compass.css` | Tokens (`--compass-stroke-w`, `--compass-glow`, `--compass-beam-opacity`, etc.), `@keyframes compass-breath` (idle), `[data-state]` selectors driving the visual transition, `data-size-bucket` rules for stroke-width adjustment, full `prefers-reduced-motion: reduce` block. |
| Modify | `src/styles/global.css` | Add the brand palette tokens (see Spec → Color System) at the `:root` and `[data-theme="light"]` rules. Add `@import "./compass.css";`. |
| Modify | `src/components/Header.astro` | Replace `<a class="wordmark">...</a>` with a `.brand` flex group containing `<CompassLink size={32}>` followed by the existing wordmark text. Update `.brand` styles for layout. |
| Modify | `src/components/BaseHead.astro` | Add `<link rel="mask-icon" href="/favicon.svg" color="#d4a574" />` after the existing `<link rel="icon">` line for Safari pinned-tab. |
| Replace | `public/favicon.svg` | Replace the existing 4-line "M"-style markup with the compass `idle`-state SVG. Optimized for 16/32px rendering (heavier stroke widths), uses `currentColor` so it adapts to OS dark/light via the `prefers-color-scheme` media query embedded in the SVG. |
| Modify | `src/consts.ts` | Add `COMPASS_LABEL = "Mazze Leczzare — home"` (used as the compass link's accessible name). |

---

## SVG Anatomy Reference (consult before Task 1)

The compass is composed of seven SVG groups, drawn in this layer order (back to front):

1. **Outer broken ring** (`<g id="ring-outer">`) — a near-circle with a gap from ~225° to ~315° (bottom-left to bottom-right). Animated: rotates very slowly (60s/turn) on the `idle` state.
2. **Inner orbital arc** (`<g id="ring-inner">`) — a smaller circle with a single break around 270°. Static.
3. **Petal/north almond** (`<g id="petal">`) — a vertical pointed-oval (almond) shape spanning the vertical axis. The "true north" — never moves.
4. **Cardinal star** (`<g id="star">`) — the four-point compass star (N/S/E/W spikes radiating from center). Static.
5. **Beam** (`<g id="beam">`) — a diagonal line from upper-right to lower-left. Opacity 0 at `idle`, fades to 1 by `focus`, becomes a dashed trailing version at `complete`.
6. **Sparkle** (`<g id="sparkle">`) — a small cross/burst at the center where the beam intersects the petal. Opacity 0 except `engaged`.
7. **Decay trail** (`<g id="trail">`) — dashed trailing line continuing from the beam beyond the outer ring; visible only at `complete`.

ViewBox: `0 0 64 64`. All strokes use `currentColor` and CSS variable widths.

---

## Task 1: Add Brand Color Tokens to global.css

**Files:**

- Modify: `src/styles/global.css` (add at top of `:root` block and a new `[data-theme="light"]` block)

- [ ] **Step 1: Read current global.css to find insertion point**

Run: `head -80 "src/styles/global.css"` to locate the `:root` block and any existing `[data-theme]` selectors.

Expected: file uses CSS custom properties. Identify the line *after* the last existing custom property in `:root` to know where to insert.

- [ ] **Step 2: Add dark-mode brand tokens to `:root`**

Insert the following block immediately before the closing `}` of the `:root` rule in `src/styles/global.css`:

```css
  /* === Brand palette (Constellation architecture, 2026-05) === */
  /* Dark mode is the default. Light mode overrides below. */
  --obsidian:           #050406;
  --deep-navy:          #0b0d12;
  --gold:               #d4a574;
  --gold-bright:        #f4d29a;
  --gold-dim:           #8a6a3a;
  --indigo-deep:        #323c5a;
  --wine-burnt:         #502838;
  --ash-amber:          #8c6450;
  --moss-black:         #3c4632;
  --magenta-transient:  192, 75, 183;    /* rgb triplet — use with rgba() at ≤0.18 alpha */

  /* BreathingHero zone tokens — locked, do not modify */
  --zone-undefined:     242, 244, 248;   /* rgb triplet */
  --zone-experiment:    #2bd3c6;
  --zone-signal:        #f4a261;
```

- [ ] **Step 3: Add light-mode overrides**

After the closing `}` of the `:root` rule, add a new `[data-theme="light"]` rule:

```css
[data-theme="light"] {
  --obsidian:           #f4f1ea;
  --deep-navy:          #f0ede5;
  --gold:               #8a6a3a;
  --gold-bright:        #b0865a;
  --gold-dim:           #d4a574;
  --indigo-deep:        #6b7a9a;
  --wine-burnt:         #8a5a6a;
  --ash-amber:          #b08570;
  --moss-black:         #6a7460;
  --magenta-transient:  128, 64, 119;    /* rgb triplet — light-mode tint */

  /* BreathingHero zone tokens — locked.
     zone-undefined inverts polarity; zone-experiment and zone-signal are theme-stable. */
  --zone-undefined:     22, 20, 16;
  --zone-experiment:    #2bd3c6;
  --zone-signal:        #f4a261;
}
```

- [ ] **Step 4: Add the compass.css import**

At the very top of `src/styles/global.css` (above any other `@import` or rules, or immediately after any existing `@import` lines), add:

```css
@import "./compass.css";
```

If there is no existing `@import`, add it as the first line of the file.

- [ ] **Step 5: Validate**

Run: `npm run check`
Expected: PASS (build + tsc). The import will fail until Task 3 creates `compass.css` — *defer Step 5 of this task until after Task 3 completes*. (See Task 3 for resumption.)

- [ ] **Step 6: Commit (do not commit yet — wait until compass.css exists)**

This task's commit is deferred to Task 3's completion.

---

## Task 2: Add COMPASS_LABEL to consts.ts

**Files:**

- Modify: `src/consts.ts`

- [ ] **Step 1: Read the file**

Run: `cat "src/consts.ts"`

Expected: a small file exporting `SITE_TITLE`, `SITE_DESCRIPTION`, etc.

- [ ] **Step 2: Add the new export**

Append to the end of `src/consts.ts`:

```ts
export const COMPASS_LABEL = "Mazze Leczzare — home";
```

- [ ] **Step 3: Validate**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Commit (deferred until end of subsystem)**

---

## Task 3: Create `src/styles/compass.css`

**Files:**

- Create: `src/styles/compass.css`

- [ ] **Step 1: Write the file**

Create `src/styles/compass.css` with this complete content:

```css
/*
 * compass.css — the brand mark's behavior layer.
 *
 * Five states (controlled by [data-state] on the .compass element):
 *   idle      — Origin: system in rest, slow ambient breath
 *   hover     — Intention: signal enters, beam emerges faintly
 *   focus     — Refraction: full beam visible, glow blooms
 *   engaged   — Transmission: sparkle active at convergence
 *   complete  — Return: beam becomes dashed trail, pattern persists
 *
 * Five size buckets (controlled by [data-size-bucket]):
 *   16, 32, 64, 128, 256 — stroke widths thicken at smaller sizes
 *   so the mark remains legible. This is not linear scaling.
 */

.compass {
  /* Stroke width responds to size bucket. Defaults to 32-bucket. */
  --compass-stroke-w: 1.6;
  --compass-stroke-w-fine: 0.9;
  --compass-glow: 0;
  --compass-beam-opacity: 0;
  --compass-sparkle-opacity: 0;
  --compass-trail-opacity: 0;
  --compass-ring-rotate: 0deg;

  display: inline-block;
  width: 1em;
  height: 1em;
  color: var(--gold);
  vertical-align: middle;
  transition:
    color 240ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

.compass svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* === Size buckets: stroke-width tuning === */
.compass[data-size-bucket="16"] { --compass-stroke-w: 3.0; --compass-stroke-w-fine: 1.8; }
.compass[data-size-bucket="32"] { --compass-stroke-w: 2.0; --compass-stroke-w-fine: 1.2; }
.compass[data-size-bucket="64"] { --compass-stroke-w: 1.6; --compass-stroke-w-fine: 0.9; }
.compass[data-size-bucket="128"]{ --compass-stroke-w: 1.3; --compass-stroke-w-fine: 0.7; }
.compass[data-size-bucket="256"]{ --compass-stroke-w: 1.1; --compass-stroke-w-fine: 0.6; }

/* === SVG group strokes === */
.compass [data-layer="ring-outer"],
.compass [data-layer="ring-inner"],
.compass [data-layer="star"],
.compass [data-layer="petal"] {
  stroke: currentColor;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.compass [data-layer="ring-outer"],
.compass [data-layer="ring-inner"] {
  stroke-width: var(--compass-stroke-w-fine);
}

.compass [data-layer="star"],
.compass [data-layer="petal"] {
  stroke-width: var(--compass-stroke-w);
}

.compass [data-layer="beam"] {
  stroke: var(--gold-bright);
  stroke-width: var(--compass-stroke-w);
  stroke-linecap: round;
  fill: none;
  opacity: var(--compass-beam-opacity);
  filter: drop-shadow(0 0 calc(var(--compass-stroke-w) * 2px) var(--gold-bright));
  transition:
    opacity 280ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 280ms cubic-bezier(0.22, 1, 0.36, 1);
}

.compass [data-layer="sparkle"] {
  fill: var(--gold-bright);
  opacity: var(--compass-sparkle-opacity);
  filter: drop-shadow(0 0 6px var(--gold-bright));
  transition: opacity 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.compass [data-layer="trail"] {
  stroke: var(--gold-dim);
  stroke-width: var(--compass-stroke-w-fine);
  stroke-linecap: round;
  stroke-dasharray: 2 4;
  fill: none;
  opacity: var(--compass-trail-opacity);
  transition: opacity 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.compass [data-layer="ring-outer"] {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(var(--compass-ring-rotate));
  animation: compass-breath 60s linear infinite;
}

/* === State transitions === */

.compass[data-state="idle"] {
  --compass-beam-opacity: 0;
  --compass-sparkle-opacity: 0;
  --compass-trail-opacity: 0;
}

.compass[data-state="hover"] {
  --compass-beam-opacity: 0.4;
  --compass-sparkle-opacity: 0;
  --compass-trail-opacity: 0;
  color: var(--gold-bright);
}

.compass[data-state="focus"] {
  --compass-beam-opacity: 1;
  --compass-sparkle-opacity: 0;
  --compass-trail-opacity: 0;
  color: var(--gold-bright);
  filter: drop-shadow(0 0 8px rgba(212, 165, 116, 0.45));
}

.compass[data-state="engaged"] {
  --compass-beam-opacity: 1;
  --compass-sparkle-opacity: 1;
  --compass-trail-opacity: 0.4;
  color: var(--gold-bright);
  filter: drop-shadow(0 0 12px rgba(244, 210, 154, 0.6));
}

.compass[data-state="complete"] {
  --compass-beam-opacity: 0.25;
  --compass-sparkle-opacity: 0;
  --compass-trail-opacity: 1;
  color: var(--gold);
}

/* === Keyframes === */
@keyframes compass-breath {
  from { --compass-ring-rotate: 0deg; }
  to   { --compass-ring-rotate: 360deg; }
}

/* Register the custom property so the keyframe animates it.
   Without @property, browsers tween from 0 to nothing. */
@property --compass-ring-rotate {
  syntax: '<angle>';
  inherits: true;
  initial-value: 0deg;
}

/* === Reduced motion === */
@media (prefers-reduced-motion: reduce) {
  .compass [data-layer="ring-outer"] {
    animation: none;
    transform: none;
  }
  .compass,
  .compass [data-layer="beam"],
  .compass [data-layer="sparkle"],
  .compass [data-layer="trail"] {
    transition: none;
  }
}
```

- [ ] **Step 2: Validate**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Now complete Task 1 Step 5**

Re-run `npm run check`. The `@import "./compass.css";` line in `global.css` now resolves.
Expected: PASS.

---

## Task 4: Create `src/components/Compass.astro`

**Files:**

- Create: `src/components/Compass.astro`

- [ ] **Step 1: Write the component**

Create `src/components/Compass.astro` with this complete content:

```astro
---
/**
 * Compass.astro — the brand mark.
 *
 * A hand-coded SVG of the Praxis-aligned compass logo with five behavior states
 * and five size buckets. Pure presentational. Use CompassLink.astro to make it
 * interactive.
 *
 * Spec: docs/superpowers/specs/2026-05-13-constellation-architecture-design.md
 */

interface Props {
  size?: number;
  state?: 'idle' | 'hover' | 'focus' | 'engaged' | 'complete';
  ariaLabel?: string;
  class?: string;
}

const {
  size = 32,
  state = 'idle',
  ariaLabel,
  class: className = '',
} = Astro.props;

// Snap to nearest size bucket for stroke-width tuning.
const buckets = [16, 32, 64, 128, 256];
const sizeBucket = buckets.reduce((prev, curr) =>
  Math.abs(curr - size) < Math.abs(prev - size) ? curr : prev
);

const role = ariaLabel ? 'img' : undefined;
---

<span
  class={`compass ${className}`.trim()}
  data-state={state}
  data-size-bucket={sizeBucket}
  style={`width: ${size}px; height: ${size}px;`}
  role={role}
  aria-label={ariaLabel}
  aria-hidden={ariaLabel ? undefined : 'true'}
>
  <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    {/* Layer 1: outer broken ring — opens at the bottom (~225° to ~315°) */}
    <g data-layer="ring-outer">
      <path d="M 32 4
               A 28 28 0 1 1 16.5 55.8" />
      <path d="M 47.5 55.8
               A 28 28 0 0 1 32 60" />
    </g>

    {/* Layer 2: inner orbital arc — single break at bottom */}
    <g data-layer="ring-inner">
      <path d="M 32 12
               A 20 20 0 1 1 24 50.7" />
    </g>

    {/* Layer 3: petal / true north — vertical pointed almond */}
    <g data-layer="petal">
      <path d="M 32 14
               C 38 22, 38 42, 32 50
               C 26 42, 26 22, 32 14 Z" />
    </g>

    {/* Layer 4: cardinal star — N S E W spikes */}
    <g data-layer="star">
      <line x1="32" y1="8"  x2="32" y2="20" />
      <line x1="32" y1="44" x2="32" y2="56" />
      <line x1="8"  y1="32" x2="20" y2="32" />
      <line x1="44" y1="32" x2="56" y2="32" />
    </g>

    {/* Layer 5: diagonal beam (upper-right → lower-left) */}
    <g data-layer="beam">
      <line x1="56" y1="12" x2="14" y2="50" />
    </g>

    {/* Layer 6: sparkle at convergence (small 4-point burst) */}
    <g data-layer="sparkle">
      <path d="M 32 28 L 33 32 L 32 36 L 31 32 Z" />
      <path d="M 28 32 L 32 31 L 36 32 L 32 33 Z" />
    </g>

    {/* Layer 7: decay trail — continuation of beam beyond ring */}
    <g data-layer="trail">
      <line x1="14" y1="50" x2="4" y2="60" />
      <line x1="56" y1="12" x2="62" y2="6" />
    </g>
  </svg>
</span>
```

- [ ] **Step 2: Validate**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Visual smoke test (manual)**

Create a temporary test page to verify rendering:

Append to `src/pages/index.astro` (temporarily, will revert in next step):

```astro
---
import Compass from '../components/Compass.astro';
---
<!-- ... existing content ... -->
<div style="background: #0b0d12; padding: 40px; display: flex; gap: 32px; align-items: center;">
  <Compass size={16} state="idle" />
  <Compass size={32} state="idle" />
  <Compass size={64} state="hover" />
  <Compass size={128} state="focus" />
  <Compass size={64} state="engaged" />
  <Compass size={64} state="complete" />
</div>
```

Run: `npm run dev`
Open: `http://localhost:4321/`

Expected: A row of six compass marks. Sizes scale from 16 to 128. Each in a different state — `idle` has no beam; `hover` shows a faint beam; `focus` has a full bright beam with glow; `engaged` adds a sparkle at center; `complete` shows a dashed trail.

If anything looks wrong, fix it before proceeding. Common issues:
- Beam invisible at all states → check `--compass-beam-opacity` cascade
- Stroke too thin at 16px → check `[data-size-bucket="16"]` rule

- [ ] **Step 4: Revert the test markup**

Remove the temporary `<Compass>` test block from `src/pages/index.astro`. Leave the file in its original state.

- [ ] **Step 5: Validate post-revert**

Run: `npm run check`
Expected: PASS.

---

## Task 5: Create `src/components/CompassLink.astro`

**Files:**

- Create: `src/components/CompassLink.astro`

- [ ] **Step 1: Write the component**

Create `src/components/CompassLink.astro` with this complete content:

```astro
---
/**
 * CompassLink.astro — interactive compass wrapped in an anchor.
 *
 * Pure CSS state machine: hover and focus transitions are driven via
 * :hover and :focus-visible pseudo-classes on the anchor, which cascade
 * into data-state on the inner Compass span via attribute selectors.
 *
 * No JavaScript. No client directives. Server-rendered.
 */

import Compass from './Compass.astro';

interface Props {
  href: string;
  label: string;
  size?: number;
  class?: string;
}

const { href, label, size = 32, class: className = '' } = Astro.props;
---

<a
  href={href}
  class={`compass-link ${className}`.trim()}
  aria-label={label}
>
  <Compass size={size} state="idle" ariaLabel={undefined} />
</a>

<style>
  .compass-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    line-height: 0;
    text-decoration: none;
    transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
  }

  .compass-link:hover :global(.compass[data-state="idle"]),
  .compass-link:focus-visible :global(.compass[data-state="idle"]) {
    /* CSS cannot mutate data-attributes, so we override the relevant
     * custom properties directly. The Compass component still has
     * data-state="idle" on the DOM, but visually presents as hover/focus. */
    --compass-beam-opacity: 0.4;
    color: var(--gold-bright);
  }

  .compass-link:active :global(.compass) {
    --compass-beam-opacity: 1;
    --compass-sparkle-opacity: 1;
    --compass-trail-opacity: 0.4;
    color: var(--gold-bright);
    filter: drop-shadow(0 0 12px rgba(244, 210, 154, 0.6));
  }

  .compass-link:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .compass-link,
    .compass-link :global(.compass),
    .compass-link :global(.compass [data-layer]) {
      transition: none;
    }
  }
</style>
```

**Note on the CSS cascade trick:** The Compass component sets its visual state via CSS custom properties on `[data-state="..."]`. CSS cannot directly change a sibling's `data-state` attribute, but it can override the inherited custom properties from the link's hover/focus rule. This keeps Compass purely declarative and CompassLink purely CSS — zero JS.

- [ ] **Step 2: Validate**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3: Visual smoke test (manual)**

Create a temporary test in `src/pages/index.astro`:

```astro
---
import CompassLink from '../components/CompassLink.astro';
import { COMPASS_LABEL } from '../consts';
---
<div style="background: #0b0d12; padding: 40px;">
  <CompassLink href="/" label={COMPASS_LABEL} size={48} />
</div>
```

Run: `npm run dev`
Open: `http://localhost:4321/`

Expected:
- The compass renders at 48px.
- Hovering it: beam becomes faintly visible, color shifts to brighter gold.
- Tab-focusing it: same beam behavior + a visible 2px gold outline.
- Mousedown/active: beam fully visible, sparkle appears, faint trail.

- [ ] **Step 4: Revert test markup**

Remove the temporary block from `src/pages/index.astro`.

- [ ] **Step 5: Validate**

Run: `npm run check`
Expected: PASS.

---

## Task 6: Replace `public/favicon.svg`

**Files:**

- Replace: `public/favicon.svg`

- [ ] **Step 1: Verify current state**

Run: `cat "public/favicon.svg"`
Expected: 4-line stylized "M" with `#00E5FF` stroke. This will be replaced.

- [ ] **Step 2: Write the new favicon**

Replace the entire contents of `public/favicon.svg` with:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
  <style>
    :root { color: #d4a574; }
    @media (prefers-color-scheme: light) { :root { color: #8a6a3a; } }
  </style>
  <g stroke="currentColor" stroke-width="2">
    <path d="M 32 4 A 28 28 0 1 1 16.5 55.8" fill="none" />
    <path d="M 47.5 55.8 A 28 28 0 0 1 32 60" fill="none" />
    <path d="M 32 12 A 20 20 0 1 1 24 50.7" fill="none" stroke-width="1.4" />
    <path d="M 32 14 C 38 22, 38 42, 32 50 C 26 42, 26 22, 32 14 Z" fill="none" />
    <line x1="32" y1="8"  x2="32" y2="20" />
    <line x1="32" y1="44" x2="32" y2="56" />
    <line x1="8"  y1="32" x2="20" y2="32" />
    <line x1="44" y1="32" x2="56" y2="32" />
  </g>
</svg>
```

Note: Beam, sparkle, and trail are omitted from the favicon — at 16px these elements would not be legible. The favicon represents the `idle` state with slightly heavier stroke widths (2.0 for major strokes, 1.4 for fine inner ring).

- [ ] **Step 3: Validate**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Browser verification**

Run: `npm run dev`
Open: `http://localhost:4321/`

In the browser tab:
- The favicon shows a gold compass against the tab background (dark in dark-mode browsers, bronze against light tab in light-mode browsers).
- Hard refresh (Cmd-Shift-R) if the old favicon is cached.

---

## Task 7: Update `src/components/BaseHead.astro` — add mask-icon

**Files:**

- Modify: `src/components/BaseHead.astro`

- [ ] **Step 1: Read current file to find the favicon line**

Run: `grep -n 'rel="icon"' src/components/BaseHead.astro`
Expected: a single line referencing `/favicon.svg`. Note its line number.

- [ ] **Step 2: Add mask-icon link directly after the existing favicon link**

Insert this line directly after the `<link rel="icon" ... href="/favicon.svg" />` line:

```astro
<link rel="mask-icon" href="/favicon.svg" color="#d4a574" />
```

The `mask-icon` link is for Safari pinned tabs (macOS Safari and iOS Safari pinned web apps), which render a single-color silhouette. The color matches `--gold` for dark-mode parity.

- [ ] **Step 3: Validate**

Run: `npm run check`
Expected: PASS.

---

## Task 8: Wire CompassLink into `src/components/Header.astro`

**Files:**

- Modify: `src/components/Header.astro`

The current Header has:

```astro
<a href="/" class="wordmark" aria-label={`${SITE_TITLE} — home`}>{SITE_TITLE}</a>
```

It needs to become:

```astro
<div class="brand">
  <CompassLink href="/" label={COMPASS_LABEL} size={32} />
  <a href="/" class="wordmark" aria-label={`${SITE_TITLE} — home`}>{SITE_TITLE}</a>
</div>
```

Both elements link to `/` — the compass leads visually but the wordmark remains independently clickable as a backup target. Two links to the same destination is fine; the compass is `aria-label`'d and the wordmark is the primary text anchor.

- [ ] **Step 1: Update the frontmatter imports**

In `src/components/Header.astro`, modify the frontmatter (the `---` block at the top) from:

```astro
---
import { SITE_TITLE } from '../consts';
import ThemeToggle from './ThemeToggle';
---
```

to:

```astro
---
import { SITE_TITLE, COMPASS_LABEL } from '../consts';
import ThemeToggle from './ThemeToggle';
import CompassLink from './CompassLink.astro';
---
```

- [ ] **Step 2: Replace the wordmark anchor with a brand group**

Find this line in the markup:

```astro
<a href="/" class="wordmark" aria-label={`${SITE_TITLE} — home`}>{SITE_TITLE}</a>
```

Replace it with:

```astro
<div class="brand">
  <CompassLink href="/" label={COMPASS_LABEL} size={32} />
  <a href="/" class="wordmark" aria-label={`${SITE_TITLE} — home`}>{SITE_TITLE}</a>
</div>
```

- [ ] **Step 3: Add `.brand` styles**

In the `<style>` block of `src/components/Header.astro`, add this rule immediately before the `.wordmark` selector:

```css
.brand {
  display: flex;
  align-items: center;
  gap: 0.6em;
  flex-shrink: 0;
}
```

- [ ] **Step 4: Validate**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5: Visual smoke test**

Run: `npm run dev`
Open: `http://localhost:4321/`

Expected:
- Header now shows the compass at 32px, immediately to the left of the "Mazze Leczzare" wordmark.
- Hovering the compass triggers the hover state.
- Tabbing through the page lands on the compass first, with a visible outline; then on the wordmark; then on the nav links.
- Click on the compass → navigates to `/`.
- Click on the wordmark → also navigates to `/`.
- Mobile (resize browser to <640px): both elements remain visible and don't break the header layout.

---

## Task 9: Theme parity check (light mode)

**Files:**

- No file changes. Verification only.

- [ ] **Step 1: Run dev server**

Run: `npm run dev`
Open: `http://localhost:4321/`

- [ ] **Step 2: Toggle light mode**

Click the theme toggle in the header (existing `<ThemeToggle>` component).

Expected:
- The compass color shifts from `#d4a574` (warm gold) to `#8a6a3a` (darker bronze) — visible against the now-cream background.
- Hovering still produces the brighter `--gold-bright` state, which in light mode is `#b0865a` (a richer mid-gold).
- The favicon updates if the OS prefers-color-scheme matches (this is OS-level, not site-level — verify by toggling OS dark/light theme).
- Header `.brand` gap and alignment unchanged.

- [ ] **Step 3: Toggle back to dark mode**

Click the theme toggle again. Confirm the compass returns to `#d4a574`.

---

## Task 10: Accessibility + Lighthouse verification

**Files:**

- No file changes. Verification only.

- [ ] **Step 1: Keyboard navigation test**

In the browser, refresh, then press Tab repeatedly from a cold page load. Verify the focus order:

1. Skip-link (if any)
2. Compass (visible gold outline, beam visible)
3. Wordmark anchor
4. Nav links: Writing, About, Work
5. GitHub link
6. ThemeToggle button

If the order is different, inspect the DOM — the compass must be the first focusable in the brand group.

- [ ] **Step 2: Screen reader announcement check**

Use VoiceOver (Cmd-F5 on macOS) or NVDA. Focus the compass.

Expected announcement: "Mazze Leczzare — home, link" (the `COMPASS_LABEL` followed by role).

Focus the wordmark.

Expected announcement: "Mazze Leczzare — home, link" (same destination, same label — this is acceptable; both are explicit navigation back to home).

- [ ] **Step 3: Run Lighthouse**

In Chrome DevTools → Lighthouse → run audit on the homepage (`/`) with Accessibility category enabled.

Expected: Accessibility score ≥ 95.

If lower:
- Check the favicon SVG has no `<title>` warnings (it shouldn't — the favicon is decorative).
- Check for any new color-contrast failures (the gold against the dark-navy substrate has been calibrated for AA — `#d4a574` on `#0b0d12` exceeds 7:1 — but verify).

- [ ] **Step 4: Reduced motion test**

In macOS System Settings → Accessibility → Display → check "Reduce motion".

Refresh the dev server page.

Expected:
- The outer ring's slow rotation stops.
- All state transitions are instant (no fade/glow animation).
- The compass still renders at the correct color and stroke widths.
- The favicon remains static (it has no animation anyway).

Uncheck reduced motion when done.

---

## Task 11: Final integration commit

**Files:**

All files touched in Tasks 1–8.

- [ ] **Step 1: Run full validation one final time**

```bash
npm run check
```

Expected: PASS.

- [ ] **Step 2: Stage all changes**

```bash
git add \
  src/styles/global.css \
  src/styles/compass.css \
  src/components/Compass.astro \
  src/components/CompassLink.astro \
  src/components/Header.astro \
  src/components/BaseHead.astro \
  src/consts.ts \
  public/favicon.svg
```

- [ ] **Step 3: Verify staged diff before committing**

```bash
git status
git diff --staged --stat
```

Expected: 8 files changed (2 created, 6 modified). No unexpected files staged. No node_modules, no .DS_Store, no .superpowers/ traces.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
[MZ] add compass brand mark — replaces M favicon + leads header

Implements Subsystem 1 of the constellation architecture: a hand-coded
SVG compass mark with five behavior states (Origin → Intention →
Refraction → Transmission → Return) keyed to five micro-interactions
(idle/hover/focus/engaged/complete). The compass scales from 16px
favicon to 256px hero without legibility loss, adapts to light/dark
themes, and respects prefers-reduced-motion.

The legacy cyan-blue M favicon is replaced. The compass leads the
header brand group; the SITE_TITLE wordmark remains as a secondary
anchor to the same destination.

Brand palette tokens added to global.css for both themes:
gold on obsidian / gold on deep-navy primary; indigo, wine,
ash-amber, moss-black accents. Magenta demoted to transient-only.

Spec: docs/superpowers/specs/2026-05-13-constellation-architecture-design.md
Plan: docs/superpowers/plans/2026-05-14-compass-subsystem-1.md

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Confirm commit landed**

```bash
git log -1 --stat
```

Expected: the commit is at HEAD with all 8 files listed.

---

## Verification Summary

After all tasks complete:

| Check | Command / Action | Threshold |
|-------|------------------|-----------|
| Build + types | `npm run check` | PASS |
| Visual | `npm run dev` → homepage shows compass + wordmark in header | manual ✓ |
| Favicon | Browser tab shows gold compass | manual ✓ |
| Hover transitions | Mouse-over compass shows beam emerging | manual ✓ |
| Focus transitions | Tab-focus compass shows beam + outline | manual ✓ |
| Theme parity | Toggle to light mode → compass color shifts to bronze | manual ✓ |
| Reduced motion | OS reduce-motion → ring stops rotating, no transitions | manual ✓ |
| Lighthouse a11y | DevTools → Lighthouse on `/` | ≥ 95 |
| Keyboard nav | Tab order: compass → wordmark → nav links → etc. | manual ✓ |
| Screen reader | Compass announces "Mazze Leczzare — home, link" | manual ✓ |

---

## What is now possible (for Subsystem 2)

After this lands, every later subsystem can:

- Mount a `<Compass size={N} state="..." />` anywhere on the site.
- Drive compass state from JS via `document.querySelector('.compass').dataset.state = 'focus'`.
- Use the brand palette tokens (`--gold`, `--indigo-deep`, `--wine-burnt`, etc.) without redefining them.
- Trust that the favicon and brand identity are stable.

Subsystem 2 (Schema + Constellation Field) is the next plan to write, once this lands and is lived with.
