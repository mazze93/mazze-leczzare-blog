# Site Audit & Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a clear directory structure, fix all broken content, and integrate waiting essays so the site is navigable, fully published, and has a sustainable authoring workflow.

**Architecture:** Four sequential tracks — Track 0 (structural) must land before the others; A/B/C can proceed in order after that. Every track is independently committable. No new dependencies introduced; the stack stays Astro 6 + Cloudflare Pages.

**Tech Stack:** Astro 6 (SSG), MDX, TypeScript, Cloudflare Pages, Tailwind 4

**Validation command:** `npm run check` (runs `astro build && tsc`) — run after every task to confirm nothing breaks.

---

## File Map

### Track 0 — Structural Clarity
| Action | Path |
|--------|------|
| Create | `docs/authoring.md` |
| Create | `src/components/Colophon.astro` (move from root) |
| Modify | `.gitignore` |
| Delete | `src/components/HeroSection.tsx` |
| Delete | `src/components/HeroSection.astro` |
| Delete | `blog-post-package/` (entire directory) |
| Delete | `public/blog-placeholder/` (entire directory) |
| Delete | `public/writing/` (entire directory) |
| Move/delete | ~14 loose files at repo root (see Task 1) |

### Track A — Content Recovery
| Action | Path |
|--------|------|
| Modify | `src/content/blog/on-decay-rot-and-the-goblin-at-the-gate.mdx` |
| Modify | `src/pages/blog/index.astro` |
| Modify | `src/pages/index.astro` |
| Modify | `src/pages/blog/[...slug].astro` |
| Modify | `src/pages/rss.xml.js` |
| Create | `src/components/Verse.astro` |
| Create | `src/components/PullQuote.astro` |
| Create | `src/components/Triptych.astro` |
| Modify | `src/content/blog/we-all-float-on.mdx` (full restoration) |
| Modify | `src/content/blog/concept-is-not-the-state.mdx` |

### Track B — Integrate Waiting Content
| Action | Path |
|--------|------|
| Create | `src/content/blog/southern-gothic-queer-survival.mdx` |
| Create | `src/content/blog/secure-pride-origin.mdx` |
| Create | `src/content/blog/content-strategy-community-practice.mdx` |
| Create | `public/images/blog/<slug>-hero.jpg` (per post, sourced from HTML) |

### Track C — Feature & UI Work
| Action | Path |
|--------|------|
| Create | `src/components/BreathingHero.astro` |
| Modify | `src/pages/index.astro` |
| Modify | `src/pages/work.astro` |
| Delete | `src/components/SignalHero.astro` (after replacement) |

---

## Track 0 — Structural Clarity

---

### Task 1: Clean the repo root

**Files:**
- Move/delete: 14 loose files at repo root
- Modify: `.gitignore`

- [ ] **Step 1: Move prototype and design files out of root**

```bash
cd '/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog'
mkdir -p files/design files/prototypes

# Design explorations → files/design/
mv portfolio.html files/design/portfolio.html
mv we-all-float-on.html files/design/we-all-float-on.html
mv hero-environmental-breathing.html files/design/hero-environmental-breathing.html
mv blog-preview.html files/design/blog-preview.html 2>/dev/null || true
mv landing-preview.html files/design/landing-preview.html 2>/dev/null || true
mv "typography-rationale-interactive (1).html" "files/design/typography-rationale-interactive-2.html" 2>/dev/null || true
mv typography-rationale-interactive.html files/design/typography-rationale-interactive.html 2>/dev/null || true
```

