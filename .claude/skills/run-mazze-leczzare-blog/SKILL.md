---
name: run-mazze-leczzare-blog
description: Run, build, screenshot, or smoke-test mazze-leczzare-blog. Use when asked to start the dev server, verify a change works in the browser, take a screenshot of the site, or confirm a page renders correctly.
---

# run-mazze-leczzare-blog

Astro 6 static blog. The driver (`driver.cjs` next to this file) is a Node HTTP smoke test — no browser binaries required. It starts against a running dev server and verifies every major route returns HTTP 200 with expected content. For visual inspection, use the `mcp__claude-in-chrome__*` MCP tools after starting the dev server.

Node is managed by **mise**. In most Claude Code sessions, `node` is already in PATH. If not:
```bash
export PATH="/Users/mazze/.local/share/mise/installs/node/lts/bin:$PATH"
```

Project root: `/Users/mazze/Code/publishing/mazze-leczzare-blog`

## Prerequisites

No extra packages. `driver.cjs` uses only Node built-ins (`http`). No Playwright, no browser downloads.

## Build

```bash
cd /Users/mazze/Code/publishing/mazze-leczzare-blog
npm ci
npm run check       # astro build + tsc — must pass before any commit
```

## Run — agent path (smoke driver)

Start the dev server, then run the driver:

```bash
cd /Users/mazze/Code/publishing/mazze-leczzare-blog

# Start dev server in background
npm run dev -- --port 4399 &>/tmp/astro-dev.log &
DEV_PID=$!

# Run driver — waits for server, checks all routes, exits 0 on pass / 1 on fail
node .claude/skills/run-mazze-leczzare-blog/driver.cjs 4399

# Stop server when done
kill $DEV_PID
```

The driver checks: `/`, `/blog/`, a discovered blog post, `/about/`, `/contact/`, `/work/`, `/signal/`, `/security/`, `/cipher-gothic/`, `/roadmap/`.

**Example output (passing):**
```
  ✓  /                       HTTP 200  "Homepage"
  ✓  /blog/                  HTTP 200  "Blog listing"
  ✓  /signal/                HTTP 200  "Signal page"
  ...
SMOKE PASSED
```

## Visual inspection — agent path

After starting the dev server:

1. Load the browser tools: use ToolSearch with `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp`
2. Create a new tab and navigate to `http://localhost:4399/`
3. Use `mcp__claude-in-chrome__computer` to take screenshots

## Run — human path

```bash
cd /Users/mazze/Code/publishing/mazze-leczzare-blog
npm run dev
# → http://localhost:4321/
```

Human default is port 4321. Use 4399 for the driver to avoid collision with an existing dev session.

## Test

```bash
npm run check       # astro build + tsc (repo-standard — run before committing)
```

There is no separate vitest suite. `npm run check` is the full validation.

## Route map (verified 2026-06-29)

Routes require trailing slashes in dev mode. Without them: 404.

| Route | Notes |
|---|---|
| `/` | BreathingHero canvas |
| `/blog/` | All posts, newest first |
| `/blog/<slug>/` | `src/content/blog/*.{md,mdx}` |
| `/about/` | Hero, work cards, engagement grid |
| `/contact/` | CF Function POST — UI renders; POST is 404 in dev |
| `/work/` | Work/portfolio page |
| `/signal/` | Field ledger — verse, fragments, dispatches |
| `/security/` | Security disclosure policy |
| `/cipher-gothic/` | Design system documentation |
| `/roadmap/` | Markdown page via BlogPost layout |
| `/login/` | Admin login |
| `/admin/` | JWT-gated admin dashboard |
| `/rss.xml` | **404 in dev** — works in `npm run build && npm run preview` |
| `/api/*` | **404 in dev** — Cloudflare Pages Functions only |

## Gotchas

**`/rss.xml` returns 404 in dev.** Astro's Vite dev server doesn't serve `.js`-backed `.xml` routes. Verify with `npm run build && npm run preview`.

**`/api/*` routes are always 404 in `npm run dev`.** Contact form, login, logout, and share-event are Cloudflare Pages Functions. The contact form UI renders; only the POST fails.

**Routes without trailing slashes return 404 in dev.** `/blog` → 404, `/blog/` → 200. Built/deployed site handles both.

**Node is managed by mise, not Homebrew.** In a remote or fresh session, `node` may not be in PATH. Fix: `export PATH="/Users/mazze/.local/share/mise/installs/node/lts/bin:$PATH"`. The `lts` symlink always points to the current active version (`24.16.0` as of 2026-06-29).

**Playwright was removed.** Do not attempt to `npm install playwright` or run `npx playwright install`. The driver uses Node built-in `http` only.

## Troubleshooting

**`env: node: No such file or directory`** — mise node not in PATH. Fix: `export PATH="/Users/mazze/.local/share/mise/installs/node/lts/bin:$PATH"`.

**`Error: connect ECONNREFUSED`** — dev server isn't running. Start it first; the driver polls for up to 30s but won't start the server itself.
