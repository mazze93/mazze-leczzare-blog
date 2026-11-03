# The Editorial Desk

**Route:** `/admin/editorial/` (existing admin session middleware)

A local-first writing room added without changing the static Astro deployment or publishing any working draft.

## Features

| Tool | Capability | Persistence and authority |
| --- | --- | --- |
| Drafting table | New drafts, working copies of published posts, Markdown source, safe plain-text preview, editorial states, checkpoints, JSON backup/restore | IndexedDB in this browser. Not synced or encrypted. |
| Targeted revision | Select exact source range, propose replacement with reason, accept/reject, immutable decision entry, pre-accept checkpoint, stale-range rejection | Draft record; does not change published source. |
| Bearing | Import `bearing export`'s `data.js` or equivalent JSON, scrub ledger sequence, disable counting frames, inspect each claim and leave-one-frame-out result | Actual browser fold of Intentional Fragility's accepted default policy. No independent validator or claim extraction. |
| Prose probes | Pattern-based alerts for absolute, causal, numeric and unattributed statements | Suggestions only, **never** Bearing evidence grades. |
| Carousel | Extract 8–9 editable slide candidates from the manuscript and download `slides.json` | Works with existing `scripts/carousel/build.py`; needs human copy review. |
| PDF report | Assemble manuscript, accepted/rejected decisions, prose prompts and imported Bearing fold into print-ready HTML | Browser Print / Save as PDF, or offline tagged PDF CLI. |

## Starting

Sign in at `/login/`, then open `/admin/editorial/` from the admin dashboard. Select a published original to create an independent working copy or create an empty draft. No publishing action is available from the Desk. The original remains unchanged.

**Back up frequently:** Export archive JSON from the library. Browser data can be erased by clearing browsing data, storage eviction, device loss or switching browser profiles. Archived JSON can contain sensitive unpublished writing; store it accordingly.

**Published-source imports are body-only:** exported Markdown of a working revision of a published post is body-only, with no reconstructed frontmatter. Apply that body in a reviewed Git branch while keeping canonical frontmatter. New drafts export with minimal `draft: true` frontmatter. The Desk does not commit to GitHub, open PRs, schedule publication, or silently publish.

**Preview limitation:** the safe browser reading preview renders headings, prose, lists and quotes as text nodes. It intentionally does not interpret arbitrary HTML or execute MDX. Test the exported piece in the real Astro pipeline before publication.

## Bearing integration

The authoritative source is `mazze93/intentional-fragility`'s **Bearing claim-graph engine**, not the heuristic prose checks. In the Bearing repository:

```sh
bearing validate
bearing audit --strict
bearing export
```

Import `surfaces/bearing-table/data.js` into the Bearing panel. The browser uses the pinned-in-this-branch `public/editorial/bearing-fold.js` algorithm. Confirm the upstream parity test on source updates before promoting new versions. The imported graph contains claim/evidence metadata that may be sensitive, so never upload a private corpus you would not want retained in browser storage and archived JSON.

**Important distinction:** a read-point fold measures independent *declared* evidence frames. Two frames producing a `robust` tier do not prove real-world truth. The Python validator and audit are separate required gates.

**Rust implementation:** the private Bearing Rust core supplied with this project is a normalized-JSON, structurally validating port with pinned Python parity checks (see its `source-provenance.json`). It is not bundled into this public repository: the source material records that the upstream licensing is not granted for public reuse. Its Rust tests/parity/CLI should remain in its private source project until a separate distribution and permission decision is made. The browser fold does not claim to execute the Rust binary or perform Rust-level validation.

## Carousel pipeline

1. Open the Carousel tool and generate candidate slides.
2. Review/edit each slide's text, especially quotation, attribution, and unproven claims.
3. Download `<slug>-slides.json` and place it at `docs/social/<slug>/slides.json`.
4. Run from the repo root:

```sh
python3 scripts/carousel/build.py <slug>           # contrast, copy and overflow gates
python3 scripts/carousel/build.py <slug> --ship    # only after review
```

The existing pipeline requires Python Playwright, Chromium, pypdf, Pillow, and installed `node_modules`. The browser generator outputs **deck source**, not a completed PDF or an auto-published carousel. Its frame and slide kinds are compatible with the existing `lexicon` rendering contract.

## Report compiler

From the PDF Report tab, export `<slug>-editorial-report.html`. Use browser Print / Save as PDF, or produce a tagged-text PDF locally:

```sh
npm run editorial:pdf -- path/to/report.html --out reports/essay-report.pdf
```

The CLI requires locally installed Chromium via Playwright, loads the HTML with JavaScript disabled, aborts external network requests, and refuses to overwrite an existing PDF. It does not fetch external sources or independently validate claims.

## Verification

```sh
npm run test:editorial
npm run test
npm run check
npm run docs:check
```

Then test `/admin/editorial/` against a real Cloudflare Pages preview, including unauthorized navigation, auth revocation, draft isolation, and mobile viewport behavior. **Astro's local static preview does not run Cloudflare Pages middleware**, so it cannot establish route confidentiality. Check the rendered `dist/admin/editorial/index.html` for accidental unpublished content; only public sources may be embedded.

## Security and remaining release gates

- `/admin/editorial/` is protected by existing `functions/_middleware.ts`. The client assets under `/editorial/` are intentionally public and contain no private drafts.
- IndexedDB is **not encryption**, and a shared browser profile is not a confidentiality boundary. Sensitive manuscripts require a private device/profile, exported encrypted backups, and threat-model review.
- Working drafts never enter Astro's content collection or public build; the import list includes only `!data.draft` originals.
- `draft: true` hides an Astro post from listings and generated slug routes, but does not protect arbitrary files under `public/`; do not put private work under `public/`.
- No automatic publication, remote synchronization, AI text generation, or D1/R2 configuration is introduced.
- Explicitly test Browser/Pages policy, build, and actual generated PDF before merging or deploying. This document is not evidence those checks passed.
