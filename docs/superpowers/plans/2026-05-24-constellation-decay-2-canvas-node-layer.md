# Constellation Decay — Plan 2: Homepage Canvas Node Layer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render an accessible, interactive layer of project-nodes over the existing BreathingHero on the homepage. Each node is fetched from `/nodes-manifest.json`, has its zone computed client-side via `computeZone` (from Plan 1), is positioned by zone, and links to `/project/{slug}/`.

**Architecture:** Progressive enhancement. The BreathingHero (decorative canvas + headline + CTAs) is unchanged and remains the no-JS fallback. A new `ConstellationNodes.astro` component renders an empty container inside the hero; a client script fills it with `<a>` nodes after fetching the manifest. Pure positioning/visual math lives in `src/utils/layout.ts` (unit-tested); the DOM wiring is a thin vanilla `<script>` matching the BreathingHero's existing style (no React island — consistent with the canvas, zero hydration cost). On mobile the overlay degrades to a legible, tappable list pinned to the bottom of the hero.

**Tech Stack:** Astro 6 (static), TypeScript, vanilla client `<script>` (Astro-bundled), vitest. Reuses `computeZone` from `src/utils/decay.ts` and the manifest from `src/pages/nodes-manifest.json.ts` (both built in Plan 1).

**Prerequisite:** Plan 1 merged into this branch (`feat/constellation-decay`). `src/utils/decay.ts` exports `computeZone(lastTouchedMs, committed, nowMs) → { zone, driftRatio, ageDays }` and `Zone`.

---

## File Structure

| Action | Path | Responsibility |
| --- | --- | --- |
| Create | `src/utils/layout.ts` | Pure: deterministic seed, zone→position, zone+drift→visual style |
| Create | `src/utils/layout.test.ts` | Unit tests for layout math |
| Create | `src/components/constellation/ConstellationNodes.astro` | Container + scoped styles + client script that fetches manifest and injects nodes |
| Modify | `src/components/BreathingHero.astro` | Import + render `<ConstellationNodes />` inside the hero `<section>` |
| Modify | 2–3 posts in `src/content/blog/*` | Demo `project:` tags so the layer has something to render (smoke test) |

`layout.ts` is pure (no DOM, no Astro) so it is unit-testable and shares the same discipline as Plan 1's `decay.ts`/`nodes.ts`.

---

### Task 1: Pure layout helpers

**Files:**
- Create: `src/utils/layout.ts`
- Test: `src/utils/layout.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/layout.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { seededUnit, nodePosition, nodeStyle } from "./layout";

describe("seededUnit", () => {
  it("is deterministic for the same slug", () => {
    expect(seededUnit("merchants-of-war")).toBe(seededUnit("merchants-of-war"));
  });
  it("returns a value in [0, 1)", () => {
    for (const s of ["a", "secure-pride", "x-y-z", ""]) {
      const u = seededUnit(s);
      expect(u).toBeGreaterThanOrEqual(0);
      expect(u).toBeLessThan(1);
    }
  });
  it("differs across different slugs", () => {
    expect(seededUnit("alpha")).not.toBe(seededUnit("beta"));
  });
});

describe("nodePosition", () => {
  it("places signal nodes in the right band (>=78%)", () => {
    const p = nodePosition("signal", 0, "x");
    expect(p.xPct).toBeGreaterThanOrEqual(78);
    expect(p.xPct).toBeLessThanOrEqual(92);
  });
  it("places undefined nodes in the left band (<=22%)", () => {
    const p = nodePosition("undefined", 1, "x");
    expect(p.xPct).toBeGreaterThanOrEqual(6);
    expect(p.xPct).toBeLessThanOrEqual(22);
  });
  it("places fresh experiment nodes in the center band", () => {
    const p = nodePosition("experiment", 0, "x");
    expect(p.xPct).toBeGreaterThanOrEqual(40);
    expect(p.xPct).toBeLessThanOrEqual(66);
  });
  it("pulls a drifting experiment node leftward as driftRatio rises", () => {
    const fresh = nodePosition("experiment", 0, "samekey");
    const drifted = nodePosition("experiment", 1, "samekey");
    expect(drifted.xPct).toBeLessThan(fresh.xPct);
  });
  it("keeps yPct within 12–88%", () => {
    const p = nodePosition("experiment", 0, "anything");
    expect(p.yPct).toBeGreaterThanOrEqual(12);
    expect(p.yPct).toBeLessThanOrEqual(88);
  });
});

describe("nodeStyle", () => {
  it("renders signal at full intensity", () => {
    expect(nodeStyle("signal", 0)).toEqual({ opacity: 1, scale: 1 });
  });
  it("dims an experiment node as it drifts", () => {
    expect(nodeStyle("experiment", 1).opacity).toBeLessThan(nodeStyle("experiment", 0).opacity);
  });
  it("renders undefined faded and smaller", () => {
    const s = nodeStyle("undefined", 1);
    expect(s.opacity).toBeLessThan(0.5);
    expect(s.scale).toBeLessThan(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module './layout'`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/layout.ts`:
```ts
import type { Zone } from "./decay";

