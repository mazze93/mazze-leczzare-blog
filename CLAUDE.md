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

```text
SITE_TITLE         = "Mazze Leczzare"
SITE_DESCRIPTION   = "Essays, experiments, and field notes from a former neuroscientist..."
SITE_URL           = "https://mazzeleczzare.com"
SITE_AUTHOR        = "Mazze Leczzare"
SITE_EMAIL         = "mailto:security@mazzeleczzare.com"
SITE_GITHUB_URL    = "https://github.com/mazze93"
SITE_REPO_URL      = "https://github.com/mazze93/mazze-leczzare-blog"
SITE_RSS_URL       = "/rss.xml"
SITE_DEFAULT_OG_IMAGE = "/blog-placeholder-about.jpg"
```

All constants are imported from `src/consts.ts` — never hardcode these inline.

## Directory Structure

```text
src/
  components/       # Astro + React components (see below)
  content/blog/     # Markdown/MDX blog posts (Content Collection)
  layouts/          # BlogPost.astro, HomepageLayout.astro
  pages/            # File-based routes
  styles/           # global.css + homepage.css
  consts.ts         # Site-wide constants
  content.config.ts # Content collection schema
  env.d.ts          # Astro env types
  cloudflare-email.d.ts  # Type declaration for cloudflare:email binding

functions/
  api/
    contact.ts      # Cloudflare Pages Function — contact form delivery
    share-event.ts  # Cloudflare Pages Function — quote share telemetry

scripts/ops/        # Local operational scripts (not part of the site build)
docs/operations/    # Agent operations protocol and memory files
docs/              # Component-level documentation (e.g. hero-section.md)
public/             # Static assets (fonts, images, favicon, hero SVG)
```

## Routes

| URL               | File                                | Notes                                    |
| ----------------- | ----------------------------------- | ---------------------------------------- |
| `/`               | `src/pages/index.astro`             | SignalHero + last 6 posts list           |
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
  updatedDate?: Date      // optional, coerced from string
  heroImage?: string      // optional, path to image in public/
}
```

Blog posts are referenced as `post.id` (the file path without extension) for URL slugs.
The index page shows the 6 most recent; the blog listing shows all.

## Components

### Layouts

#### `BlogPost.astro` (layout)

Wraps all blog posts and markdown pages.

- Accepts `Props` that unifies blog collection entries *and* raw markdown frontmatter
  (both paths resolve via `resolved = { ...frontmatter, ...props }` spread)
- Injects Article JSON-LD with `headline`, `datePublished`, `dateModified`, `author`, `publisher`
- All quote-share CSS lives here as scoped `:global()` rules targeting `.prose > p`
- Mounts `<PostQuoteShare client:load title={title} path={Astro.url.pathname} />` on every post
- Responsive: at ≤720px the share button moves below the paragraph (static, always visible)

#### `HomepageLayout.astro` (layout)

Homepage-specific layout with the editorial deep-navy palette.

- Imports `src/styles/homepage.css` (Playfair Display + DM Sans) alongside global tokens
- Sets `data-layout="homepage"` on `<body>` so shared CSS vars remap to the editorial palette
- Header and Footer auto-adapt to the homepage theme with no component changes

### Astro (server-only, zero JS by default)

#### `SignalHero.astro`

Homepage hero: "From Erasure → Signal".

- Full-viewport section with a `<canvas>` particle network animation
- Visually progresses from noise (left/magenta–amber) to signal (right/teal)
- Runs at ~30fps with `requestAnimationFrame`; pauses on `visibilitychange`
- Respects `prefers-reduced-motion` — draws one static frame instead of animating
- Falls back gracefully if JS fails (text renders over the dark CSS gradient)
- Two CTAs: "Read the writing" → `/blog/` and "Explore the work" → `/work/`
- Tuning constants and tagline options documented in `docs/hero-section.md`

#### `BaseHead.astro`

Injected into every page `<head>`.

- Imports `global.css`
- Full Open Graph + Twitter card meta tags
- Canonical URL
- Preloads Atkinson fonts (regular + bold WOFF)
- Inline `<script is:inline>` that reads `localStorage['theme-preference']` and sets
  `document.documentElement.dataset.theme` before paint (prevents flash)
- Two JSON-LD structured data blocks: `WebSite` schema + `Person` schema on every page

#### `Header.astro`

Sticky, `backdrop-filter: blur(8px)` frosted glass.

- Nav links: Writing (`/blog/`), About (`/about/`), Work (`/work/`)
- Utility links: GitHub (external), RSS
- `ThemeToggle` React island (`client:load`)

#### `Footer.astro`

3-column grid (brand tagline / nav links / social), collapses to 1-column on mobile.

#### `FormattedDate.astro`

Renders a `<time>` element from a `Date` prop.

#### `HeaderLink.astro`

Nav link that adds `.active` class when href matches current path.

### React Islands (`client:load`)

#### `HeroSection.tsx`

Legacy hero component — exists in `src/components/` but is **not currently mounted** on any
page. The homepage uses `SignalHero.astro` instead. Do not add new usages; consider removal.

#### `ThemeToggle.tsx`

Light/dark toggle.

- Reads from `localStorage['theme-preference']`, falls back to `prefers-color-scheme`
- Writes to `document.documentElement.dataset.theme` and updates `meta[name="theme-color"]`
- Dark = `#0f172a`, light = `#f7f4ed`

