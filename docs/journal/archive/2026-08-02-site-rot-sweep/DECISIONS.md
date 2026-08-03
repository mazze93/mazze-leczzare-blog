# DECISIONS — site-rot-sweep

Append-only. Date · decision · why · how to reverse.

Prior task's decision log: `docs/journal/archive/2026-07-28-cv-work-integration/DECISIONS.md`.

---

## 2026-08-02 · Pre-flight: the font "orphans" are missing files, not dead weight

**Decision:** Reverse the conclusion I gave the user at the end of the CLAUDE.md
audit turn. I reported `public/fonts/` as 13 unreferenced files — "dead weight
in the deploy" — and recommended leaving them alone. That was wrong, because the
grep behind it was scoped to `src/` and every consumer lives in `public/`.

**Verification that overturned it:** `git log --oneline -- public/fonts` traces
the files to `7525613 feat(artifacts): publish the tessera-claude-anchor session
record`. Re-running the reference scan across `public/` gives 24 distinct
`/fonts/*.woff2` URLs against 13 files present. Fourteen references resolve to
nothing:

- `/intentional-fragility/` → `atkinsonhyperlegible-{400,700}-normal`,
  `cormorantgaramond-{500,600}-{normal,italic}`, `dmmono-{400,500}-normal` (8)
- `/writing/what-i-can-stand-by/` → `jetbrainsmono-{400,500}-normal`,
  `newsreader-{400,500}-{normal,italic}` (6)

`/artifacts/tessera-claude-anchor.html` is the one page whose 11 references all
resolve — it shipped with its fonts. The other two pages did not.

**Why it matters:** these are live production URLs serving ~14 font 404s per
visit and silently falling back to system fonts. The audit's framing would have
left that in place.

**How to reverse:** none — this is a correction of record, not a state change.

---

## 2026-08-02 · Scaffold fresh, archive the closed set

**Decision:** Move the cv-work-integration `PLAN.md` / `DECISIONS.md` /
`CHECKPOINT.md` / prior checkpoint into
`docs/journal/archive/2026-07-28-cv-work-integration/` via `git mv`, and
scaffold a new set for this task at `docs/journal/`.

**Why:** The skill says append, never re-scaffold — but that guards a *live*
burst sequence. The cv-work-integration journal is closed (`8a9efba docs: close
journal — CV/work integration shipped`); its Phase 7 is ticked and its deferred
list is empty. Appending an unrelated task to a closed plan would make both
harder to resume. `git mv` preserves every line and its history, so nothing is
lost — consistent with this session's prefer-not-to-delete instruction.

**How to reverse:** `git mv docs/journal/archive/2026-07-28-cv-work-integration/*
docs/journal/` and delete the new scaffold.

---

## 2026-08-02 · REVERSAL: there are no font 404s. Phase 2 is void.

**Decision:** Revert Phase 2 entirely. I vendored 14 woff2 files into
`public/fonts/`, verified "0 missing", and was about to commit. Then I read an
actual `@font-face` block and found the URLs are `./fonts/…` — *relative* — not
`/fonts/…`. My scan had grepped the literal string `/fonts/`, which matches
`./fonts/` as a substring. Both pages ship their own sibling `fonts/`
directories, fully populated and tracked in git:

- `public/intentional-fragility/fonts/` — 8 files, all present
- `public/writing/what-i-can-stand-by/fonts/` — 6 files, all present

Nothing was ever broken. The 14 files I added were unreferenced duplicates of
files already on disk one directory over. Deleted them; tree is back to clean.

**Replaced the string-grep with a resolver** that parses `url(...)` out of every
HTML file under `public/`, resolves relative URLs against each page's own URL,
and stats the result: **25 references, 0 broken.** The only unreferenced font
files in the whole tree are `public/fonts/atkinson-{bold,regular}.woff` — two
legacy `.woff` (not woff2) files from `0063889 source repo import`, superseded
by the `atkinsonhyperlegible-*.woff2` that `/intentional-fragility/` carries
locally.

**Why this happened, so it doesn't again:** two grep-shaped mistakes in a row on
the same question — first scoping to `src/` when the consumers were in
`public/`, then substring-matching a path prefix. Both produced a confident,
specific, wrong number (13 orphans; then 14 404s). A path is not a string; it
resolves against a base. Verify file references by *resolving and stat-ing*
them, not by grepping for a prefix.

**Correcting the record for the user:** my original audit line — "13 files that
nothing in `src/` references" — was literally true but framed to imply they were
all dead. Eleven of the thirteen serve `/artifacts/tessera-claude-anchor.html`.
Two are genuinely orphaned. "Dead weight in the deploy" was wrong about 11/13.

**How to reverse:** nothing to reverse — the working tree is byte-identical to
the pre-Phase-2 state (`git status` clean apart from the pre-existing CLAUDE.md
and package.json edits).

---

## 2026-08-02 · Self-host Inter rather than add @fontsource/inter

