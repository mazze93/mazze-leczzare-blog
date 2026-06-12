# Design Sync Notes — mazze-leczzare-blog

## Project

**Claude Design project:** Cipher Gothic Design System  
**Project ID:** `019e1ccb-00cb-7782-8451-738a76f22b4e`  
**URL:** https://claude.ai/design/p/019e1ccb-00cb-7782-8451-738a76f22b4e

## What this connection is NOT

This is NOT a component library sync. The blog has no publishable component dist/.
The Cipher Gothic project is a hand-crafted design tool with:
- `SKILL.md` — the `/cipher-gothic-design` skill
- `colors_and_type.css` — canonical `--cg-*` token system
- `ui_kits/blog/` and `ui_kits/homepage/` — JSX kit components
- `preview/` — atomic design cards
- `uploads/` — reference copies of the blog's CSS

## What this connection IS

The Cipher Gothic Design System project is **upstream** of the blog.
Blog CSS is the production implementation of the design system.

## Token relationship

| Design project (`colors_and_type.css`) | Blog (`global.css`) |
|---|---|
| `--cg-teal: #34C3B9` | `--teal: #34c3b9` ✓ synced 2026-06-12 |
| `--cg-coral: #E85A4A` | `--coral: #e85a4a` ✓ synced 2026-06-12 |
| `--cg-teal-dim: #1C6964` | `--teal-dim: #1c6964` ✓ synced 2026-06-12 |
| `--cg-coral-dim: #A04030` | `--coral-dim: #a04030` ✓ synced 2026-06-12 |
| `--font-mono: JetBrains Mono` | `--font-mono: DM Mono` — blog self-hosts DM Mono |

## Assets

| Design project | Blog source | Notes |
|---|---|---|
| `assets/compass-mark.svg` | `public/favicon.svg` | Canonical vector — authored SVG, gold stroke |
| `assets/compass-mark.png` | *(no PNG in blog)* | Raster render in project; update manually if sigil changes |
| `assets/mazze-headshot.jpg` | `public/mazze-headshot.jpg` | 563KB |
| `assets/mazze-leczzare-social-preview.png` | `public/mazze-leczzare-social-preview.png` | OG image |

## Maintaining the connection

When blog CSS changes, update the reference copies in the design project:
- `uploads/global.css` ← `src/styles/global.css`
- `uploads/editorial.css` ← `src/styles/editorial.css`
- `uploads/homepage.css` ← `src/styles/homepage.css`

When blog assets change, update the design project:
- `assets/compass-mark.svg` ← `public/favicon.svg`
- `assets/mazze-headshot.jpg` ← `public/mazze-headshot.jpg`
- `assets/mazze-leczzare-social-preview.png` ← `public/mazze-leczzare-social-preview.png`

When design project tokens change, update the blog's `global.css` to match.

## Re-sync risks

- `colors_and_type.css` in the design project may evolve independently — check for new `--cg-*` tokens and map them to blog variables if relevant
- `ui_kits/blog/` JSX components may diverge from the actual Astro blog components — they're prototyping tools, not production code
- The blog uses `--cg-*`-free simple variable names — intentional; don't port the `--cg-*` prefix into production CSS
