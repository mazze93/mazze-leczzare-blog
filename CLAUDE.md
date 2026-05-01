# mazze-leczzare-blog — Claude Context

Personal blog and publishing space for Mazze LeCzzare Frazer — a former neuroscientist turned
storyteller, marketer, and cybersecurity explorer. The site frames itself as a
"static-first working studio" for essays, field notes, and public working documents.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 6 (`output: "static"`, fully SSG) |
| UI islands | React 19 (`@astrojs/react`) — used only where interaction earns its keep |
| Content | Markdown + MDX via Astro Content Collections (loader API) |
| Edge functions | Cloudflare Pages Functions (`functions/`) |
| Styles | CSS custom properties + Tailwind CSS 4 (utility layer; `preflight: false`) |
| Fonts | Atkinson Hyperlegible (self-hosted WOFF, preloaded); Cormorant Garamond, DM Mono, DM Sans, Playfair Display (via `@fontsource`) |
| Sitemap | `@astrojs/sitemap` (auto-generated) |
| RSS | `@astrojs/rss` |
| Email | `mimetext` + Cloudflare Email binding (`cloudflare:email`) |
| Type checking | TypeScript 6 strict mode + `tsc` via `npm run check` |
| Deploy CLI | Wrangler 4 (`wrangler.toml` manages Pages/Functions config) |
| Node | 22.x (`.nvmrc`) |

## Key Commands

```bash
npm run dev        # Astro dev server (localhost:4321)
npm run build      # Static build → dist/
npm run preview    # Preview dist/ locally
npm run check      # astro build && tsc (repo-standard validation)
npm run docs:check # Validate doc command references and deployment terminology
```

**Always run `npm run check` before committing any code change.**

## Site Identity (`src/consts.ts`)

All constants are imported from `src/consts.ts` — never hardcode these inline.

```text
SITE_TITLE           = "Mazze Leczzare"
SITE_DESCRIPTION     = "Essays, experiments, and field notes from a former neuroscientist..."
SITE_URL             = "https://mazzeleczzare.com"
SITE_AUTHOR          = "Mazze Leczzare"
SITE_EMAIL           = "mailto:security@mazzeleczzare.com"
SITE_GITHUB_URL      = "https://github.com/mazze93"
SITE_TWITTER         = "@southerncunning"
SITE_REPO_URL        = "https://github.com/mazze93/mazze-leczzare-blog"
SITE_RSS_URL         = "/rss.xml"
SITE_DEFAULT_OG_IMAGE = "/mazze-leczzare-social-preview.png"
```

## Directory Structure

```text
src/
  assets/images/blog/ # Processed blog images (referenced in MDX with relative paths)
  components/         # Astro + React components (see Components section below)
  content/blog/       # Markdown/MDX blog posts (Content Collection)
  layouts/            # BlogPost.astro, HomepageLayout.astro
  pages/              # File-based routes
  styles/             # global.css, homepage.css, editorial.css
  cloudflare-email.d.ts # Type declarations for Cloudflare email binding
  consts.ts           # Site-wide constants
  content.config.ts   # Content collection schema (Astro loader API)
  env.d.ts            # Astro env type declarations

functions/
  _middleware.ts      # Global Cloudflare middleware — JWT auth + Markdown-for-Agents
  api/
    contact.ts        # Cloudflare Pages Function — contact form delivery
    share-event.ts    # Cloudflare Pages Function — quote share telemetry
    login.ts          # Cloudflare Pages Function — admin login
    logout.ts         # Cloudflare Pages Function — admin logout

public/
  _headers            # Cloudflare security headers + agent discovery Link headers
  _redirects          # Cloudflare redirects (/manifesto/ → /work/)
  .well-known/        # Agent/MCP discovery files (see Agent Discoverability section)
  fonts/              # Self-hosted WOFF files (atkinson-bold, atkinson-regular)
  images/blog/        # Static blog images (served directly, no processing)

scripts/ops/          # Local operational scripts (not part of the site build)
docs/operations/      # Agent operations protocol and memory files
files/                # HTML prototypes and design notes (not deployed)
```

## Routes

