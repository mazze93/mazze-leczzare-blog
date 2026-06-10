# Constellation Decay — Plan 1: Data Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the data layer for the decaying constellation — schema fields, pure zone-decay math, project-node aggregation, and a static `/nodes-manifest.json` that the homepage canvas and studio will consume.

**Architecture:** The site stays `output: "static"`. A build-time Astro endpoint (`src/pages/nodes-manifest.json.ts`) aggregates blog + signal frontmatter into project nodes and emits a static JSON manifest. Zone is **never stored** — it is a pure function of `now − lastTouched` (+ a `committed` seal), computed by `src/utils/decay.ts`. Consumers (canvas island, studio, project pages) compute zone fresh, so decay advances continuously between deploys with no backend. KV/Durable Objects are deferred to the future "touch-without-deploy" cycle.

**Tech Stack:** Astro 6 (static), TypeScript (strict), Astro content collections, vitest (new dev-only dependency — see Task 1).

**Q4 refinement (flagged for author):** This plan delivers the static-manifest + client-side-zone path rather than a KV-backed Pages Function. Rationale: the repo has no Cloudflare adapter, no wrangler, and no test runner; a KV write-at-deploy step would require CF API secrets and new infra for no v1 benefit, since live decay only needs `now − lastTouched` computed at read time. KV/DO returns when a mutable "touch" action is built. Same decay model, zones, schema, and UX. Veto if the heavier KV path is wanted now.

---

## File Structure

| Action | Path | Responsibility |
| --- | --- | --- |
| Modify | `package.json` | Add `vitest` dev dep + `test` / `test:watch` scripts |
| Create | `vitest.config.ts` | Minimal vitest config (node env, test glob) |
| Modify | `src/content.config.ts` | Add `project` + `committed` to blog **and** signal schemas |
| Create | `src/utils/decay.ts` | Pure zone computation from elapsed time + committed seal |
| Create | `src/utils/decay.test.ts` | Unit tests for decay math |
| Create | `src/utils/nodes.ts` | Pure aggregation: frontmatter entries → project `NodeRecord[]` |
| Create | `src/utils/nodes.test.ts` | Unit tests for aggregation |
| Create | `src/pages/nodes-manifest.json.ts` | Build-time Astro endpoint → static `/nodes-manifest.json` |

`decay.ts` and `nodes.ts` are deliberately pure (no Astro imports) so they are unit-testable and shared by both the build-time endpoint and the future client island.

---

### Task 1: Add vitest tooling

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest as a dev dependency**

Run:
```bash
npm install -D vitest
```
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add test scripts to package.json**

In `package.json`, add to the `"scripts"` object (alongside the existing `check`):
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create the vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Verify the runner starts with no tests yet**

Run: `npm test`
Expected: vitest runs and reports "No test files found" (exit non-zero is fine here — confirms vitest is installed and wired). Proceed to Task 2.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "build: add vitest for decay-logic unit tests"
```

---

### Task 2: Extend content schema with project + committed

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Add fields to the `blog` schema**

In `src/content.config.ts`, inside the `blog` collection's `z.object({ ... })`, add after the existing `draft` field:
```ts
    // ── constellation fields ──
    project: z.string().optional(),    // slug — joins/creates a node (singular for v1)
    committed: z.boolean().optional(), // true → node pinned to signal, immune to decay
```

- [ ] **Step 2: Add the same fields to the `signal` schema**

In the `signal` collection's `z.object({ ... })`, add after its existing `slug` field:
```ts
    // ── constellation fields ──
    project: z.string().optional(),
    committed: z.boolean().optional(),
```

- [ ] **Step 3: Verify the build still passes (no existing post breaks)**

Run: `npm run check`
Expected: PASS — both new fields are optional, so all existing posts remain valid.

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add project + committed constellation fields to content schema"
```

---

### Task 3: Pure zone-decay computation

