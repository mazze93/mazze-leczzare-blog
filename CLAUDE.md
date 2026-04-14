# mazze-leczzare-blog — Claude Context

Personal blog and publishing space for Mazze LeCzzare Frazer — a former neuroscientist turned
storyteller, marketer, and cybersecurity explorer. The site frames itself as a
"static-first working studio" for essays, field notes, and public working documents.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 6 (`output: "static"`, fully SSG) |
| UI islands | React 19 (`@astrojs/react`) — used only where interaction earns its keep |
| Content | Markdown + MDX via Astro Content Collections |
| Edge functions | Cloudflare Pages Functions (`functions/api/`) |
| Fonts | Atkinson Hyperlegible (self-hosted WOFF, preloaded) |
| Sitemap | `@astrojs/sitemap` (auto-generated) |
| RSS | `@astrojs/rss` |
| Email | `mimetext` + Cloudflare Email binding (`cloudflare:email`) |
| Type checking | TypeScript 5 strict mode + `tsc` via `npm run check` |
| Deploy CLI | Wrangler 4 (`wrangler.toml` manages Pages/Functions config) |

## Key Commands

```bash
npm run dev        # Astro dev server (localhost:4321)
npm run build      # Static build → dist/
npm run preview    # Preview dist/ locally
npm run check      # astro build && tsc (repo-standard validation)
npm run docs:check # Validate doc command references and deployment terminology
```

## Site Identity (`src/consts.ts`)

All constants are imported from `src/consts.ts` — never hardcode these inline.

```text
SITE_TITLE         = "Mazze Leczzare"
SITE_URL           = "https://mazzeleczzare.com"
SITE_AUTHOR        = "Mazze Leczzare"
SITE_EMAIL         = "mailto:security@mazzeleczzare.com"
```

## Directory Structure

```text
src/
  components/       # Astro + React components
  content/blog/     # Markdown/MDX blog posts (Content Collection)
  layouts/          # BlogPost.astro, HomepageLayout.astro
  pages/            # File-based routes
  styles/           # global.css + homepage.css
  consts.ts         # Site-wide constants
  content.config.ts # Content collection schema

functions/api/
  contact.ts        # Cloudflare Pages Function — contact form delivery
  share-event.ts    # Cloudflare Pages Function — quote share telemetry

scripts/ops/        # Local operational scripts (not part of the site build)
docs/operations/    # Agent operations protocol and memory files
public/             # Static assets (fonts, images, favicon, hero SVG)
```

## Routes

| URL               | File                                | Notes                                    |
| ----------------- | ----------------------------------- | ---------------------------------------- |
| `/`               | `src/pages/index.astro`             | BreathingHero + last 6 posts list        |
| `/blog`           | `src/pages/blog/index.astro`        | All posts, sorted newest-first           |
| `/blog/[slug]/`   | `src/pages/blog/[...slug].astro`    | Dynamic blog post route                  |
| `/contact`        | `src/pages/contact.astro`           | ContactForm island                       |
| `/about`          | `src/pages/about.md`                | Markdown page via BlogPost layout        |
| `/work`           | `src/pages/work.astro`              | Work/portfolio page                      |
| `/security`       | `src/pages/security.astro`          | Security disclosure policy               |
| `/roadmap`        | `src/pages/roadmap.md`              | Markdown page via BlogPost layout        |
| `/rss.xml`        | `src/pages/rss.xml.js`              | RSS feed endpoint                        |
| `/api/contact`    | `functions/api/contact.ts`          | POST only — form delivery                |
| `/api/share-event`| `functions/api/share-event.ts`      | POST only — quote telemetry              |

## Content Collection

Defined in `src/content.config.ts`. Collection name: `blog`.
Source: `src/content/blog/**/*.{md,mdx}`.

**Frontmatter schema (Zod):**

```ts
{
  title: string           // required
  description: string     // required
  pubDate: Date           // required, coerced from string
  updatedDate?: Date      // optional
  heroImage?: string      // optional, path to image in public/
}
```

Blog posts are referenced as `post.id` for URL slugs. The index shows 6 most recent; blog listing shows all.

## Components (brief)

Read source for full detail — these are the non-obvious points:

- **`SignalHero.astro` / `BreathingHero.astro`** — homepage hero canvas. `BreathingHero` is current; `SignalHero` is legacy but kept. Respects `prefers-reduced-motion`.
- **`BlogPost.astro`** (layout) — mounts `<PostQuoteShare client:load>` on every post. All quote-share CSS lives here as scoped `:global()` rules.
- **`HomepageLayout.astro`** — sets `data-layout="homepage"` on body; editorial deep-navy palette via `src/styles/homepage.css`.
- **`PostQuoteShare.tsx`** — paragraph-level quote sharing. Imperative DOM; assigns `data-quote-share-id` to `.prose > p`, injects share buttons, telemetries to `/api/share-event` via `sendBeacon`.
- **`ContactForm.tsx`** — honeypot field (`company`), timing check (`startedAt`), submits JSON to `POST /api/contact`.
- **`ThemeToggle.tsx`** — reads/writes `localStorage['theme-preference']` and `document.documentElement.dataset.theme`.
- **`HeroSection.tsx`** — legacy React hero, **not mounted anywhere**. Do not add usages.

## Cloudflare Functions

`contact.ts` — env vars: `CONTACT_EMAIL`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_SUBJECT_PREFIX`, `CONTACT_WEBHOOK_URL`, `CONTACT_WEBHOOK_AUTH_HEADER`. Webhook takes priority over email binding. Validates honeypot, timing (≥1500ms), name (2–80), email, message (20–4000). Escapes all header and HTML values.

`share-event.ts` — env vars: `SHARE_EVENT_RATE_LIMITER`. Rate limit: 20 req/60s per fingerprint. CORS guard on Origin/Referer. Validates `event`, `path`, `quoteId`. Returns 204 on success.

## Authoring Blog Posts

1. Create `src/content/blog/your-slug.md` (or `.mdx`)
2. Required frontmatter: `title`, `description`, `pubDate` (YYYY-MM-DD). Optional: `heroImage`, `updatedDate`.
3. All `<p>` in `.prose` automatically get share buttons via `PostQuoteShare`.
4. Post appears at `/blog/your-slug/` and surfaces on homepage if in top 6.

## Ops Scripts (`scripts/ops/`)

| Script                    | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `update-context-cache.sh` | Snapshots current git state to `docs/operations/memory/context-cache/` |
| `prune-context-cache.sh N`| Keeps N most recent snapshots                                  |
| `session-handoff.sh`      | Updates `ACTIVE_CONTEXT.md` and `SESSION_LOG.md`               |
| `setup-hooks.sh`          | Installs git hooks path + `git ctx` alias (one-time)           |
| `verify-docs-integrity.sh`| Validates doc command refs and deployment terminology           |
| `verify-lockfile.sh`      | Checks `package-lock.json` is in sync                          |

## Key Constraints

- **Static output only** — `astro.config.mjs` sets `output: "static"`. No SSR. All dynamic behaviour goes through Cloudflare Functions.
- **Astro islands discipline** — React is used for `ThemeToggle`, `ContactForm`, `PostQuoteShare` only. Do not add React for non-interactive rendering.
- **No external analytics script** — telemetry is first-party only via `share-event.ts`.
- **No published email address** — contact routes privately through the function.
- **`src/consts.ts` is the single source of truth** for site identity — import from there.
- **`npm run check` is the repo-standard validation** — run before committing any code change.