| URL               | File                                | Notes                                    |
| ----------------- | ----------------------------------- | ---------------------------------------- |
| `/`               | `src/pages/index.astro`             | BreathingHero + last 6 posts list        |
| `/blog`           | `src/pages/blog/index.astro`        | All posts, sorted newest-first           |
| `/blog/[slug]/`   | `src/pages/blog/[...slug].astro`    | Dynamic blog post route                  |
| `/contact`        | `src/pages/contact.astro`           | ContactForm island                       |
| `/about`          | `src/pages/about.mdx`               | MDX page via BlogPost layout             |
| `/work`           | `src/pages/work.astro`              | Work/portfolio page                      |
| `/security`       | `src/pages/security.astro`          | Security disclosure policy               |
| `/roadmap`        | `src/pages/roadmap.md`              | Markdown page via BlogPost layout        |
| `/login`          | `src/pages/login.astro`             | Admin login page                         |
| `/admin`          | `src/pages/admin/index.astro`       | Admin dashboard (JWT auth-gated)         |
| `/rss.xml`        | `src/pages/rss.xml.js`              | RSS feed endpoint                        |
| `/api/contact`    | `functions/api/contact.ts`          | POST only — form delivery                |
| `/api/share-event`| `functions/api/share-event.ts`      | POST only — quote telemetry              |
| `/api/login`      | `functions/api/login.ts`            | POST only — admin auth                   |
| `/api/logout`     | `functions/api/logout.ts`           | POST only — session clear                |

## Content Collection

Defined in `src/content.config.ts`. Collection name: `blog`.
Source: `src/content/blog/**/*.{md,mdx}`. Uses Astro's loader API (`glob` loader).

**Frontmatter schema (Zod):**

```ts
{
  title: string             // required
  description: string       // required
  pubDate: Date             // required — coerced from YYYY-MM-DD string
  updatedDate?: Date        // optional — coerced from string
  heroImage?: ImageMetadata // optional — relative path from post file to src/assets/images/blog/
  subtitle?: string         // optional — deck shown under title
  category?: string         // optional — primary category (e.g. 'Essay')
  author?: string           // optional — overrides default site author
  tags?: string[]           // optional — topic tags
  readingTime?: string      // optional — manual override (e.g. '~7 min')
  heroImageOG?: string      // optional — Open Graph / social share image path
  heroImageAlt?: string     // optional — alt text for hero image
  featured?: boolean        // optional — pinned/curated flag
  slug?: string             // optional — explicit URL slug override
  draft?: boolean           // optional — true hides post from all listings
}
```

Draft filtering: `getCollection('blog', ({ data }) => !data.draft)` — draft posts are excluded
from all listings. Blog posts are referenced as `post.id` for URL slugs. The index shows 6
most recent; blog listing shows all.

## Components (brief)

Read source for full detail — these are the non-obvious points:

**Layout / page-level:**
- **`BreathingHero.astro`** — homepage hero: three-zone environmental breathing canvas (noise particles, emergence nodes, signal nodes). Respects `prefers-reduced-motion` with static gradient fallback. `SignalHero.astro` is the legacy predecessor — still present but not mounted anywhere.
- **`BlogPost.astro`** (layout) — mounts `<AuthorCoda>` then `<PostQuoteShare client:load>` after `.prose`. All quote-share CSS lives here as scoped `:global()` rules.
- **`HomepageLayout.astro`** — sets `data-layout="homepage"` on body; editorial deep-navy palette via `src/styles/homepage.css`.
- **`AuthorCoda.astro`** — author byline + headshot + condensed bio rendered at the end of every post. Headshot path defaults to `/mazze-headshot.jpg`; hides gracefully if image is missing.

**Interactive islands (React):**
- **`PostQuoteShare.tsx`** — paragraph-level quote sharing. Imperative DOM; assigns `data-quote-share-id` to `.prose > p`, injects share buttons, telemetries to `/api/share-event` via `sendBeacon`.
- **`ContactForm.tsx`** — honeypot field (`company`), timing check (`startedAt`), submits JSON to `POST /api/contact`.
- **`ThemeToggle.tsx`** — reads/writes `localStorage['theme-preference']` and `document.documentElement.dataset.theme`.

**MDX prose components** (`src/components/` top-level — import with relative path in MDX):
- **`Verse.astro`** — styled poetry/verse block.
- **`PullQuote.astro`** — pull-quote callout.
- **`Triptych.astro`** — three-panel image layout.
- **`Colophon.astro`** — end-of-document colophon block.

