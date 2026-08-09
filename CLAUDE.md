# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Local: `~/Projects/blog/mazze-leczzare-blog` (alias `~/Code/blog/…`) · Repo: `mazze93/mazze-leczzare-blog` · Domain: `mazzeleczzare.com`

Security engineering, technical writing, and essays at the intersection of infrastructure and story. The site is a "static-first working studio" for public-facing work, field notes, and the Cipher Gothic design system.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 7 (`output: "static"`, fully SSG, `trailingSlash: "always"`) |
| UI islands | React 19 (`@astrojs/react`) — used only where interaction earns its keep |
| Content | Markdown + MDX via Astro Content Collections (loader API) |
| Edge functions | Cloudflare Pages Functions (`functions/`) |
| Styles | Hand-authored CSS custom properties only — see Styles section. No Tailwind (retired 2026-08-03) |
| Fonts | Mostly `@fontsource` `@import`s in `global.css`/`homepage.css`: Cormorant Garamond, Cormorant SC, DM Mono, DM Sans, Playfair Display; Space Grotesk Variable + Crimson Pro on `/cipher-gothic/` only. Inter is the exception — declared with explicit `@font-face` rules pointing at the already-deployed `/fonts/inter-*.woff2` (see Fonts note below). `BaseHead.astro` preloads exactly one file — Cormorant Garamond latin-400 — imported through Vite with `?url`, never a hardcoded path. |
| RSS | `@astrojs/rss` — feed at `/rss.xml`, auto-generated from blog content collection |
| Sitemap | `@astrojs/sitemap` (auto-generated) |
| Email | `mimetext` + Cloudflare Email binding (`cloudflare:email`) |
| Type checking | TypeScript 7 strict mode + `tsc` via `npm run check` |
| Deploy CLI | Wrangler 4 (`wrangler.toml` manages Pages/Functions config) |
| Node | 22.x (`.nvmrc`) |

## Key Commands

```bash
npm run dev        # Astro dev server (localhost:4321)
npm run build      # Static build → dist/
npm run preview    # Preview dist/ locally
npm run check      # astro build && tsc (repo-standard validation)
npm run test       # vitest run — unit tests for src/**/*.test.ts
npm run test:watch # vitest watch mode
npm run docs:check # Validate doc command references and deployment terminology
```

Run a single test file or case with vitest directly, e.g.
`npx vitest run src/utils/decay.test.ts` or `npx vitest run -t "some test name"`.

**Always run `npm run check` before committing any code change.** Tests cover
`src/utils/` pure logic (decay, layout, node aggregation) and the admin
dashboard's post-filtering/sorting — run `npm run test` when touching those.

A `pre-push` git hook (installed via the `prepare` script into
`.git/hooks/pre-push`) blocks pushes if `public/` has untracked files that
would silently be missing from the deploy.

## Site Identity (`src/consts.ts`)

All constants are imported from `src/consts.ts` — never hardcode these inline.

```text
SITE_TITLE           = "Mazze LeCzzare"
SITE_DESCRIPTION     = "Security engineer, content strategist, and founder of Secure Pride. Essays and infrastructure for systems with real human stakes."
SITE_URL             = "https://mazzeleczzare.com"
SITE_AUTHOR          = "Mazze LeCzzare"
SITE_EMAIL           = "mailto:security@mazzeleczzare.com"
SITE_GITHUB_URL      = "https://github.com/mazze93"
SITE_TWITTER         = "@southerncunning"
SITE_REPO_URL        = "https://github.com/mazze93/mazze-leczzare-blog"
SITE_DEFAULT_OG_IMAGE = "/mazze-leczzare-social-preview.png"
COMPASS_LABEL        = "Mazze LeCzzare — home"
```

## Directory Structure