**Files:**
- Create: `src/utils/decay.ts`
- Test: `src/utils/decay.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/decay.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { computeZone, DRIFT_START_DAYS, ERASURE_DAYS, DAY_MS } from "./decay";

const NOW = Date.UTC(2026, 4, 23); // 2026-05-23

function daysAgo(n: number): number {
  return NOW - n * DAY_MS;
}

describe("computeZone", () => {
  it("pins committed nodes to signal regardless of age", () => {
    const r = computeZone(daysAgo(10_000), true, NOW);
    expect(r.zone).toBe("signal");
    expect(r.driftRatio).toBe(0);
  });

  it("places freshly-touched work in experiment with no drift", () => {
    const r = computeZone(daysAgo(5), false, NOW);
    expect(r.zone).toBe("experiment");
    expect(r.driftRatio).toBe(0);
  });

  it("keeps work in experiment but drifts it within the band", () => {
    const midBand = (DRIFT_START_DAYS + ERASURE_DAYS) / 2; // 105 days
    const r = computeZone(daysAgo(midBand), false, NOW);
    expect(r.zone).toBe("experiment");
    expect(r.driftRatio).toBeGreaterThan(0);
    expect(r.driftRatio).toBeLessThan(1);
    expect(r.driftRatio).toBeCloseTo(0.5, 1);
  });

  it("drops fully-aged work into undefined with max drift", () => {
    const r = computeZone(daysAgo(ERASURE_DAYS + 30), false, NOW);
    expect(r.zone).toBe("undefined");
    expect(r.driftRatio).toBe(1);
  });

  it("treats exactly DRIFT_START_DAYS as the start of drift", () => {
    const r = computeZone(daysAgo(DRIFT_START_DAYS), false, NOW);
    expect(r.zone).toBe("experiment");
    expect(r.driftRatio).toBeCloseTo(0, 5);
  });

  it("reports ageDays for downstream display", () => {
    const r = computeZone(daysAgo(42), false, NOW);
    expect(Math.round(r.ageDays)).toBe(42);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './decay'` (or export errors).

- [ ] **Step 3: Write the implementation**

Create `src/utils/decay.ts`:
```ts
export type Zone = "undefined" | "experiment" | "signal";

export const DAY_MS = 86_400_000;
export const DRIFT_START_DAYS = 30;
export const ERASURE_DAYS = 180;

export interface ZoneState {
  zone: Zone;
  driftRatio: number; // 0 at fresh/sealed, 0→1 across the drift band, 1 at erasure
  ageDays: number;
}

/**
 * Zone is a pure function of recency and the committed seal.
 * Committed work is sealed (signal, never decays). Otherwise:
 *   age < DRIFT_START_DAYS  → experiment, driftRatio 0
 *   drift band              → experiment, driftRatio interpolated 0→1
 *   age >= ERASURE_DAYS      → undefined, driftRatio 1
 */
export function computeZone(
  lastTouchedMs: number,
  committed: boolean,
  nowMs: number,
): ZoneState {
  const ageDays = (nowMs - lastTouchedMs) / DAY_MS;

  if (committed) {
    return { zone: "signal", driftRatio: 0, ageDays };
  }
  if (ageDays < DRIFT_START_DAYS) {
    return { zone: "experiment", driftRatio: 0, ageDays };
  }
  if (ageDays >= ERASURE_DAYS) {
    return { zone: "undefined", driftRatio: 1, ageDays };
  }
  const driftRatio = (ageDays - DRIFT_START_DAYS) / (ERASURE_DAYS - DRIFT_START_DAYS);
  return { zone: "experiment", driftRatio, ageDays };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all 6 `computeZone` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/decay.ts src/utils/decay.test.ts
git commit -m "feat: add pure zone-decay computation with unit tests"
```

---

### Task 4: Pure project-node aggregation