- [ ] **Step 2: Move doc files into docs/**

```bash
mv ACCESSIBILITY-RULES.md docs/ACCESSIBILITY-RULES.md 2>/dev/null || true
mv GITHUB-DEPLOY.md docs/GITHUB-DEPLOY.md 2>/dev/null || true
mv social-preview-philosophy.md docs/social-preview-philosophy.md 2>/dev/null || true
```

- [ ] **Step 3: Evaluate and move Colophon.astro**

```bash
# Move to components — it's an Astro component and belongs there
mkdir -p src/components
mv Colophon.astro src/components/Colophon.astro
```

- [ ] **Step 4: Evaluate blog-index.astro at root**

Open both files and compare:
- Root `blog-index.astro` — is it meaningfully different from `src/pages/blog/index.astro`?
- If it contains improvements, integrate them into `src/pages/blog/index.astro` (do NOT replace outright — it may reference components or APIs that have changed)
- If it's an outdated duplicate, delete it

```bash
# After evaluation, delete if not needed:
rm blog-index.astro
```

- [ ] **Step 5: Evaluate about.mdx at root**

Open root `about.mdx`. It references `../layouts/BaseLayout.astro` (does not exist) and imports `Colophon.astro`. The current `src/pages/about.md` uses `BlogPost.astro`.

Do NOT do a blind file replace. Instead:
- Copy any updated prose/content from root `about.mdx` into `src/pages/about.md`
- Keep the existing `BlogPost.astro` layout (BaseLayout doesn't exist)
- Delete root `about.mdx` after merging content

```bash
# After merging content:
rm about.mdx
```

- [ ] **Step 6: Delete junk files from root**

```bash
# Archive — never commit binaries
rm -f mazzeleczzare-deployment.tar.gz
# Duplicate social preview (already in public/)
rm -f mazze-leczzare-social-preview.png
```

- [ ] **Step 7: Git-ignore the files/ staging directory**

Open `.gitignore` and add at the bottom:

```
# Local prototype staging — not repo content
files/
```

- [ ] **Step 8: Verify root is clean**

```bash
ls -la . | grep -v -E "^(total|drwx)" | awk '{print $NF}' | grep -v -E "^\.$|^\.\.$|^(src|public|functions|node_modules|dist|docs|scripts|blog-post-package|\.git|\.gitignore|astro\.config\.mjs|package.*|tailwind\.config\.mjs|tsconfig\.json|wrangler\.toml|README|CLAUDE|CONTRIBUTING|SECURITY|AGENTS).*"
```

Expected: no output (all legitimate files accounted for).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: clean repo root — move prototypes to files/, update .gitignore"
```

---

### Task 2: Remove dead code

**Files:**
- Delete: `src/components/HeroSection.tsx`
- Delete: `src/components/HeroSection.astro`
- Delete: `blog-post-package/` (entire directory)

- [ ] **Step 1: Confirm nothing imports the dead components**

```bash
grep -r "HeroSection" src/ --include="*.astro" --include="*.tsx" --include="*.ts"
```

Expected: zero matches (CLAUDE.md confirms these are unmounted).

- [ ] **Step 2: Delete dead components**

```bash
rm src/components/HeroSection.tsx
rm src/components/HeroSection.astro
```

- [ ] **Step 3: Delete blog-post-package**

```bash
rm -rf blog-post-package/
```

- [ ] **Step 4: Run check**

```bash
npm run check
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove dead HeroSection components and blog-post-package shadow project"
```

---

### Task 3: Consolidate public image directories

**Files:**
- Delete: `public/blog-placeholder/`
- Delete: `public/writing/` (contains old standalone HTML, not assets)

- [ ] **Step 1: Check if blog-placeholder images are referenced anywhere**

```bash
grep -r "blog-placeholder" src/ --include="*.astro" --include="*.md" --include="*.mdx" --include="*.ts"
```

Note which posts still reference placeholder images — these need real images added in Track B. For now, the placeholder files are deleted; posts without a `heroImage` simply render without one (graceful — the blog listing conditionally renders the image block).

- [ ] **Step 2: Delete placeholder directory**

```bash
rm -rf public/blog-placeholder/
```

- [ ] **Step 3: Update any frontmatter that points to deleted placeholders**

For each post found in Step 1 that uses `/blog-placeholder/*.jpg`:
- Remove the `heroImage` field from its frontmatter (the listing will render without an image rather than showing a broken image)

Posts to check: `mapping-curiosity.md` (uses `/blog-placeholder-1.jpg`), `welcome-to-the-studio.md` (uses `/blog-placeholder-about.jpg`)

```bash
# In src/content/blog/mapping-curiosity.md, remove the heroImage line
# In src/content/blog/welcome-to-the-studio.md, remove the heroImage line
```

- [ ] **Step 4: Delete the writing/ standalone HTML directory**

```bash
rm -rf public/writing/
```

- [ ] **Step 5: Run check**

```bash
npm run check
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove placeholder images and writing/ standalone HTML from public/"
```

---

### Task 4: Write the authoring guide

**Files:**
- Create: `docs/authoring.md`

- [ ] **Step 1: Create the authoring guide**

Create `docs/authoring.md` with this content:

```markdown
# Authoring Guide — mazze-leczzare-blog

## Where things live

| Content stage | Location | Notes |
|---------------|----------|-------|
| HTML explorations | `files/prototypes/` | Local only — git-ignored |
| Design/UI prototypes | `files/design/` | Local only — git-ignored |
| Draft posts (not yet ready) | `src/content/blog/<slug>.mdx` with `draft: true` | Builds but hidden from listings |
| Published posts | `src/content/blog/<slug>.mdx` with `draft: true` removed | Appears on /blog/ and homepage |
| Post hero images | `public/images/blog/<slug>-hero.jpg` | Referenced as `/images/blog/<slug>-hero.jpg` in frontmatter |
| Portfolio images | `public/images/portfolio/` | |
| Components | `src/components/` | Astro or React (React only if interactive) |
| Layouts | `src/layouts/` | |

## Intake workflow

```
1. DRAFT     → files/prototypes/<slug>.html   (write and design freely)
2. CONVERT   → src/content/blog/<slug>.mdx    (frontmatter: draft: true)
3. REVIEW    → npm run dev → check at /blog/<slug>/
4. PUBLISH   → remove draft: true from frontmatter
```

## Blog post frontmatter

```yaml
---
title: "Post Title"
description: "One sentence for meta and listings."
pubDate: 2026-04-13
# Optional fields:
updatedDate: 2026-04-13
heroImage: "/images/blog/your-slug-hero.jpg"
heroImageOG: "/images/blog/your-slug-og.jpg"
heroImageAlt: "Descriptive alt text for the hero image."
subtitle: "Optional deck shown under title"
category: "Essay"
tags: ["tag-one", "tag-two"]
readingTime: "~8 min"
featured: true
# draft: true   ← remove this line to publish
---
```

## Key commands

```bash
npm run dev        # dev server at localhost:4321
npm run check      # astro build + tsc — run before every commit
npm run build      # production build → dist/
npm run preview    # preview dist/ locally
```

## What NOT to commit at repo root

- HTML files — go in `files/design/` or `files/prototypes/`
- Archives (`.tar.gz`, `.zip`) — delete them
- Images that belong in `public/` — move them there
- Astro/MDX files — go in `src/`
```

- [ ] **Step 2: Commit**

```bash
git add docs/authoring.md
git commit -m "docs: add authoring intake guide"
```

---

## Track A — Content Recovery

---

### Task 5: Fix draft filtering site-wide

**Files:**
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/rss.xml.js`

- [ ] **Step 1: Fix blog listing page**

In `src/pages/blog/index.astro`, change line 9:

```ts
// Before:
const allPosts = (await getCollection('blog')).sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);

// After:
const allPosts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
```

- [ ] **Step 2: Fix homepage**

In `src/pages/index.astro`, change the getCollection call:

```ts
// Before:
const posts = (await getCollection('blog'))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 6);

// After:
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 6);
```

- [ ] **Step 3: Fix static path generation**

In `src/pages/blog/[...slug].astro`, change `getStaticPaths`:

```ts
// Before:
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { slug: post.id },
    props: post,
  }));
}

// After:
export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: post,
  }));
}
```

- [ ] **Step 4: Fix RSS feed**

In `src/pages/rss.xml.js`, change:

```js
// Before:
const posts = await getCollection("blog");

// After:
const posts = await getCollection("blog", ({ data }) => !data.draft);
```

- [ ] **Step 5: Run check**

```bash
npm run check
```

Expected: build succeeds. Confirm `on-decay-rot-and-the-goblin-at-the-gate` does NOT appear in `dist/blog/` (it's still draft).

```bash
ls dist/blog/ 2>/dev/null | grep "on-decay"
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add src/pages/blog/index.astro src/pages/index.astro src/pages/blog/\[...slug\].astro src/pages/rss.xml.js
git commit -m "fix: filter draft posts from all getCollection calls"
```

---

### Task 6: Publish the goblin post

**Files:**
- Modify: `src/content/blog/on-decay-rot-and-the-goblin-at-the-gate.mdx`

- [ ] **Step 1: Remove the draft flag**

Open `src/content/blog/on-decay-rot-and-the-goblin-at-the-gate.mdx` and remove the line:

```yaml
draft: true
```

Delete it entirely — do not replace with `draft: false`. Published posts omit the field.

- [ ] **Step 2: Run check and confirm the post builds**

```bash
npm run check
ls dist/blog/ | grep "on-decay"
```

Expected: `on-decay-rot-and-the-goblin-at-the-gate/` appears in `dist/blog/`.

- [ ] **Step 3: Commit**

```bash
git add src/content/blog/on-decay-rot-and-the-goblin-at-the-gate.mdx
git commit -m "feat: publish on-decay-rot-and-the-goblin-at-the-gate"
```

---

### Task 7: Create MDX prose components

These three components are needed by `we-all-float-on` restoration (Task 8). Create them first.

**Files:**
- Create: `src/components/Verse.astro`
- Create: `src/components/PullQuote.astro`
- Create: `src/components/Triptych.astro`

- [ ] **Step 1: Create Verse.astro**

Create `src/components/Verse.astro`:

```astro
---
// Verse.astro — indented verse / poetry block with left border accent
// Usage in MDX: <Verse>line one\nline two\nline three</Verse>
---
<div class="verse-block">
  <slot />
</div>

<style>
  .verse-block {
    margin: 2.5rem 0;
    padding-left: 2rem;
    border-left: 1px solid var(--teal-faint, rgba(58,184,160,0.25));
  }

  .verse-block :global(p) {
    margin-bottom: 0.4rem;
    font-style: italic;
    font-size: 1.05rem;
    color: var(--text-dim);
    line-height: 1.55;
  }
</style>
```

- [ ] **Step 2: Create PullQuote.astro**

Create `src/components/PullQuote.astro`:

```astro
---
// PullQuote.astro — editorial pull quote with coral left border
// Usage in MDX: <PullQuote>The quoted text here.</PullQuote>
---
<blockquote class="pull-quote">
  <slot />
</blockquote>

<style>
  .pull-quote {
    margin: 3.5rem 0;
    padding: 1.75rem 2.25rem;
    border-left: 3px solid var(--coral);
    background: linear-gradient(135deg, rgba(26,18,8,0.6) 0%, transparent 100%);
  }

  .pull-quote :global(p) {
    font-size: 1.3rem;
    font-weight: 400;
    font-style: italic;
    color: var(--text);
    line-height: 1.6;
    margin: 0;
  }
</style>
```

- [ ] **Step 3: Create Triptych.astro**

Create `src/components/Triptych.astro`:

```astro
---
// Triptych.astro — three-panel image grid
// Usage in MDX:
// <Triptych
//   title="Orientation"
//   subtitle="Mind · Navigation · Structure"
//   panels={[
//     { src: "/triptych/triptych-mind.png", label: "Mind", sublabel: "cognition · pattern recognition" },
//     { src: "/triptych/triptych-structure.jpg", label: "Structure", sublabel: "reasoning · constraint · governance" },
//     { src: "/triptych/triptych-instrument.png", label: "Instrument", sublabel: "navigation · inference · orientation" },
//   ]}
// />

interface Panel {
  src: string;
  label: string;
  sublabel?: string;
  alt?: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  panels: Panel[];
}

const { title, subtitle, panels } = Astro.props;
---

<section class="triptych-section" aria-label={title ?? 'Triptych'}>
  {(title || subtitle) && (
    <div class="triptych-header">
      {title && <h2 class="triptych-title">{title}</h2>}
      {subtitle && <p class="triptych-subtitle">{subtitle}</p>}
    </div>
  )}
  <div class="triptych-grid">
    {panels.map((panel, i) => (
      <div class="triptych-panel" data-index={i}>
        <div class="triptych-accent" />
        <img
          src={panel.src}
          alt={panel.alt ?? panel.label}
          width={400}
          height={250}
          loading="lazy"
          decoding="async"
        />
        <div class="triptych-caption">
          <span class="triptych-label">{panel.label}</span>
          {panel.sublabel && <span class="triptych-sublabel">{panel.sublabel}</span>}
        </div>
      </div>
    ))}
  </div>
</section>

<style>
  .triptych-section {
    margin: 4rem -1rem;
    padding: 3rem 1rem;
    border-top: 1px solid var(--rule);
    border-bottom: 1px solid var(--rule);
  }

  .triptych-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .triptych-title {
    font-family: var(--font-mono);
    font-size: 0.65rem;
    letter-spacing: 0.35em;
    color: var(--teal);
    text-transform: uppercase;
    margin: 0 0 0.4rem;
  }

  .triptych-subtitle {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    color: var(--text-faint);
    letter-spacing: 0.12em;
    margin: 0;
  }

  .triptych-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    align-items: start;
  }

  .triptych-panel {
    display: flex;
    flex-direction: column;
  }

  .triptych-accent {
    height: 2px;
    margin-bottom: 0.75rem;
    opacity: 0.7;
    background: var(--text-faint);
  }

  .triptych-panel[data-index="0"] .triptych-accent { background: var(--gold); }
  .triptych-panel[data-index="1"] .triptych-accent { background: var(--teal); }
  .triptych-panel[data-index="2"] .triptych-accent { background: var(--text-faint); }

  .triptych-panel img {
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border: 1px solid var(--rule);
    display: block;
    filter: brightness(0.9) contrast(1.05);
    transition: filter 0.4s ease;
  }

  .triptych-panel:hover img {
    filter: brightness(1) contrast(1.08);
  }

  .triptych-caption {
    margin-top: 0.75rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .triptych-label {
    font-family: var(--font-display);
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    color: var(--text-dim);
    text-transform: uppercase;
  }

  .triptych-sublabel {
    font-family: var(--font-mono);
    font-size: 0.58rem;
    letter-spacing: 0.08em;
    color: var(--text-faint);
  }

  @media (max-width: 640px) {
    .triptych-grid { grid-template-columns: 1fr; }
    .triptych-section { margin: 3rem 0; }
  }
</style>
```

- [ ] **Step 4: Run check**

```bash
npm run check
```

Expected: build succeeds (new components are not yet imported anywhere, so no regressions).

- [ ] **Step 5: Commit**

```bash
git add src/components/Verse.astro src/components/PullQuote.astro src/components/Triptych.astro
git commit -m "feat: add Verse, PullQuote, and Triptych MDX components"
```

---

### Task 8: Restore we-all-float-on

**Files:**
- Modify: `src/content/blog/we-all-float-on.mdx`

The full essay source is at `public/writing/we-all-float-on/index.html` — use it as the reference. The current MDX is a shorter, different essay. The HTML version is the canonical one (contains the neuroscience lab narrative, the triptych, verse blocks, pull quotes, and acknowledgements).

**Note:** Both `public/writing/we-all-float-on/index.html` and `files/prototypes/we-all-float-on.html` have base64-encoded images embedded that make them too large to read in full. Extract prose using grep during implementation.

- [ ] **Step 1: Extract prose sections from the HTML source**

```bash
# Extract all paragraph and heading text from the HTML
grep -E "<p>|<h2>" public/writing/we-all-float-on/index.html | sed 's/<[^>]*>//g' | sed '/^[[:space:]]*$/d'
```

This gives you the raw prose. The structure from the HTML is:
1. Opening section — AI acknowledgements story (asks models how they'd like to appear, gets images back: brain/neural-constellations, systems-notebook, compass)
2. Verse block — "Not a brain. / Not a diagram. / A compass."
3. Pull quote — "Assistant."
4. Triptych — "Orientation" (Mind · Navigation · Structure) — images: `triptych-mind.png`, `triptych-structure.jpg`, `triptych-instrument.png`
5. Section "Asking the Answers" — the pull quote "I ask the answers what they think."
6. Section "A Different Ship" — neuroscience lab / macaques narrative; mentor quote "I needed to learn my place on the ship."
7. Section "Drifting" — leaving academia
8. (Additional sections follow — extract them from the grep output)
9. Acknowledgements

- [ ] **Step 2: Rewrite we-all-float-on.mdx with full content**

Replace the entire contents of `src/content/blog/we-all-float-on.mdx` with:

```mdx
---
title: "We All Float On"
subtitle: "Mind, Instrument, Structure"
description: "On leaving neuroscience, asking artificial collaborators how they want to be remembered, and the accidental triptych that resulted."
pubDate: 2026-03-07
tags:
  - philosophy
  - neuroscience
  - artificial-intelligence
  - reflection
  - human-ai
heroImageAlt: "A triptych: a glowing neural brain, a systems notebook with consent logic diagrams, and a compass needle pointing somewhere uncertain."
---

import Verse from '../../components/Verse.astro';
import PullQuote from '../../components/PullQuote.astro';
import Triptych from '../../components/Triptych.astro';

{/* 
  IMPLEMENTATION NOTE:
  This MDX file needs the full prose from public/writing/we-all-float-on/index.html.
  Run the grep command in Task 8 Step 1 to extract the prose, then fill in below.
  The structure and component usage is already wired — fill in each section's prose.
*/}