**MDX prose components** (`src/components/blog/` — blog-specific variants):
- **`blog/PullQuote.astro`** — blog-specific pull-quote variant.
- **`blog/Triptych.astro`** — blog-specific triptych variant.
- **`blog/MentorQuote.astro`** — attributed mentor/interview quote block.
- **`blog/VerseBlock.astro`** — verse block variant used within blog posts.

**Standard structural** (no non-obvious behaviour): `BaseHead.astro`, `Header.astro`, `Footer.astro`, `HeaderLink.astro`, `FormattedDate.astro`.

## Styles

| File | Purpose |
| ---- | ------- |
| `global.css` | CSS custom properties, base resets, shared typography |
| `homepage.css` | Deep-navy editorial palette for the homepage (`data-layout="homepage"`) |
| `editorial.css` | Editorial/article-specific prose styles |

Tailwind CSS 4 is present as a utility layer (`tailwind.config.mjs`). Preflight is disabled —
`global.css` owns the base reset. Tailwind tokens map CSS custom properties to Tailwind
consumers. Four font families are defined: `home-display`, `home-sans`, `blog-serif`,
`blog-mono`. Do not add Tailwind's own opinionated resets or base styles.

## Cloudflare Functions

### `functions/_middleware.ts` — Global middleware

Runs on every request before any function. Two responsibilities:

**1. Admin auth (JWT guard)**
- Protects all `/admin/*` routes.
- Reads `__Host-auth_token` cookie, verifies HMAC-SHA256 JWT against `JWT_SECRET`.
- Optionally checks `JWT_REVOCATION_LIST` KV for revoked JTI values.
- Fails closed — misconfigured or short `JWT_SECRET` (< 32 chars) redirects to `/login`.

**2. Markdown for Agents**
- When a request includes `Accept: text/markdown`, converts HTML responses to Markdown.
- Uses `HTMLRewriter` to strip `nav`, `header`, `footer`, `script`, `style`, etc.
- Returns `Content-Type: text/markdown` with `Vary: Accept` and `x-markdown-tokens` header.

### `functions/api/contact.ts`

Env vars: `CONTACT_EMAIL`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `CONTACT_SUBJECT_PREFIX`,
`CONTACT_WEBHOOK_URL`, `CONTACT_WEBHOOK_AUTH_HEADER`. Webhook takes priority over email
binding. Validates honeypot, timing (≥1500ms), name (2–80), email, message (20–4000).
Escapes all header and HTML values.

### `functions/api/share-event.ts`

Env vars: `SHARE_EVENT_RATE_LIMITER`. Rate limit: 20 req/60s per fingerprint. CORS guard
on Origin/Referer. Validates `event`, `path`, `quoteId`. Returns 204 on success.

### `functions/api/login.ts`

Env vars: `ADMIN_PASSWORD`, `JWT_SECRET`, `LOGIN_RATE_LIMITER`. Signs a 24h HS256 JWT
with a random `jti` and sets it as `__Host-auth_token` (HttpOnly, Secure, SameSite=Strict).
Uses constant-time comparison for password check. Rate limit: 5 req/60s.

### `functions/api/logout.ts`

Clears the `__Host-auth_token` cookie (Max-Age=0).

## Environment Variables and Secrets

Copy `.dev.vars.example` to `.dev.vars` for local development.

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `ADMIN_PASSWORD` | Yes | Plain-text password for `/api/login` |
| `JWT_SECRET` | Yes | HMAC signing key — minimum 32 random chars |
| `CONTACT_TO_EMAIL` | Yes (email path) | Recipient for contact form |
| `CONTACT_FROM_EMAIL` | No (wrangler.toml default) | Sender address |
| `CONTACT_SUBJECT_PREFIX` | No (wrangler.toml default) | Email subject prefix |
| `CONTACT_WEBHOOK_URL` | No | POST contact payloads here instead of email |
| `CONTACT_WEBHOOK_AUTH_HEADER` | No | Authorization header for the webhook |

Cloudflare bindings (configure in `wrangler.toml` + dashboard):

| Binding | Type | Purpose |
| ------- | ---- | ------- |
| `JWT_REVOCATION_LIST` | KV Namespace | Stores revoked JWT JTI values |
| `SHARE_ANALYTICS` | KV Namespace | Share event storage |
| `LOGIN_RATE_LIMITER` | Rate Limit | 5 req/60s on `/api/login` |
| `SHARE_EVENT_RATE_LIMITER` | Rate Limit | 20 req/60s on `/api/share-event` |

## Agent Discoverability

The site exposes machine-readable agent discovery files under `public/.well-known/`:

