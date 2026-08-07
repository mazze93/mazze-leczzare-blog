# mazze-leczzare-blog — Agent Context

Personal blog for Mazze LeCzzare Frazer. Astro 7 static site deployed to **Cloudflare Pages**.

## Stack

- **Framework**: Astro 7, `output: "static"` (fully SSG — no SSR)
- **UI islands**: React 19 (`@astrojs/react`) — interactive components only
- **Content**: Markdown + MDX via Astro Content Collections (`src/content/blog/`)
- **Styles**: hand-authored CSS custom properties (`src/styles/`) only. **No Tailwind** — the config and dependency were both retired 2026-08-03; `global.css` owns the reset
- **Edge functions**: Cloudflare Pages Functions (`functions/`)
- **Middleware**: `functions/_middleware.ts` — JWT admin auth + Markdown-for-Agents content negotiation
- **Deploy**: Cloudflare Pages (not Workers, not Vercel)
- **Node**: 22.x

## Canonical Commands (from `package.json`)

```bash
npm run dev        # Astro dev server on localhost:4321
npm run build      # Static build → dist/
npm run preview    # Preview dist/ locally
npm run check      # astro build && tsc — repo-standard validation
npm run docs:check # Validate doc command refs and deployment terminology
npm run test       # vitest run — unit tests for src/**/*.test.ts
```

**Always run `npm run check` before committing code changes.**

## Key Constraints

- **No SSR** — `output: "static"` is non-negotiable. All dynamic behaviour lives in `functions/api/`.
- **Islands discipline** — React only for `ThemeToggle`, `ContactForm`, `PostQuoteShare`, and `constellation/ConstellationNodes`. No React for static rendering.
- **No Tailwind** — retired 2026-08-03 (config archived to `docs/archive/retired-2026-08-03/`). Style with the custom properties in `global.css`; do not reintroduce utility classes.
- **Single source of truth** — site identity in `src/consts.ts`. Never hardcode URLs, titles, emails.
- **No external analytics** — telemetry is first-party only via `functions/api/share-event.ts`.
- **No published email** — contact goes through `functions/api/contact.ts`. One approved exception: the résumé contact line on `/work/research-program-operations/` (see CLAUDE.md).
- **JWT_SECRET must be ≥ 32 chars** — middleware and login fail closed if not met.
- **Deployment platform is Cloudflare Pages** — do not use Workers adapter terminology. Local preview uses `npm run preview`, not wrangler's local server command.

## Routes

| URL                | File                                |
| ------------------ | ----------------------------------- |
| `/`                | `src/pages/index.astro`             |
| `/blog`            | `src/pages/blog/index.astro`        |
| `/blog/[slug]/`    | `src/pages/blog/[...slug].astro`    |
| `/contact`         | `src/pages/contact.astro`           |
| `/about`           | `src/pages/about.astro`               |
| `/work`            | `src/pages/work.astro`              |
| `/security`        | `src/pages/security.astro`          |
| `/roadmap`         | `src/pages/roadmap.md`              |
| `/login`           | `src/pages/login.astro`             |
| `/admin`           | `src/pages/admin/index.astro`       |
| `/writing/`        | `src/pages/writing/index.astro` (publication catalogue) |
| `/intentional-fragility/` | `public/intentional-fragility/index.html` (standalone spine page) |
| `/writing/what-i-can-stand-by/` | `public/writing/what-i-can-stand-by/index.html` (standalone) |
| `/artifacts/tessera-claude-anchor.html` | `public/artifacts/tessera-claude-anchor.html` (standalone) |
| `/rss.xml`         | `src/pages/rss.xml.js`              |
| `/api/contact`     | `functions/api/contact.ts`          |
| `/api/share-event` | `functions/api/share-event.ts`      |
| `/api/login`       | `functions/api/login.ts`            |
| `/api/logout`      | `functions/api/logout.ts`           |

## Middleware (`functions/_middleware.ts`)

Runs on every request. Three responsibilities:

1. **JWT auth** — protects all `/admin/*` routes. Reads `__Host-auth_token` cookie, verifies HS256 JWT against `JWT_SECRET`. Fails closed on missing or short secret.
2. **Markdown-for-Agents** — when a request includes `Accept: text/markdown`, converts the HTML response to Markdown via `HTMLRewriter` and returns `Content-Type: text/markdown`.
3. **Security headers** — sets CSP and `X-Frame-Options` on every response. `/artifacts/*` gets a relaxed `ARTIFACT_CSP`; everything else gets `DEFAULT_CSP`.

## Content Collection Schema

```ts
// src/content.config.ts — collection: "blog"
{
  title: string             // required
  description: string       // required
  pubDate: Date             // required — coerced from YYYY-MM-DD string
  updatedDate?: Date
  heroImage?: ImageMetadata // relative path from post file to src/assets/images/blog/ (processed by Astro)
  subtitle?: string
  category?: string
  author?: string
  tags?: string[]
  readingTime?: string      // manual override e.g. '~7 min'
  heroImageOG?: string      // Open Graph image path
  heroImageAlt?: string     // alt text for hero image
  featured?: boolean
  slug?: string             // explicit URL slug override
  draft?: boolean           // true = hidden from all listings
}
```

## Images

Two directories serve different purposes — do not mix them:

| Directory | Purpose | How to reference |
| --------- | ------- | ---------------- |
| `src/assets/images/blog/` | Astro-processed images — WebP/AVIF conversion, srcset, lazy loading | Relative path in frontmatter `heroImage` (e.g. `../../assets/images/blog/hero.jpg`), or relative import in MDX body |
| `public/images/blog/` | Static images served as-is — OG/social only | URL string in `heroImageOG` (e.g. `/images/blog/og.jpg`) |

## Authoring Posts

Create `src/content/blog/your-slug.md` with `title`, `description`, `pubDate` (YYYY-MM-DD).
Body prose auto-gets paragraph share buttons. Post appears at `/blog/your-slug/`.
Set `draft: true` to hide from all listings without deleting.

## Deployment

Cloudflare Pages. Build command: `npm run build`. Output: `dist/`. Functions in `functions/`
are deployed automatically. Secrets (`ADMIN_PASSWORD`, `JWT_SECRET`, `CONTACT_WEBHOOK_URL`,
optional `CONTACT_WEBHOOK_AUTH_HEADER`) must be set via `wrangler secret put` or the
Cloudflare dashboard — never in `wrangler.toml`. Route-level rate limiting should be
managed in the Cloudflare dashboard for this Pages project.
