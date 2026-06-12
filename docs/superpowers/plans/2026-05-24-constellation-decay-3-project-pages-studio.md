# Constellation Decay — Plan 3: Project Pages + Studio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the destinations the constellation nodes link to — a static `/project/[slug]/` page per project (zone-tinted reading register) — and a public read-only `/studio/` worklist that shows every project sorted by activity with its proximity-to-decay.

**Architecture:** Both are static Astro pages computed at build time. They reuse Plan 1's pure functions (`aggregateNodes`, `computeZone`) plus a new shared `collectAllNodes()` helper (extracted from the manifest endpoint to keep one source of truth) and a new pure `decayStatus()` string helper. Zone on these pages is build-time (as of last deploy) — the live drift lives on the homepage canvas, by design.

**Tech Stack:** Astro 6 (static), TypeScript, vitest. Depends on Plans 1 + 2 merged.

**Scope decision (flagged):** This builds `/studio/` as a **same-site subpage** (a read-only lens on the same node data) — matching the original "subpage" framing and avoiding a second app. The separate `studio.mazzeleczzare.com` deployment, its KV/DO state, Astro Actions, and the "push-to-front" pipeline are **deferred** pending two unresolved decisions: (1) subdomain vs. subpage, (2) the push-to-front mechanism. See the session tessera for the full studio-deployment critique.

---

## File Structure

| Action | Path | Responsibility |
| --- | --- | --- |
| Create | `src/utils/collectNodes.ts` | Async: read blog+signal collections (`!draft`) → `NodeRecord[]` (one source of truth) |
| Modify | `src/pages/nodes-manifest.json.ts` | Use `collectAllNodes()` instead of inline aggregation |
| Modify | `src/utils/decay.ts` | Add pure `decayStatus(state, committed)` string helper |
| Modify | `src/utils/decay.test.ts` | Tests for `decayStatus` |
| Create | `src/pages/project/[slug].astro` | Static project page; zone-tinted; lists the project's pieces |
| Create | `src/pages/studio.astro` | Read-only worklist of all projects, sorted by activity |
| Create | `src/styles/constellation-pages.css` | Shared zone-register styling for project + studio pages |

---

### Task 1: Extract `collectAllNodes()` (DRY)

**Files:**
- Create: `src/utils/collectNodes.ts`
- Modify: `src/pages/nodes-manifest.json.ts`

- [ ] **Step 1: Create the shared collector**

Create `src/utils/collectNodes.ts`:
```ts
import { getCollection } from "astro:content";
import { aggregateNodes, type RawEntry, type NodeRecord } from "./nodes";

/** Single source of truth: aggregate blog + signal frontmatter into project nodes. */
export async function collectAllNodes(): Promise<NodeRecord[]> {
  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const signal = await getCollection("signal", ({ data }) => !data.draft);

  const entries: RawEntry[] = [
    ...blog.map((e) => ({ id: e.id, type: "blog" as const, data: e.data })),
    ...signal.map((e) => ({ id: e.id, type: "signal" as const, data: e.data })),
  ];
  return aggregateNodes(entries);
}
```

- [ ] **Step 2: Refactor the manifest endpoint to use it**

In `src/pages/nodes-manifest.json.ts`, replace the body so it imports and calls `collectAllNodes()`:
```ts
import type { APIRoute } from "astro";
import { collectAllNodes } from "../utils/collectNodes";

export const GET: APIRoute = async () => {
  const nodes = await collectAllNodes();
  const generatedAt = nodes.length > 0 ? nodes[0].lastTouched : null;
  const body = JSON.stringify({ generatedAt, nodes });
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
```

- [ ] **Step 3: Verify the manifest is byte-identical to before**

Run: `npm run build >/dev/null 2>&1 && cat dist/nodes-manifest.json`
Expected: same shape and same 2 demo nodes as before the refactor (`secure-pride`, `static-first`). Build passes.

- [ ] **Step 4: Commit**

```bash
git add src/utils/collectNodes.ts src/pages/nodes-manifest.json.ts
git commit -m "refactor: extract collectAllNodes as the single node-aggregation source"
```

---

### Task 2: `decayStatus()` pure helper

**Files:**
- Modify: `src/utils/decay.ts`
- Modify: `src/utils/decay.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to the existing `describe("computeZone", ...)` block's file in `src/utils/decay.test.ts` (add a new describe at the end of the file):
```ts
import { decayStatus } from "./decay";

