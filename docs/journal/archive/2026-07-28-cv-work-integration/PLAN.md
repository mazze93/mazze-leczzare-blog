# PLAN — cv-work-integration (resume session)

## Request restated

The prior session (`docs/journal/2026-07-28-1543-cv-integration-checkpoint.md`) ended
mid-flight with two artifacts staged-for-commit and three files modified-but-unstaged:

1. `docs/mazze-leczzare-cv.pdf` — new
2. `public/artifacts/publication-surface-v1.2.2.html` — new
3. `CLAUDE.md` — Fonts row corrected
4. `src/pages/about.astro` — migrated to shared Cipher Gothic tokens + new UC Davis / Luck Lab bio paragraph
5. `src/pages/work.astro` — migrated to shared Cipher Gothic tokens

This session's job: commit each logical unit, push after each, then FF the
locked worktree to origin/main.

User decisions (2026-07-28, via AskUserQuestion this session):
- **Worktree:** FF to main after push.
- **Bio paragraph:** split into its own commit (`refactor` then `docs(bio):`).
- **Commit order:** artifacts → refactor → push each.
- **Work.astro bio card (added mid-session when the diff was audited):**
  three commits — refactor + about paragraph + work card. The card is
  feature work, not refactor, so it owns its own commit. (See DECISIONS.md.)

## Files / repos in scope

**In `blog/mazze-leczzare-blog` (on `main`):**
- The five files above.
- `docs/journal/PLAN.md`, `DECISIONS.md`, `CHECKPOINT.md` — this scaffold (new).
- `docs/journal/2026-07-28-1543-cv-integration-checkpoint.md` — left untouched, referenced.

**Adjacent (one phase only):**
- `.claude/worktrees/cv-work-integration` — locked worktree on branch `cv-work-integration`,
  same HEAD as main, no commits ahead. FF to `origin/main` at the end of Phase 5.

## Constraints

- **Repo standard:** `npm run check` before any commit that touches `src/`. Required by
  `CLAUDE.md` ("Always run `npm run check` before committing any code change").
- **Max posture:** never print secrets. No secrets in the diffs here (verified — these are
  docs + prose + style tokens), so a literal-secret-scan is not needed; the changes
  themselves are safe to commit.
- **HIGH posture:** "verify before push; no unreviewed publishes." This is a public
  site. The two `src/pages/*` migrations are public-facing and must pass `npm run check`
  before commit. The bio paragraph is fully editorial — the prior session drafted it
  with a Nature citation; it is publishing-grade.
- **No force-push / no remote-branch deletion / no making-private-public.** Pushes
  here are plain `git push origin main`.
- **Commit and push together** (global CLAUDE.md). Each phase ends with a push.

## Phases

Each phase is small enough to finish and commit/push before stopping.

### Phase 1 — Scaffold the journal

- Create `docs/journal/PLAN.md`, `DECISIONS.md`, `CHECKPOINT.md`.
- Commit: `docs: scaffold session-journal for cv-work-integration resume`.
- **Push deferred** — repo pre-push hook (from `scripts/ops/setup-hooks.sh`)
  blocks pushes when `public/` has untracked files; the
  `publication-surface-v1.2.2.html` artifact is exactly that. Phase 1 +
  Phase 2 must push together.

### Phase 2 — docs: artifacts

- Verify the two artifact files are still on disk and unmodified (`git status`).
- `git add docs/mazze-leczzare-cv.pdf public/artifacts/publication-surface-v1.2.2.html`.
- Commit: `docs: add CV PDF and publication surface artifact (v1.2.2)`.
- Push (this push carries Phase 1 + Phase 2 together — the pre-push hook
  blocks any push that would leave `public/` with untracked files, so the
  artifact must be in the *current* HEAD's public/ tree before the push).

### Phase 3 — refactor: pages + CLAUDE.md fonts row

- `git diff src/pages/about.astro src/pages/work.astro` line-by-line audit.
  The prior session flagged `work.astro` as "not audited line-by-line." This
  phase is the audit-and-confirm moment: **no `var(--ab-*)` references
  survived, no stranded `@fontsource-variable/space-grotesk` or
  `@fontsource/crimson-pro` imports**, the scoped `<style>` block compiles.
  ✓ Confirmed at the start of this session (Phase 3 prep).
- **Crucially:** for this phase, also `git add -p` to keep the diff to
  *only* the refactor hunks — exclude the about.astro bio paragraph (Phase 4)
  and the work.astro banknote-authentication card + flagship CSS (Phase 5).
- `npm run check` (repo standard).
- Commit: `refactor(about,work): migrate to shared Cipher Gothic design tokens`.
- Push.

### Phase 4 — docs(bio): about.astro UC Davis / Luck Lab paragraph

- Re-read the new paragraph in `src/pages/about.astro` to confirm its content
  is the UC Davis / Luck Lab / counterfeiting program / Nature
  (Dodgson & Raymond, *Scientific Reports*, 2022,
  https://www.nature.com/articles/s41598-022-05972-8) — the prior session
  authored this and we want to ship it as written, not silently rewrite.
  ✓ Confirmed at the start of this session (Phase 4 prep).
- `git add -p` only the bio-paragraph hunk.
- `npm run check` (repo standard — bio is content, but the file is TypeScript).
- Commit: `docs(about): add UC Davis / Luck Lab counterfeit-detection bio paragraph`.
- Push.

### Phase 5 — feat(work): banknote-authentication flagship card

- The new `banknote-authentication` entry in `work.astro` has three
  *intertwined* kinds of hunks: a schema field (`flagship?: boolean`), data
  (the new entry), and CSS (`.work-card--flagship`, `tag--gold`,
  `.work-card--flagship:hover`). All three belong to the new feature.
- `git add -p` to select only the hunks that introduce the banknote card,
  the `flagship` field, and the new CSS. The refactor token swaps from
  `work.astro` were already committed in Phase 3 — make sure this
  commit's diff doesn't redouble them.
- `npm run check`.
- Commit: `feat(work): add banknote-authentication flagship card (UC Davis / Luck Lab)`.
- Push.

### Phase 6 — worktree: ff to origin/main

- `git -C .claude/worktrees/cv-work-integration fetch origin main`.
- `git -C .claude/worktrees/cv-work-integration merge --ff-only origin/main`.
- If `ff-only` fails (e.g. main rebased since the worktree was created), stop
  and ask — not auto-merge.
- Tick CHECKPOINT.md.
- No commit needed in this session for the worktree (it's a branch advance).

### Phase 7 — close

- Update CHECKPOINT.md with final state.
- Optional: append a one-line summary to `docs/journal/2026-07-28-1543-cv-integration-checkpoint.md`
  ("Resumed 2026-07-28, all phases landed, see CHECKPOINT.md"). Or leave the
  prior checkpoint untouched and let CHECKPOINT.md be the new resume point.
  Default: leave the older file untouched (the skill says append, never re-scaffold).

## Out of scope (do not silently address)

- Any other modifications to `src/`, `public/`, `functions/`, or `docs/` beyond
  the five files named above.
- Tech debt from session #153 (Pages→Workers migration scope doc). Deferred.
- Lighthouse, a11y, or performance audits. Run `npm run check` (TypeScript +
  Astro build) — Lighthouse is CI-only and not in this session's scope.
- Anything in `secure-pride/*` (different repo, different posture, different
  workspace — HARD STOP per global CLAUDE.md).