**Files:**
- Create: `src/utils/nodes.ts`
- Test: `src/utils/nodes.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/nodes.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { aggregateNodes, titleize, type RawEntry } from "./nodes";

function entry(
  id: string,
  type: "blog" | "signal",
  data: Partial<RawEntry["data"]> & { title: string; pubDate: Date },
): RawEntry {
  return { id, type, data: { ...data } as RawEntry["data"] };
}

describe("titleize", () => {
  it("converts a slug to title case", () => {
    expect(titleize("merchants-of-war")).toBe("Merchants Of War");
  });
});

describe("aggregateNodes", () => {
  it("ignores entries with no project", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", pubDate: new Date("2026-01-01") }),
    ]);
    expect(nodes).toHaveLength(0);
  });

  it("groups pieces by project slug", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01") }),
      entry("b", "signal", { title: "B", project: "mow", pubDate: new Date("2026-02-01") }),
      entry("c", "blog", { title: "C", project: "sp", pubDate: new Date("2026-01-15") }),
    ]);
    expect(nodes).toHaveLength(2);
    const mow = nodes.find((n) => n.slug === "mow")!;
    expect(mow.count).toBe(2);
  });

  it("uses the max of updatedDate/pubDate across pieces as lastTouched", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01"), updatedDate: new Date("2026-03-10") }),
      entry("b", "blog", { title: "B", project: "mow", pubDate: new Date("2026-02-01") }),
    ]);
    expect(nodes[0].lastTouched).toBe(new Date("2026-03-10").toISOString());
  });

  it("prefers updatedDate over pubDate for a single piece", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01"), updatedDate: new Date("2026-04-01") }),
    ]);
    expect(nodes[0].lastTouched).toBe(new Date("2026-04-01").toISOString());
  });

  it("seals the node if any piece is committed", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01") }),
      entry("b", "blog", { title: "B", project: "mow", pubDate: new Date("2026-02-01"), committed: true }),
    ]);
    expect(nodes[0].committed).toBe(true);
  });

  it("lists pieces newest-first", () => {
    const nodes = aggregateNodes([
      entry("old", "blog", { title: "Old", project: "mow", pubDate: new Date("2026-01-01") }),
      entry("new", "blog", { title: "New", project: "mow", pubDate: new Date("2026-05-01") }),
    ]);
    expect(nodes[0].pieces.map((p) => p.id)).toEqual(["new", "old"]);
  });

  it("derives a titleized display name from the slug", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "merchants-of-war", pubDate: new Date("2026-01-01") }),
    ]);
    expect(nodes[0].title).toBe("Merchants Of War");
  });

  it("sorts nodes by lastTouched, newest-first", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "stale", pubDate: new Date("2026-01-01") }),
      entry("b", "blog", { title: "B", project: "fresh", pubDate: new Date("2026-05-01") }),
    ]);
    expect(nodes.map((n) => n.slug)).toEqual(["fresh", "stale"]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './nodes'`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/nodes.ts`:
```ts
export interface RawEntry {
  id: string;
  type: "blog" | "signal";
  data: {
    title: string;
    project?: string;
    committed?: boolean;
    pubDate: Date;
    updatedDate?: Date;
  };
}

export interface PieceRef {
  id: string;
  title: string;
  type: "blog" | "signal";
  pubDate: string; // ISO
}

export interface NodeRecord {
  slug: string;
  title: string;       // titleized slug (display name)
  lastTouched: string; // ISO — max(updatedDate ?? pubDate) across pieces
  committed: boolean;  // true if any piece is committed
  count: number;
  pieces: PieceRef[];  // newest-first
}

