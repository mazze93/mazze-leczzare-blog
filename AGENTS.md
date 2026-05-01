# mazze-leczzare-blog — Agent Context

Personal blog for Mazze LeCzzare Frazer. Astro 6 static site deployed to **Cloudflare Pages**.

## Stack

- **Framework**: Astro 6, `output: "static"` (fully SSG — no SSR)
- **UI islands**: React 19 (`@astrojs/react`) — interactive components only
- **Content**: Markdown + MDX via Astro Content Collections (`src/content/blog/`)
- **Styles**: CSS custom properties (`src/styles/`) + Tailwind CSS 4 utility layer (`tailwind.config.mjs`; `preflight: false` — `global.css` owns the base reset)
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
```

**Always run `npm run check` before committing code changes.**

## Key Constraints

- **No SSR** — `output: "static"` is non-negotiable. All dynamic behaviour lives in `functions/api/`.
- **Islands discipline** — React only for `ThemeToggle`, `ContactForm`, `PostQuoteShare`. No React for static rendering.
- **Tailwind utility layer only** — maps CSS vars to utility classes; do not enable preflight or let Tailwind own base styles.
- **Single source of truth** — site identity in `src/consts.ts`. Never hardcode URLs, titles, emails.
- **No external analytics** — telemetry is first-party only via `functions/api/share-event.ts`.
- **No published email** — contact goes through `functions/api/contact.ts`.
- **JWT_SECRET must be ≥ 32 chars** — middleware and login fail closed if not met.
- **Deployment platform is Cloudflare Pages** — do not use Workers adapter terminology or `wrangler dev` for local preview; use `npm run preview`.

## Routes

| URL                | File                                |
| ------------------ | ----------------------------------- |
| `/`                | `src/pages/index.astro`             |
| `/blog`            | `src/pages/blog/index.astro`        |
| `/blog/[slug]/`    | `src/pages/blog/[...slug].astro`    |
| `/contact`         | `src/pages/contact.astro`           |
| `/about`           | `src/pages/about.mdx`               |
| `/work`            | `src/pages/work.astro`              |
| `/security`        | `src/pages/security.astro`          |
| `/roadmap`         | `src/pages/roadmap.md`              |
| `/login`           | `src/pages/login.astro`             |
| `/admin`           | `src/pages/admin/index.astro`       |
| `/rss.xml`         | `src/pages/rss.xml.js`              |
| `/api/contact`     | `functions/api/contact.ts`          |
| `/api/share-event` | `functions/api/share-event.ts`      |
| `/api/login`       | `functions/api/login.ts`            |
| `/api/logout`      | `functions/api/logout.ts`           |

## Middleware (`functions/_middleware.ts`)

Runs on every request. Two responsibilities:

1. **JWT auth** — protects all `/admin/*` routes. Reads `__Host-auth_token` cookie, verifies HS256 JWT against `JWT_SECRET`. Fails closed on missing or short secret.
2. **Markdown-for-Agents** — when a request includes `Accept: text/markdown`, converts the HTML response to Markdown via `HTMLRewriter` and returns `Content-Type: text/markdown`.

## Content Collection Schema

```ts
// src/content.config.ts — collection: "blog"
{
  title: string             // required
  description: string       // required
  pubDate: Date             // required — coerced from YYYY-MM-DD string
  updatedDate?: Date
  heroImage?: string        // URL path relative to public/ (e.g. /images/blog/foo.jpg)
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
| `src/assets/images/blog/` | Astro-processed images (optimized, WebP) | Relative import in MDX body |
| `public/images/blog/` | Static images served as-is | URL path in frontmatter (`heroImage`, `heroImageOG`) |

## Authoring Posts

Create `src/content/blog/your-slug.md` with `title`, `description`, `pubDate` (YYYY-MM-DD).
Body prose auto-gets paragraph share buttons. Post appears at `/blog/your-slug/`.
Set `draft: true` to hide from all listings without deleting.

## Deployment

Cloudflare Pages. Build command: `npm run build`. Output: `dist/`. Functions in `functions/`
are deployed automatically. Secrets (`ADMIN_PASSWORD`, `JWT_SECRET`, `CONTACT_TO_EMAIL`)
must be set via `wrangler secret put` or the Cloudflare dashboard — never in `wrangler.toml`.