describe("decayStatus", () => {
  const NOW2 = Date.UTC(2026, 4, 23);
  const at = (days: number) => computeZone(NOW2 - days * DAY_MS, false, NOW2);

  it("reports sealed for committed projects", () => {
    const state = computeZone(NOW2 - 9999 * DAY_MS, true, NOW2);
    expect(decayStatus(state, true)).toBe("sealed");
  });
  it("counts down days until drift while fresh", () => {
    expect(decayStatus(at(10), false)).toBe("20 days until drift");
  });
  it("reports days into drift within the band", () => {
    expect(decayStatus(at(60), false)).toBe("30 days into drift");
  });
  it("reports erasure once fully aged", () => {
    expect(decayStatus(at(ERASURE_DAYS + 5), false)).toBe("in erasure");
  });
});
```
(`computeZone`, `DAY_MS`, `ERASURE_DAYS` are already imported at the top of this test file from Plan 1; add `decayStatus` to that import or import separately as shown.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `decayStatus` is not exported.

- [ ] **Step 3: Implement**

Append to `src/utils/decay.ts`:
```ts
/** Human-readable decay state for studio/project display. Pure. */
export function decayStatus(state: ZoneState, committed: boolean): string {
  if (committed) return "sealed";
  if (state.zone === "undefined") return "in erasure";
  if (state.ageDays < DRIFT_START_DAYS) {
    return `${Math.ceil(DRIFT_START_DAYS - state.ageDays)} days until drift`;
  }
  return `${Math.floor(state.ageDays - DRIFT_START_DAYS)} days into drift`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all decay tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/decay.ts src/utils/decay.test.ts
git commit -m "feat: add decayStatus helper for studio/project display with tests"
```

---

### Task 3: Project pages `/project/[slug]/`

**Files:**
- Create: `src/styles/constellation-pages.css`
- Create: `src/pages/project/[slug].astro`

- [ ] **Step 1: Create the shared page styling**

Create `src/styles/constellation-pages.css`:
```css
.cn-page { max-width: 760px; width: calc(100% - 2rem); margin: 0 auto; padding: 4em 1rem 5em; }
.cn-page__label { font-family: var(--font-mono); font-size: 0.68em; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-faint); margin: 0 0 0.5em; }
.cn-page__title { font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 300; color: var(--text); margin: 0 0 0.3em; line-height: 1.05; }
.cn-zone-badge { display: inline-block; font-family: var(--font-mono); font-size: 0.65em; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2em 0.6em; border-radius: var(--radius-sm); border: 1px solid currentColor; }
.cn-zone-badge[data-zone="experiment"] { color: #2bd3c6; }
.cn-zone-badge[data-zone="signal"]     { color: #f4a261; }
.cn-zone-badge[data-zone="undefined"]  { color: var(--text-faint); }

.cn-pieces { list-style: none; margin: 2.5em 0 0; padding: 0; }
.cn-piece { border-bottom: 1px solid var(--rule); }
.cn-piece a { display: flex; align-items: baseline; gap: 1em; padding: 1em 0; text-decoration: none; }
.cn-piece a:hover .cn-piece__title { color: var(--teal); }
.cn-piece__type { font-family: var(--font-mono); font-size: 0.65em; text-transform: uppercase; color: var(--text-faint); width: 4em; flex-shrink: 0; }
.cn-piece__title { font-family: var(--font-display); font-size: 1.15em; color: var(--text); transition: color var(--transition-fast); }

/* Zone reading register: erasure pages read faded (but still WCAG AA). */
.cn-page[data-zone="undefined"] { opacity: 0.82; filter: grayscale(0.25); }
.cn-page[data-zone="signal"] .cn-page__title { letter-spacing: 0.01em; }
```

- [ ] **Step 2: Create the project page**

Create `src/pages/project/[slug].astro`:
```astro
---
import type { GetStaticPaths } from "astro";
import BaseHead from "../../components/BaseHead.astro";
import Header from "../../components/Header.astro";
import Footer from "../../components/Footer.astro";
import { collectAllNodes } from "../../utils/collectNodes";
import { computeZone, decayStatus } from "../../utils/decay";
import "../../styles/constellation-pages.css";

export const getStaticPaths: GetStaticPaths = async () => {
  const nodes = await collectAllNodes();
  return nodes.map((node) => ({ params: { slug: node.slug }, props: { node } }));
};

const { node } = Astro.props;
const state = computeZone(new Date(node.lastTouched).getTime(), node.committed, Date.now());
const status = decayStatus(state, node.committed);
---
<!doctype html>
<html lang="en">
<head>
  <BaseHead title={`${node.title} — Project`} description={`Pieces in the ${node.title} project.`} />
</head>
<body>
  <Header />
  <main class="cn-page" data-zone={state.zone}>
    <p class="cn-page__label">Project · <span class="cn-zone-badge" data-zone={state.zone}>{state.zone}</span> · {status}</p>
    <h1 class="cn-page__title">{node.title}</h1>
    <ul class="cn-pieces" role="list">
      {node.pieces.map((p) => (
        <li class="cn-piece">
          <a href={`/${p.type}/${p.id}/`}>
            <span class="cn-piece__type">{p.type}</span>
            <span class="cn-piece__title">{p.title}</span>
          </a>
        </li>
      ))}
    </ul>
  </main>
  <Footer />
</body>
</html>
```

- [ ] **Step 3: Build and verify the routes exist**

Run:
```bash
npm run build >/dev/null 2>&1 && ls dist/project/
```
Expected: directories for each tagged slug (e.g., `secure-pride/`, `static-first/`), each with `index.html`. The homepage node links (`/project/{slug}/`) now resolve.

- [ ] **Step 4: Commit**

```bash
git add src/styles/constellation-pages.css src/pages/project/\[slug\].astro
git commit -m "feat: add zone-tinted /project/[slug] pages"
```

---

### Task 4: Studio worklist `/studio/`

**Files:**
- Create: `src/pages/studio.astro`

- [ ] **Step 1: Create the studio page**

Create `src/pages/studio.astro`:
```astro
---
import BaseHead from "../components/BaseHead.astro";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import { collectAllNodes } from "../utils/collectNodes";
import { computeZone, decayStatus } from "../utils/decay";
import "../styles/constellation-pages.css";

const nodes = await collectAllNodes(); // already sorted by lastTouched desc
const rows = nodes.map((node) => {
  const state = computeZone(new Date(node.lastTouched).getTime(), node.committed, Date.now());
  return { node, zone: state.zone, status: decayStatus(state, node.committed) };
});
const fmt = (iso: string) => new Date(iso).toISOString().slice(0, 10);
---
<!doctype html>
<html lang="en">
<head>
  <BaseHead title="Studio — the bench" description="Every project, sorted by activity, with its proximity to decay." />
</head>
<body>
  <Header />
  <main class="cn-page">
    <p class="cn-page__label">Studio</p>
    <h1 class="cn-page__title">The bench</h1>
    <ul class="cn-pieces" role="list">
      {rows.map(({ node, zone, status }) => (
        <li class="cn-piece">
          <a href={`/project/${node.slug}/`}>
            <span class="cn-zone-badge" data-zone={zone}>{zone}</span>
            <span class="cn-piece__title">{node.title}</span>
            <span class="cn-piece__type">{node.count} · {fmt(node.lastTouched)} · {status}</span>
          </a>
        </li>
      ))}
    </ul>
  </main>
  <Footer />
</body>
</html>
```

- [ ] **Step 2: Build and verify**

Run:
```bash
npm run build >/dev/null 2>&1 && test -f dist/studio/index.html && echo "STUDIO OK"
```
Expected: prints `STUDIO OK`. Open `/studio/` in `npm run dev` and confirm each project shows zone badge, count, date, and a status string ("sealed" / "N days until drift" / "in erasure").

- [ ] **Step 3: Commit**

```bash
git add src/pages/studio.astro
git commit -m "feat: add read-only /studio worklist sorted by activity"
```

---

## Self-Review

**Spec coverage (Plan 3 slice):**
- `/project/[slug]` static pages, zone-tinted register, real piece links → Task 3 ✓
- `/studio` read-only worklist, activity-sorted, proximity-to-decay → Task 4 ✓
- Build-time zone on these pages (live drift stays on canvas) → computeZone called at build ✓
- DRY single aggregation source → Task 1 `collectAllNodes` ✓
- Studio as same-site subpage; backend-studio-app/KV/DO/push-pipeline deferred → noted in scope decision ✓

**Placeholder scan:** none — every step has concrete code or an exact command.

**Type consistency:** `collectAllNodes(): Promise<NodeRecord[]>` reuses `RawEntry`/`NodeRecord` from `nodes.ts`. `decayStatus(state: ZoneState, committed: boolean)` matches `computeZone`'s `ZoneState` return. Piece links use `PieceRef.type` + `.id` → `/${type}/${id}/`, consistent with blog/signal routes.

---

## Verification (end of Plan 3)

| Check | Command | Threshold |
| --- | --- | --- |
| Unit tests | `npm test` | all green (Plans 1–2 + decayStatus) |
| Type + build | `npm run check` | passes |
| Project routes | `ls dist/project/` | one dir per tagged slug |
| Studio route | `test -f dist/studio/index.html` | exists |
| Manifest unchanged | `cat dist/nodes-manifest.json` | same nodes as before Task 1 |
| Visual | `npm run dev` → `/studio/`, `/project/<slug>/` | zone tinting + status strings correct |