```text
src/
  assets/images/blog/ # Processed blog images (referenced in MDX with relative paths)
  components/         # Astro + React components (see Components section below)
  content/blog/       # Markdown/MDX blog posts (Content Collection)
  content/signal/     # Signal transmissions (Content Collection)
  content/tesserae/   # Tesserae — mosaic-tile fragments (Content Collection)
  utils/              # Constellation logic, split pure-vs-Astro for testability (see Constellation System below):
    decay.ts          #   pure — age/committed/resolved → Zone ("undefined"|"experiment"|"signal"|"resolved")
    layout.ts         #   pure — deterministic (seeded) node position/style from a Zone
    nodes.ts          #   pure — aggregates raw collection entries into project nodes
    collectNodes.ts   #   astro:content wrapper — calls getCollection + nodes.ts.aggregateNodes
  layouts/            # BlogPost.astro, HomepageLayout.astro
  pages/              # File-based routes
  styles/             # global.css, homepage.css, compass.css, constellation-pages.css,
                      #   haven-ink.tokens.css
  cloudflare-email.d.ts # Type declarations for Cloudflare email binding
  consts.ts           # Site-wide constants
  content.config.ts   # Content collection schema (Astro loader API)
  env.d.ts            # Astro env type declarations

functions/
  _middleware.ts      # Global Cloudflare middleware — JWT auth + Markdown-for-Agents + security headers
  api/
    contact.ts        # Cloudflare Pages Function — contact form delivery
    share-event.ts    # Cloudflare Pages Function — quote share telemetry
    login.ts          # Cloudflare Pages Function — admin login
    logout.ts         # Cloudflare Pages Function — admin logout

public/
  _headers            # Cloudflare security headers + agent discovery Link headers
  _redirects          # Cloudflare redirects (/manifesto/ → /work/)
  .well-known/        # Agent/MCP discovery files (see Agent Discoverability section)
  fonts/              # Shared self-hosted woff2, served at /fonts/* to the standalone
                      #   HTML pages under public/ (NOT to the Astro site, which gets
                      #   its fonts from @fontsource via global.css — the one exception
                      #   is the Inter @font-face block, which reuses these files).
                      #   Every file here resolves — the two legacy atkinson-*.woff
                      #   orphans were retired 2026-08-03.
  images/blog/        # Static blog images (served directly, no processing)

scripts/ops/          # Local operational scripts (not part of the site build)
docs/operations/      # Agent operations protocol and memory files
docs/journal/         # Live session journal (PLAN/DECISIONS/CHECKPOINT); archive/ holds closed ones
docs/archive/         # Files pulled out of a build path but kept in git — see its README
files/                # HTML prototypes and design notes (not deployed; gitignored)
```

## Routes

