# PLAN — apex navigation: one junction, everything linked

**Opened 2026-11-14. Revision 2 (01:15Z)** adopts an external review of revision 1; see
DECISIONS § **Review of revision 1 adopted**. Status: **draft, awaiting mazze's
go-ahead.** No burst has started.

## The ask, restated

Make mazzeleczzare.com legible. The apex is the junction. A visitor arriving on the landing
page goes through the airlock and is routed to every part of the work:

- the writing;
- the instruments (subdomains);
- the bench (every project);
- field notes, in both of its senses;
- the creative and music studio.

Every page and subdomain links up to its place and across to what is relevant, so the whole
estate is indexed and navigable. The constellation is fully loaded: every project is a node.
Studio stops being locked out. Alidade (study 01) is an input, not the answer.

## The finding that reshapes this plan

**A successful build and a complete `dist/` link graph can still omit a live page on the
apex.** `/signal/bearing-table/` is served by a separate Worker route that overrides
Pages, so it is in no repo build. Any coverage claim made from build output alone is
therefore false by construction. Every inventory and gate below is **deployment-aware**:
build output plus edge routing.

## Repos and systems in scope

| Where | What changes |
|---|---|
| `blog/mazze-leczzare-blog` (primary) | `src/pages/index.astro`, `components/constellation/*`, `Header.astro`, `Footer.astro`, `src/pages/studio.astro`, `project/[slug].astro`, `writing/index.astro`, `blog/*` listings, `src/content.config.ts`, **`functions/api/ingest.ts`** (project validation), a **new project registry** in `src/data/`, `src/utils/{nodes,collectNodes}.ts`, `astro.config.mjs`, `public/_redirects`, `scripts/ops/` (new gates), `.github/workflows/`, the `CLAUDE.md` / `AGENTS.md` route tables, `check-docs-drift.sh` |
| `blog/alidade` | read-only; its six bearings are the starting taxonomy |
| 8 subdomain repos (burst 8) | a return path to the apex and to the project's page. Checkmate is excluded by owner decision |
| Cloudflare zone | read-only inventory in bursts 0 and 3b. The only write is track S (Studio), separately approved |

## Evidence base and its limits

The audit is at `~/Projects/inbox/2026-11-13/airlock-patrol/`: private and gitignored, with
the baseline taken 2026-11-13 23:05–23:20Z and post-change states in
`header-states.csv`.

- **Sitemap:** 72 URLs, all 200. The crawl fetched 74: those 72 plus 2 non-sitemap probes,
  `/signal/bearing-table/` and `/manifesto/`.
- **Orphans (0 inbound internal links among crawled pages):** `/constellation/`, two
  artifacts, and `/signal/bearing-table/`.
- **1 inbound link:** `/blog/field-notes/`, `/blog/artifacts/` and `/blog/dispatches/`
  (each only from `/blog/`), plus 7 artifacts and standalone works.
- **Constellation vs `/work`:** 9 nodes from `project:` frontmatter, against 22 `/work`
  entries, which form a CV model. They overlap on 4 slugs.
- **Subdomain return paths:** "none found **within the inspected surface**", which was
  root pages only, and absolute links only. That is not a finding of absence.
- **Deployment provenance:**
  - Deployed revisions are **missing locally** for fieldnotes (`96c2d21`), checkmate
    (`f8c7ad4`) and research (`b9d27982`).
  - stele and fieldnotes deploy by **direct upload**, so merging a PR deploys nothing.
- **Studio:**
  - The deployed bundle was inspected and is version-pinned: `studio-worker-inspection.md`,
    version `d910da7c…`, sha256 `bd8bef98…`.
  - The gate is a per-Worker Access app created 2026-08-26.
  - Unknown: the strength of the secret, AI Gateway limits, and what the assets contain.

## Design principle

**One registry, many surfaces,** reconciled against **what is actually served**:

```
project registry (slug, title, bearing, kind, home URL, repo, deploy mechanism, status, related[])
   ├─ constellation nodes · the bench · /project/<slug>/ · airlock bearings · nodes-manifest
   ├─ /work entries and content (blog, signal, tesserae) reference it by slug
   └─ /api/ingest validates project: against it (same module, importable by Functions)

route inventory = build output (dist/) ∪ edge routing (Pages domains, Workers routes,
                  Workers custom domains, redirect rules, _redirects, Access apps)
   each row: route · serving system · source repo · deployed revision | "unknown"
             · publication policy (public-indexed | public-unindexed | gated | excluded)
             · verified_at
```

## Bursts

