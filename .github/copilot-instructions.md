<!-- Copilot/AI agent instructions tailored to this Astro blog starter -->
# Project quickstart for AI coding agents

This repo is an Astro-based static blog, designed for deployment to Cloudflare Pages or other static hosting platforms.
Below are the immediate, discoverable conventions and examples an AI agent needs to be productive here.

## Quick Commands

- `npm install` : install dependencies
- `npm run dev` : start local dev server (Astro, http://localhost:4321)
- `npm run build` : build production site to `./dist`
- `npm run preview` : preview production build locally
- `npm run check` : build + TypeScript type checking (validates changes)
- `npm run astro` : run Astro CLI commands

## Testing & Linting

- **No test framework**: This project does not have automated tests. Manual verification is required for changes.
- **Type checking**: TypeScript type checking is done via `tsc` (part of `npm run check`).
- **No linters**: No ESLint or Prettier configuration. Follow existing code style in the project.

## Architecture Overview

- **Framework**: Astro (see `astro.config.mjs`), configured for static site generation (`output: "static"`)
- **Content**: Markdown/MDX files in `src/content/blog/`. Content Collections are configured in `src/content.config.ts`
- **Pages**: Route files in `src/pages/` (e.g., `src/pages/blog/[...slug].astro` and `src/pages/blog/index.astro`)
- **Layouts & components**: `src/layouts/` and `src/components/` contain shared UI. Global constants in `src/consts.ts`
- **Static assets**: `public/` directory (fonts, images) — files served directly from root path
- **Integrations**: MDX (`@astrojs/mdx`), Sitemap (`@astrojs/sitemap`)
- **RSS Feed**: Generated via `@astrojs/rss` package in `src/pages/rss.xml.js` (not an Astro integration)

## Project-Specific Conventions

**Content collection schema** (see `src/content.config.ts`): frontmatter must include `title`, `description`, and `pubDate` (coerced to Date). Optional keys: `updatedDate`, `heroImage`.

Example frontmatter for a new post (`src/content/blog/my-post.md`):

```markdown
---
title: "My Post"
description: "Short summary"
pubDate: 2025-01-01
heroImage: /blog-placeholder-1.jpg  # Placeholder images 1-5 available in public/
---

Your post content here...
```

**Routing**: pages use `getCollection('blog')` and `post.id` as the slug. URLs follow `/blog/{post.id}/` (see `src/pages/blog/[...slug].astro`).

**Rendering MDX/Markdown**: use `render(post)` from `astro:content` to extract `Content` for insertion into `BlogPost` layout.

## Key Files to Reference

- `src/content.config.ts` — collection loader and Zod schema (frontmatter rules).
- `src/pages/blog/index.astro` — listing page, sorts posts by `pubDate`.
- `src/pages/blog/[...slug].astro` & `src/layouts/BlogPost.astro` — post routing and layout.
- `src/components/*` — site header/footer and small reusable components (link pattern, formatted date).
- `src/consts.ts` — global site constants like `SITE_TITLE` and `SITE_DESCRIPTION`.

## Build & Deploy

- **Build output**: `./dist/` directory (excluded from git via `.gitignore`)
- **Deployment target**: Cloudflare Pages (or any static hosting platform)
- **Production URL**: Configured in `astro.config.mjs` as `https://mazzeleczzare.com`
- **Deployment process**: Connect repository to Cloudflare Pages with build command `npm run build` and output directory `dist`

## TypeScript & Typing

- Content collection types are from `astro:content` (e.g., `CollectionEntry<'blog'>`)
- When changing frontmatter schema, update `src/content.config.ts` Zod schema accordingly
- Type checking is performed via `tsc` (part of `npm run check`)
- All `.astro` files support TypeScript in frontmatter sections (between `---` delimiters)

## Styling & Layout

- **Global styles**: `src/styles/global.css`
- **Component styles**: Components often have inline `<style>` blocks in `.astro` files
- **CSS architecture**: Uses CSS custom properties (variables) like `--black`, `--gray`, `--accent` for theming
- **Style conventions**: Follow existing scoped style patterns within Astro components

## Common Tasks

- **Add new blog post**: create MD/MDX in `src/content/blog/` with frontmatter matching the Zod schema.
- **Update site metadata**: edit `src/consts.ts` (site title/description) and `astro.config.mjs` (site URL).
- **Change layout**: modify `src/layouts/BlogPost.astro` or `src/components/*`.

## Troubleshooting

- If you encounter build errors, check that all dependencies are installed (`npm install`)
- For type errors, run `npm run check` to see full TypeScript diagnostics
- Ensure frontmatter in blog posts matches the schema in `src/content.config.ts`
- The dev server runs on port 4321 by default; check for port conflicts if it fails to start

## Boundaries & Restrictions

**DO NOT modify or remove:**
- Existing blog posts in `src/content/blog/` unless specifically requested
- The `.gitignore` file (keeps build artifacts out of version control)
- Production dependencies in `package.json` without careful consideration

**ALWAYS:**
- Run `npm run check` before committing changes to validate builds and types
- Test new blog posts locally with `npm run dev` to verify frontmatter and rendering
- Keep the content schema in `src/content.config.ts` in sync with frontmatter expectations
- Use absolute paths from `/` for images in `public/` directory (e.g., `/blog-placeholder-1.jpg`)

## Code Style Examples

**Astro component with TypeScript frontmatter:**
```astro
---
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

const posts = (await getCollection('blog')).sort(
	(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
---

<ul>
	{posts.map((post) => (
		<li>
			<a href={`/blog/${post.id}/`}>
				<h4>{post.data.title}</h4>
			</a>
		</li>
	))}
</ul>
```

**Content collection schema pattern:**
```typescript
import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
  }),
});
```

---

If anything in these notes is missing or unclear, tell me which area (routing, content schema, build/deploy) you want expanded and I will update this file.