| URL               | File                                | Notes                                    |
| ----------------- | ----------------------------------- | ---------------------------------------- |
| `/`               | `src/pages/index.astro`             | BreathingHero + last 6 posts list        |
| `/blog`           | `src/pages/blog/index.astro`        | All posts, sorted newest-first           |
| `/blog/[slug]/`   | `src/pages/blog/[...slug].astro`    | Dynamic blog post route                  |
| `/blog/field-notes` | `src/pages/blog/field-notes.astro`| Blog filtered to `contentType: 'field-note'` (essays) |
| `/blog/dispatches` | `src/pages/blog/dispatches.astro`  | Blog filtered to `contentType: 'dispatch'` (position pieces/critiques) |
| `/blog/artifacts` | `src/pages/blog/artifacts.astro`    | Blog filtered to `contentType: 'artifact'` (posts shipping repos/transcripts/skills) |
| `/contact`        | `src/pages/contact.astro`           | ContactForm island                       |
| `/about`          | `src/pages/about.astro`             | Full custom page — hero, work cards, engagement grid, contact |
| `/cipher-gothic`  | `src/pages/cipher-gothic.astro`     | Design system documentation page        |
| `/work`           | `src/pages/work.astro`              | Work/portfolio page                      |
| `/security`       | `src/pages/security.astro`          | Security disclosure policy               |
| `/roadmap`        | `src/pages/roadmap.md`              | Markdown page via BlogPost layout        |
| `/login`          | `src/pages/login.astro`             | Admin login page                         |
| `/admin`          | `src/pages/admin/index.astro`       | Admin dashboard (JWT auth-gated)         |
| `/rss.xml`        | `src/pages/rss.xml.js`              | RSS feed endpoint                        |
| `/signal`, `/signal/[slug]/` | `src/pages/signal/`      | Transmissions (signal collection)        |
| `/tesserae`, `/tesserae/[slug]/` | `src/pages/tesserae/`| Mosaic tiles (tesserae collection)       |
| `/writing`        | `src/pages/writing/index.astro`     | The catalogue — all published work by form |
| `/studio`         | `src/pages/studio.astro`            | The bench — projects by activity + decay proximity |
| `/constellation`  | `src/pages/constellation.astro`     | Full-bleed sky view — same node geometry as the homepage hero, plus a flattened shadow index; static, no hydration |
| `/project/[slug]/`| `src/pages/project/[slug].astro`    | Pieces belonging to one project node     |
| `/support`        | `src/pages/support.astro`           | Support page                             |
| `/nodes-manifest.json` | `src/pages/nodes-manifest.json.ts` | Constellation node manifest (build-time JSON) |
| `/artifacts/*`    | `public/artifacts/*.html`           | Self-contained HTML artifacts (tessera-claude-anchor, tree-of-knowledge, publication-surface) — static files, no build step. **Only path granted `ARTIFACT_CSP`** — the one place CDN fonts are permitted |
| `/essays/the-breakthrough-artifact.html` | `public/essays/…`  | Standalone artifact, linked from `/writing/`. Fonts self-hosted from `/fonts/*` |
| `/intentional-fragility/` | `public/intentional-fragility/index.html` | Standalone page; ships its own `fonts/` subdirectory (relative `./fonts/` URLs) |
| `/writing/what-i-can-stand-by/` | `public/writing/what-i-can-stand-by/index.html` | Standalone page; ships its own `fonts/` subdirectory |
| `/api/contact`    | `functions/api/contact.ts`          | POST only — form delivery                |
| `/api/ingest`     | `functions/api/ingest.ts`           | POST only — authenticated content ingest |
| `/api/share-event`| `functions/api/share-event.ts`      | POST only — quote telemetry              |
| `/api/login`      | `functions/api/login.ts`            | POST only — admin auth                   |
| `/api/logout`     | `functions/api/logout.ts`           | POST only — session clear                |

## Content Collections

Defined in `src/content.config.ts`. **Three collections** (all glob-loader,
`src/content/<name>/**/*.{md,mdx}`):

| Collection | What it holds | Extra schema fields beyond the blog set |
| ---------- | ------------- | --------------------------------------- |
| `blog` | Essays — the primary long-form surface | (full schema below) |
| `signal` | Transmissions from the field ledger — verse, fragments, dispatches | `transmissionId`, `cycle`, `classification`, `status`, `origin` (all optional strings; map to TransmissionFeed props) |
| `tesserae` | Mosaic tiles — smallest modular fragments, neither essay nor transmission | blog-common fields only. **Currently empty** (`.gitkeep` only), so every build prints `The collection "tesserae" does not exist or is empty` — expected, not a regression; it clears when the first tile lands |

**Constellation fields** (`project?: string`, `committed?: boolean`,
`resolved?: boolean`) exist on **all three** collections (`blog`, `signal`,
`tesserae`): they attach a piece to a project node. `committed` seals a node
into permanent signal (never decays); `resolved` is a terminal archive seal —
a deliberate editorial act, never set via `/api/ingest`.

The `blog` collection additionally carries a content-type taxonomy:
`contentType: 'artifact' | 'dispatch' | 'field-note'` (default `'field-note'`)
plus `repoUrl?`, `artifactNote?`, `sessionTranscript?` — these back the
`/blog/artifacts`, `/blog/dispatches`, `/blog/field-notes` sub-listings.

