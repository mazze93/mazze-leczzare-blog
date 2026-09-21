---
name: run-mazze-leczzare-blog
description: Run, build, screenshot, or smoke-test mazze-leczzare-blog. Use when asked to start the dev server, verify a change works in the browser, take a screenshot of the site, or confirm a page renders correctly.
---

# run-mazze-leczzare-blog

Starts the site, proves every route still serves, and hands off to the browser
for anything visual. The smoke driver (`driver.cjs`, next to this file) is plain
Node over HTTP — no browser binaries, no extra installs.

> **This file asserts as little as possible, on purpose.** The previous version
> rotted badly: it named a project path under a macOS user that doesn't exist on
> this machine, claimed a framework major that had moved on twice, said there
> was no test suite when there are ~200 tests, told you Playwright had been
> removed while it sat in `devDependencies`, and carried a nine-route map after
> the site had grown past fifty. It even documented a route as 404-in-dev that
> now serves 200. Every one of those was a fact written down once and never
> re-checked. So: **derive, don't assert.** The driver reads the project root,
> the framework version, the npm scripts and the entire route list at run time
> and prints them. If you are about to add a fact to this file, add a check to
> the driver instead.

## Quick start

From **anywhere inside the repo** (the driver walks up to the git root itself):

```bash
node .claude/skills/run-mazze-leczzare-blog/driver.cjs --start
```

That starts the dev server, probes every route, prints a summary, and stops the
server again. Exit code 0 means every route passed.

Other forms:

| Command | What it does |
| --- | --- |
| `driver.cjs` | Probe a dev server you already have running (default port 4321) |
| `driver.cjs --port 4399` | Any port (a bare `driver.cjs 4399` still works) |
| `driver.cjs --start` | Start the server, probe, stop it |
| `driver.cjs --preview` | `npm run build`, then probe the **production** output |
| `driver.cjs --base https://…` | Probe a deployed site instead of localhost |
| `driver.cjs --expect /work/=Research` | Add a substring check to one route |
| `driver.cjs --json` | Machine-readable results on stdout |

## What the driver checks, and why it's shaped that way

- **Routes are discovered, never listed.** It reads `dist/` when a build exists
  — which includes dynamic routes: blog posts, projects, signal entries — and
  falls back to `src/pages/` otherwise. A new page is covered the moment it
  exists; a deleted one stops being probed. Nothing to update here, ever.
- **Expectations are structural, not per-page.** Every route must return 200,
  carry a non-empty `<title>`, return a body of plausible size, and show no dev
  error overlay. Per-page magic strings ("expect the word *Roadmap*") break on
  every rename and train you to ignore the driver. Use `--expect` when you
  genuinely want one, for one run.
- **Environment quirks are reported, not asserted.** `/rss.xml` and
  `/api/contact` are probed and their status printed rather than described here.
  API routes are Cloudflare Pages Functions and don't run under `astro dev`, so
  they 404 locally and are real in production — the driver shows you what
  actually happened, which is how the old file's stale claim about `/rss.xml`
  would have been caught years earlier.
- **One real dev-vs-production difference is handled, not flagged.** Pages
  shipped as `public/<name>/index.html` 404 at `/<name>/` under `astro dev`,
  because the dev server doesn't resolve a directory to its index the way
  Cloudflare Pages does. The driver retries the explicit file and, if that
  serves, passes the route with a note. Without that it cries wolf on two
  perfectly healthy pages.

## The one genuinely surprising thing: `astro dev` daemonizes

In the current Astro major, `npm run dev` **returns immediately** and leaves a
background dev server running. Three consequences, each verified by hitting it:

- Killing the `npm` process does **not** stop the server — the port stays bound.
  Use `npx astro dev stop`.
- Astro manages **one daemon per project**. Asking for a second port while one
  is running is a silent no-op: nothing listens on the new port and your probe
  hangs until it times out. The driver checks `astro dev status` first and
  probes the running server instead of starting a doomed second one.
- `npx astro dev logs` is where the output went. The driver prints its tail when
  a start fails.

The driver only stops a server it started itself; one you started by hand stays
up.

## Visual inspection

For anything you have to *look* at, start the server and drive Chrome:

1. Load the tools in **one** call — `ToolSearch` with
   `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__javascript_tool,mcp__claude-in-chrome__tabs_close_mcp`
2. `tabs_context_mcp` → `tabs_create_mcp` → `navigate` to the local URL.
3. Screenshot with `computer` (`save_to_disk: true` when the human should see it).

**Seed the theme before load, not after.** Setting
`document.documentElement.dataset.theme` after the page loads is overwritten by
the inline bootstrap in `BaseHead` and by `ThemeToggle`'s effect — a past
session read that as a serious regression when it was a broken probe. Do this
instead, then screenshot:

```js
localStorage.setItem('theme-preference', 'light'); location.reload();
```

Sweep dark **and** light on any page you touched. Close tabs you opened.

## Validation commands

Take them from `package.json`, not from a list here — the driver prints the
script names on every run, and the repo's own `CLAUDE.md` is the authority on
which gates a given change needs. As of this writing that's `npm run check`
before any commit, with `npm test`, `npm run docs:check` and
`scripts/ops/check-docs-drift.sh` alongside it.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `no server at … (ECONNREFUSED)` after `--start` | Usually a daemon already running for this project on another port. `npx astro dev status`, then `npx astro dev stop`. |
| Port still bound after a run | You started that server by hand; the driver won't stop what it didn't start. `npx astro dev stop`. |
| A route 404s in dev but works deployed | Directory-index resolution for a `public/` subfolder, or an API route that only exists in production. Re-run with `--preview`. |
| `Could not find a project root` | You're outside the repo. `cd` into it. |
| `node: command not found` | Node isn't on this shell's PATH. The driver prints the interpreter it ran under; any Node ≥ 18 works. |

## Keeping this skill honest

Keep the asymmetry that makes it durable: **the driver discovers, this file
explains.** Anything version-, path-, count- or page-specific belongs in code
that reads it at run time and fails loudly when it changes — not in prose that
goes quietly stale. A fact in this file that nothing re-checks is a future wrong
answer, and this skill has already produced several.
