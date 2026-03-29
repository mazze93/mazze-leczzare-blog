<!-- Copilot/AI agent instructions tailored to this Astro + Cloudflare Pages blog -->
# Project quickstart for AI coding agents

This repo is an Astro-based static blog deployed to **Cloudflare Pages**.
Use this file as operational guidance that matches the current repository state.

## Canonical Commands (must match `package.json`)

- `npm install` : install dependencies
- `npm run dev` : local dev server (Astro on :4321)
- `npm run build` : produce `./dist`
- `npm run preview` : local preview of the built site (`astro preview`)
- `npm run check` : build + TypeScript check (`astro build && tsc`)
- `npm run docs:check` : verify instruction/docs consistency

## Testing & Linting

- **No formal unit test framework is configured** in this repo.
- **Type checking** is done via `tsc` in `npm run check`.
- **Docs integrity check** is done via `npm run docs:check`.
- **No ESLint/Prettier config** is currently enforced; follow existing style.

## Architecture Overview

- **Runtime/deployment model**: static output (`output: "static"`) for Cloudflare Pages.
- **Content**: Markdown/MDX files in `src/content/blog/`, schema in `src/content.config.ts`.
- **Pages**: route files under `src/pages/`.
- **Layouts/components**: `src/layouts/` and `src/components/`.
- **Static assets**: `public/`.
- **Functions**: API endpoints in `functions/` (e.g., contact/share event handlers).

## Project-Specific Conventions

- Keep blog frontmatter aligned with `src/content.config.ts` (`title`, `description`, `pubDate`; optional `updatedDate`, `heroImage`).
- Blog routes use collection-derived IDs (see `src/pages/blog/[...slug].astro`).
- Update `src/consts.ts` for global site metadata changes.

## Build & Deploy

- Build output is `dist/`.
- Primary deployment target is Cloudflare Pages.
- Keep deployment docs aligned with:
  1. `astro.config.mjs`
  2. `package.json` scripts
  3. `README.md`

## Troubleshooting

- Run `npm install` if modules are missing.
- Run `npm run check` for build/type failures.
- Run `npm run docs:check` after changing instruction/docs files.