| # | Burst | Needs mazze | Output and acceptance |
|---|---|---|---|
| 0 | **Deployment-aware route inventory and intent map** (read-only). Every route from `dist/` plus every edge route gets a row: serving system, repo, deployed revision or `unknown`, publication policy, intent, audience, project, inbound/outbound links, `verified_at`. **Explicit exclusions:** the obsidian-mcp tunnel, `checkmate-ci` on workers.dev, `*.pages.dev` previews, `/admin/*`, `/login/`, `/api/*` | review the intents | `docs/ia/route-inventory.json` + `intent-map.md`. **Accept:** `/signal/bearing-table/` is present and classified as `worker-route` |
| 1 | **Taxonomy and naming**: bearings (alidade's six as the hypothesis); the Studio name collision; `/writing/` vs `/blog/`; the field-notes duality stated in copy | **decisions** | DECISIONS entries only |
| 2 | **Project registry**, with three parts that must land together: (a) registry module + `project:` validated in `content.config.ts` (an unknown slug fails the build); (b) **ingest validation**: `functions/api/ingest.ts`'s `.strict()` schemas validate `project` against the same module, so an ingest can't commit a slug that later breaks the build on `main`; (c) **reachability**: every registry project has a `/project/<slug>/` and a node | confirm the project list | the constellation is fully loaded. **Accept:** unit tests for unknown-slug rejection on both paths |
| 3 | **Gates, two of them.** (3a) **Build gate** over `dist/`: every page has ≥1 inbound non-nav link; every bearing is ≤2 clicks from `/`; every registry project has a page and a node; no orphan artifacts. (3b) **Edge gate**, read-only and scheduled: re-derive edge routes from the Cloudflare API with a read-only token and probe them live; fail if any served route lacks an inventory row, or an inventory row no longer resolves. **Its acceptance test is the bearing-table case** | read-only API token for CI (**ask**: zone read, Workers routes read, Pages read) | CI jobs. **Accept:** deleting `bearing-table` from the inventory makes 3b fail while 3a stays green |
| 4 | **Airlock as hub**: the landing door routes by bearing and links `/constellation/` | visual sign-off | `AirlockStrip` / `index.astro` |
| 5 | **Nav from data**: header and footer generated from the bearings file | visual sign-off | `Header.astro`, `Footer.astro` |
| 6 | **Bench lists every project**, registry-driven | — | bench route |
| 7 | **Field notes, both senses**: `/blog/field-notes/` ↔ `fieldnotes.`, plus a line of copy on the duality | copy approval | listing + project pages |
| 8 | **Return paths, per repo.** For each of the 8 repos: (1) **provenance**: compare the deployed revision with the source; if the deployed revision is missing locally, `git fetch` and reconcile before editing. (2) **Record the rollback point**: the current deployment or version ID. (3) Edit and PR. (4) **Deploy by that repo's mechanism**: Git integration, `wrangler deploy`, or direct upload for stele and fieldnotes. (5) **Verify live**: the return link is present on the served page. (6) Rollback is to the recorded ID. A merged PR alone counts as nothing | per-repo merge and deploy | a per-repo row in CHECKPOINT: provenance ✓, rollback ID, deployed ID, live ✓ |
| 9 | **Indexing**: sitemap covers every `public-indexed` inventory row, including edge-served ones; fix the `.html` canonical vs 308; subdomain sitemaps | Search Console access | sitemap changes |

**Order:** 0 → 1 → 2 → 3, then 4–7, then 8–9. Bursts 0 and 3 only measure and can run
before design sign-off.

## Track S — Studio (separate; not in the burst order)

Studio is not opened until its deployed code and its effective Access boundary are
evidenced. **Both now are** (`studio-worker-inspection.md`, 2026-11-14). Still open before
any change:

1. **mazze:** what Studio shows publicly, and whether to recover the dashboard-only source
   into a repo (registry entry, `WORKSPACE.md`).
2. Unknowns to close or accept: `TRIGGER_SECRET` strength; whether AI Gateway `mazze-studio`
   rate-limits; what the static assets contain.
3. **Proposed change** (approval required, outward-facing): replace the per-Worker app with
   a path-scoped hostname app covering `studio.mazzeleczzare.com/auth` and `/generate/*`,
   plus a WAF rate limit on those paths. Then the site and `/audio/*` become public.
   Rollback: re-create the per-Worker destination app from its backed-up JSON.

## Checkmate witness (monitoring note, not a burst)

The witness is a **scheduled snapshot refresh**; the build reads the committed snapshot. If
3b grows a staleness check, report **refresh failure** (the workflow can't read the head)
and **snapshot age** separately from build status.

## Known constraints

- The `blog` repo is HIGH posture: visual changes land on a branch and merge only after
  mazze likes the render.
- Touch the map when you touch the territory: route tables and drift checks go in the same
  commit.
- No React for non-interactive rendering.
- Checkmate stays unlinked from the apex by owner decision.
- WebMCP is on zone-wide. Out of scope; a pending decision is in the audit.
- The audit is two periods (baseline, then post-change). Cite its state labels, not "current".
