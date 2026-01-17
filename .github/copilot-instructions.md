# mazzeleczzare.com — AI Coding Agent Instructions

## Overview

This repository contains the source code for **mazzeleczzare.com**, a performance-focused, accessible blog built with Astro and deployed to Cloudflare Pages as a static site.

**Mission**: Deliver a fast, accessible reading experience with minimal JavaScript, clean SEO, and stable content URLs.

**Tech Stack**: Astro 5.x, TypeScript (strict mode), MDX, static site generation  
**Deployment**: Cloudflare Pages (static hosting)  
**Performance Target**: 100/100 Lighthouse score

---

## Core Principles (Non-Negotiables)

These principles are foundational to the project and must not be compromised:

### 1. Privacy First
- **No tracking/telemetry by default**. Analytics, monitoring, or third-party scripts require explicit approval via a Decision file in `/decisions`.
- Do not add cookies, localStorage, or tracking pixels without documented approval.

### 2. Content Stability
- **Never break permalinks**. URLs are permanent contracts with readers and search engines.
- Content must remain accessible at the same path indefinitely.
- When refactoring routing, ensure redirects are in place.

### 3. Accessibility & Readability
- **Semantic HTML first**. Use proper heading hierarchy, landmarks, and ARIA labels only when HTML semantics are insufficient.
- Maintain WCAG 2.1 AA compliance minimum (contrast ratios, keyboard navigation, screen reader support).
- Test changes with keyboard-only navigation.

### 4. Simplicity & Performance
- **Minimal dependencies**. Each new dependency must justify its bundle size impact.
- Prefer Astro components and SSR over client-side JavaScript.
- Client directives (`client:*`) require justification in PR descriptions.
- Keep the build simple and fast.

---

## Content Management Rules

### Frontmatter Schema
- **Schema changes require a Decision file**. The frontmatter schema (defined in `src/content.config.ts`) is a public API contract.
- Required fields: `title` (string), `description` (string), `pubDate` (date)
- Optional fields: `updatedDate` (date), `heroImage` (string path)
- All blog posts must validate against the Zod schema.

### Content Guidelines
- Write excerpts/descriptions thoughtfully. Never invent quotes or misrepresent content.
- Use Markdown for simple posts, MDX when component interactivity is needed.
- Place blog posts in `src/content/blog/` with meaningful filenames (becomes the URL slug).
- Images belong in `public/` directory for optimal serving.

### URL Structure
- Blog posts: `/blog/{post.id}/` where `post.id` is the filename without extension
- Static pages: `/about/`, `/manifesto/`, `/roadmap/`
- RSS feed: `/rss.xml`

---

## Engineering Standards

### Development Workflow
1. **Always verify changes**:
   ```bash
   npm run build    # Ensure production build succeeds
   npm run check    # Run type checking (build + tsc)
   npm run preview  # Test locally before deploying
   ```
2. **Test accessibility**: Use keyboard navigation to verify interactive elements.
3. **Check performance**: Lighthouse audit for significant UI changes.

### Code Style & Patterns
- **TypeScript strict mode** is enforced (`strictNullChecks: true`).
- Follow existing patterns in the codebase (study similar files before creating new ones).
- Component styles: Inline `<style>` blocks in `.astro` files using CSS variables for theming.
- Global styles: Edit `src/styles/global.css` for site-wide changes.

### Astro Best Practices
- **Prefer static rendering**: This site uses `output: "static"`.
- **Minimize client directives**: Use `client:load`, `client:idle`, etc. only when necessary.
- **Use Content Collections API**: Access blog posts via `getCollection('blog')` from `astro:content`.
- **Render markdown**: Use `render(post)` to extract `Content` component and metadata.

### Environment Variables
- Add environment variables only if required for Cloudflare Pages deployment.
- Document new variables in README or a Decision file.

---

## Decision-Making Process

**Significant changes require a Decision file** in `/decisions/` directory.

### What Requires a Decision File:
- Routing changes or URL restructuring
- SEO strategy modifications (meta tags, sitemap logic)
- Analytics or tracking additions
- Content model/schema changes
- New third-party dependencies with significant impact
- Changes to build or deployment process

### Decision File Template:
```markdown
# [Short Title]

**Date**: YYYY-MM-DD  
**Status**: Proposed | Accepted | Rejected

## Context
[Why is this decision needed?]

## Considered Options
1. Option A: [Description]
2. Option B: [Description]

## Decision
[Chosen option and rationale]

## Consequences
- Positive: [Benefits]
- Negative: [Trade-offs]
- Risks: [What could go wrong]
```