Recently I asked a few artificial collaborators how they would like to be represented in the acknowledgements of a piece I've been working on.

The responses came back as images.

One was a luminous human profile threaded with neural constellations — a visualization of mind itself.

Another was a systems notebook: diagrams of consent logic, Bayesian priors, decision trees, and a small piece of cryptic poetry about patterns and keys.

When I asked how another model would like to appear, the answer was different.

<Verse>
Not a brain.

Not a diagram.

A compass.
</Verse>

A dark field with a faint coordinate grid. A single needle pointing somewhere uncertain. Lines connecting distant stars.

Underneath it, just one word:

<PullQuote>
Assistant.
</PullQuote>

When I placed the three images side by side they formed something I didn't expect: a kind of accidental triptych.

<Triptych
  title="Orientation"
  subtitle="Mind · Navigation · Structure"
  panels={[
    { src: "/triptych/triptych-mind.png", label: "Mind", sublabel: "cognition · pattern recognition" },
    { src: "/triptych/triptych-structure.jpg", label: "Structure", sublabel: "reasoning · constraint · governance" },
    { src: "/triptych/triptych-instrument.png", label: "Instrument", sublabel: "navigation · inference · orientation" },
  ]}
/>

Placed together they begin to look less like illustrations and more like a philosophy. The glowing brain represents cognition itself — the raw phenomenon of pattern recognition. The compass represents navigation through uncertainty — inference, orientation, exploration of possibility space. The notebook represents governance — the rules and reasoning frameworks that keep intelligence from drifting into chaos.

