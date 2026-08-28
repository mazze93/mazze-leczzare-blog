---
name: carousel
description: Turn an existing long-form post on mazze-leczzare-blog into a shareable LinkedIn carousel (a multi-slide square/portrait PDF) and attach it to the site. Use this whenever the user asks to make a carousel, slide deck, or "shareable version" of a post, wants something to post on LinkedIn, or references sharing content more broadly and the underlying material is a blog post on this site. Covers slide-copy distillation, the Design Components build process, PDF assembly, site placement, and linking back from the source post.
---

# Carousel

Distills a long-form post into an 8–10 slide carousel PDF, publishes it as an
editable canvas, and files it on the site next to the post it came from —
without re-deriving the visual system or the file conventions from scratch
each time. Two worked examples exist end to end: `src/content/blog/maestro-in-practice.md`
(carousel at `public/social/maestro-in-practice.pdf`) and
`src/content/blog/concept-is-not-the-state.mdx` (carousel at
`public/social/concept-is-not-the-state.pdf`). Read one before starting if
you want to see the pattern applied rather than just described.

## 1. Read the source post fully before writing a word of slide copy

Don't distill from a summary of the post or from memory of the conversation
that produced it — read `src/content/blog/<slug>.md(x)` directly. The
carousel's job is to compress the post's actual argument, not to restate
whatever framing came up while discussing it. Note as you read:
`contentType` (dispatch/artifact/field-note — tells you the post's register),
`title`/`subtitle`, and the section structure — most posts already have a
natural slide-per-section shape (executive summary → core findings →
recommendation → close) that saves you from inventing one.

## 2. Pick 8–10 beats, not more

A carousel that runs long loses LinkedIn's swipe-through rate. Standard
shape, adapt as needed:

1. **Cover** — title + a one-line hook (not the post's `description` verbatim
   — sharper, shorter).
2. **Framing/context** — what the post is responding to, in plain terms.
3–4. **Core claims or findings** — the two or three things a reader should
   walk away knowing, one per slide where possible.
5. **The critique or the fix** — whatever the post's actual argument turns
   on. This is usually the strongest slide; don't bury it.
6. **A supporting finding or stat**, if the post has one worth a slide of
   its own.
7. **Why it matters / the bigger frame** — optional, use if the post has a
   real "so what" beyond the headline claim.
8. **CTA** — one line back to the full post's URL.

Every slide needs a short headline plus, usually, one supporting line or a
2–3 item list. Never pad a thin slide with filler — cut to 8 slides rather
than stretch to 10.

## 3. Choose the visual register — don't default to the site's Cipher Gothic system

The two worked examples deliberately use *different* systems, and that's
correct, not drift:

- **MAESTRO in Practice** (a security research report) uses the site's own
  Cipher Gothic tokens: obsidian/deep-navy ground, teal/gold/coral accent
  hierarchy, Cormorant Garamond + DM Mono. Appropriate because the post
  *is* the kind of studio work the site's primary palette was built for.
- **The Concept Is Not the State** (a confrontational critique essay) uses a
  louder, purpose-built system: alternating black/cream/brick-red
  backgrounds, a heavy Poppins grotesk, a faint grid-paper texture. Chosen
  because the post argues against a popular framing, and a punchier
  register serves that better than the site's usual editorial calm.

Read the post's `contentType` and tone before defaulting to Cipher Gothic.
`dispatch` (critique/position pieces) and `artifact` (shipped/technical work)
can both justify a distinct register if the content calls for it; when in
doubt, ask, or build 2 low-fi direction options and let the user pick — see
the `design` skill's "Settle the aesthetic with the user" guidance. Whatever
system you pick, apply it consistently: same chrome (top eyebrow label,
bottom footer with page count), same closing-line treatment (a boxed
callout, not a bare line — see the fix applied to `concept-is-not-the-state`
for why bare closing lines read as unfinished), and **attribution on every
single slide**, including any full-bleed color/statement slides — a slide
that gets screenshotted and reshared alone still needs to carry the byline
back to the site.

## 4. Build it as a Design Components canvas

Invoke the `design` skill (it is not optional — it owns the seed/publish
mechanics, the `.dc.html` format, and the runtime contract pin). Build one
`.dc.html` artboard per slide (`Main.dc.html` for the cover, `Slide02.dc.html`
onward), plus a `canvas.json` laying them out in a row with
`"print": "fixed"` on every artboard — this is a series of single-page
pieces, not one flowing document. Use the frame size that matches your
platform target: 1080×1350 (portrait, more feed real estate) or 1080×1080
(square, safest default) both work for LinkedIn; pick one and hold it across
every slide in the deck.

Screenshot-check before publishing (Playwright + the pre-installed Chromium
at `/opt/pw-browsers/chromium-*/chrome-linux/chrome` — run the script from
inside the repo directory, or `playwright` won't resolve). Look at every
slide at the real frame size and fix overflow, cramped type, or dead
vertical space before you publish — a slide with a headline and a 3-item
list will look top-heavy and unfinished unless the content block is
vertically centered in the frame (`display:flex; flex-direction:column;
justify-content:center` on the content container), not top-anchored.

Publish with the `Artifact` tool per the `design` skill's step 4 (pin
`contract`, declare capabilities from the roster, one favicon emoji held
stable). This gives the user an editable, sharable link to the canvas
itself — hand it over even though the PDF is the actual deliverable that
goes on the site.

## 5. Assemble the PDF from the checked screenshots, don't wait on the in-editor export

The canvas editor's "Export PDF" is a manual, browser-only toolbar action —
there's no way to trigger it from here. Since you already rendered every
slide as a PNG for the visual check in step 4, assemble those directly into
a multi-page PDF instead of asking the user to export by hand:

```python
from PIL import Image
imgs = [Image.open(f).convert('RGB') for f in ['Main.png', 'Slide02.png', ...]]
imgs[0].save('out.pdf', save_all=True, append_images=imgs[1:])
```

(`pip install Pillow` into a scratch venv if the environment's Python
doesn't have it — don't touch the site's own Node toolchain for this.) This
produces a page-per-slide PDF at the exact resolution you already verified
visually, which is what actually matters for a LinkedIn upload.

## 6. File it on the site

- PDF goes at `public/social/<slug>.pdf`, `<slug>` matching the source
  post's URL slug exactly — this convention is documented in CLAUDE.md's
  Directory Structure section.
- Add one line to the end of the source post's prose (not frontmatter),
  matching the "Formal companion" pattern already used for `/papers/`:

  ```markdown
  > **Shareable version:** [an N-slide carousel (PDF)](/social/<slug>.pdf) distilling <one clause naming what it covers> — built for LinkedIn, sized for anywhere else.
  ```

- Do **not** add it to `writing/index.astro`'s catalogue — that page lists
  primary works, and a carousel is derivative promotional collateral for a
  post that's already listed there. Linking from the post itself is the
  right amount of visibility.
- Run `npm run check` and `npm run docs:check` after editing the post (the
  new prose line and the PDF path both need to resolve cleanly) — see
  `publish-essay`'s validation step for why this matters even for a
  small-looking change.

## Worked examples

`public/social/maestro-in-practice.pdf` (9 slides, 1080×1350, Cipher Gothic
register) and `public/social/concept-is-not-the-state.pdf` (8 slides,
1080×1080, black/cream/red register) were both built with this exact
process in the same session. Diff their source posts' final paragraphs to
see the "Shareable version" line pattern applied twice, and compare the two
`.dc.html` systems to see how the register changes while the structural
conventions (chrome, footer attribution, boxed closing lines) stay fixed.