#### `ContactForm.tsx`

Controlled form with 3 visible fields + 1 honeypot.

- State machine: `SubmitState = 'idle' | 'submitting' | 'success' | 'error'`
- `startedAt` captured via `useMemo(() => Date.now(), [])` at mount time, sent as hidden field
- Submits JSON to `POST /api/contact`
- Response typed as `ContactApiResponse { ok?, error?, message? }`
- `aria-live="polite"` status region for screen reader feedback
- Honeypot: `company` field in a wrapper `div` with `aria-hidden="true"`; input has `tabIndex={-1}` and `autoComplete="off"`

#### `PostQuoteShare.tsx`

Paragraph-level quote sharing — the signature feature.

Props: `{ title: string; path: string }` — post title and pathname (e.g. `/blog/slug/`).

- Mounts via `useEffect` into `.prose` DOM; purely imperative DOM manipulation, renders `null`
- Assigns `data-quote-share-id="quote-N"` to each non-empty direct `<p>` child of `.prose`;
  also sets `id="quote-N"` only if the paragraph has no existing `id` (preserves authored anchors)
- Injects a "Share" `<button>` into every paragraph
- On click: tries `navigator.share()` first (native share sheet), falls back to
  `navigator.clipboard.writeText()`, falls back to legacy `document.execCommand('copy')`
- Share URL format: `https://mazzeleczzare.com/blog/slug/?quote=quote-N&via=quote-share`
- Quote text truncated to 220 chars for the share sheet
- On landing from a share URL: scrolls to `?quote=` paragraph, applies `.quote-share-highlight`
  (accent background + box-shadow) for 4s, fires `quote_share_visited` event once per session
  (guarded by `sessionStorage` key to prevent duplicate counting)
- Telemetry: `navigator.sendBeacon` → `POST /api/share-event`; falls back to `fetch` with
  `keepalive: true` if beacon returns false — fire-and-forget, must never block reading
- Full cleanup on unmount: removes buttons, event listeners, class names, clears timeouts

## Cloudflare Functions

Both use the Cloudflare Pages Functions convention: `export async function onRequestPost(context)`.

### `functions/api/contact.ts`

Delivers contact form submissions via **either** Cloudflare Email binding **or** webhook.

**Environment bindings:**

```text
CONTACT_EMAIL               # Cloudflare Email binding (send method)
CONTACT_TO_EMAIL            # Recipient address (required for email path)
CONTACT_FROM_EMAIL          # Sender address (default: contact@mazzeleczzare.com)
CONTACT_SUBJECT_PREFIX      # Email subject prefix (default: "Mazze Contact")
CONTACT_WEBHOOK_URL         # Alternate delivery — POST to this URL
CONTACT_WEBHOOK_AUTH_HEADER # Optional Bearer token for webhook
```

**Delivery logic:** Webhook takes priority over email binding when both are set.
Returns 500 if neither is configured.

**Validation pipeline (in order):**