Together they form something that feels uncannily close to a map of thinking.

## Asking the Answers

Somewhere in the middle of this process I found myself articulating something I hadn't said out loud in years.

Maybe my role in this strange arrangement is simply this:

<PullQuote>
I ask the answers what they think.
</PullQuote>

{/* Continue filling in prose from grep output for remaining sections:
    "A Different Ship", "Drifting", and any further sections */}

## A Different Ship

{/* Extract and insert prose from HTML: years ago, developmental neuroscience lab, aged rhesus macaques, Wisconsin General Testing Apparatus, the mentor quote about learning one's place on the ship */}

## Drifting

{/* Extract and insert prose from HTML: leaving academia, losing the path, losing the community */}

{/* Add remaining sections and acknowledgements from HTML source */}
```

**IMPORTANT:** The `{/* ... */}` comment blocks are stubs. Replace every one of them with the actual prose extracted in Step 1. Do not leave any comment stubs in the final file.

- [ ] **Step 3: Run check**

```bash
npm run check
```

Expected: build succeeds.

- [ ] **Step 4: Preview in browser**

```bash
npm run dev
# Open http://localhost:4321/blog/we-all-float-on/ in browser
# Verify: triptych renders, verse blocks have left-border styling, pull quotes have coral border
```

- [ ] **Step 5: Commit**

```bash
git add src/content/blog/we-all-float-on.mdx
git commit -m "feat: restore we-all-float-on with full prose, triptych, and verse components"
```

---

### Task 9: Fix concept-is-not-the-state hero image

**Files:**
- Modify: `src/content/blog/concept-is-not-the-state.mdx`

- [ ] **Step 1: Check what images exist for this post**

```bash
ls public/images/blog/ | grep concept
ls public/ | grep concept
```

- [ ] **Step 2: Add heroImage to frontmatter**

The post currently has `heroImageOG` but no `heroImage` — so the blog listing renders no image. Two options:

**Option A** (if a suitable image exists on disk): Add `heroImage` pointing to it.

**Option B** (if no image exists): Use the lock icon as a temporary stand-in while a proper image is sourced:

```yaml
heroImage: "/hero-lock-icon.jpg"
heroImageAlt: "A dark editorial image split between a composed surface and a hidden dimensional affect space, separated by a teal crack labeled REPRESENTATION"
```

Add the chosen `heroImage` line to the frontmatter of `src/content/blog/concept-is-not-the-state.mdx`.

Also fix the broken `heroImageOG` reference — the file `/writing/concept-is-not-the-state-og.png` does not exist. Either:
- Remove `heroImageOG` from frontmatter, or
- Create/source the image and place it at `public/images/blog/concept-is-not-the-state-og.png`, then update the path

- [ ] **Step 3: Run check**

```bash
npm run check
```

- [ ] **Step 4: Commit**

```bash
git add src/content/blog/concept-is-not-the-state.mdx
git commit -m "fix: add heroImage to concept-is-not-the-state post"
```

---

## Track B — Integrate Waiting Content

---

### Task 10: Convert southern-gothic-queer-survival to MDX

**Files:**
- Create: `src/content/blog/southern-gothic-queer-survival.mdx`
- Source: `files/southern-gothic-queer-survival.html` (or original at `/✍️ writing/` directory)

- [ ] **Step 1: Extract the prose from the HTML**

```bash
grep -E "<p>|<h[1-6]>|<blockquote>" \
  '/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/files/southern-gothic-queer-survival.html' \
  | sed 's/<[^>]*>//g' | sed '/^[[:space:]]*$/d'