### Constellation system

A project node aggregates every published piece (across `blog`/`signal`/
`tesserae`) that shares a `project` slug, then places it on an erasure→signal
axis by recency and seal state. The logic is deliberately split across
`src/utils/` so the math is unit-testable without `astro:content`:

- **`decay.ts`** (pure) — `computeZone()`: age + `committed`/`resolved` →
  `Zone` (`"undefined" | "experiment" | "signal" | "resolved"`). Precedence is
  `resolved` > `committed` > age; drift starts at 30 days, full erasure at 180.
- **`layout.ts`** (pure) — `seededUnit()`/`nodePosition()`/`nodeStyle()`: a
  slug hashes (FNV-1a) to a stable 0–1 position so the same node renders in
  the same place across the homepage hero and `/constellation` without a
  layout database.
- **`nodes.ts`** (pure) — `aggregateNodes()`: groups raw collection entries
  into `NodeRecord`s (one per project).
- **`collectNodes.ts`** (Astro-only) — the only file that calls
  `getCollection`; wraps the three collections and hands them to `nodes.ts`.

Consumers: the homepage hero (`BreathingHero.astro` → `ConstellationNodes.tsx`,
hydrated), `/studio`, `/project/[slug]`, `/constellation` (static, no
hydration), and `/nodes-manifest.json` (machine-readable dump of the same
node set). `Header.astro` and `TransmissionFeed.astro` read `computeZone`
too, for zone-aware styling outside the hero itself.

