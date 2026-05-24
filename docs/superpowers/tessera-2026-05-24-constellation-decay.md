# Tessera — Constellation Decay (session handoff)

> **Purpose:** This is a session-bridge handoff. A fresh Claude Code window should read this to pick up exactly where the previous session left off. Read this file first, then the spec and the three plans it references. Date: 2026-05-24. Branch: `feat/constellation-decay`.

---

## The vision (one paragraph)

The homepage hero (`BreathingHero`) becomes a navigable **constellation of project-nodes**. Each node is a project (emergent from a `project:` frontmatter slug, not a fixed taxonomy). A node's **zone is derived from recency**, never authored: recently-touched work glows center (`experiment`), neglected work drifts left and fades (`undefined` = erasure), and work marked `committed: true` is sealed at the right (`signal`) and immune to decay. The arc **Erasure → Signal** is a force the site exerts on its own contents over time. The site tells the story of the maker's progress. Clicking a node → `/project/{slug}/`. A public `/studio/` shows the same nodes as an activity worklist.

## Current state

- **Branch:** `feat/constellation-decay`, fully pushed to origin (7 commits ahead of where it diverged).
- **PR #124** is OPEN against `main`: https://github.com/mazze93/mazze-leczzare-blog/pull/124 — **merge is HELD** pending visual verification. Do NOT merge without the user's explicit go.
- **Dev server:** `npm run dev` → http://localhost:4321/
- **Working tree:** only `docs/operations/memory/context-cache/latest.md` (hook-dirtied, never stage it) and untracked `src/assets/images/blog/hero-decay-rot.png` (purpose unknown, leave it). Plan 3 + this tessera will be added.

## What is DONE (build-verified: 30/30 unit tests, `npm run check` clean)

- **Spec:** `docs/superpowers/specs/2026-05-23-constellation-decay-design.md` (supersedes Subsystems 2–4 of the 2026-05-13 Constellation spec; Compass Subsystem 1 stands).
- **Plan 1 — data foundation** (`docs/superpowers/plans/2026-05-23-constellation-decay-1-data-foundation.md`): `project`+`committed` schema fields on blog AND signal; `src/utils/decay.ts` (`computeZone`); `src/utils/nodes.ts` (`aggregateNodes`, `titleize`); static `src/pages/nodes-manifest.json.ts` → `/nodes-manifest.json`. Vitest added.
- **Plan 2 — canvas node layer** (`docs/superpowers/plans/2026-05-24-constellation-decay-2-canvas-node-layer.md`): `src/utils/layout.ts` (`seededUnit`, `nodePosition`, `nodeStyle`); the node layer is a **React island** `src/components/constellation/ConstellationNodes.tsx` + `ConstellationNodes.module.css`, mounted `client:load` in `BreathingHero.astro`.
- **Compass wiring:** node hover/focus/click dispatch a `compass:state` CustomEvent; a listener in `Header.astro` sets the brand compass `data-state` (idle/focus/engaged). `compass.css` already had the `[data-state]` transitions.
- **zod deprecation cleared:** `src/content.config.ts` imports `z` from `zod` (direct dep, deduped to 4.3.6).
- **Demo content:** 3 posts carry placeholder `project:` tags — `the-lock-icon-is-not-security.mdx` + `secure-pride-origin.mdx` → `secure-pride`; `static-first-is-a-discipline.md` → `static-first` + `committed: true`. **These are smoke-test placeholders; the author should set the real project taxonomy.**

## IMMEDIATE next step (the blocker before merge)