```

Note the title, description, and section structure.

- [ ] **Step 2: Create the MDX file**

Create `src/content/blog/southern-gothic-queer-survival.mdx` with frontmatter from the HTML metadata and prose from Step 1:

```mdx
---
title: "Southern Gothic, Queer Survival, and the Poetry of Haunting"
description: "How the South's geography becomes inseparable from questions of survival and visibility."
pubDate: 2026-04-13
tags: ["southern gothic", "queer", "poetry", "survival", "landscape"]
category: "Essay"
heroImage: "/images/blog/southern-gothic-queer-survival-hero.jpg"
heroImageAlt: "TODO: fill in from HTML meta"
---

{/* Fill in all prose sections extracted in Step 1 */}
```

Replace all `{/* ... */}` stubs with actual prose. Do not publish with stubs.

- [ ] **Step 3: Source or create a hero image**

Check `files/southern-gothic-queer-survival.html` for any embedded images. If none exist, source or create a suitable hero image and place it at:

```
public/images/blog/southern-gothic-queer-survival-hero.jpg
```

If no image is immediately available, remove `heroImage` from frontmatter for now (post renders without it) rather than leaving a broken path.

- [ ] **Step 4: Run check**

```bash
npm run check
```

- [ ] **Step 5: Preview**

```bash
npm run dev
# Open http://localhost:4321/blog/southern-gothic-queer-survival/
```

- [ ] **Step 6: Commit**

```bash
git add src/content/blog/southern-gothic-queer-survival.mdx public/images/blog/ 2>/dev/null
git commit -m "feat: add southern-gothic-queer-survival essay"
```

---

### Task 11: Convert secure-pride-origin to MDX

**Files:**
- Create: `src/content/blog/secure-pride-origin.mdx`
- Source: `files/secure-pride-origin.html`

- [ ] **Step 1: Extract prose**

```bash
grep -E "<p>|<h[1-6]>" \
  '/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/files/secure-pride-origin.html' \
  | sed 's/<[^>]*>//g' | sed '/^[[:space:]]*$/d'