| File | Purpose |
| ---- | ------- |
| `mcp/server-card.json` | MCP server card — lists `contact` and `share-event` tools + RSS resource |
| `agent-skills/index.json` | Agent skills index (agentskills.io schema) |
| `agent-skills/contact/SKILL.md` | Contact skill instructions for agents |
| `agent-skills/share-event/SKILL.md` | Share-event skill instructions for agents |
| `api-catalog` | RFC 9727 linkset API catalog |
| `oauth-authorization-server` | OAuth AS metadata |
| `oauth-protected-resource` | OAuth protected resource metadata |
| `security.txt` | Security contact information |

Homepage (`/`) sends Link headers for all discovery endpoints via `public/_headers`.
Middleware serves `text/markdown` content-negotiation for any AI agent that requests it.

## Authoring Blog Posts

1. Create `src/content/blog/your-slug.md` (or `.mdx`)
2. Required frontmatter: `title`, `description`, `pubDate` (YYYY-MM-DD format).
3. Optional frontmatter: `subtitle`, `heroImage`, `heroImageAlt`, `heroImageOG`, `updatedDate`, `author`, `tags`, `category`, `readingTime`, `featured`, `slug`. Set `draft: true` to hide from all listings.
4. MDX posts can import components with relative paths: `import Verse from '../../components/Verse.astro'`
5. Blog images: place hero images in `src/assets/images/blog/` and reference them in frontmatter as a relative path from the post file (e.g. `heroImage: ../../assets/images/blog/hero.jpg`). Astro processes these through the image pipeline. OG override images (`heroImageOG`) remain URL strings pointing to `public/`.
6. All `<p>` in `.prose` automatically get share buttons via `PostQuoteShare`.
7. All posts automatically get the `AuthorCoda` author block at the end.
8. Post appears at `/blog/your-slug/` and surfaces on homepage if in top 6 by date.

## Ops Scripts (`scripts/ops/`)

| Script                    | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `update-context-cache.sh` | Snapshots current git state to `docs/operations/memory/context-cache/` |
| `prune-context-cache.sh N`| Keeps N most recent snapshots                                  |
| `session-handoff.sh`      | Updates `ACTIVE_CONTEXT.md` and `SESSION_LOG.md`               |
| `setup-hooks.sh`          | Installs git hooks path + `git ctx` alias (one-time)           |
| `verify-docs-integrity.sh`| Validates doc command refs and deployment terminology           |
| `verify-lockfile.sh`      | Checks `package-lock.json` is in sync                          |
| `check-docs-drift.sh`     | Compares CLAUDE.md documentation against actual filesystem state |

`scripts/bootstrap-dev-toolbelt.sh` — one-time developer environment bootstrap (separate from ops).

## CI / GitHub Workflows

| Workflow | Trigger | What it does |
| -------- | ------- | ------------ |
| `ci.yml` | push / PR | `npm run check` + `npm audit --audit-level=high` |
| `codeql.yml` | push / PR / schedule | CodeQL static analysis |
| `dependency-review.yml` | PR | Flags new vulnerable dependencies |
| `docs-integrity.yml` | push / PR | Runs `npm run docs:check` |
| `lighthouse.yml` | push / PR | Lighthouse CI performance/accessibility audit |

## Key Constraints

- **Static output only** — `astro.config.mjs` sets `output: "static"`. No SSR. All dynamic behaviour goes through Cloudflare Functions.
- **Astro islands discipline** — React is used for `ThemeToggle`, `ContactForm`, `PostQuoteShare` only. Do not add React for non-interactive rendering.
- **Tailwind utility layer only** — Tailwind maps CSS vars to utility classes. `preflight: false`. Do not let Tailwind own base styles or reset behaviour; `global.css` owns that.
- **No external analytics script** — telemetry is first-party only via `share-event.ts`.
- **No published email address** — contact routes privately through the function.
- **`src/consts.ts` is the single source of truth** for site identity — import from there.
- **`npm run check` is the repo-standard validation** — run before committing any code change.
- **Draft posts** — use `draft: true` in frontmatter, never delete in-progress posts.
- **Deployment platform is Cloudflare Pages** — not Workers, not Vercel. Do not use Workers adapter terminology. Local preview uses `npm run preview`, not `wrangler dev`.
- **JWT_SECRET must be ≥ 32 chars** — middleware and login fail closed if this is not met.
