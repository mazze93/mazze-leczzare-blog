# docs/archive/

Files pulled out of a build path but kept in version control rather than
deleted. Nothing here is served — `docs/` is not part of the site build.

| File | Was | Why it moved |
| --- | --- | --- |
| `the_breakthrough_artifact.duplicate.html` | `src/pages/blog/the_breakthrough_artifact.html` | Byte-identical duplicate of `public/essays/the-breakthrough-artifact.html`, so the same document published at two URLs (`/blog/the_breakthrough_artifact/` and `/essays/the-breakthrough-artifact.html`). Only the `/essays/` one is linked — from the catalogue at `/writing/` — so that one is canonical. The old URL 301s to it via `public/_redirects`. Kept here because it is the historical `src/pages/` copy; the live content is the `/essays/` file, and that is the one to edit. |

## `retired-2026-08-03/`

Dead code removed from the build during the design-systems pass. All of it was
verified unreachable before the move — none of it was doing anything.

| File | Was | Why it went |
| --- | --- | --- |
| `editorial.css` | `src/styles/` | Imported by nothing. Its `--color-*` tokens never resolved at runtime, so 11 `var(--color-x, #fallback)` sites across the blog components silently rendered their hardcoded fallbacks — see `83e1725`. Kept because the prototype tokens may be worth mining; do NOT wire it in as-is (it redefines `--font-mono` and ships a palette that differs from the live one). |
| `SignalHero.astro` | `src/components/` | Legacy predecessor to `BreathingHero.astro`, mounted nowhere. Carried 8 hardcoded pre-Kintsugi colour literals. |
| `tailwind.config.mjs` | repo root | Tailwind was never wired up: no integration in `astro.config.mjs`, no `@import "tailwindcss"`, zero utility classes in `src/`. The `tailwindcss` devDependency went with it. The theme block is kept here as a record of which CSS variables were once meant to reach utility consumers. |
| `atkinson-{bold,regular}.woff` | `public/fonts/` | The only unreferenced font files in the repo — legacy `.woff` from `0063889 source repo import`, superseded by the `atkinsonhyperlegible-*.woff2` that `/intentional-fragility/` ships locally. |

To restore any of these: `git mv` it back and re-add whatever wiring it needs
(an import, a mount, a dependency). Nothing here is referenced by the build, so
restoring is additive and safe.
