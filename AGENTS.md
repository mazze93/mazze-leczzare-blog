# mazze-leczzare-blog — Codex Context

Personal blog. Built with Astro.

## Stack
- **Framework**: Astro (`astro.config.mjs`)
- **Functions**: `functions/` directory for API-style endpoints and integrations
- **Output**: `dist/` (built static output)
- **Assets**: `brand-assets-showcase.html`, `_generate_showcase.py`

## Canonical Commands (from `package.json`)
```bash
npm run dev        # Dev server
npm run build      # Build to dist/
npm run preview    # Preview built output
npm run check      # Build + type check (astro build && tsc)
npm run docs:check # Validate docs/instructions consistency
```

## Notes
- `docs/` directory exists — check there for authoring and operations conventions.
- Landing page route is `src/pages/index.astro`.