/** Deterministic 0..1 from a string (FNV-1a). Stable across renders for a given slug. */
export function seededUnit(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export interface NodePos {
  xPct: number;
  yPct: number;
}

/**
 * Horizontal band per zone (percent of hero width); vertical from a second seed.
 * A drifting experiment node is pulled leftward toward the undefined band as
 * driftRatio → 1, so aging is visible as migration, not a snap between zones.
 */
export function nodePosition(zone: Zone, driftRatio: number, slug: string): NodePos {
  const u = seededUnit(slug);
  const v = seededUnit(slug + "::y");
  let xPct: number;
  if (zone === "signal") {
    xPct = 78 + u * 14; // 78–92
  } else if (zone === "undefined") {
    xPct = 6 + u * 16; // 6–22
  } else {
    const base = 40 + u * 26; // 40–66
    const pulled = base - driftRatio * (base - 24); // toward ~24 at full drift
    xPct = pulled;
  }
  const yPct = 12 + v * 76; // 12–88
  return { xPct, yPct };
}

export interface NodeStyleOut {
  opacity: number;
  scale: number;
}

/** Visual intensity: signal full, experiment dims with drift, undefined faded. */
export function nodeStyle(zone: Zone, driftRatio: number): NodeStyleOut {
  if (zone === "signal") return { opacity: 1, scale: 1 };
  if (zone === "undefined") return { opacity: 0.42, scale: 0.82 };
  return { opacity: 1 - driftRatio * 0.45, scale: 1 - driftRatio * 0.12 };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all `layout` tests green (plus Plan 1's existing tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/layout.ts src/utils/layout.test.ts
git commit -m "feat: add pure node-layout helpers (position + visual style) with tests"
```

---

### Task 2: ConstellationNodes component

**Files:**
- Create: `src/components/constellation/ConstellationNodes.astro`

- [ ] **Step 1: Write the component**

Create `src/components/constellation/ConstellationNodes.astro`:
```astro
---
// Interactive project-node layer over the BreathingHero.
// Progressive enhancement: the server renders an empty, inert container.
// The client script fills it from /nodes-manifest.json and upgrades it to a
// navigation landmark. No-JS users keep the hero headline + CTAs beneath.
---
<div class="constellation-nodes" data-constellation></div>

<style>
  .constellation-nodes {
    position: absolute;
    inset: 0;
    z-index: 5; /* above the canvas (auto), below hero content (z-index 10) */
    pointer-events: none; /* container is transparent to input; links re-enable */
  }

  .cn-node {
    position: absolute;
    left: var(--x);
    top: var(--y);
    transform: translate(-50%, -50%) scale(var(--scale, 1));
    opacity: var(--opacity, 1);
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 44px;
    min-height: 44px;
    padding: 0.4rem 0.5rem;
    border-radius: 999px;
    text-decoration: none;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  .cn-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--zone-color);
    box-shadow: 0 0 12px 2px var(--zone-color);
  }

  .cn-node[data-zone="experiment"] { --zone-color: #2bd3c6; }
  .cn-node[data-zone="signal"]     { --zone-color: #f4a261; }
  .cn-node[data-zone="undefined"]  { --zone-color: rgba(242, 244, 248, 0.7); }

  .cn-label {
    font-family: var(--font-mono, monospace);
    font-size: 0.72rem;
    letter-spacing: 0.03em;
    color: #f2f4f8;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    text-shadow: 0 0 8px rgba(0, 0, 0, 0.85);
  }

  .cn-node:hover .cn-label,
  .cn-node:focus-visible .cn-label {
    opacity: 1;
    transform: none;
  }

  .cn-node:focus-visible {
    outline: 2px solid #f4d29a;
    outline-offset: 3px;
  }

  /* Entry stagger only when JS-enhanced AND motion is allowed */
  .constellation-nodes[data-animate="true"] .cn-node {
    animation: cnFadeIn 0.6s ease-out both;
    animation-delay: var(--delay, 0ms);
  }

  @keyframes cnFadeIn {
    from { opacity: 0; }
    to   { opacity: var(--opacity, 1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .constellation-nodes[data-animate] .cn-node { animation: none; }
    .cn-node { transition: none; }
  }

  /* Mobile: degrade the overlay to a legible, tappable list pinned to the
     bottom of the hero — does not fight the vertically-centered headline. */
  @media (max-width: 768px) {
    .constellation-nodes {
      position: absolute;
      inset: auto 0 0 0;
      max-height: 42vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem;
      z-index: 11;
      pointer-events: auto;
      background: linear-gradient(to top, rgba(11, 13, 18, 0.94), rgba(11, 13, 18, 0));
    }
    .cn-node {
      position: static;
      transform: none;
      opacity: 1;
      justify-content: flex-start;
    }
    .cn-label { opacity: 1; transform: none; }
    .cn-node[data-zone="signal"]     { order: 1; }
    .cn-node[data-zone="experiment"] { order: 2; }
    .cn-node[data-zone="undefined"]  { order: 3; }
  }
</style>

<script>
  import { computeZone } from "../../utils/decay";
  import { nodePosition, nodeStyle } from "../../utils/layout";

  interface ManifestNode {
    slug: string;
    title: string;
    lastTouched: string;
    committed: boolean;
    count: number;
    pieces: { id: string; title: string; type: string; pubDate: string }[];
  }

  async function initConstellation() {
    const root = document.querySelector<HTMLElement>("[data-constellation]");
    if (!root) return;

    let data: { nodes: ManifestNode[] };
    try {
      const res = await fetch("/nodes-manifest.json");
      if (!res.ok) return;
      data = await res.json();
    } catch {
      return; // network failure → hero CTAs remain the fallback
    }
    if (!data.nodes || data.nodes.length === 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const now = Date.now();
    const frag = document.createDocumentFragment();

    for (const node of data.nodes) {
      const { zone, driftRatio } = computeZone(
        new Date(node.lastTouched).getTime(),
        node.committed,
        now,
      );
      const { xPct, yPct } = nodePosition(zone, driftRatio, node.slug);
      const { opacity, scale } = nodeStyle(zone, driftRatio);

      const a = document.createElement("a");
      a.className = "cn-node";
      a.href = `/project/${node.slug}/`;
      a.dataset.zone = zone;
      const pieceWord = node.count === 1 ? "piece" : "pieces";
      a.setAttribute("aria-label", `${node.title} — ${zone} zone, ${node.count} ${pieceWord}`);
      a.style.setProperty("--x", `${xPct}%`);
      a.style.setProperty("--y", `${yPct}%`);
      a.style.setProperty("--opacity", String(opacity));
      a.style.setProperty("--scale", String(scale));
      if (!reduced) a.style.setProperty("--delay", `${Math.random() * 600}ms`);

      const dot = document.createElement("span");
      dot.className = "cn-dot";
      dot.setAttribute("aria-hidden", "true");

      const label = document.createElement("span");
      label.className = "cn-label";
      label.textContent = node.title;

      a.append(dot, label);
      frag.appendChild(a);
    }

    root.replaceChildren(frag);
    root.setAttribute("role", "navigation");
    root.setAttribute("aria-label", "Project constellation");
    if (!reduced) root.dataset.animate = "true";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initConstellation);
  } else {
    initConstellation();
  }
</script>
```

- [ ] **Step 2: Verify it type-checks and builds in isolation**

Run: `npm run check`
Expected: PASS. (The component isn't mounted yet — this just confirms the script's imports of `computeZone`/`layout` resolve and the file compiles.)

- [ ] **Step 3: Commit**

```bash
git add src/components/constellation/ConstellationNodes.astro
git commit -m "feat: add ConstellationNodes layer (manifest fetch + accessible nodes)"
```

---

### Task 3: Mount the layer in the hero

**Files:**
- Modify: `src/components/BreathingHero.astro`

- [ ] **Step 1: Import the component**

In `src/components/BreathingHero.astro`, the file begins with a frontmatter fence that currently contains only a comment block. Replace the closing `---` of that frontmatter so the import is inside the fence. Concretely, change the top of the file from:
```astro
---
/**
 * BreathingHero.astro
 ... (existing comment) ...
 */
---
```
to:
```astro
---
/**
 * BreathingHero.astro
 ... (existing comment) ...
 */
import ConstellationNodes from "./constellation/ConstellationNodes.astro";
---
```
(Keep the entire existing comment block; only add the `import` line before the closing `---`.)

- [ ] **Step 2: Render the layer inside the hero section**

In the same file, the markup is:
```astro
<section class="breathing-hero" aria-label="Site introduction">
  <canvas class="breathing-hero__canvas" aria-hidden="true"></canvas>
  <div class="breathing-hero__content">
    ...
  </div>
</section>
```
Add `<ConstellationNodes />` immediately after the closing `</div>` of `.breathing-hero__content` and before `</section>`:
```astro
    </div>
    <ConstellationNodes />
  </section>
```
The `.breathing-hero` is already `position: relative`, so the layer's `position: absolute; inset: 0` anchors to it. The canvas has no `z-index` (paints below the layer's `z-index: 5`); `.breathing-hero__content` is `z-index: 10` (stays above the layer on desktop).

- [ ] **Step 3: Build and verify no errors**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Verify the static HTML still ships the hero + CTAs (no-JS fallback intact)**

Run:
```bash
npm run build >/dev/null 2>&1 && grep -c "breathing-hero__cta" dist/index.html
```
Expected: prints a count `>= 1` — the CTAs are present in the static HTML, confirming the no-JS fallback survives. The node `<a>` elements will NOT be in the static HTML (they are injected client-side) — that is correct.

- [ ] **Step 5: Commit**

```bash
git add src/components/BreathingHero.astro
git commit -m "feat: mount constellation node layer over the breathing hero"
```

---

### Task 4: Demo content + manual smoke test

This task tags real posts so the layer renders, then verifies behavior in a browser. Tagging is a demo for verification — the author will set the true `project`/`committed` values later.

**Files:**
- Modify: 2–3 existing files in `src/content/blog/`

- [ ] **Step 1: Identify candidate posts**

Run:
```bash
ls src/content/blog/
```
Pick 3 existing posts. Choose ones with different `pubDate`/`updatedDate` ages if possible so multiple zones appear.

- [ ] **Step 2: Add demo project tags to their frontmatter**

In each chosen post's frontmatter, add a `project:` line. Use a shared slug for at least two so a multi-piece node appears. Example (adapt slugs to real content themes):
```yaml
project: field-notes
```
On ONE post, additionally add:
```yaml
committed: true
```
so a sealed (signal-zone) node is visible. Do not change any other frontmatter.

- [ ] **Step 3: Rebuild the manifest and confirm nodes appear**

Run:
```bash
npm run build >/dev/null 2>&1 && node --input-type=module -e "import('node:fs').then(fs => { const m = JSON.parse(fs.readFileSync('dist/nodes-manifest.json','utf8')); console.log('node count:', m.nodes.length); for (const n of m.nodes) console.log('-', n.slug, '| committed:', n.committed, '| pieces:', n.count); });"
```
Expected: prints `node count: >= 1` and lists the tagged projects, with the committed one flagged `true`.

- [ ] **Step 4: Manual browser smoke test**

Run: `npm run dev`
Then in a browser at the dev URL (default `http://localhost:4321/`):
- [ ] The BreathingHero canvas still animates and the headline/CTAs are visible.
- [ ] Project-node dots appear over the field; the sealed/committed project sits on the right (signal), recently-touched in the center (experiment).
- [ ] Hovering a node reveals its label; the dot glows in its zone color (teal/amber/faint-white).
- [ ] Tab key moves focus through the nodes with a visible gold focus ring; each node is ≥44px tappable; Enter navigates to `/project/{slug}/` (this route 404s until Plan 3 — that is expected).
- [ ] Resize to ≤768px wide: nodes collapse into a tappable list pinned to the bottom of the hero, ordered signal → experiment → undefined, all labels visible.
- [ ] Enable OS "reduce motion" and reload: nodes appear without the fade-in stagger; the canvas hides itself (existing behavior); nodes remain navigable.

- [ ] **Step 5: Commit the demo tags**

```bash
git add src/content/blog/<the-files-you-edited>
git commit -m "content: add demo project tags to exercise the constellation layer"
```

---

## Self-Review

**Spec coverage (Plan 2 slice — the navigable canvas):**
- Homepage hero is the navigable surface; BreathingHero unchanged → Task 3 (mount, canvas + CTAs preserved) ✓
- Nodes are real DOM `<a>` over the canvas, not painted on it → Task 2 ✓
- Zone computed client-side from `computeZone` (live decay as `now` advances) → Task 2 script ✓
- Positioned by zone band + seeded jitter; drift pulls leftward → Tasks 1 + 2 ✓
- Visual reflects zone + driftRatio (opacity/scale/color) → `nodeStyle` + CSS ✓
- Accessibility: real links, descriptive `aria-label`, tab order, visible focus, 44px targets → Task 2 ✓
- `prefers-reduced-motion`: no entry animation, canvas self-hides, nodes still navigable → Task 2 CSS + script ✓
- No-JS: static hero + CTAs functional; nodes are enhancement only → Task 3 Step 4 verifies ✓
- No CLS: container is `position: absolute` (out of flow) — mounting it cannot shift the headline → Task 2/3 ✓
- Mobile degradation (legible tappable list) → Task 2 media query ✓

**Deferred to Plan 3 (not gaps here):** `/project/[slug]` pages (nodes link there; 404 until built) and `/studio`.

**Placeholder scan:** none — every step has concrete code or an exact command. Task 4's slug values are intentionally author-chosen demo data, with the exact frontmatter lines shown.

**Type consistency:** `Zone` imported from `decay.ts` into `layout.ts` and the component script. `computeZone(lastTouchedMs, committed, nowMs)` called with `(new Date(node.lastTouched).getTime(), node.committed, now)` — matches Plan 1's signature. `ManifestNode` shape matches `NodeRecord` emitted by `nodes-manifest.json.ts`. CSS custom props (`--x`,`--y`,`--opacity`,`--scale`,`--delay`,`--zone-color`) are set in the script and consumed in the styles consistently.

---

## Verification (end of Plan 2)

| Check | Command / method | Threshold |
| --- | --- | --- |
| Unit tests | `npm test` | all green (Plan 1 + layout) |
| Type + build | `npm run check` | passes |
| No-JS fallback | `grep -c breathing-hero__cta dist/index.html` | ≥ 1 |
| Manifest non-empty | rebuild + node read (Task 4 Step 3) | ≥ 1 node |
| Visual smoke | `npm run dev` (Task 4 Step 4 checklist) | all boxes pass |
| Keyboard / focus / 44px | Tab through homepage | full coverage, visible ring |
| Reduced motion | OS toggle + reload | no stagger; nodes navigable |
