# DECISIONS — apex navigation (append-only)

Format: date · decision · why · how to reverse.

## 2026-11-14 00:45Z · **Phase 0: the /work collection is not a project registry**

**Assumption checked:** that `src/content/work/` (22 entries, made first-class in #220)
could serve as the single project registry feeding the constellation, the bench and
`/project/<slug>/`.

**Result: false.**

- `/work` is a CV model: sections `editorial` / `instruments` / `provenance` / `record`,
  tiers `live` / `published` / `acknowledged` / `self`
  (`src/content.config.ts:111-138`, `src/data/work.ts:13,30`).
  It holds Teaching, Laboratory Operations and Bloom Magazine alongside products.
- The constellation's 9 nodes come from free-text `project:` frontmatter
  (`src/utils/nodes.ts`).
- They overlap on 4 slugs: context-synapse, intentional-fragility, secure-pride, stele.
- 5 nodes have no work entry: aletheia, cognitive-topology, decision-telemetry, maestro,
  static-first.
- 18 work entries have no node.
- Only 4 work entries carry a `projectHref`.

**Decision:** the plan adds a dedicated project registry (burst 2). `/work` entries and
content reference it by slug; `/work` is not repurposed.

**Why:** reusing the CV model would put jobs and teaching on the constellation, or force
the CV to carry nav concerns.

**Reverse:** drop burst 2 and key everything on `/work` slugs, accepting non-project nodes.

## 2026-11-14 00:45Z · **Existence check: no prior whole-site navigation plan**

Searched `docs/` and the journals.

- `docs/superpowers/specs/2026-04-13-site-audit-design.md` and
  `2026-05-13-constellation-architecture-design.md` cover content recovery and
  constellation mechanics. Their subsystems 3 and 4 (glassmorphic reading pane,
  shattering/afterimage) were never built: no component exists under `src/components/`.
- Alidade (`blog/alidade`, 2026-10-13) is the only navigation study. By its own README its
  relationships are "design proposals, not a complete canonical content inventory", and
  Checkmate is deliberately absent.

**Decision:** this burst sequence is new work. Alidade's six bearings are the starting
hypothesis for burst 1, not a settled taxonomy.

## 2026-11-14 00:45Z · **Studio: scope the Access gate, don't delete it**

Read the deployed `mazze-studio` bundle (dashboard upload 2026-06-19; no source on disk)
through the read-only API.

- `POST /generate/<name>` queues paid music generation (`env.AI.run("minimax/music-2.6")`).
- It is guarded only by header `x-trigger-secret`, compared with `!==`.
- `POST /auth` returns ok/401 for a supplied secret, which is a guessing oracle.
- There is no rate limit.
- `GET /status/*`, `GET /audio/*` and the static assets need no auth in code.

**Decision:** "un-gate Studio" becomes "Access protects `POST /auth` and `POST /generate*`
only". The site and the audio go public.

**Why:** removing Access outright exposes a brute-forceable path to paid generation.

**Reverse:** restore the host-wide Access destination.

## 2026-11-14 01:15Z · **Review of revision 1 adopted (plan → revision 2)**

An external review of revision 1 and the audit package (pasted by mazze) was checked claim by claim against disk.

**Confirmed and fixed:**

- `hosts.csv` apex row had 18 fields against a 16-column header (unquoted commas from my sed edit). Rebuilt with quoting plus a `captured_state` column; pre-repair copy at `.raw/hosts.csv.pre-repair-2026-11-14`.
- "74 sitemap pages" in revision 1 was wrong: 72 sitemap URLs plus 2 non-sitemap probes (`/signal/bearing-table/`, `/manifesto/`), so 74 were fetched (`crawl.json`, keys 73–74).
- The audit report claimed one snapshot but records two periods (a baseline, then approved zone changes). It now says so; `header-states.csv` holds S0, S1 and S2.
- The roadmap's plain-text Studio mention was typed "related reading". It is now non-navigable text that never counts as an edge.
- The Checkmate witness was called a runtime dependency of the build. It is a scheduled snapshot refresh; the build reads the committed snapshot. Refresh failure and staleness are now recorded as separate failure modes.
- "WebMCP inert on every host checked" overstated it. It now reads: the recorded checks did not establish a successful browser-facing MCP interaction; deployed Checkmate and Studio remain unresolved.
- "Deliberate, not a compromise" overstated it. The audit log establishes the actor and the interface, not intent.
- The report's next-steps list had been split by later inserts, and "the one write" became false after the rule went to DENY. Both are fixed.

**Correct in substance but already evidenced, now filed:**

- The Studio claims (routes, `x-trigger-secret`, `minimax/music-2.6`) came from a read-only inspection of the deployed bundle that lived only in conversation.
- It is now filed and version-pinned: `studio-worker-inspection.md`, version `d910da7c…`, sha256 `bd8bef98…`.
- The effective boundary was also evidenced: a per-Worker Access app (`aud f525eb71…`, matching the live redirect `kid`), created 2026-08-26.
- That also corrected the `cloudflare-access-fleet-lockout` memory, which had called it a "deliberate hostname app".

**Plan changes:**

- Burst 0 becomes a deployment-aware route inventory (build output plus edge routing, with explicit exclusions).
- Burst 3 splits into a build gate and an edge gate; the bearing-table case is the edge gate's acceptance test.
- Burst 8 gains per-repo provenance, deploy-by-mechanism, live verification and a recorded rollback point.
- Studio moves out of the burst order into track S.

**Interpreted, not verified:**

- The review asks to "preserve the earlier registry, ingest-validation and reachability fixes" from a review this session never saw.
- These are read as: the registry (burst 2a), ingest validation (2b) and reachability (2c and the 3a click-depth rule).
- Ingest validation is grounded: `functions/api/ingest.ts:72,92,107` accept free-text `project` (max 80) on all three schemas. Once the content schema validates slugs, an ingest could commit an unknown slug to `main` and break the deploy build.

**Why:** a build-only gate can report complete coverage while a live apex route is invisible to it.

**Reverse:** revision 1 is recoverable from this entry plus the bullets above. It was never committed.
