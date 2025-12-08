<!-- Copilot/AI agent instructions tailored to this Astro + Cloudflare blog starter -->
# Project quickstart for AI coding agents

This repo is an Astro-based static blog scaffold, deployed to Cloudflare Workers using the `@astrojs/cloudflare` adapter.
Below are the immediate, discoverable conventions and examples an AI agent needs to be productive here.

**Quick Commands:**
- `npm install` : install deps
- `npm run dev` : local dev server (Astro, :4321)
- `npm run build` : produce `./dist`
- `npm run preview` : build + `wrangler dev` (preview on Cloudflare runtime)
- `npm run cf-typegen` : `wrangler types` (generate Cloudflare types)
- `npm run check` : build + `tsc` + `wrangler deploy --dry-run` (CI-style check)

**Big-picture architecture**
- Framework: `astro` (see `astro.config.mjs`), deployed with `@astrojs/cloudflare` adapter. Note `platformProxy.enabled` is set in the adapter.
- Content: Markdown/MDX files live in `src/content/blog/`. Content Collections are configured in `src/content.config.ts`.
- Pages: Route files are in `src/pages/` (e.g. `src/pages/blog/[...slug].astro` and `src/pages/blog/index.astro`).
- Layouts & components: `src/layouts/` and `src/components/` contain shared UI. Global constants are in `src/consts.ts`.
- Static assets: `public/` (fonts, images) and referenced directly from templates.

**Project-specific conventions (must follow)**
- Content collection schema (see `src/content.config.ts`): frontmatter must include `title`, `description`, and `pubDate` (coerced to Date). Optional keys: `updatedDate`, `heroImage`.

Example frontmatter for a new post (`src/content/blog/my-post.md`):

```
---
title: "My Post"
description: "Short summary"
pubDate: 2025-01-01
heroImage: /assets/my-hero.jpg
---
```

- Routing: pages use `getCollection('blog')` and `post.id` as the slug. URLs follow `/blog/{post.id}/` (see `src/pages/blog/[...slug].astro`).
- Rendering MDX/Markdown: use `render(post)` from `astro:content` to extract `Content` for insertion into `BlogPost` layout.

**Files to inspect for behavior examples**
- `src/content.config.ts` — collection loader and Zod schema (frontmatter rules).
- `src/pages/blog/index.astro` — listing page, sorts posts by `pubDate`.
- `src/pages/blog/[...slug].astro` & `src/layouts/BlogPost.astro` — post routing and layout.
- `src/components/*` — site header/footer and small reusable components (link pattern, formatted date).

**Build / Deploy notes for automation**
- The repo expects Cloudflare Tools: `wrangler` is used (`devDependencies`). CI scripts call `wrangler deploy --dry-run` in `npm run check`.
- Before deploying, ensure `site` in `astro.config.mjs` points to the canonical domain (it currently uses `https://example.com`).

**TypeScript & typing patterns**
- Content collection types are used (`astro:content` types, `CollectionEntry<'blog'>`). When changing frontmatter, update `src/content.config.ts` schema accordingly.
- Run `npm run cf-typegen` or `wrangler types` if adding Cloudflare-specific bindings.

**Styling & layout**
- Global styles: `src/styles/global.css`.
- Components often inline small `<style>` blocks inside `.astro` files — follow the existing style placement and variable usage (CSS variables used in components).

**Common edits an agent might do**
- Add new blog: create MD/MDX in `src/content/blog/` with frontmatter matching the Zod schema.
- Update site metadata: edit `src/consts.ts` (site title/description) and `astro.config.mjs` (site URL).
- Change layout: modify `src/layouts/BlogPost.astro` or `src/components/*`.

If anything in these notes is missing or unclear, tell me which area (routing, content schema, build/deploy) you want expanded and I will update this file.
