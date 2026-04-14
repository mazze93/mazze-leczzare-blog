# Authoring Guide — mazze-leczzare-blog

## Where things live

| Content stage | Location | Notes |
|---------------|----------|-------|
| HTML explorations | `files/prototypes/` | Local only — git-ignored |
| Design/UI prototypes | `files/design/` | Local only — git-ignored |
| Draft posts (not yet ready) | `src/content/blog/<slug>.mdx` with `draft: true` | Builds but hidden from listings |
| Published posts | `src/content/blog/<slug>.mdx` with `draft: true` removed | Appears on /blog/ and homepage |
| Post hero images | `public/images/blog/<slug>-hero.jpg` | Referenced as `/images/blog/<slug>-hero.jpg` in frontmatter |
| Portfolio images | `public/images/portfolio/` | |
| Components | `src/components/` | Astro or React (React only if interactive) |
| Layouts | `src/layouts/` | |

## Intake workflow

```
1. DRAFT     → files/prototypes/<slug>.html   (write and design freely)
2. CONVERT   → src/content/blog/<slug>.mdx    (frontmatter: draft: true)
3. REVIEW    → npm run dev → check at /blog/<slug>/
4. PUBLISH   → remove draft: true from frontmatter
```

## Blog post frontmatter

```yaml
---
title: "Post Title"
description: "One sentence for meta and listings."
pubDate: 2026-04-13
# Optional fields:
updatedDate: 2026-04-13
heroImage: "/images/blog/your-slug-hero.jpg"
heroImageOG: "/images/blog/your-slug-og.jpg"
heroImageAlt: "Descriptive alt text for the hero image."
subtitle: "Optional deck shown under title"
category: "Essay"
tags: ["tag-one", "tag-two"]
readingTime: "~8 min"
featured: true
# draft: true   ← remove this line to publish
---
```

## Key commands

```bash
npm run dev        # dev server at localhost:4321
npm run check      # astro build + tsc — run before every commit
npm run build      # production build → dist/
npm run preview    # preview dist/ locally
```

## What NOT to commit at repo root

- HTML files — go in `files/design/` or `files/prototypes/`
- Archives (`.tar.gz`, `.zip`) — delete them
- Images that belong in `public/` — move them there
- Astro/MDX files — go in `src/`
