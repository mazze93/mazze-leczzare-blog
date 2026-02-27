# mazze-leczzare-blog — Claude Context

Personal blog at [mazzeleczzare.com](https://mazzeleczzare.com). Built with Astro, deployed to Cloudflare Pages.

## Stack
- **Framework**: Astro 5 (`astro.config.mjs`) — static output
- **Content**: MDX + Markdown via Astro Content Collections
- **Integrations**: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`
- **Deployment**: Cloudflare Pages (`wrangler.toml`)
- **Language**: TypeScript

## Key Commands
```bash
npm run dev       # Dev server
npm run build     # Build to dist/
npm run preview   # Preview built output
npm run check     # Type-check (astro build && tsc)
```

## Project Structure
```
src/
  content/
    blog/           # Blog posts (.md / .mdx)
  pages/
    index.astro     # Homepage
    about.md
    manifesto.md
    roadmap.md
    blog/           # Blog listing + post pages
    rss.xml.js      # RSS feed
  layouts/
    BlogPost.astro  # Layout for blog posts
  components/
    BaseHead.astro  Header.astro  Footer.astro
    HeaderLink.astro  FormattedDate.astro
  styles/           # Global CSS
  consts.ts         # SITE_TITLE, SITE_DESCRIPTION
  content.config.ts # Content collection schema
public/             # Static assets (favicon, fonts, placeholder images)
```

## Blog Post Frontmatter
```yaml
---
title: "Post Title"
description: "Short description"
pubDate: "2026-01-15"
updatedDate: "2026-01-20"  # optional
heroImage: "/blog-placeholder-1.jpg"  # optional
---
```

## Notes
- Site URL: `https://mazzeleczzare.com` (set in `astro.config.mjs`)
- Global site metadata lives in `src/consts.ts`
- New blog posts go in `src/content/blog/` as `.md` or `.mdx`
- No server-side functions — fully static output
