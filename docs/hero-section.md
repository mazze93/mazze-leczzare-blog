# Hero Section: From Erasure → Signal

## Overview

The homepage hero is a full-viewport landing section that visually communicates **chaos → emergence → structure → signal** through an animated particle network on a dark background.

## File locations

| File | Purpose |
|------|---------|
| `src/components/SignalHero.astro` | Hero component (markup, styles, canvas animation) |
| `src/pages/index.astro` | Homepage that renders the hero + recent posts grid |
| `src/styles/global.css` | CSS custom properties for the hero palette (`--hero-*`) |
| `src/consts.ts` | Site title and description |

## How the animation works

A `<canvas>` element behind the hero content renders a particle network:

- **Left zone (noise):** Particles drift randomly, few connections, faint colors (magenta/amber)
- **Center zone (emergence):** Particles begin forming connections, transitional colors
- **Right zone (signal):** Particles anchor to stable positions, dense network, bright teal nodes with glow

The animation runs at ~30fps using `requestAnimationFrame` with frame throttling. It pauses when the tab is hidden (`visibilitychange`).

### Reduced motion

When `prefers-reduced-motion: reduce` is active:
- The animation loop does not start
- A single static frame of scattered nodes is drawn instead
- CSS entrance animations are also disabled

### Graceful degradation

If JavaScript fails, the canvas is empty and invisible. The hero text renders normally against the dark background with the CSS gradient overlay providing subtle visual interest.

## Tuning

### Colors

Edit CSS variables in `src/styles/global.css`:

```css
--hero-bg: #0b0d12;        /* Background color */
--hero-text: #f2f4f8;      /* Headline color */
--hero-text-muted: #b7c0d1; /* Tagline color */
--hero-teal: #2bd3c6;       /* Signal accent / CTA */
--hero-magenta: #c04bb7;    /* Noise accent */
--hero-amber: #f4a261;      /* Transition accent */
```

### Animation parameters

Edit the constants at the top of the `<script>` block in `SignalHero.astro`:

```js
const PARTICLE_COUNT = 90;       // Number of particles (lower = less CPU)
const CONNECTION_DISTANCE = 120;  // Max px between connected nodes
const BASE_SPEED = 0.15;         // Drift speed multiplier
const TARGET_FPS = 30;           // Animation frame rate cap
const NODE_MIN_RADIUS = 1;       // Smallest node (noise side)
const NODE_MAX_RADIUS = 2.5;     // Largest node (signal side)
const LINE_OPACITY_MAX = 0.18;   // Maximum connection line opacity
```

### Text content

The headline and tagline are in `SignalHero.astro`. Three tagline options are included (two commented out):

- **Option A** (active): "Finding signal inside complex systems."
- **Option B**: "Writing, security, and systems thinking at the edge of meaning."
- **Option C**: "Technology, pattern recognition, and the architecture of human sense-making."

### CTA buttons

Two CTAs link to `/blog/` and `/work/`. Edit the `href` and text in the `signal-hero__actions` div.

## Disabling or replacing the animation

To remove the canvas animation entirely:

1. Delete the `<canvas>` element and `<script>` block from `SignalHero.astro`
2. The hero will display text over the dark gradient background + overlay

To replace with a static image or SVG:

1. Replace the `<canvas>` with an `<img>` or inline `<svg>` in the same position
2. Keep the `.signal-hero__overlay` for the gradient vignette effect

## Deployment

The hero is fully static. No server-side dependencies were added.

```bash
npm run dev       # Local dev server
npm run build     # Build to dist/
npm run preview   # Preview built output
```

Deployment via Cloudflare Pages remains unchanged — the `dist/` output directory and `wrangler.toml` configuration are unaffected.

### Static compatibility

All changes are client-side HTML, CSS, and JavaScript. The canvas animation is inlined in the Astro component (no external dependencies added). The build output remains fully static and compatible with Cloudflare Pages.