---

## Technical Reference

### Quick Command Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview production build locally |
| `npm run check` | Type check + build validation |
| `npm run astro -- --help` | Get Astro CLI help |

### Project Structure

```
mazze-leczzare-blog/
├── .github/               # GitHub config, workflows, and this file
├── public/                # Static assets (images, fonts, favicon)
│   ├── blog-placeholder-*.jpg
│   └── fonts/
├── src/
│   ├── components/        # Reusable Astro components
│   │   ├── BaseHead.astro      # <head> meta tags and SEO
│   │   ├── Header.astro        # Site header with navigation
│   │   ├── Footer.astro        # Site footer
│   │   ├── HeaderLink.astro    # Navigation link component
│   │   └── FormattedDate.astro # Date formatting component
│   ├── content/
│   │   └── blog/          # Blog post markdown/MDX files
│   ├── layouts/
│   │   └── BlogPost.astro # Blog post page template
│   ├── pages/             # File-based routing
│   │   ├── index.astro         # Homepage
│   │   ├── about.md            # About page
│   │   ├── manifesto.md        # Manifesto page
│   │   ├── roadmap.md          # Roadmap page
│   │   ├── rss.xml.js          # RSS feed generator
│   │   └── blog/
│   │       ├── index.astro     # Blog listing page
│   │       └── [...slug].astro # Dynamic blog post pages
│   ├── styles/
│   │   └── global.css     # Global styles and CSS variables
│   ├── consts.ts          # Site-wide constants (SITE_TITLE, etc.)
│   ├── content.config.ts  # Content collections schema (Zod)
│   └── env.d.ts           # TypeScript environment declarations
├── astro.config.mjs       # Astro configuration
├── tsconfig.json          # TypeScript config (strict mode)
└── package.json           # Dependencies and scripts
```

### Architecture Details

#### Content Collections
- **Location**: `src/content/blog/`
- **Schema**: Defined in `src/content.config.ts` using Zod validation
- **Access pattern**: Use `getCollection('blog')` from `astro:content`
- **Rendering**: Use `render(post)` to get `Content` component and metadata

#### Routing System
- **Blog posts**: Dynamic route in `src/pages/blog/[...slug].astro`
  - `post.id` (filename without extension) becomes the URL slug
  - Example: `first-post.md` → `/blog/first-post/`
- **Static pages**: Direct file mapping in `src/pages/`
  - Example: `about.md` → `/about/`
- **Collections**: Blog index at `src/pages/blog/index.astro` (sorted by `pubDate` descending)

#### Component Architecture
- **BaseHead**: Manages `<head>` content, SEO meta tags, Open Graph data
- **Header/Footer**: Site-wide navigation and footer (used in layouts)
- **BlogPost layout**: Wraps blog content with consistent structure, handles dates, hero images
- **FormattedDate**: Formats dates with locale support (e.g., "January 1, 2025")

### Type System

**TypeScript Configuration**: Extends `astro/tsconfigs/strict` with `strictNullChecks: true`

**Key Types**:
```typescript
import type { CollectionEntry } from 'astro:content';

// Blog post type
type BlogPost = CollectionEntry<'blog'>;

// Frontmatter shape
type BlogPostData = {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  heroImage?: string;
};
```

**Type Safety Rules**:
- Always import types from `astro:content` for collection entries
- Update `src/content.config.ts` Zod schema when changing frontmatter structure
- Run `npm run check` to validate types before committing

### Styling System

#### Global Styles
- **File**: `src/styles/global.css`
- **Scope**: Site-wide typography, resets, base colors
- **Variables**: CSS custom properties for theming (e.g., `--gray`, `--gray-dark`, `--box-shadow`)

#### Component Styles
- **Pattern**: Scoped `<style>` blocks inside `.astro` files
- **Approach**: Component-specific styles with CSS variable references
- **No CSS Modules**: Astro provides automatic scoping

#### Design Tokens
Defined in `src/styles/global.css` as CSS custom properties:
- Color palette: `--accent`, `--gray`, `--gray-light`, `--gray-dark`
- Shadows: `--box-shadow`
- Responsive: Mobile-first approach, max-width containers

### Build & Deployment

**Build Process**:
1. Astro statically generates all pages at build time
2. Output directory: `./dist/` (excluded from git)
3. Content collections are validated and synced
4. TypeScript types are checked

**Deployment Configuration** (Cloudflare Pages):
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Framework**: Astro (static)
- **Node version**: Specified in `.nvmrc` or package.json `engines` (if present)

