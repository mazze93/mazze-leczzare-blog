<!-- Copilot/AI agent instructions tailored to this Astro blog starter -->
# Project quickstart for AI coding agents

This repo is an Astro-based static blog, deployed to Cloudflare Pages as a static website.
Below are the immediate, discoverable conventions and examples an AI agent needs to be productive here.

## Quick Commands

- `npm install` : install dependencies
- `npm run dev` : local dev server (Astro, localhost:4321)
- `npm run build` : build production site to `./dist`
- `npm run preview` : preview production build locally
- `npm run check` : build + TypeScript type checking
- `npm run astro ...` : run Astro CLI commands (e.g., `npm run astro add`, `npm run astro check`)

## Testing & Linting

- **No test framework**: This project does not have automated tests. Manual verification is required for changes.
- **Type checking**: TypeScript type checking is done via `tsc` (part of `npm run check`).
- **No linters**: No ESLint or Prettier configuration. Follow existing code style in the project.

## Architecture Overview

- **Framework**: `astro` (see `astro.config.mjs`), configured for static output (`output: "static"`).
- **Deployment**: Static site deployed to Cloudflare Pages (not Workers).
- **Content**: Markdown/MDX files live in `src/content/blog/`. Content Collections are configured in `src/content.config.ts` using Astro's glob loader.
- **Pages**: Route files are in `src/pages/` (e.g., `src/pages/blog/[...slug].astro` for individual posts and `src/pages/blog/index.astro` for the listing page).
- **Layouts & components**: `src/layouts/` and `src/components/` contain shared UI. Global constants are in `src/consts.ts`.
- **Static assets**: `public/` directory (fonts, images) served directly without processing.

## Project-Specific Conventions

**Content collection schema** (see `src/content.config.ts`): frontmatter must include `title`, `description`, and `pubDate` (coerced to Date). Optional keys: `updatedDate`, `heroImage`.

Example frontmatter for a new post (`src/content/blog/my-post.md`):

```
---
title: "My Post"
description: "Short summary"
pubDate: 2025-01-01
heroImage: /assets/my-hero.jpg
---
```

**Routing**: pages use `getCollection('blog')` to retrieve blog posts. Each post's `id` (derived from the file path) serves as the URL slug. URLs follow `/blog/{post.id}/` pattern (see `src/pages/blog/[...slug].astro`).

**Rendering MDX/Markdown**: use `render(post)` from `astro:content` to extract `Content` for insertion into `BlogPost` layout.

## Key Files to Reference

- `src/content.config.ts` — collection loader and Zod schema (frontmatter rules).
- `src/pages/blog/index.astro` — listing page, sorts posts by `pubDate`.
- `src/pages/blog/[...slug].astro` & `src/layouts/BlogPost.astro` — post routing and layout.
- `src/components/*` — site header/footer and small reusable components (link pattern, formatted date).
- `src/consts.ts` — global site constants like `SITE_TITLE` and `SITE_DESCRIPTION`.

## Build & Deploy

- **Deployment target**: Cloudflare Pages (static site deployment).
- **Build command**: `npm run build` (produces `./dist` directory).
- **Build output**: `./dist/` directory (excluded from git).
- **Site URL**: Configured in `astro.config.mjs` as `site: "https://example.com"` - update this to your actual domain before deploying.
- **Deployment**: Connect your GitHub repository to Cloudflare Pages with build command `npm run build` and output directory `dist`.

## TypeScript & Typing

- Content collection types are generated from `astro:content` (e.g., `CollectionEntry<'blog'>` type).
- When changing frontmatter schema, update the Zod schema in `src/content.config.ts` accordingly.
- Type checking is enforced via `tsc` as part of the `npm run check` command.
- TypeScript configuration is in `tsconfig.json`.

## Styling & Layout

- **Global styles**: `src/styles/global.css`.
- **Component styles**: Components often inline small `<style>` blocks inside `.astro` files — follow the existing style placement and variable usage (CSS variables used in components).

## Common Tasks

- **Add new blog post**: create MD/MDX in `src/content/blog/` with frontmatter matching the Zod schema.
- **Update site metadata**: edit `src/consts.ts` (site title/description) and `astro.config.mjs` (site URL).
- **Change layout**: modify `src/layouts/BlogPost.astro` or `src/components/*`.

## Troubleshooting

- If you encounter build errors, ensure all dependencies are installed with `npm install`.
- For type errors, run `npm run check` to get detailed TypeScript diagnostics.
- Ensure blog post frontmatter matches the Zod schema defined in `src/content.config.ts`.
- Check that the `site` URL in `astro.config.mjs` is correct for your deployment.

---

If anything in these notes is missing or unclear, tell me which area (routing, content schema, build/deploy) you want expanded and I will update this file.