**Visual verification at http://localhost:4321/** — this was never confirmed (dev server was down at handoff). Check:
1. Nodes render positioned by zone (teal `secure-pride` mid-field, amber `static-first` right). If the homepage looks stale, restart `npm run dev` (a `.astro`→`.tsx` swap doesn't always hot-reload).
2. **Hover/focus a node → the header compass refracts** (gold beam blooms); leaving → idle; click → `engaged` flash. This is the new wiring and the main thing to confirm.
3. Tab focus ring, 44px targets; ≤768px collapses to a bottom-pinned tappable list; `prefers-reduced-motion` removes the stagger.

If it looks right → tell the user, then on their go **squash-merge PR #124** (`gh pr merge 124 --squash --delete-branch` — repo blocks merge commits). If something's off, fix on the branch first.

## Then: Plan 3

`docs/superpowers/plans/2026-05-24-constellation-decay-3-project-pages-studio.md` — builds `/project/[slug]/` pages + read-only `/studio/` worklist, extracting `collectAllNodes()` and adding `decayStatus()`. Execute subagent-driven (the established workflow this branch used). Not yet started.

## Key decisions already made — do NOT relitigate

- **Static manifest, not KV, for v1.** The repo has no Cloudflare adapter/wrangler. Live decay is achieved by the client computing `now − lastTouched`; no backend needed. KV/Durable Objects are deferred to a future "touch-without-deploy" cycle. (User confirmed.)
- **React island justified** by the compass wiring + the fact that `ThemeToggle` already ships React on every page (marginal cost = component code only). Styling via CSS module (not `is:global`).
- **Click → navigate to `/project/{slug}/`**, not an inline dialog (accessibility + SEO). (User confirmed.)
- **Zone vocabulary** `undefined / experiment / signal` inherited from the 2026-05-13 spec. **Two ambers stay distinct:** `--zone-signal #f4a261` (content state) vs `--gold #d4a574` (brand/compass) — never merge them.
- Thresholds: 30d → drift starts, 180d → erasure. `committed` seals to signal. (User approved.)

## OPEN questions (unresolved — needed before the bigger studio work)

The user shared a "Studio Site Deployment Guide" for a separate `studio.mazzeleczzare.com` app. The previous session critiqued it; key points the user has NOT yet decided:
1. **Subdomain vs. subpage.** User's original word was "subpage." Recommendation: same-site `/studio/*` (Plan 3 builds the read-only lens this way), avoiding a second app + shared-component duplication. The separate-app path is a one-way door.
2. **The "push to front" mechanism is undefined** — how does studio push content to the front-facing site? (shared KV? commit to repo? deploy hook?) This is the crux of the backend-studio vision and blocks any KV/DO work.
3. Guide bugs to fix IF the separate app is built: `output: 'hybrid'` was **removed in Astro 5** (use `output: 'static'` + per-route `prerender = false`); the guide mixes Pages and Workers deploy models (pick one); KV bindings are premature (defer to when read/written); CSP-in-middleware won't cover static pages (use `_headers`) and `default-src 'self'` breaks islands (needs nonces); pin Node to 22 LTS (machine runs 26 → EBADENGINE). Everything is arm64-native on the M5 Pro (no Rosetta).

## Repo governance (this session's hard rules)

- **Never** `git merge`/`git push`/PR-merge without explicit user confirmation; always surface what + destination. Repo enforces **squash** merges.
- Stage only named files — never `git add -A`/`.`. Never stage the context-cache file or the untracked PNG.
- Commit trailer used this branch: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`.
- Posture is HIGH: accessibility non-negotiable, no CLS, Lighthouse a11y ≥ 95 / perf ≥ 85 on `/`.

## File map (constellation feature)

```
docs/superpowers/specs/2026-05-23-constellation-decay-design.md      ← spec (current)
docs/superpowers/specs/2026-05-13-constellation-architecture-design.md ← Compass (Sub 1) + color system; Subs 2–4 superseded
docs/superpowers/plans/2026-05-23-constellation-decay-1-data-foundation.md  ← DONE
docs/superpowers/plans/2026-05-24-constellation-decay-2-canvas-node-layer.md ← DONE (now React)
docs/superpowers/plans/2026-05-24-constellation-decay-3-project-pages-studio.md ← TODO
src/utils/decay.ts            computeZone + (Plan 3 adds) decayStatus
src/utils/nodes.ts            aggregateNodes, titleize
src/utils/layout.ts           seededUnit, nodePosition, nodeStyle
src/pages/nodes-manifest.json.ts   static manifest endpoint
src/components/constellation/ConstellationNodes.tsx + .module.css   React island
src/components/BreathingHero.astro   mounts the island (client:load)
src/components/Header.astro          compass:state listener
src/components/Compass.astro, CompassLink.astro, src/styles/compass.css   the mark (built, Sub 1)
```