### blog collection schema

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
  contentType?: 'artifact' | 'dispatch' | 'field-note' // optional — default 'field-note'; drives /blog/{artifacts,dispatches,field-notes}
  repoUrl?: string          // optional — linked repo, for contentType: 'artifact'
  artifactNote?: string     // optional — annotation for contentType: 'artifact'
  sessionTranscript?: string // optional — linked transcript, for contentType: 'artifact'
  project?: string          // optional — constellation node slug (see Constellation System)
  committed?: boolean       // optional — seals node into permanent signal
  resolved?: boolean        // optional — terminal archive seal
}
```

Draft filtering: `getCollection('blog', ({ data }) => !data.draft)` — draft posts are excluded
from all listings. Blog posts are referenced as `post.id` for URL slugs. The index shows 6
most recent; blog listing shows all.

## Components (brief)

Read source for full detail — these are the non-obvious points:

**Layout / page-level:**
- **`BreathingHero.astro`** — homepage hero. Leads with the two shipped products, Stratum and Stele, as side-by-side cards (distinct hand-drawn glyphs — append-only bands vs. an inscribed slab — a role line, a description, a stack line, and an outbound link each), under a "Shipped & running" eyebrow. This replaced a display headline that read as a thesis rather than an answer; the products had previously been the least visible things on the site. Behind the content sits the three-zone environmental breathing canvas (noise particles, emergence nodes, signal nodes) and `ConstellationNodes`. Respects `prefers-reduced-motion` with static gradient fallback. Its legacy predecessor `SignalHero.astro` was retired 2026-08-03 to `docs/archive/retired-2026-08-03/`.
- **`BlogPost.astro`** (layout) — mounts `<AuthorCoda>` then `<PostQuoteShare client:load>` after `.prose`. All quote-share CSS lives here as scoped `:global()` rules.
- **`HomepageLayout.astro`** — sets `data-layout="homepage"` on body; editorial deep-navy palette via `src/styles/homepage.css`.
- **`AuthorCoda.astro`** — author byline + headshot + condensed bio rendered at the end of every post. Headshot path defaults to `/mazze-headshot.jpg`; hides gracefully if image is missing.
- **`constellation/AirlockStrip.astro`** — plain-language orientation strip shown before the `/constellation` sky view (for visitors arriving from a CV/talk/LinkedIn link). Zero hydration.

**Interactive islands (React):**
- **`PostQuoteShare.tsx`** — paragraph-level quote sharing. Imperative DOM; assigns `data-quote-share-id` to `.prose > p`, injects share buttons, telemetries to `/api/share-event` via `sendBeacon`.
- **`ContactForm.tsx`** — honeypot field (`company`), timing check (`startedAt`), submits JSON to `POST /api/contact`.
- **`ThemeToggle.tsx`** — reads/writes `localStorage['theme-preference']` and `document.documentElement.dataset.theme`.
- **`constellation/ConstellationNodes.tsx`** — mounted `client:load` inside `BreathingHero.astro` (the homepage hero). Renders live project nodes using `decay.ts`/`layout.ts` math; the one React island that isn't a form/toggle — see Key Constraints.

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

**Brand mark:**
- **`Compass.astro`** — hand-coded SVG brand mark. Pure presentational; 5 `state` values (`idle`/`hover`/`focus`/`engaged`/`complete`) × 5 size buckets.
- **`CompassLink.astro`** — `Compass` wrapped in an anchor. Pure CSS state machine (`:hover`/`:focus-visible` cascading through custom properties) — no JS, no client directive. Use this, not `Compass`, whenever the mark is interactive.

**Also MDX-mountable:** `SectionBreak.astro` (decorative in-prose divider, `aria-hidden`), `blog/ArtifactEmbed.astro` (iframes a `public/artifacts/*.html` file with caption + fullscreen link).

**Navigation:**
- **`Header.astro`** — masthead. `minimal` prop drops the nav links entirely (used by the homepage, where `AirlockStrip` is the door). The full nav is `Work · Writing · About · Studio ▾ · │ · Stratum● · Stele●`, where the teal dot marks running software rather than another essay. **Studio is a disclosure parent, not a peer link:** it opens a menu holding The bench (`/studio/`), Signal, and Tesserae. Those two are thin fragment surfaces, and giving each a top-level slot spent nav width out of proportion to their content — Tesserae had no link at all and was an unreachable route. Implemented as a `<button aria-expanded>` + `hidden` `<ul>`, not a CSS hover menu (hover menus are unreachable by keyboard and unusable on touch); Escape returns focus to the trigger, `focusin`/click outside closes, ArrowDown opens onto the first item. The toggle is vanilla JS in the component's existing `<script>` block — deliberately not a React island, per Key Constraints. That script also listens for `compass:state` to refract the brand compass.
- **`Footer.astro`** — carries a flatter list than the header, including `/studio/`, `/signal/`, and `/tesserae/` as siblings, so the nested surfaces stay one click away from any page.

**Standard structural** (no non-obvious behaviour): `BaseHead.astro`, `FormattedDate.astro`.

## Styles

| File | Purpose |
| ---- | ------- |
| `global.css` | CSS custom properties, base resets, shared typography |
| `homepage.css` | Deep-navy editorial palette for the homepage (`data-layout="homepage"`) |
| `compass.css` | Header brand-mark micro-interaction — 5 `[data-state]` phases (idle/hover/focus/engaged/…) |
| `constellation-pages.css` | Shared `.cn-page` chrome for `/studio` and `/project/[slug]` |
| `haven-ink.tokens.css` | Haven/Ink light-mode palette. **Wired** — `global.css` imports it and maps it onto the `--home-*` surface and the constellation sky in `[data-theme="light"]` |

**No Tailwind.** It was installed-but-unwired for a long time; the config and
the `tailwindcss` devDependency were both retired 2026-08-03 (config archived to
`docs/archive/retired-2026-08-03/`). Every style here is hand-authored CSS driven
by the custom properties in `global.css`. Don't reintroduce utility classes.

## Cloudflare Functions

### `functions/_middleware.ts` — Global middleware

Runs on every request before any function. Three responsibilities:

**1. Admin auth (JWT guard)**
- Protects all `/admin/*` routes.
- Reads `__Host-auth_token` cookie, verifies HMAC-SHA256 JWT against `JWT_SECRET`.
- Optionally checks `JWT_REVOCATION_LIST` KV for revoked JTI values.
- Fails closed — misconfigured or short `JWT_SECRET` (< 32 chars) redirects to `/login`.

**2. Markdown for Agents**
- When a request includes `Accept: text/markdown`, converts HTML responses to Markdown.
- Uses `HTMLRewriter` to strip `nav`, `header`, `footer`, `script`, `style`, etc.
- Returns `Content-Type: text/markdown` with `Vary: Accept` and `x-markdown-tokens` header.

**3. Security headers**
- Sets `Content-Security-Policy` and `X-Frame-Options` on every response via
  `withSecurityHeaders()` — this lives here, **not** in `public/_headers`.
- Artifact-aware: `/artifacts/*` gets a relaxed `ARTIFACT_CSP`/`SAMEORIGIN`
  (allows Google Fonts, frameable by same origin); everything else gets
  `DEFAULT_CSP`/`DENY`.

### `functions/api/contact.ts`

Env vars: `CONTACT_FROM_EMAIL`, `CONTACT_SUBJECT_PREFIX`, `CONTACT_WEBHOOK_URL`,
`CONTACT_WEBHOOK_AUTH_HEADER`. Requires same-origin browser submissions and a configured
webhook URL. Validates honeypot, timing (≥1500ms), name (2–80), email, message (20–4000).
Escapes header values and forwards a structured JSON payload to the webhook receiver.

### `functions/api/share-event.ts`

Env vars: `SHARE_ANALYTICS`. Same-origin guarded endpoint for quote-share telemetry.
Validates `event`, `path`, `quoteId`, stores counters in KV when available, and returns 204 on success.

### `functions/api/login.ts`

Env vars: `ADMIN_PASSWORD`, `JWT_SECRET`. Signs a 24h HS256 JWT
with a random `jti` and sets it as `__Host-auth_token` (HttpOnly, Secure, SameSite=Strict).
Uses constant-time comparison for password check. Route-level rate limiting should be enforced in the Cloudflare dashboard.

### `functions/api/ingest.ts`

Env vars: `INGEST_SECRET`, `GITHUB_INGEST_TOKEN`. Authenticated machine
ingest for modular Markdown (tesserae, signal transmissions, blog essays)
from Obsidian export scripts / Actions. Publishes by **committing to `main`
via the GitHub Contents API** (a Pages Function has no filesystem — ingest
means commit), which triggers the normal Pages build. Security posture,
non-negotiable (rationale in the file header):
- **`.md` only, never `.mdx`** — MDX executes caller-supplied JSX at build time.
- **`heroImage` not ingestible** — it resolves through Astro's `image()`
  against a real on-disk asset; add by hand post-ingest.
- Frontmatter schemas are `.strict()` **duplicates** of `content.config.ts`
  (the `astro:content` virtual module can't be imported from a Function) —
  schema changes must update both places.
- Rate limiting is a Cloudflare dashboard WAF rule; because this route writes
  to the repo, set it **stricter** than `/api/login` and `/api/share-event`.

### `functions/api/logout.ts`

Reads the `__Host-auth_token` cookie, verifies and decodes the JWT, then writes
`revoked:{jti}` to the `JWT_REVOCATION_LIST` KV namespace with a TTL equal to the
token's remaining lifetime. Clears the cookie (Max-Age=0) regardless of whether
revocation succeeded — the cookie is always cleared even if KV is unavailable.

## Environment Variables and Secrets

Copy `.dev.vars.example` to `.dev.vars` for local development.

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `ADMIN_PASSWORD` | Yes | Plain-text password for `/api/login` |
| `JWT_SECRET` | Yes | HMAC signing key — minimum 32 random chars |
| `CONTACT_FROM_EMAIL` | No (wrangler.toml default) | Reserved site metadata; not used by the current webhook-only contact flow |
| `CONTACT_SUBJECT_PREFIX` | No (wrangler.toml default) | Prefix used when building the webhook payload subject |
| `CONTACT_WEBHOOK_URL` | Yes | POST validated contact payloads to this webhook |
| `CONTACT_WEBHOOK_AUTH_HEADER` | No | Authorization header value sent to the webhook |
| `INGEST_SECRET` | For `/api/ingest` | Bearer secret for machine content ingest |
| `GITHUB_INGEST_TOKEN` | For `/api/ingest` | Token used to commit ingested files via GitHub Contents API |

Cloudflare bindings (configure KV in `wrangler.toml`; manage route rate limiting in the dashboard):

| Binding | Type | Purpose |
| ------- | ---- | ------- |
| `JWT_REVOCATION_LIST` | KV Namespace | Stores revoked JWT JTI values |
| `SHARE_ANALYTICS` | KV Namespace | Share event storage |

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

## Astro / Frontend Notes

- **Scoped styles don't reach runtime-injected nodes** — Astro scopes component styles to build-time DOM. Canvas elements or JS-created nodes won't receive scoped styles; use `is:global` or inline styles for those.
- **Safari favicon** — SVG favicons may not render in Safari. Always pair with a `.ico` or `.png` fallback.

## Key Constraints

- **Static output only** — `astro.config.mjs` sets `output: "static"`. No SSR. All dynamic behaviour goes through Cloudflare Functions.
- **Astro islands discipline** — React is used for `ThemeToggle`, `ContactForm`, `PostQuoteShare`, and `ConstellationNodes` (homepage hero) only. Do not add React for non-interactive rendering.
- **No Tailwind** — config and dependency both retired 2026-08-03. Style with CSS custom properties; `global.css` owns the reset.
- **Two font systems, deliberately** — the Astro site gets fonts from `@fontsource` (Vite-resolved, hashed into `dist/_astro/`). The standalone HTML pages under `public/` get them from `/fonts/*.woff2` or their own local `fonts/` subdirectory, because nothing processes them. Don't "unify" these; check which side of the line a file is on first. `check-docs-drift.sh` §8 resolves every reference and fails on a miss.
- **CDN fonts only under `/artifacts/`** — `_middleware.ts` grants `ARTIFACT_CSP` (which allows `fonts.googleapis.com`/`gstatic.com`) to `/artifacts/*` alone. A `<link>` to Google Fonts on any other path is CSP-blocked at runtime with no build error — the page just silently renders in fallback typefaces. Self-host instead. Enforced by `check-docs-drift.sh` §9.
- **Verify file references by resolving them, not by grepping** — paths in this repo mix root-absolute (`/fonts/x.woff2`) and relative (`./fonts/x.woff2`) forms, and `grep "/fonts/"` matches both while meaning neither. Two wrong conclusions were reached this way (see `docs/journal/DECISIONS.md`, 2026-08-02). Resolve against the referring file's base, then `stat`.
- **No external analytics script** — telemetry is first-party only via `share-event.ts`.
- **No published email address** — contact routes privately through the function. **One approved exception:** `/work/research-program-operations/` publishes `mazze@mazzeleczzare.com` in its résumé contact line, because a résumé a hiring manager cannot reply to fails at its only job, and recruiters routinely work from the PDF alone inside an ATS where a contact-form URL is a dead end. This was an explicit owner decision made with the scraping tradeoff stated. Do not strip it as a constraint violation.
- **`src/consts.ts` is the single source of truth** for site identity — import from there.
- **`npm run check` is the repo-standard validation** — run before committing any code change.
- **Draft posts** — use `draft: true` in frontmatter, never delete in-progress posts.
- **Deployment platform is Cloudflare Pages** — not Workers, not Vercel. Do not use Workers adapter terminology. Local preview uses `npm run preview`, not `wrangler dev`.
- **JWT_SECRET must be ≥ 32 chars** — middleware and login fail closed if this is not met.
