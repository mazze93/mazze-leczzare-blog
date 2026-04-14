# mazze-leczzare-blog — Agent Context

Personal blog for Mazze LeCzzare Frazer. Astro 6 static site deployed to **Cloudflare Pages**.

## Stack

- **Framework**: Astro 6, `output: "static"` (fully SSG — no SSR)
- **UI islands**: React 19 (`@astrojs/react`) — interactive components only
- **Content**: Markdown + MDX via Astro Content Collections (`src/content/blog/`)
- **Edge functions**: Cloudflare Pages Functions (`functions/api/`)
- **Deploy**: Cloudflare Pages (not Workers, not Vercel)

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
- **No Tailwind** — removed for Astro 6 compatibility. CSS custom properties in `src/styles/global.css`.
- **Single source of truth** — site identity in `src/consts.ts`. Never hardcode URLs, titles, emails.
- **No external analytics** — telemetry is first-party only via `functions/api/share-event.ts`.
- **No published email** — contact goes through `functions/api/contact.ts`.

## Routes

| URL            | File                             |
| -------------- | -------------------------------- |
| `/`            | `src/pages/index.astro`          |
| `/blog`        | `src/pages/blog/index.astro`     |
| `/blog/[slug]/`| `src/pages/blog/[...slug].astro` |
| `/contact`     | `src/pages/contact.astro`        |
| `/about`       | `src/pages/about.md`             |
| `/work`        | `src/pages/work.astro`           |
| `/security`    | `src/pages/security.astro`       |
| `/roadmap`     | `src/pages/roadmap.md`           |
| `/api/contact` | `functions/api/contact.ts`       |
| `/api/share-event` | `functions/api/share-event.ts` |

## Content Collection Schema

```ts
// src/content.config.ts — collection: "blog"
{
  title: string        // required
  description: string  // required
  pubDate: Date        // required
  updatedDate?: Date
  heroImage?: string   // path relative to public/
}
```

## Authoring Posts

Create `src/content/blog/your-slug.md` with `title`, `description`, `pubDate`. Body prose auto-gets paragraph share buttons. Post appears at `/blog/your-slug/`.

## Deployment

Cloudflare Pages. Build command: `npm run build`. Output: `dist/`. Functions in `functions/api/` are deployed automatically alongside the static site.

Do not use `wrangler deploy`, `wrangler dev`, `@astrojs/cloudflare`, or Workers adapter terminology — this is a Pages deployment with a static Astro site.