1. Parse body: JSON (`Content-Type: application/json`) or `FormData` (form POST fallback)
2. Honeypot: if `company` is non-empty → silent 200 OK (bot trap)
3. Timing: `startedAt` must be a finite positive number; `Date.now() - startedAt >= 1500ms`
4. Name: 2–80 chars
5. Email: matches `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, max 120 chars, lowercased
6. Message: 20–4000 chars

**Security:** All values passed to email headers go through `escapeHeader()` (strips `\r\n`).
All values in HTML body go through `escapeHtml()` (full entity escaping).

**Response shape:** `{ ok: boolean, error?: string, message?: string }` + `Cache-Control: no-store`.

### `functions/api/share-event.ts`

Records paragraph quote share events for analytics.

**Environment bindings:**

```text
SHARE_EVENT_RATE_LIMITER # Cloudflare Rate Limiting binding
```

**Rate limit:** 20 requests / 60 seconds per fingerprint (IP + User-Agent SHA-256, 32 hex chars).
Returns 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Window` headers.

**CORS guard:** `Origin` or `Referer` header must match the request's own origin.
Rejects cross-origin POSTs with 403.

**Event validation:**

- `event`: must be `quote_share_clicked` or `quote_share_visited`
- `path`: matches `/^\/[A-Za-z0-9/_-]*$/`, no `//` or `..`, max 180 chars
- `quoteId`: matches `/^quote-\d{1,4}$/`, max 64 chars

**Success response:** `204 No Content`. Events are logged via `console.log(JSON.stringify({...}))` —
structured for Cloudflare log drains.

## Theme System

Toggled by `document.documentElement.dataset.theme = 'dark' | 'light'`.
CSS custom properties in `global.css` switch on `[data-theme="dark"]`.
Flash prevention: inline script in `BaseHead.astro` reads `localStorage` before first paint.

## SEO & Structured Data

Every page gets two JSON-LD blocks (WebSite + Person) from `BaseHead.astro`.
Blog posts additionally get an Article JSON-LD block from `BlogPost.astro`.
All pages have canonical URLs, OG tags, and Twitter card meta.
`pubDate`/`updatedDate` map to `article:published_time` / `article:modified_time`.

## Authoring Blog Posts

1. Create `src/content/blog/your-slug.md` (or `.mdx`)

2. Required frontmatter:

   ```yaml
   ---
   title: "Post Title"
   description: "One-sentence description for meta and listings."
   pubDate: 2026-03-21
   heroImage: "/your-image.jpg"   # optional, goes in public/
   updatedDate: 2026-04-01        # optional
   ---
   ```

3. Write body content — all `<p>` elements in `.prose` automatically get paragraph-level
   share buttons via `PostQuoteShare`

4. Post appears at `/blog/your-slug/` and surfaces on the homepage (if in top 6)

## Ops Scripts (`scripts/ops/`)

| Script                    | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `update-context-cache.sh` | Snapshots current git state to `docs/operations/memory/context-cache/`       |
| `prune-context-cache.sh N`| Keeps N most recent snapshots, deletes older ones                            |
| `session-handoff.sh`      | Updates `ACTIVE_CONTEXT.md` and `SESSION_LOG.md` with structured metadata    |
| `setup-hooks.sh`          | Installs git hooks path + `git ctx` alias (one-time setup per clone)         |
| `verify-docs-integrity.sh`| Validates doc command refs and deployment terminology (`npm run docs:check`) |
| `verify-lockfile.sh`      | Checks `package-lock.json` is in sync with `package.json`                    |

Git hook (`post-commit`): advisory only — prints reminder to run `git ctx` manually.
Context cache files (`latest.md` and timestamped snapshots) are **not tracked** — excluded
by `docs/operations/memory/context-cache/.gitignore`.

## Key Constraints

- **Static output only** — `astro.config.mjs` sets `output: "static"`. No SSR,
  no server endpoints in Astro itself. All dynamic behaviour goes through Cloudflare Functions.
- **Astro islands discipline** — React is used for `ThemeToggle`, `ContactForm`, and
  `PostQuoteShare` only. All three have clear interactive reasons. `HeroSection.tsx` exists
  but is unmounted; the homepage hero is `SignalHero.astro` (pure Astro).
  Do not add React for non-interactive rendering.
- **No external analytics script** — telemetry is first-party only via `share-event.ts`.
- **No published email address** — contact routes privately through the function;
  the footer note says "Mailbox addresses are not published here."
- **`src/consts.ts` is the single source of truth** for site identity — import from there.