**Decision:** Close the Cipher Gothic open item by declaring four `@font-face`
rules in `global.css` that point at the existing `/fonts/inter-*.woff2`, instead
of adding an `@fontsource/inter` dependency and importing it like the other
families.

**Why:** `7525613` already put those four files in the repo and on the CDN for
`/artifacts/tessera-claude-anchor.html`, which serves them from these exact
URLs. A dependency would ship a second copy of bytes already hosted. The cost of
reusing them is four rules. Nothing is downloaded until a rule applies the
family — `.cg-body` is the only consumer and has no users yet — so this is
byte-neutral for every page as it stands.

**Trade-off accepted:** it mixes conventions. The site's other fonts resolve
through Vite (hashed, in `dist/_astro/`); these resolve as plain `/fonts/` URLs
out of `public/`. Documented in the block comment and in CLAUDE.md so the
inconsistency is deliberate rather than confusing.

**How to reverse:** `npm i @fontsource/inter`, replace the `@font-face` block
with `@import '@fontsource/inter/latin-{300,400,500,600}.css';`.

---

## 2026-08-02 · Fix the Breakthrough CSP by self-hosting, not by widening ARTIFACT_CSP

**Decision:** `/essays/the-breakthrough-artifact.html` loaded fonts from
fonts.googleapis.com under a `font-src 'self'` CSP, so its typefaces never
loaded in production. Fixed by vendoring the 8 cuts it uses — not by extending
middleware's `isArtifact` test to cover `/essays/`.

**Why:** widening the relaxed CSP to a second path trades a rendering bug for a
weaker security posture on a page that has no need of third-party requests, and
the repo has already made the opposite call once, explicitly (`7525613`: "no
third-party requests"). Self-hosting also fits the site's stated privacy-first
posture. The CDN URL requested 16 cuts; the stylesheet uses 8, so only 8 were
vendored.

**Note:** `/artifacts/tree-of-knowledge.html` and
`/artifacts/publication-surface-v1.2.2.html` still fetch CDN fonts. They are
under `/artifacts/`, so `ARTIFACT_CSP` permits it and they render correctly —
not a bug, but they are the remaining third-party requests on the site if that
posture is ever tightened. Left alone; noted in the deferred list.

**How to reverse:** restore the `<link>` block and delete the `@font-face`
block; the vendored woff2 can stay (harmless) or be removed.

---

## 2026-08-02 · Duplicate route archived to docs/, not files/

**Decision:** `src/pages/blog/the_breakthrough_artifact.html` moved to
`docs/archive/`, not to `files/`.

**Why:** `files/` is where CLAUDE.md points for non-deployed HTML prototypes,
and it was the first choice — but `files/` is gitignored, so moving it there
would have dropped the file out of version control entirely. That reads as a
delete, which this session was asked to avoid. `docs/archive/` is tracked, is
not part of the site build, and carries a README explaining what each file was
and why it moved. CLAUDE.md's `files/` entry now notes that it is gitignored.

**How to reverse:** `git mv docs/archive/the_breakthrough_artifact.duplicate.html
src/pages/blog/the_breakthrough_artifact.html` and drop the two `_redirects`
lines. Note that this restores a duplicate route *and* a CSP-broken page.

---

## 2026-08-02 · Dead config labelled, not removed

**Decision:** `tailwind.config.mjs` and `src/styles/editorial.css` both stay on
disk with corrective header comments, rather than being deleted along with the
`tailwindcss` devDependency.

**Why:** the session instruction was to prefer commenting out over deleting, and
both files hold information worth keeping — the Tailwind theme block records
which CSS variables were meant to reach utility consumers, and editorial.css
holds prototype tokens. The active harm in both cases was not their existence
but their *instructions*: editorial.css told the reader to add a CDN font link
that CSP blocks, and tailwind.config.mjs implied a working utility layer. Both
now say plainly that they are inert and what would be required to change that.

**How to reverse:** delete `tailwind.config.mjs` and `npm rm tailwindcss`; the
theme mapping is recoverable from git history.

---

## 2026-08-02 · Left the pending @astrojs/sitemap pin change untouched

**Decision:** `package.json`/`package-lock.json` carry an uncommitted
`"@astrojs/sitemap": "3.7.3"` → `"^3.7.3"` change that predates this session.
Neither committed nor reverted; left exactly as found.

**Why:** it is a dependency-pinning policy choice, not mine to make. The repo
pins `astro`, `@astrojs/mdx` and `typescript` exactly, and sitemap was in that
set, so loosening it is a deliberate-looking departure — but it is also
consistent with every other dependency, so it may equally be an artifact of a
stray `npm install`. The resolved version is unchanged (3.7.3), so it has zero
effect today either way. Sweeping it into an unrelated commit would misattribute
it; reverting it would discard someone's in-flight edit.

**How to reverse:** n/a — no action taken. Surfaced to the user.