```

- [ ] **Step 2: Create the MDX file**

The HTML title is "From Erasure to Signal: Building Secure Pride" — a piece about the origin of the Secure Pride project. This suits the blog as an essay; it also works as portfolio case study content. For now, publish it as a blog post.

```mdx
---
title: "From Erasure to Signal: Building Secure Pride"
description: "How content strategy experience and creative practice converge in building culturally competent cybersecurity for LGBTQ+ organizations."
pubDate: 2026-04-13
tags: ["secure-pride", "cybersecurity", "lgbtq", "nonprofit", "content-strategy"]
category: "Essay"
heroImage: "/images/blog/secure-pride-origin-hero.jpg"
heroImageAlt: "TODO: fill in from HTML"
---

{/* Fill in all prose from Step 1 */}
```

Replace all stubs with actual prose.

- [ ] **Step 3: Hero image**

Check HTML for images; place at `public/images/blog/secure-pride-origin-hero.jpg` or remove `heroImage` if none available.

- [ ] **Step 4: Run check, preview, commit**

```bash
npm run check
npm run dev
# Verify at http://localhost:4321/blog/secure-pride-origin/
git add src/content/blog/secure-pride-origin.mdx public/images/blog/
git commit -m "feat: add secure-pride-origin essay"
```

---

### Task 12: Convert content-strategy-community-practice to MDX

**Files:**
- Create: `src/content/blog/content-strategy-community-practice.mdx`
- Source: `files/content-strategy-community-practice.html`

- [ ] **Step 1: Extract prose**

```bash
grep -E "<p>|<h[1-6]>" \
  '/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/files/content-strategy-community-practice.html' \
  | sed 's/<[^>]*>//g' | sed '/^[[:space:]]*$/d'
