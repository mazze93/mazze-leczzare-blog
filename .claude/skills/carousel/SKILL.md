---
name: carousel
description: Turn an existing long-form post on mazze-leczzare-blog into a shareable LinkedIn carousel (a multi-slide portrait/square PDF) and file it on the site. Use this whenever the user asks to make a carousel, slide deck, or "shareable version" of a post, wants something to post on LinkedIn, or references sharing a post more broadly. Covers slide-copy distillation, the editorial and fact gate, the repo-native build (slides.json → tagged PDF via scripts/carousel/build.py), site placement, and linking back from the source post.
---

# Carousel

Distills a long-form post into an 8–10 slide carousel PDF and files it on the
site next to the post it came from. The pipeline lives in the repo, so every
deck is reproducible from one data file:

```
docs/social/<slug>/slides.json  ──build.py──▶  public/social/<slug>.pdf
        (the source; committed)                  (the deliverable; committed)
                                   └──▶ docs/social/<slug>/build/  (PNGs, HTML; gitignored)
```

**Reference build:** `the-attack-surface-of-security-language` — read its
`slides.json` and the PDF before starting. The two earlier decks
(`maestro-in-practice`, `concept-is-not-the-state`) were made with a
PNG-assembly process this skill has retired: their PDFs have no text layer,
and their canvas sources were never committed, so they can't be rebuilt.
Use them as visual-register references only.

## 0. Setup (once per environment)

```bash
npm ci                                   # @fontsource fonts the build inlines
python3 -m playwright install chromium   # if `playwright` can't find a browser
pip install pypdf                        # PDF verification
```

The repo requires Node ≥ 22 and **npm ≥ 11** with engine-strict on. If
`npm ci` fails with `EBADENGINE`, install a matching npm. Don't bypass the
pin with `--engine-strict=false`.

## 1. Read the source post fully before writing a word of slide copy

Read `src/content/blog/<slug>.md(x)` directly. Don't work from a summary or
from memory of the conversation that produced it. The carousel compresses the
post's actual argument. Note `contentType` (dispatch / artifact / field-note:
the register), title and subtitle, the section structure, and **every
factual claim with a footnote**. Those become your corroboration list in step 3.

## 2. Pick 8–10 beats, not more, and write them as data

