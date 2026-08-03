# HANDOFF — design-systems pass (2026-08-02)

Written at a session limit. Ordered so a local model can pick up the baton.

> **Where this sits in the journal.** A concurrent session in the
> `worktree-cv-work-integration` worktree scaffolded `docs/journal/` for a
> different task (**design-sync-css-parity**) and archived the previous set
> while this pass was in flight. So the live `PLAN.md`/`DECISIONS.md`/
> `CHECKPOINT.md` in this directory describe *that* task, not this one. The
> earlier site-rot-sweep log is at
> `docs/journal/archive/2026-08-02-site-rot-sweep/`. This pass's decisions are
> recorded below rather than appended to a log belonging to other work.

## Decisions from this pass

**Kintsugi wins the palette conflict; `global.css` was the stale copy.** Moved
shared `--teal`/`--coral` onto `#5CCFCF`/`#F07178` rather than pulling the two
kintsugi pages back. The prior checkpoint filed `/cipher-gothic`'s palette as
"divergent, an open design question" — that framing was wrong.
`/intentional-fragility/` carries the same two hexes, which makes them a
coherent palette rather than page drift: those pages were ahead, global.css was
stale. Mazze confirmed the divergence was unintentional. *Reverse:* revert
`5f650a2`, but keep its two independent a11y fixes (`--teal-dim`/`--coral-dim`
were failing AA at 2.92:1 and 2.94:1 beforehand).

**The light-mode gap was 8 tokens, not three stylesheets.** Going in — and in
what I told mazze — the claim was that `homepage.css`, `constellation-pages.css`
and `compass.css` each needed light blocks. Measuring instead of assuming:
`homepage.css` sets no colours at all, and the other two consume only tokens
that already invert. Cross-referencing every `var()` in `src/` against the
`[data-theme="light"]` block found exactly 8 colour tokens with no override, all
`--home-*`. Adding blocks to those three files would have been no-op CSS.
*Reverse:* revert `6ea7bd6` and drop the `haven-ink.tokens.css` import.

**Shipped Haven/Ink without browser proof, and labelled it.** The session limit
hit mid-verification; the Playwright script was written but never ran. Stranding
working, building code uncommitted risks losing it — but `/ship` requires
proving behaviour, and computed contrast ratios are not a render. Committed with
the gap stated in the message rather than letting "npm run check passes" stand
in for "it looks right." Item 1 below is that verification.

**Shipped and pushed:** `c72b64f` sitemap · `a2d1be5` CV · `5f650a2` Kintsugi
palette. **Committed, NOT yet pushed:** `6ea7bd6` Haven/Ink light mode.

---

## 0. Push the pending commit — do this first

```bash
cd ~/Projects/blog/mazze-leczzare-blog
git log --oneline origin/main..HEAD   # expect: 6ea7bd6
npm run check && npm run test && npm run docs:check
git push origin main
```

`origin/main` moved twice during the last session (Dependabot + a masthead
island). If push is rejected: `git pull --rebase origin main`, re-run the three
checks, push again. Zed's file watcher holds transient `.git/index.lock` —
a failed `git add`/`commit` is usually that; retry after 2s rather than
deleting the lock.

---

## 1. Verify the light mode that just shipped — HIGHEST PRIORITY

`6ea7bd6` is the one commit in this pass **not proven end-to-end**. It builds,
and the values are confirmed in the built CSS, but it has never been rendered.
The contrast numbers in that commit message are computed from hex values, not
sampled from a browser. Treat it as unverified until this is done.

```bash
npm run preview          # http://localhost:4321
```

Then, per page, toggle `document.documentElement.dataset.theme = 'light'` and
confirm computed style — Playwright is already a devDependency:

| Page | Expect in light |
| --- | --- |
| `/` | body background Haven paper `#f4f0e7`, **not** deep navy `#08080e` |
| `/constellation/` | ink-on-paper star chart; nodes/asterisms visible, not washed out |
| `/studio/`, `/project/<slug>/` | `.cn-page` chrome legible |
| `/blog/`, `/about/`, `/work/` | unchanged from before (they already worked) |

The script that was about to run when the session ended:

```js
// /tmp/lightproof.mjs — playwright; loops pages × ['dark','light'],
// sets dataset.theme, reads getComputedStyle(body).backgroundColor/color,
// console.table's the result, screenshots / and /constellation/ in light.
```

Two known risks, both unverified:
- `.node.gold circle` has a **hardcoded** dark-mode glow,
  `drop-shadow(0 0 14px rgba(232, 182, 76, 0.75))` at `constellation.astro:432`.
  It will likely read wrong on paper. Same class of bug as the `.tag` literals
  fixed in `5f650a2` — a dark-palette colour written as a literal, so no token
  change reaches it.
