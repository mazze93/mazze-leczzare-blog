---
name: publish-essay
description: Turn a pasted essay (plus an optional hero image) into a new blog post on mazze-leczzare-blog and open a draft PR. Use this whenever the user pastes or attaches essay/article text and asks to add it to the blog, publish it, "turn this into a post," or shares a hero image alongside long-form prose — even if they don't say the word "skill" or name a file path. Covers frontmatter authoring, citation formatting, image placement, validation, and the git/PR workflow end to end.
---

# Publish Essay

Takes a pasted essay (and, often, a hero image attached to the same message) and
turns it into a committed, validated, PR'd blog post — without re-discovering
this repo's conventions from scratch each time. This repo already documents its
content-collection schema in `CLAUDE.md` under "Content Collections" — read that
section for the authoritative field list rather than trusting a copy here, since
copies drift.

## 1. Decide frontmatter values that aren't obvious from the schema

The schema tells you *what* fields exist; it doesn't tell you *which value* to
pick. These are the judgment calls, made once so you don't re-derive them by
grepping every post each time:

- **`contentType`**: `'dispatch'` for a position piece / critique (the essay
  argues a claim, like this skill's own worked example — see below). `'artifact'`
  only if it ships a repo/transcript/skill alongside it. `'field-note'` (the
  default — can be omitted) for a personal/reflective essay.
- **`project`**: run `grep -n "^project:" src/content/blog/*.md*` once to see
  the current slugs in use (as of writing: `secure-pride`, `context-synapse`,
  `cognitive-topology`, `intentional-fragility`). If the essay's subject matches
  an existing project's ongoing work, reuse that slug — don't invent a new one
  unless the essay genuinely starts a new thread. If it doesn't fit any, omit
  the field entirely rather than forcing it.
- **`committed`**: `true` if the piece is meant to seal into that project's
  permanent signal (most essays tied to an active project are). Omit if unsure
  — it's easier to add later than to walk back.
- **`draft`**: `false` once you're actually publishing. Set `true` only if the
  user explicitly wants it staged but hidden.
- **File extension**: `.md` unless the essay needs one of the MDX prose
  components (`Verse`, `PullQuote`, `Triptych`, `MentorQuote`, `VerseBlock`,
  `ArtifactEmbed`, `SectionBreak`) — importing those requires `.mdx`. Most
  pasted essays are plain prose and don't need this.
- **`slug`**: only set explicitly if you want the URL to differ from the
  filename — otherwise the filename already determines it, and repeating it
  is just convention-following, not required.
- **`pubDate`**: today's date, unless the user gives you one.
- **`readingTime`**: estimate from word count (~200 wpm) rather than skipping it.

## 2. Convert citations to the site's footnote convention

If the essay uses bracket citations (`claim.[1][2]` ... `[1] Source Name URL`),
convert to Markdown footnotes so they render correctly (the site's `remark-gfm`
pipeline supports `[^n]` footnotes — bare `[1]` bracket text does not become a
link or a footnote, it just renders as literal text):

```markdown
...places organizational context and governance at the center of risk
management.[^1][^2]
```
```markdown
## Sources

[^1]: NIST. [Artificial Intelligence Risk Management Framework (AI RMF 1.0).](https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf)

[^2]: NIST. [The NIST Cybersecurity Framework (CSF) 2.0.](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf)
```

If the essay has no citations, skip this — most don't.

## 3. Place the hero image, if one was provided

Copy it into `src/assets/images/blog/` with a descriptive kebab-case name ending
`-hero.<ext>` (existing names are inconsistent about prefixing with the post
slug — don't feel bound to match the post filename). Reference it in frontmatter
as a relative path (`../../assets/images/blog/whatever-hero.png`), not a root
path — Astro's image pipeline needs the relative import to process it. Write
`heroImageAlt` yourself by describing what's actually in the image; don't leave
it out just because the user didn't dictate alt text.

If no image was provided, omit `heroImage` entirely rather than inventing one.

## 4. Validate before committing

```bash
bash .claude/skills/publish-essay/scripts/validate.sh
```

This runs `npm run check` and `npm run docs:check` — the two repo-standard
gates — but filters the output to pass/fail plus only the error lines. Running
`npm run check` directly works too, but it prints ~150 lines of route listings
and image-optimization logs for a 40-page site; the wrapper exists so you don't
have to read past that noise on every essay.

Never skip this step. A missed relative-path typo in `heroImage` or a schema
field typo builds locally-fine-looking output but fails `astro build` — better
to catch it here than in CI.

## 5. Commit, push, open a draft PR

Standard repo git flow applies (see the top-level git instructions for this
session for branch/commit/PR mechanics). A few things specific to this
workflow:

- Commit message: imperative subject line naming the essay title, body
  explaining the piece's actual argument in 2-3 sentences (not "adds a blog
  post" — say what it claims).
- Check `.github/pull_request_template.md` and fill it in from the diff.
- The PR is about a single essay — don't bundle unrelated fixes into it, and
  don't let an unrelated CI failure (e.g. a pre-existing dependency audit
  finding) block it; note those once in the PR thread as pre-existing and
  move on rather than expanding scope to fix them.

## Worked example

The post at `src/content/blog/the-attack-surface-of-security-language.md` was
built with this exact process: `dispatch` contentType, reused the `secure-pride`
project slug because the essay's subject matched that project's existing
line of work, converted four bracket citations to `[^n]` footnotes with a
`## Sources` section, and placed a provided hero image at
`src/assets/images/blog/load-bearing-lexicon-hero.png`. Use it as a reference
if you want to see the pattern applied end to end.
