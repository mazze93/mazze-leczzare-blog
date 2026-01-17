# mazzeleczzare.com (Astro + Cloudflare Pages) — Copilot Instructions

## What this repo is

- Static site/blog for mazzeleczzare.com built with Astro.
- Deployment: Cloudflare Pages.
- Primary goal: fast, accessible reading experience; minimal JS; clean SEO.

## Non-negotiables

- **No tracking/telemetry by default**: No analytics scripts unless explicitly approved in a Decision file.
- **Keep content and URLs stable**: Avoid breaking permalinks.
- **Prefer accessibility and readability**: Semantic HTML, good contrast, keyboard support.
- **Avoid unnecessary dependencies**: Keep the build simple.

## Content rules

- Posts are Markdown/MDX with frontmatter.
- **Never change frontmatter schema without a Decision file**.
- Generate excerpts/descriptions thoughtfully; do not invent quotes.

## Engineering rules

- Prefer Astro components and server-side rendering where appropriate; minimize client directives.
- Add/modify env vars only if required for Cloudflare Pages.
- **Always provide verification steps**:
  - `npm run build`
  - `npm run preview` (if configured)

## Decision process

- Significant changes (routing, SEO strategy, analytics, content model changes) **require a Decision file in `/decisions`**.
- A Decision file documents the rationale, alternatives considered, and implementation approach.

---

## Technical Quickstart

### Quick Commands

- `npm install` : install deps
- `npm run dev` : local dev server (Astro, :4321)
- `npm run build` : produce `./dist`
- `npm run preview` : preview your build locally
- `npm run check` : build + `tsc` (type checking)

### Testing & Linting

- **No test framework**: This project does not have automated tests. Manual verification is required for changes.
- **Type checking**: TypeScript type checking is done via `tsc` (part of `npm run check`).
- **No linters**: No ESLint or Prettier configuration. Follow existing code style in the project.

### Architecture Overview

- **Framework**: `astro` (see `astro.config.mjs`), deployed as a static site to Cloudflare Pages.
- **Content**: Markdown/MDX files live in `src/content/blog/`. Content Collections are configured in `src/content.config.ts`.
- **Pages**: Route files are in `src/pages/` (e.g. `src/pages/blog/[...slug].astro` and `src/pages/blog/index.astro`).
- **Layouts & components**: `src/layouts/` and `src/components/` contain shared UI. Global constants are in `src/consts.ts`.
- **Static assets**: `public/` (fonts, images) and referenced directly from templates.

### Project-Specific Conventions

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

**Routing**: pages use `getCollection('blog')` and `post.id` as the slug. URLs follow `/blog/{post.id}/` (see `src/pages/blog/[...slug].astro`).

**Rendering MDX/Markdown**: use `render(post)` from `astro:content` to extract `Content` for insertion into `BlogPost` layout.

### Key Files to Reference

- `src/content.config.ts` — collection loader and Zod schema (frontmatter rules).
- `src/pages/blog/index.astro` — listing page, sorts posts by `pubDate`.
- `src/pages/blog/[...slug].astro` & `src/layouts/BlogPost.astro` — post routing and layout.
- `src/components/*` — site header/footer and small reusable components (link pattern, formatted date).
- `src/consts.ts` — global site constants like `SITE_TITLE` and `SITE_DESCRIPTION`.

### Build & Deploy

- The repo deploys to Cloudflare Pages as a static site.
- Before deploying, ensure `site` in `astro.config.mjs` points to the canonical domain (currently uses `https://example.com`).
- **Build output**: `./dist/` directory (excluded from git).

### TypeScript & Typing

- Content collection types are used (`astro:content` types, `CollectionEntry<'blog'>`). When changing frontmatter, update `src/content.config.ts` schema accordingly.
- Type checking is enforced via `tsc` in the check script.

### Styling & Layout

- **Global styles**: `src/styles/global.css`.
- **Component styles**: Components often inline small `<style>` blocks inside `.astro` files — follow the existing style placement and variable usage (CSS variables used in components).

### Common Tasks

- **Add new blog post**: create MD/MDX in `src/content/blog/` with frontmatter matching the Zod schema.
- **Update site metadata**: edit `src/consts.ts` (site title/description) and `astro.config.mjs` (site URL).
- **Change layout**: modify `src/layouts/BlogPost.astro` or `src/components/*`.

### Troubleshooting

- If you encounter build errors, check that all dependencies are installed (`npm install`).
- Ensure frontmatter in blog posts matches the schema in `src/content.config.ts`.

---

If anything in these notes is missing or unclear, tell me which area (routing, content schema, build/deploy) you want expanded and I will update this file.
