<!-- Repo-local coding instructions for AI agents working in this Astro + Cloudflare Pages blog -->
# Project quickstart for AI coding agents

These repo-local instructions are the source of truth for mechanics in this workspace.
External charters can be used as benchmark overlays for quality, privacy, and review discipline,
but they do not override the actual scripts, package manifest, or deployment/config files in this repo.

## Quick Commands

- `npm install` : install dependencies
- `npm run dev` : Astro dev server on localhost
- `npm run build` : produce the static site in `./dist`
- `npm run preview` : preview the built site locally via Astro preview
- `npm run check` : repo-standard validation (`astro build && tsc`)

## Testing and Validation

- **No automated test framework**: this repo currently relies on build and type validation plus manual verification.
- **Type checking**: `tsc` runs inside `npm run check`.
- **No repo lint setup**: there is no ESLint or Prettier configuration to enforce.
- **Cloudflare validation is manual**: `wrangler` exists as a tool and config surface, but it is not part of the default `npm run check` script.

For code changes, prefer this validation order:

1. `npm run check`
2. Manual route/UI verification for affected pages
3. Manual Cloudflare/runtime verification only when you change `functions/` behavior or `wrangler.toml`

## Actual Architecture

- **Framework**: Astro 5 static site (`astro.config.mjs` sets `output: "static"`)
- **Interactive UI**: React islands via `@astrojs/react`
- **Content**: Markdown/MDX in `src/content/blog/` using Astro Content Collections
- **Backend surface**: Cloudflare Pages Functions in `functions/api/`
- **Build output**: `dist/`
- **Cloudflare config**: `wrangler.toml` manages bindings and runtime metadata

This repo is not currently using the `@astrojs/cloudflare` adapter.
Do not assume `wrangler dev`, `wrangler deploy --dry-run`, or Cloudflare typegen are part of the default workflow unless the repo scripts are updated to say so.

## Project-Specific Conventions

- **Site identity** lives in `src/consts.ts`. Do not hardcode title, canonical URL, author, or social links inline.
- **Content schema** is defined in `src/content.config.ts`. Blog frontmatter must include:
  - `title`
  - `description`
  - `pubDate`
  Optional:
  - `updatedDate`
  - `heroImage`
- **Routes** use `post.id` and resolve to `/blog/{post.id}/`.
- **Markdown/MDX rendering** uses `render(post)` from `astro:content` and the `BlogPost.astro` layout.
- **Component styling** is split between `src/styles/global.css` and inline `<style>` blocks in `.astro` files. Follow the existing pattern.
- **Theme state** is driven by `document.documentElement.dataset.theme` and `localStorage['theme-preference']`. Update both UI code and theme-color metadata together if you change theme behavior.
- **Quote sharing** is paragraph-level and imperative. Preserve authored paragraph anchors when touching `src/components/PostQuoteShare.tsx` or the `.prose` markup in `src/layouts/BlogPost.astro`.
- **Contact delivery** prefers a webhook secret over the Cloudflare email binding. If you change delivery behavior, keep the secret-based path and email-binding fallback both documented.
- **Functions** should stay small, privacy-conscious, and explicit about validation and response shapes.

## Runtime Surfaces

- **Homepage**: `src/pages/index.astro` renders the hero plus the latest 6 posts.
- **Blog index**: `src/pages/blog/index.astro` lists all posts newest-first.
- **Blog posts**: `src/pages/blog/[...slug].astro` resolves collection entries by `post.id`.
- **Markdown pages**: `src/pages/about.md`, `src/pages/manifesto.md`, and `src/pages/roadmap.md` flow through the shared `BlogPost.astro` layout.
- **Contact API**: `functions/api/contact.ts` accepts JSON or `FormData`, enforces honeypot and timing checks, and returns `{ ok, error?, message? }` with `Cache-Control: no-store`.
- **Share telemetry API**: `functions/api/share-event.ts` accepts only first-party quote-share events, rate-limits via Cloudflare, and should remain fire-and-forget from the reader's perspective.

## Key Files

- `astro.config.mjs` — actual Astro build config
- `package.json` — authoritative scripts and dependency list
- `wrangler.toml` — Cloudflare Pages bindings and rate limits
- `src/content.config.ts` — content collection schema
- `src/layouts/BlogPost.astro` — blog post layout and post-local styles
- `src/pages/blog/[...slug].astro` — blog route generation
- `src/pages/blog/index.astro` — blog listing
- `src/pages/contact.astro` — contact page shell
- `src/components/ContactForm.tsx` — contact form island
- `src/components/PostQuoteShare.tsx` — paragraph quote sharing island
- `src/components/HeroSection.tsx` — homepage hero island
- `src/components/ThemeToggle.tsx` — persisted theme selector island
- `src/components/BaseHead.astro` — global metadata, theme bootstrap, and JSON-LD
- `functions/api/contact.ts` — contact delivery handler
- `functions/api/share-event.ts` — first-party quote-share telemetry handler
- `scripts/ops/update-context-cache.sh` — explicit context snapshot helper
- `scripts/ops/session-handoff.sh` — handoff updater for memory files
- `docs/operations/AGENT_OPERATIONS_PROTOCOL.md` — repo-local agent execution protocol

## Cloudflare Notes

- `wrangler` is installed as a dev dependency and `wrangler.toml` is real configuration, not dead weight.
- `functions/api/contact.ts` depends on Cloudflare bindings for delivery.
- `functions/api/share-event.ts` may depend on a rate-limiter binding when configured.
- If you change function bindings, update both code and `wrangler.toml` together.
- If you introduce new Cloudflare-specific runtime requirements, document the manual validation path because the default `npm run check` does not execute them.
- Current configured bindings in `wrangler.toml` are:
  - `CONTACT_FROM_EMAIL`
  - `CONTACT_SUBJECT_PREFIX`
  - `CONTACT_EMAIL` (`send_email`)
  - `SHARE_EVENT_RATE_LIMITER` (`ratelimits`)

## Privacy and Security Guidance

- Keep telemetry first-party and minimal.
- Do not add third-party analytics, invasive tracking, or unnecessary identifier capture.
- Do not import browser-only or end-to-end-encryption defaults from external charters unless the product explicitly chooses them.
- Preserve the current architecture unless there is a repo-specific reason to change it.

## PR Scope Hygiene

- Keep feature PRs limited to intentional product or ops changes.
- Do not commit local operator artifacts such as `.codex/`, ad hoc zip files, or machine-local metadata.
- Do not let generated context-cache churn become incidental PR noise.
- If a generated operational file changes during commit flow, restore it unless the task is explicitly about ops/memory maintenance.

## Troubleshooting

- If a build fails, inspect `package.json`, the changed files, and the actual command output before changing code.
- If TypeScript errors mention Cloudflare bindings, verify the current types and config instead of assuming the repo uses generated runtime types.
- If you are unsure how a route is wired, inspect `src/pages/`, `src/layouts/`, and `src/components/` before introducing new patterns.