export function titleize(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function touchedAt(data: RawEntry["data"]): number {
  return (data.updatedDate ?? data.pubDate).getTime();
}

export function aggregateNodes(entries: RawEntry[]): NodeRecord[] {
  const groups = new Map<string, RawEntry[]>();
  for (const e of entries) {
    const slug = e.data.project;
    if (!slug) continue;
    const list = groups.get(slug);
    if (list) list.push(e);
    else groups.set(slug, [e]);
  }

  const nodes: NodeRecord[] = [];
  for (const [slug, group] of groups) {
    const sorted = [...group].sort(
      (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
    );
    const lastTouchedMs = Math.max(...group.map((e) => touchedAt(e.data)));
    nodes.push({
      slug,
      title: titleize(slug),
      lastTouched: new Date(lastTouchedMs).toISOString(),
      committed: group.some((e) => e.data.committed === true),
      count: group.length,
      pieces: sorted.map((e) => ({
        id: e.id,
        title: e.data.title,
        type: e.type,
        pubDate: e.data.pubDate.toISOString(),
      })),
    });
  }

  nodes.sort(
    (a, b) => new Date(b.lastTouched).getTime() - new Date(a.lastTouched).getTime(),
  );
  return nodes;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all `titleize` + `aggregateNodes` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/nodes.ts src/utils/nodes.test.ts
git commit -m "feat: add project-node aggregation from frontmatter with unit tests"
```

---

### Task 5: Static nodes manifest endpoint

**Files:**
- Create: `src/pages/nodes-manifest.json.ts`

- [ ] **Step 1: Write the endpoint**

Create `src/pages/nodes-manifest.json.ts`:
```ts
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { aggregateNodes, type RawEntry } from "../utils/nodes";

export const GET: APIRoute = async () => {
  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const signal = await getCollection("signal", ({ data }) => !data.draft);

  const entries: RawEntry[] = [
    ...blog.map((e) => ({ id: e.id, type: "blog" as const, data: e.data })),
    ...signal.map((e) => ({ id: e.id, type: "signal" as const, data: e.data })),
  ];

  const nodes = aggregateNodes(entries);
  const body = JSON.stringify({
    generatedAt: new Date().toISOString(),
    nodes,
  });

  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
```

- [ ] **Step 2: Build and verify the manifest is emitted as a static file**

Run: `npm run build`
Expected: PASS. The build output contains `dist/nodes-manifest.json`.

Verify with:
```bash
test -f dist/nodes-manifest.json && echo "MANIFEST OK"
```
Expected: prints `MANIFEST OK`.

- [ ] **Step 3: Sanity-check the manifest shape**

Run:
```bash
node -e "const m=require('./dist/nodes-manifest.json'); console.log('nodes:', m.nodes.length); console.log(JSON.stringify(m.nodes[0] ?? 'none', null, 2));"
```
Expected: prints a node count. (It may be `0` / `none` until posts are tagged with `project:` — that is expected at this stage and not a failure. Tagging existing content happens in Plan 2 or as a content task.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/nodes-manifest.json.ts
git commit -m "feat: emit static nodes-manifest.json from content frontmatter"
```

---

## Self-Review

**Spec coverage (this plan's slice — the data layer):**
- Schema extension (`project`, `committed`, singular) → Task 2 ✓
- Zone model (recency + committed pin, drift band, thresholds 30/180) → Task 3 ✓
- "Zone never authored, always derived" → no `zone` field added; `computeZone` is the only source ✓
- `lastTouched` = max(updatedDate ?? pubDate) across pieces → Task 4 ✓
- Node shape (slug, title, lastTouched, committed, count, pieces) → Task 4 `NodeRecord` ✓
- Manifest data delivery (Q4 refinement: static manifest, not KV Function) → Task 5 ✓
- Draft exclusion (`!data.draft`) consistent with existing `/blog` index → Task 5 ✓

**Deferred to later plans (not gaps in this plan):**
- Homepage canvas node layer + client-side zone computation → Plan 2 (will import `computeZone` from `decay.ts`).
- `/project/[slug]` pages and `/studio` → Plan 3.
- Mobile interaction strategy → Plan 2.
- Tagging existing posts with `project:` → a content task in Plan 2.

**Placeholder scan:** none — every step has concrete code or an exact command.

**Type consistency:** `Zone` defined in `decay.ts` and reused conceptually by `nodes.ts` (no duplicate). `RawEntry`, `NodeRecord`, `PieceRef` are defined once in `nodes.ts` and referenced by tests and the endpoint with matching shapes. `computeZone` signature `(lastTouchedMs, committed, nowMs)` is stable for Plan 2's consumer.

---

## Verification (end of Plan 1)

| Check | Command | Threshold |
| --- | --- | --- |
| Unit tests | `npm test` | all green |
| Type + build | `npm run check` | passes |
| Manifest emitted | `test -f dist/nodes-manifest.json` | file exists |