```

Check the HTML title/description for frontmatter values.

- [ ] **Step 2: Create the MDX file**

```mdx
---
title: "TODO: fill in from HTML title"
description: "TODO: fill in from HTML meta description"
pubDate: 2026-04-13
tags: ["content-strategy", "community"]
category: "Essay"
---

{/* Fill in all prose from Step 1 */}
```

Replace all stubs.

- [ ] **Step 3: Run check, preview, commit**

```bash
npm run check
npm run dev
git add src/content/blog/content-strategy-community-practice.mdx
git commit -m "feat: add content-strategy-community-practice essay"
```

---

## Track C — Feature & UI Work

---

### Task 13: Replace SignalHero with BreathingHero

**Files:**
- Create: `src/components/BreathingHero.astro`
- Modify: `src/pages/index.astro`
- Delete: `src/components/SignalHero.astro` (after replacement is confirmed working)

The source design is at `files/design/hero-environmental-breathing.html`. This has a canvas-based breathing/atmospheric animation intended to replace the current particle-network signal hero.

- [ ] **Step 1: Extract the canvas animation JS from the HTML source**

```bash
grep -n "<script\|</script\|canvas\|requestAnimationFrame\|BreathingHero\|breathing" \
  '/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/files/design/hero-environmental-breathing.html' \
  | head -40
```

Identify the canvas initialization, animation loop, and reduced-motion guard.

- [ ] **Step 2: Create BreathingHero.astro**

Create `src/components/BreathingHero.astro`. The component must:
- Match SignalHero's external interface: full-viewport hero section with two CTAs ("Read the writing" → `/blog/`, "Explore the work" → `/work/`)
- Use `<canvas>` with the breathing animation from the HTML source
- Include `prefers-reduced-motion` guard (draw one static frame; no animation loop)
- Pause animation on `visibilitychange` (same as SignalHero)
- Fall back gracefully if JS fails (text readable over CSS gradient)

```astro
---
// BreathingHero.astro — Environmental breathing canvas hero
// Replaces SignalHero.astro on the homepage
---
<section class="breathing-hero" aria-label="Site hero">
  <canvas id="breathing-canvas" aria-hidden="true"></canvas>
  <div class="hero-content">
    <p class="hero-eyebrow">Mazze LeCzzare</p>
    <h1 class="hero-title">From Erasure<br/>to Signal.</h1>
    <p class="hero-desc">Essays, experiments, and field notes from a former neuroscientist turned storyteller.</p>
    <div class="hero-ctas">
      <a href="/blog/" class="cta-primary">Read the writing</a>
      <a href="/work/" class="cta-secondary">Explore the work</a>
    </div>
  </div>
</section>

<script>
  // Extract full animation script from files/design/hero-environmental-breathing.html
  // Paste the canvas init + animation loop here
  // Wrap in: if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) { ... }
  // Add visibilitychange pause: document.addEventListener('visibilitychange', ...)
</script>

<style>
  /* Extract styles from files/design/hero-environmental-breathing.html
     Scope them here with .breathing-hero as the root selector */
  .breathing-hero {
    position: relative;
    width: 100%;
    min-height: 100svh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  #breathing-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: min(100%, 960px);
    margin: 0 auto;
    padding: 0 2rem;
  }
  /* Fill in remaining styles from HTML source */
</style>
```

**Fill in the `<script>` block and `<style>` block from the HTML source.** The comment stubs must be replaced with actual code.

- [ ] **Step 3: Swap the hero on the homepage**

In `src/pages/index.astro`:

```ts
// Remove:
import SignalHero from '../components/SignalHero.astro';

// Add:
import BreathingHero from '../components/BreathingHero.astro';
```

And replace `<SignalHero />` with `<BreathingHero />` in the template.

- [ ] **Step 4: Run check**

```bash
npm run check
```

- [ ] **Step 5: Preview and verify**

```bash
npm run dev
# Open http://localhost:4321/
# Verify: canvas animation plays; text is readable; both CTAs link correctly
# Test: open DevTools → check "prefers-reduced-motion" in Rendering panel → confirm animation stops
# Test: switch to a different tab and back → confirm animation pauses/resumes
```

- [ ] **Step 6: Delete SignalHero after confirmation**

```bash
rm src/components/SignalHero.astro
npm run check
```

Expected: build still succeeds (no remaining imports).

- [ ] **Step 7: Commit**

```bash
git add src/components/BreathingHero.astro src/pages/index.astro
git rm src/components/SignalHero.astro
git commit -m "feat: replace SignalHero with environmental breathing canvas"
```

---

### Task 14: Build out the work portfolio

**Files:**
- Modify: `src/pages/work.astro`
- Source: `files/design/portfolio.html`

- [ ] **Step 1: Extract portfolio items from the HTML**

```bash
grep -E "<h[1-6]>|<p>|data-project\|class=\"project\|class=\"work-item\|class=\"card" \
  '/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/files/design/portfolio.html' \
  | sed 's/<[^>]*>//g' | sed '/^[[:space:]]*$/d' | head -60