**Current Site URL**: `https://example.com` (placeholder in `astro.config.mjs`)  
⚠️ Update `site` value in `astro.config.mjs` before production deployment.

### Testing & Quality Assurance

**Automated Checks**:
- ✅ TypeScript type checking: `npm run check`
- ✅ Build validation: `npm run build`
- ❌ No unit tests configured
- ❌ No linting configured (ESLint/Prettier)

**Manual Testing Checklist**:
- [ ] Build succeeds without errors
- [ ] Preview site loads correctly (`npm run preview`)
- [ ] All links work (internal and external)
- [ ] Keyboard navigation functions properly
- [ ] Images load with proper alt text
- [ ] RSS feed validates (check `/rss.xml`)
- [ ] Lighthouse score ≥95 for Performance, Accessibility, SEO

**Style Guidelines**:
- Follow existing code patterns (indentation, naming conventions)
- Use 2-space indentation (Astro/TypeScript)
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable names

---

## Common Tasks & Recipes

### Adding a New Blog Post

1. **Create file** in `src/content/blog/my-new-post.md`
2. **Add frontmatter**:
   ```yaml
   ---
   title: "My New Post"
   description: "A concise summary for SEO and social sharing"
   pubDate: 2025-01-17
   heroImage: /blog-placeholder-1.jpg
   ---
   ```
3. **Write content** in Markdown or MDX
4. **Verify**: Run `npm run build` to validate schema and build
5. **Preview**: Run `npm run preview` to view locally

**URL will be**: `/blog/my-new-post/`

### Updating Site Metadata

**Site Title/Description**:
- Edit `src/consts.ts`: Update `SITE_TITLE` and `SITE_DESCRIPTION`

**Canonical URL**:
- Edit `astro.config.mjs`: Update `site` property

**SEO/Open Graph**:
- Edit `src/components/BaseHead.astro` for meta tag logic

### Modifying a Layout

**Blog post layout**: `src/layouts/BlogPost.astro`
- Contains hero image logic, date formatting, title/description structure
- Used by `src/pages/blog/[...slug].astro`

**Site-wide layout**: Components in `src/components/Header.astro` and `Footer.astro`

### Adding a New Static Page

1. **Create file** in `src/pages/my-page.md` or `src/pages/my-page.astro`
2. **Add frontmatter** (for Markdown) or use layouts (for Astro)
3. **Link from navigation** in `src/components/Header.astro` if needed

### Customizing Styles

**Global changes**: Edit `src/styles/global.css`  
**Component-specific**: Add `<style>` block in the `.astro` component  
**CSS variables**: Modify or add to `:root` in `global.css` for theme consistency

### Debugging Build Issues

**Problem**: `tsc` type errors
- **Solution**: Check `src/content.config.ts` schema matches frontmatter
- Ensure all imports use correct types from `astro:content`

**Problem**: Content not appearing
- **Solution**: Verify file is in `src/content/blog/` with valid frontmatter
- Check schema validation in `npm run build` output

**Problem**: Styles not applying
- **Solution**: Check for typos in CSS variable names
- Verify `global.css` is imported in base layout

---

## Troubleshooting

### Build Errors

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| "Cannot find module" | Missing dependency | Run `npm install` |
| Zod validation failed | Invalid frontmatter | Check `src/content.config.ts` schema |
| TypeScript errors | Type mismatch | Run `npm run check` for details |
| Missing file in build | File not in `public/` or `src/` | Move to correct directory |

### Content Issues

- **Posts not showing**: Ensure `pubDate` is valid and not in the future
- **Broken images**: Image paths must start with `/` and exist in `public/`
- **Bad formatting**: Check for unclosed HTML tags or invalid Markdown syntax

### Performance Issues

- **Slow build**: Too many blog posts? Consider pagination (requires code changes)
- **Large bundle**: Audit dependencies, remove unused packages
- **Slow page load**: Optimize images, check for blocking scripts

---

## Resources

- **Astro Docs**: https://docs.astro.build
- **Content Collections**: https://docs.astro.build/en/guides/content-collections/
- **Cloudflare Pages**: https://developers.cloudflare.com/pages/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse

---

## Questions or Clarifications

If anything in these instructions is unclear or missing, please ask specifically:
- **Routing**: How URLs map to files and dynamic routes
- **Content schema**: Frontmatter structure and validation
- **Deployment**: Build process and Cloudflare Pages configuration
- **Styling**: CSS architecture and theming system
- **Components**: How to use or create reusable components

This document is maintained as part of the repository. Propose updates via PR when discovering gaps or outdated information.
