# Site Audit & Overhaul — Design Spec
**Date:** 2026-04-13
**Status:** Approved

---

## Problem Statement

The mazze-leczzare-blog repo has accumulated structural debt that makes authoring and navigation
confusing. There is no clear intake path for new content — so files accumulate at the repo root,
in a separate writing directory, and in an ad-hoc `files/` staging folder. This structural
ambiguity is the root cause of nearly every other issue: broken drafts, missing images, stranded
content, and features that were built but never integrated.

---

## Scope Decomposition

This overhaul is split into four sequential tracks. Track 0 is foundational — it must land first
so subsequent tracks stay fixed.

---

## Track 0 — Structural Clarity (Foundational)

**Goal:** Establish a canonical directory taxonomy and authoring intake workflow so content has a
clear home at every stage of its lifecycle.

### Canonical directory taxonomy

```
src/
  content/
    blog/         ← published MDX/MD posts (what is now there)
    poetry/       ← new: MDX files for poetry/gothic pieces
  pages/
    blog/         ← blog routes (index, [slug])
    poetry/       ← new: poetry collection route
  components/     ← Astro + React islands only
  layouts/        ← BlogPost.astro, HomepageLayout.astro
  styles/         ← global.css, homepage.css

public/
  images/
    blog/         ← hero images for blog posts (consolidate all blog images here)
    portfolio/    ← work/portfolio images
  fonts/          ← (unchanged)
  triptych/       ← keep as-is; used by we-all-float-on
  favicon.svg
  robots.txt
  (remove: blog-placeholder/, writing/ standalone HTML)

files/            ← LOCAL ONLY, git-ignored staging area for prototypes and design explorations
  prototypes/     ← HTML prototypes of posts before MDX conversion
  design/         ← UI explorations (hero variants, blog index redesigns, typography)

docs/
  superpowers/
    specs/        ← design docs (here)
  operations/     ← agent ops protocol, session logs (unchanged)
  authoring.md    ← new: authoring guide for content intake workflow
  hero-section.md ← move from docs/ root into docs/
```

### Authoring intake workflow

```
1. DRAFT     → files/prototypes/<slug>.html   (HTML explorations, no Astro build)
2. CONVERT   → src/content/blog/<slug>.mdx    (frontmatter: draft: true)
3. REVIEW    → run `npm run dev`, check at /blog/<slug>/
4. PUBLISH   → remove draft: true (or set draft: false)
```

This replaces the current non-workflow of dropping files at repo root.

### Cleanup tasks

**Repo root — file disposition:**
| File | Action |
|------|--------|
| `about.mdx` | Move → `src/pages/about.mdx` (replace `about.md`) |
| `blog-index.astro` | Evaluate vs current; integrate or delete |
| `Colophon.astro` | Move → `src/components/Colophon.astro` |
| `portfolio.html` | Move → `files/design/portfolio.html` |
| `we-all-float-on.html` | Move → `files/prototypes/we-all-float-on.html` |
| `hero-environmental-breathing.html` | Move → `files/design/hero-environmental-breathing.html` |
| `blog-preview.html` | Move → `files/design/blog-preview.html` |
| `landing-preview.html` | Move → `files/design/landing-preview.html` |
| `typography-rationale-interactive.html` (both) | Move → `files/design/` |
| `ACCESSIBILITY-RULES.md` | Move → `docs/ACCESSIBILITY-RULES.md` |
| `GITHUB-DEPLOY.md` | Move → `docs/GITHUB-DEPLOY.md` |
| `social-preview-philosophy.md` | Move → `docs/social-preview-philosophy.md` |
| `mazze-leczzare-social-preview.png` | Delete (already in `public/`) |
| `mazzeleczzare-deployment.tar.gz` | Delete (archive, not tracked) |

**Dead code — remove:**
- `src/components/HeroSection.tsx` — unmounted React component
- `src/components/HeroSection.astro` — unmounted Astro component
- `blog-post-package/` — shadow Astro project, entire directory

**Image consolidation:**
- `public/blog-placeholder/` → delete (replace with real images per post)
- `public/images/blog/` → keep, extend (canonical location for post hero images)
- `public/writing/` → delete (contained an old standalone HTML page, not assets)
- `public/triptych/` → keep as-is (referenced by we-all-float-on)

**files/ directory — git-ignore and reorganize:**
- Add `files/` to `.gitignore` (it is a local staging area, not repo content)
- Move existing files into `files/prototypes/` or `files/design/` as appropriate

**docs/ — minor cleanup:**
- Move `docs/hero-section.md` → `docs/hero-section.md` (already correct, no change needed)
- Create `docs/authoring.md` — authoring intake guide

---

## Track A — Content Recovery (Fix What's Broken)

**Goal:** Every published post renders correctly; no draft posts appear in listings or generate
routes; missing images are resolved.

### Draft filtering

Add `filter(p => !p.data.draft)` to every `getCollection('blog')` call:

- `src/pages/blog/index.astro` — listing page
- `src/pages/index.astro` — homepage last-6 posts
- `src/pages/blog/[...slug].astro` — `getStaticPaths` (prevents draft routes from building)
- `src/pages/rss.xml.js` — RSS feed