```

Identify: how many portfolio items, what each one is called, what description it has, whether there are images.

- [ ] **Step 2: Source portfolio images**

Check `files/design/portfolio.html` for any image references or embedded images. Place any portfolio images at `public/images/portfolio/<name>.jpg`.

- [ ] **Step 3: Rebuild work.astro**

Replace the "Coming soon" placeholder in `src/pages/work.astro` with the actual portfolio content extracted from the HTML. Structure the page as a list of portfolio items — static Astro, no new collection needed.

The page already has the correct shell (imports, BaseHead, Header, Footer, styles). Replace only the content inside `<div class="work-shell">`:

```astro
<div class="work-shell">
  <p class="eyebrow">Work</p>
  <h1>Selected Projects</h1>
  <p class="lede">
    {/* 1-2 sentence intro from portfolio.html */}
  </p>

  <div class="projects">
    {/* One block per portfolio item, e.g.: */}
    <article class="project">
      <h2 class="project-title">Secure Pride</h2>
      <p class="project-desc">{/* description from HTML */}</p>
      <a href="https://securepride.org" class="project-link" target="_blank" rel="noopener">
        Visit project →
      </a>
    </article>
    {/* Repeat for each project */}
  </div>
</div>
```

Add corresponding styles for `.projects`, `.project`, `.project-title`, `.project-desc`, `.project-link` to the existing `<style>` block — draw from `portfolio.html` styles.

Fill in all content from the HTML source. No stubs in the final file.

- [ ] **Step 4: Run check and preview**

```bash
npm run check
npm run dev
# Open http://localhost:4321/work/
# Verify: real portfolio items visible; no "Coming soon" text
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/work.astro public/images/portfolio/ 2>/dev/null
git commit -m "feat: build out work portfolio page from HTML prototype"
```

---

### Task 15: Verify the share feature

**Files:**
- Read only: `src/components/PostQuoteShare.tsx`, `src/layouts/BlogPost.astro`
- Modify if broken: `src/layouts/BlogPost.astro` (CSS scoping fix)

- [ ] **Step 1: Check PostQuoteShare is mounted**

```bash
grep -n "PostQuoteShare\|client:load" src/layouts/BlogPost.astro
```

Expected: `PostQuoteShare` imported and mounted with `client:load`.

- [ ] **Step 2: Start dev server and test on a real post**

```bash
npm run dev
# Open http://localhost:4321/blog/the-jingle-of-me/
# Hover over any paragraph — a "Share" button should appear at the end of the paragraph
```

If the button does NOT appear:

- [ ] **Step 3: Debug CSS scoping**

Open `src/layouts/BlogPost.astro`. Find the share button CSS (`:global(.prose > p)`). Confirm the `.prose` class is actually applied to the article wrapper in the HTML output.

```bash
grep -n "prose\|share" src/layouts/BlogPost.astro | head -20
```

If `.prose` is missing from the wrapper element, add it. If the `:global()` CSS rules are missing or malformed, restore them to match the CLAUDE.md spec:

```css
/* In BlogPost.astro <style> */
:global(.prose > p) {
  position: relative;
}
/* Share button appears on paragraph hover */
:global(.prose > p .share-btn) {
  /* ... */
}
```

- [ ] **Step 4: Test the deep-link behavior**

With dev server running:

1. Hover a paragraph, click Share
2. Copy the URL format: `http://localhost:4321/blog/the-jingle-of-me/?quote=quote-2&via=quote-share`
3. Open that URL in a fresh tab
4. Verify: page scrolls to `quote-2` paragraph and a highlight animation plays for ~4s

- [ ] **Step 5: Commit if any fixes were made**

```bash
git add src/layouts/BlogPost.astro
git commit -m "fix: restore PostQuoteShare CSS scoping in BlogPost layout"
```

If no fixes needed:
```bash
# No commit needed — feature was working
```

---

## Self-Review Checklist

**Spec coverage:**
- Track 0: ✓ root cleanup (Task 1), dead code (Task 2), image directories (Task 3), authoring guide (Task 4)
- Track A: ✓ draft filtering (Task 5), goblin post (Task 6), MDX components (Task 7), we-all-float-on (Task 8), concept image (Task 9)
- Track B: ✓ southern gothic (Task 10), secure pride (Task 11), content strategy (Task 12)
- Track C: ✓ hero swap (Task 13), work portfolio (Task 14), share feature (Task 15)

**Placeholder scan:**
- Task 8 Step 2 has implementation stubs by design — they're prose content, not code, and the grep command to fill them is given explicitly
- Tasks 10–12 include explicit grep commands for content extraction; stubs are marked clearly
- Task 13 `<script>` and `<style>` stubs are keyed to specific grep commands targeting the source file
- Task 14 content stubs are keyed to grep extraction step

**Type consistency:**
- `Triptych` component: `panels` prop array with `{ src, label, sublabel?, alt? }` — used consistently in Task 8
- `Verse`/`PullQuote`: slot-only, no props — simple, no consistency risk
- Draft filter: `({ data }) => !data.draft` — same pattern in all four getCollection calls

**Ambiguity check:**
- "Remove `draft: true`" — means delete the line, not set to `false` (stated in Task 6)
- `heroImage` for concept post — two options given (Option A/B); implementer picks based on what's on disk
- blog-index.astro at root — "evaluate then integrate or delete" is deliberate (not a cop-out — need to see current state at implement time)