Write `docs/social/<slug>/slides.json`. Standard shape, adapt as needed:
cover (title plus a one-line hook sharper than the `description`) → framing →
2–3 core claims, one per slide → the fix or critique the post turns on (usually
the strongest slide; don't bury it) → a supporting finding → the human or
practical stakes → close with a boxed callout and URL. Cut to 8 rather than
pad to 10.

Rules that came out of real builds:

- **Every slide carries a `source` note** (post line numbers or the primary
  source). It isn't rendered. It's what lets the copy be audited.
- **Keep the post's lists at their real length.** Trimming a 5-item list to 3
  manufactures a triad, a Claude-ism the post didn't commit. It also drops
  whatever got cut, which in the reference build was the sharpest item.
- **Never upgrade a citation.** If the post says a framework *acknowledges
  context*, the slide can't say the framework *endorses the post's fix*.
  Labels are the usual place this creeps in.
- The author's own lines can be used verbatim, including his constructions.
  The gate below only flags what the carousel introduces.

Slide kinds the renderer supports: `cover`, `statement`, `definition`
(headword + struck naive reading + governed reading), `senses` (numbered),
`manifest` (a schema block), `evidence` (citation cards), `close`. Field names
are in `scripts/carousel/render.py`. Add a kind there rather than hand-writing
a one-off slide.

## 3. The gate: prose-touchstone and fact corroboration (not optional)

Nothing goes to social media without this. The author's reputation as a
writer is the stake.

1. **Corroborate every factual claim on a slide against its primary source**,
   not the post's paraphrase and not a secondary article. Record what you
   checked and when in that slide's `source` field. If a primary source can't
   be reached, say so to the user. Don't ship the claim on the strength of the
   footnote alone.
2. **Run the copy probe.** `build.py` runs it automatically and fails the build
   on introduced negation pivots ("not X. It's Y", "X, not Y", "not only…but")
   or stock filler. It also reports tricolons and three-item lists for you to
   **curate by hand**: a hit inside the post's own list is a false positive,
   and a list you trimmed to three is not. Say which is which.
   ```bash
   python3 scripts/carousel/copy_probe.py docs/social/<slug>/slides.json src/content/blog/<slug>.md
   ```
3. **Probe the probe.** A clean result is provisional until a restated form of
   the same tic would still be caught. The detector's `self_test()` holds the
   restated forms that once slipped past. When you find a new miss, add it
   there in the same commit.
4. Load the `prose-touchstone` skill for anything the regexes can't see
   (voice, rhythm, a construction nobody has named yet), and report per
   claim: held / did not hold / accepted trade-off.

## 4. Choose the visual register

Don't default to the site's palette. Pick the register the argument earns,
and when in doubt, show the user two low-fi options. Themes live in
`scripts/carousel/themes/<name>.css`, and `slides.json` names one with
`"theme"`.

| Deck | Register | Why |
|---|---|---|
| maestro-in-practice | Cipher Gothic tokens: obsidian, teal/gold/coral, Cormorant + DM Mono | studio research report, the site's own voice |
| concept-is-not-the-state | black/cream/brick-red, heavy Poppins, grid paper | confrontational critique of a popular framing |
| the-attack-surface-of-security-language | **Lexicon** (`themes/lexicon.css`): paper and ink, Playfair headwords, mono part-of-speech, one redline accent for diffs | the post argues about *words*, so the deck is a dictionary whose entries get struck and governed |

Whatever the register, these stay fixed:

- the same chrome on every slide: running head (eyebrow + guide word) and
  footer (byline · mazzeleczzare.com · page count). A slide reshared alone
  still carries the byline home.
- a boxed callout for the closing line, never a bare line (bare lines read as
  unfinished).
- content blocks vertically centered, so short slides don't sit top-heavy.
- one frame size held across the deck: 1080×1350 (portrait, more feed) or
  1080×1080 (square).

A new theme has to pass `contrast.py`. Contrast numbers in a theme's header
comment are **measured, not estimated**. In the reference build, the estimates
were wrong in every row. Two more rules learned the hard way:

- **Mono tracking ≤ .08em.** Above that, Chromium positions each glyph
  separately, and the PDF text layer reads "D I S P A T C H". `build.py`
  fails on it.
- **Type sizes are set for a phone.** A 1080px slide is shown at roughly
  380px in the feed, so nothing below 25px in the frame (about 9px on a
  phone). Body copy ≥ 36px.

## 5. Build, look, fix

```bash
python3 scripts/carousel/build.py <slug>          # gates + render + checks
python3 scripts/carousel/build.py <slug> --ship   # …and copy PDF to public/social/
```

The build fails loudly at each stage: copy gate → contrast → render (one
self-contained HTML, fonts inlined) → layout (DOM overflow and gutter check)
→ **one tagged `page.pdf()` call** → PDF verify (page count = slides, text
layer on every page, no letter-spaced runs, structure tree intact, metadata
set). The PDF is printed from the HTML rather than assembled from
screenshots, so it keeps selectable, searchable, screen-readable text.

Passing checks aren't the same as looking. Open
`docs/social/<slug>/build/slide-NN.png` (make a contact sheet) and judge every
slide at frame size: diff markers that inherit a strikethrough, wrapped lines
hanging off the marker instead of the text, URLs breaking mid-word, and
inconsistent placement between slides with long and short words were all
caught this way, not by a check. Send the user the contact sheet once
it's clean, before filing.

Want an editable or shareable link for review? Publish
`build/carousel.html` with the `Artifact` tool. It's optional. The committed
source of truth is `slides.json`.

## 6. File it on the site

- `--ship` puts the PDF at `public/social/<slug>.pdf` (slug = the post's URL
  slug exactly, per CLAUDE.md's Directory Structure).
- Add one line at the end of the post's prose, before `## Sources` if there
  is one:
  ```markdown
  > **Shareable version:** [an N-slide carousel (PDF)](/social/<slug>.pdf) distilling <what it covers> — built for LinkedIn, sized for anywhere else.
  ```
  That line is prose. Run it past the same gate as the slides (no
  manufactured triad in "what it covers").
- Don't add it to `writing/index.astro`. Carousels are derivative
  collateral.
- `npm run check` and `npm run docs:check` must pass. Then **resolve the link
  in the build**, don't grep for it: confirm
  `dist/blog/<slug>/index.html` links `/social/<slug>.pdf` and that
  `dist/social/<slug>.pdf` is byte-identical to the built PDF.

## 7. Ship, and confirm it's live

Commit `slides.json`, the PDF, and the post edit together on a branch, and
open a PR. Merging to `main` deploys to Cloudflare Pages, which is publishing,
so get the user's explicit go first. After deploy, fetch the live post and the
live PDF URL. Cloudflare rewrites pages at the edge, and only the live URL
proves the deploy.

Posting to LinkedIn itself is a separate, explicit step the user takes or
approves. Hand them the PDF and, if they ask, post copy that's been through
the same gate.

## Known debt

- `maestro-in-practice.pdf` and `concept-is-not-the-state.pdf` have no text
  layer and no committed source. Rebuilding them means writing their
  `slides.json` and a theme for each register. Until then they're
  image-only on the site.