### on-decay-rot-and-the-goblin-at-the-gate

Remove `draft: true` from frontmatter. Post is complete and should publish.

### we-all-float-on — full restoration

The MDX file is a stripped skeleton. The full essay is in `files/prototypes/we-all-float-on.html`
(4.4 MB — includes all prose sections, verse blocks, pull quotes, triptych, acknowledgements).

Restoration steps:
1. Extract all prose and structural sections from the HTML
2. Rewrite as MDX using the site's existing conventions
3. Add MDX components for: verse blocks (`<Verse>`), pull quotes (`<PullQuote>`), triptych
   (`<Triptych>`) — these are new Astro components to be created in `src/components/`
4. Wire triptych images from `public/triptych/` (already on disk)
5. Add proper frontmatter: `heroImage`, `heroImageAlt`, `subtitle`, `tags`

### concept-is-not-the-state — hero image

- The post uses `heroImageOG` but not `heroImage` → blog listing renders no image
- The OG image (`/writing/concept-is-not-the-state-og.png`) is referenced but doesn't exist
- Resolution: add `heroImage` pointing to an existing asset, or create the image and place it at
  `public/images/blog/concept-is-not-the-state-hero.jpg`

---

## Track B — Integrate Waiting Content

**Goal:** All complete essays and content pieces in `files/` become published posts or
portfolio entries.

### Blog posts to convert (HTML → MDX)

| Source file | Target slug | Type |
|-------------|-------------|------|
| `files/southern-gothic-queer-survival.html` | `southern-gothic-queer-survival` | Essay |
| `files/content-strategy-community-practice.html` | `content-strategy-community-practice` | Essay |
| `files/secure-pride-origin.html` | `secure-pride-origin` | Essay or portfolio case study |

Each conversion follows the authoring intake workflow:
1. Extract prose from HTML, strip presentational markup
2. Create MDX with full frontmatter (title, description, pubDate, tags, heroImage)
3. Source or create hero images → `public/images/blog/<slug>-hero.jpg`
4. Set `draft: false` when ready to publish

### Southern Cunning Field Almanac

The almanac (`/✍️ writing/southern-cunning-field-almanac/`) is a substantial research compendium,
not a single blog post. Decision deferred to author. Options:
- A single long-form essay blog post (summary/introduction with the full doc linked)
- A dedicated `/almanac/` route (special page type, not in the blog collection)
- Leave in the writing directory; do not publish to the blog

### Poetry as a content type (deferred)

Whether poetry gets its own collection (`src/content/poetry/`) and route (`/poetry/`) is a design
question for Track C. Track B converts the prose essays only.

---

## Track C — Feature & UI Work

**Goal:** The homepage hero is replaced, the work portfolio is built out, the share feature is
verified, and any poetry-specific page design decisions are made.

### Homepage hero — environmental breathing canvas

Replace `SignalHero.astro` with a new `BreathingHero.astro` based on the
`files/design/hero-environmental-breathing.html` prototype.

- Extract canvas animation logic into `BreathingHero.astro`
- Preserve the same CTA links: "Read the writing" → `/blog/`, "Explore the work" → `/work/`
- Preserve `prefers-reduced-motion` static fallback
- Remove `SignalHero.astro` after replacement (or keep for reference — author's call)

### Work portfolio

Replace the "Coming soon" placeholder in `work.astro` with real content based on
`files/design/portfolio.html`.

- Extract portfolio items from the HTML design
- Implement as a static Astro page (no new collection needed unless there are many items)
- Wire any portfolio images to `public/images/portfolio/`

### Share feature verification

`PostQuoteShare.tsx` is built and mounted in `BlogPost.astro`. Verify:
- Share buttons appear on paragraph hover in a published post
- `navigator.share()` / clipboard fallback works in browser
- `?quote=quote-N` deep-link scrolls and highlights correctly
- `POST /api/share-event` receives events (check Cloudflare logs or network tab)

If buttons are invisible: check CSS scoping — the `:global()` rules in `BlogPost.astro` may have
been broken by a recent layout change.

### Poetry collection (if desired)

If the author wants `/poetry/` as a distinct route:
- Add `poetry` collection to `src/content.config.ts`
- Create `src/content/poetry/` directory
- Create `src/pages/poetry/index.astro` and `src/pages/poetry/[...slug].astro`
- Design the poetry layout (distinct from prose BlogPost.astro — likely less chrome, more
  typographic focus)

---

## Success Criteria

- Repo root contains only tracked project files (no loose HTMLs, archives, or misplaced assets)
- `getCollection('blog')` never returns `draft: true` posts anywhere on the site
- All published posts display their hero image correctly
- `we-all-float-on` renders with full prose, verse blocks, and triptych
- At least `southern-gothic-queer-survival` and one other essay are live as MDX posts
- `work.astro` shows real portfolio content
- A developer (or the author) can read `docs/authoring.md` and know exactly where to put a new
  piece of writing at any stage of completion

---

## Out of Scope

- `mazze-leczzare-arc/` — separate Cloudflare project, unrelated to this repo
- `Fellowship-Pack/` — brand assets, not blog content
- New analytics, comment system, or subscription features
- Any changes to Cloudflare Functions (`contact.ts`, `share-event.ts`)
