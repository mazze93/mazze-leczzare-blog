# Mazze LeCzzare — Personal Blog

![Framework](https://img.shields.io/badge/Framework-Astro%206-orange)
![Hosting](https://img.shields.io/badge/Hosting-Cloudflare%20Pages-blue)
![Content](https://img.shields.io/badge/Content-Markdown%20%2B%20MDX-success)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

Personal editorial platform for Mazze LeCzzare Frazer — essays, field notes, and public working documents at the intersection of narrative, cognition, and security-forward design.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 6 (fully static, `output: "static"`) |
| UI islands | React 19 — interactive components only |
| Content | Markdown + MDX via Astro Content Collections |
| Edge functions | Cloudflare Pages Functions (`functions/api/`) |
| Fonts | Atkinson Hyperlegible (self-hosted) |
| Deploy | Cloudflare Pages |

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Dev server → localhost:4321
npm run build      # Static build → dist/
npm run preview    # Preview built site locally
npm run check      # Build + TypeScript check (repo-standard validation)
npm run docs:check # Validate docs/instruction consistency
```

## Deployment

Deployed to **Cloudflare Pages** (not Workers, not Vercel).

Build settings:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

### Contact form

The `/contact` form (`functions/api/contact.ts`) supports two delivery paths:

1. **Webhook** — set `CONTACT_WEBHOOK_URL` as a Cloudflare secret. Optional: `CONTACT_WEBHOOK_AUTH_HEADER`.
2. **Email binding** — `CONTACT_EMAIL` Cloudflare Email binding as fallback.

Webhook takes priority when both are configured. Non-secret vars (`CONTACT_FROM_EMAIL`, `CONTACT_SUBJECT_PREFIX`) live in `wrangler.toml` under `[vars]`.

```bash
npx wrangler secret put CONTACT_WEBHOOK_URL
npx wrangler secret put CONTACT_WEBHOOK_AUTH_HEADER
```

## Project Structure

```text
src/
  components/       # Astro + React components
  content/blog/     # Markdown/MDX posts (Content Collection)
  layouts/          # BlogPost.astro, HomepageLayout.astro
  pages/            # File-based routes
  styles/           # global.css + homepage.css
  consts.ts         # Site-wide constants (single source of truth)

functions/api/
  contact.ts        # Contact form delivery
  share-event.ts    # Paragraph quote share telemetry

public/             # Static assets (fonts, images, favicon)
scripts/ops/        # Local operational scripts
docs/operations/    # Agent protocol and session memory
```

## Authoring Posts

Create `src/content/blog/your-slug.md` with frontmatter:

```yaml
---
title: "Post Title"
description: "One-sentence description."
pubDate: 2026-04-14
heroImage: "/your-image.jpg"   # optional
---
```

Post appears at `/blog/your-slug/` and surfaces on the homepage if in the 6 most recent.

## GitHub social preview

Upload `.github/social-preview.png` in `Settings → General → Social preview`.
