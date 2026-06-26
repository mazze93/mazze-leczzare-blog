---
name: run-mazze-leczzare-blog
description: Run, build, screenshot, or smoke-test mazze-leczzare-blog. Use when asked to start the dev server, verify a change works in the browser, take a screenshot of the site, or confirm a page renders correctly.
---

# run-mazze-leczzare-blog

Astro 6 static blog driven by a Playwright CJS driver (`driver.cjs` next to this file). The driver starts against a running dev server, navigates all major routes, toggles the theme, and screenshots each page.

Node is managed by **mise** — always prefix commands:
```bash
export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"
```

## Prerequisites

No extra packages needed. Playwright installs itself on first driver run (`npm install --save-dev playwright`). The engine warning about Node 22.x vs 24.x is harmless.

## Build

```bash
export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"
cd /Users/mazze/code/mazze-leczzare-blog
npm ci
npm run check       # astro build + tsc — must pass before any commit
```

## Run — agent path (driver)

Start the dev server, then run the driver against it:

```bash
export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"
cd /Users/mazze/code/mazze-leczzare-blog

# Start dev server in background
npm run dev -- --port 4399 &>/tmp/astro-dev.log &
DEV_PID=$!

# Run driver (waits for server automatically, PORT OUTDIR optional)
node .claude/skills/run-mazze-leczzare-blog/driver.cjs 4399 /tmp/blog-screenshots

# Stop server when done
kill $DEV_PID
```

The driver covers: `/` (dark + light), `/blog/`, first post, `/about/`, `/contact/` (form filled, not submitted), `/work/`.

Screenshots land in the `OUTDIR` you pass (default `/tmp/mazze-blog-screenshots`). Read them with the `Read` tool.

### Quick single-page screenshot

```bash
export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"
npx playwright screenshot --browser chromium http://localhost:4399/ /tmp/screenshot.png
```

`npx playwright screenshot` works without any prior setup and is the fastest way to grab one page.

## Run — human path

```bash
export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"
cd /Users/mazze/code/mazze-leczzare-blog
npm run dev
# → http://localhost:4321/ opens in browser
```

Human default is port 4321; driver examples use 4399 to avoid collision with an existing `npm run dev` session.

## Test

```bash
export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"
npm run test        # vitest run
npm run check       # astro build + tsc (repo-standard — run before committing)
```

## Route map (verified)

Routes require trailing slashes in dev mode. Without them: 404.

| Route | Title | Notes |
|---|---|---|
| `/` | Mazze Leczzare | BreathingHero canvas |
| `/blog/` | Writing — Mazze Leczzare | All posts |
| `/blog/<slug>/` | Post title | `src/content/blog/*.{md,mdx}` |
| `/about/` | About | MDX page |
| `/contact/` | Contact \| Mazze Leczzare | CF Function POST — 404 in dev |
| `/work/` | Work — Mazze Leczzare | |
| `/security/` | (security page) | |
| `/login/` | (login page) | |
| `/admin/` | (admin, JWT-gated) | |
| `/rss.xml` | — | **404 in dev** — Vite doesn't serve `.xml` endpoints; works in `npm run build && npm run preview` |
| `/api/*` | — | **404 in dev** — Cloudflare Pages Functions only run on CF or `wrangler pages dev` |

## Gotchas

**`/rss.xml` returns 404 in dev.** Astro's Vite dev server doesn't serve `.js`-backed `.xml` routes. Verify RSS with `npm run build && npm run preview` instead, or deploy.

**`/api/*` routes are always 404 in `npm run dev`.** The contact form, login, logout, and share-event endpoints are Cloudflare Pages Functions. They only run under `wrangler pages dev` or when deployed. The contact form UI renders correctly; only the POST fails.

**Routes without trailing slashes return 404.** `/blog` → 404, `/blog/` → 200. This is Astro dev mode behaviour only; the built/deployed site handles both.

**Node is managed by mise, not Homebrew.** `npm` and `node` are not on the default shell PATH in Claude Code. Always prefix with `export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"` or commands fail silently with `env: node: No such file or directory`.

**Theme toggle selector.** The ThemeToggle button is `button[aria-label^="Activate"]` (e.g., "Activate light mode" / "Activate dark mode"). Text content is `"Light"` / `"Dark"` (title case), not `"LIGHT"` / `"DARK"`.

**playwright engine warning.** `npm warn EBADENGINE` about Node 22.x vs 24.x appears on playwright install — harmless, driver runs fine on Node 24.

## Troubleshooting

**`env: node: No such file or directory`** — mise node not in PATH. Fix: `export PATH="/Users/mazze/.local/share/mise/installs/node/24.16.0/bin:$PATH"`.

**`Error: Cannot find package 'playwright'`** — driver auto-installs playwright on first run; if it fails, run `npm install --save-dev playwright` manually from project root.

**`Error: connect ECONNREFUSED`** — dev server isn't running. Start it first; driver polls for up to 30s but won't start the server itself.

**`npm run check` fails after `npm install --save-dev playwright`** — playwright adds its browser binaries, which can trigger Astro type checks. Run `npm run check` to confirm; if it fails, revert playwright with `npm uninstall playwright`.