- The `[data-theme="light"] .cn-page` selector is untested; if `/studio` and
  `/project/*` don't invert, that selector is why.

If a fix is needed, it is a follow-up commit — do not amend `6ea7bd6`.

---

## 2. Radiate the kintsugi seam into components

The palette migrated in `5f650a2`, but the **seam itself** — the visual gold
crack that makes `/intentional-fragility/` look the way it does — has not
radiated anywhere. The tokens now exist site-wide (`--gold-seam`,
`--gold-seam-bright`, `--gold-seam-deep`, `--hairline`, `--hairline-soft`) and
nothing consumes them yet.

Reference implementation: `public/intentional-fragility/index.html`, the
`.seam` rules (~line 115) — an absolutely-positioned SVG path with a gold
gradient stroke plus a blurred glow copy, `--seam-x: clamp(34px, 8vw, 120px)`,
with the content shell padded to clear it.

Suggested order, cheapest first: `SectionBreak.astro` (already a divider —
smallest possible change), then `PullQuote.astro` / `blog/PullQuote.astro`
(seam as the left rule), then `AuthorCoda.astro`, then the `BlogPost.astro`
layout margin. **Confirm the direction with mazze on the first one before
doing the rest** — this is visible editorial design, not a mechanical change.

---

## 3. Reconcile /cipher-gothic with its own documentation

`5f650a2` resolved the palette (the page was right, global.css was stale) and
the comment at the top of its `<style is:global>` block now says so. Still open:

- The page's swatches/specimens should be **read from** `var(--teal)` /
  `var(--coral)` rather than its page-local `--cg-accent` / `--cg-coral`
  aliases, so the next palette change reaches it automatically. The comment
  already asks for this; nothing does it yet.
- The page documents Space Grotesk / Crimson Pro, which are **not** the site's
  body type. That is legitimate for a specimen page, but the page should say so
  explicitly, or a reader will take it as the site-wide type system.
- Per mazze: Cipher Gothic is **one** design system deployed here, not the
  be-all for the site. The page should be framed that way.

---

## 4. Document the design systems in CLAUDE.md

Not started. CLAUDE.md still implies one design system. It should name three
and say where each applies:

| System | Applies to | Source of truth |
| --- | --- | --- |
| Kintsugi | site-wide palette + seam | `global.css` `:root`, ref `/intentional-fragility/` |
| Cipher Gothic | `/cipher-gothic/` specimen; `--cg-*` type/space/motion tokens | `global.css` Cipher Gothic block |
| Haven / Ink | light mode (all non-artifact pages) | `haven-ink.tokens.css` + `[data-theme="light"]` |

Note that `/artifacts/*` are self-contained and own their palettes — they are
deliberately outside all three.

---

## 5. Smaller open items

- **`--home-gold` in light** maps to `--gold-seam-deep`, which is itself
  redefined in the same block. It resolves correctly (CSS custom properties
  resolve at use, not declaration) but it reads as circular. Worth a comment or
  a direct hex.
- **`src/styles/editorial.css`** — still imported by nothing, now trap-flagged
  in its header (`02b0c02`). Either wire it in properly or retire it.
- **`tailwindcss`** — inert config, labelled in `02b0c02`. Keep or
  `npm rm tailwindcss` + delete `tailwind.config.mjs`.
- **`public/fonts/atkinson-{bold,regular}.woff`** — the only genuinely
  unreferenced font files in the repo.
- **`/artifacts/tree-of-knowledge.html`** and
  **`publication-surface-v1.2.2.html`** still fetch CDN fonts. Permitted by
  `ARTIFACT_CSP` so not a defect, but they are the last third-party requests on
  a site that otherwise makes none.
- **`docs/mazze-leczzare-cv.pdf`** and `public/mazze-leczzare-cv.pdf` are now
  two byte-identical copies. Fine, but only `public/` ships — if the CV is
  updated, update that one, or add a check.

---

## Guardrails for whoever picks this up

- `npm run check && npm run test && npm run docs:check` before every commit.
  `docs:check` now includes a font-reference resolver (§8) and a CDN-font/CSP
  check (§9) — both added this session, both verified to actually fail.
- **Resolve paths, don't grep them.** Two wrong conclusions were reached this
  session by substring-matching `/fonts/` (it matches `./fonts/`). If a claim
  is "this file is unused" or "this reference is broken", resolve it against
  its base and `stat` it.
- **New page under `public/`?** Add it to `customPages` in `astro.config.mjs`
  *and* `DOCUMENTED_PAGES` in `check-docs-drift.sh`, same commit.
- Commit and push at every phase boundary; don't batch.
