# CHECKPOINT — cv-work-integration (resume session)

**Last updated:** 2026-07-28 (scaffold + plan revisions mid-session)
**Branch:** `main` @ `46404cd` (scaffold committed locally)
**Prior session:** `docs/journal/2026-07-28-1543-cv-integration-checkpoint.md` (read this first if resuming)

## To resume

1. Read `docs/journal/2026-07-28-1543-cv-integration-checkpoint.md` — captures the
   state when the prior session ended.
2. Read `docs/journal/PLAN.md` — phases (current: 7 phases, was 6).
3. Read `docs/journal/DECISIONS.md` — what was decided and why.
4. Continue at the first unchecked phase below.

## Phase status

- [x] **Phase 0 — pre-flight:** request restated, files in scope named,
      load-bearing assumption (state matches checkpoint) verified, drift
      noted (artifacts are untracked, not staged — no functional difference).
- [x] **Phase 1 — scaffold:** create `PLAN.md`, `DECISIONS.md`, `CHECKPOINT.md`,
      and include the prior checkpoint file (so the journal archive ships
      as a coherent set). Committed locally as `46404cd`
      (`docs: scaffold session-journal for cv-work-integration resume`).
- [ ] **Phase 2 — docs: artifacts.** Commit + push:
      `docs: add CV PDF and publication surface artifact (v1.2.2)`.
- [ ] **Phase 3 — refactor: pages + CLAUDE.md.** `npm run check`, audit
      `work.astro` line-by-line (✓ done at Phase 3 prep: no `--ab-*` refs,
      no stranded font imports). Commit + push:
      `refactor(about,work): migrate to shared Cipher Gothic design tokens`.
- [ ] **Phase 4 — docs(bio): about.astro.** Bio paragraph verified at Phase 4
      prep (Nature citation s41598-022-05972-8, Dodgson & Raymond, 2022).
      `npm run check`. Commit + push:
      `docs(about): add UC Davis / Luck Lab counterfeit-detection bio paragraph`.
- [ ] **Phase 5 — feat(work): banknote-authentication flagship card.** Added
      mid-session when the work.astro diff was audited and found to contain
      a new flagship card (not just refactor). `npm run check`. Commit + push:
      `feat(work): add banknote-authentication flagship card (UC Davis / Luck Lab)`.
- [ ] **Phase 6 — worktree: ff.** `git -C .claude/worktrees/cv-work-integration
      merge --ff-only origin/main`. Stop and ask if `ff-only` fails.
- [ ] **Phase 7 — close.** Update this file with final state.

## Deferred / needs user

(Empty — the three open questions from the prior session were resolved this
session via AskUserQuestion. One follow-up question (work.astro bio scope)
also resolved mid-session: three commits, not two. No outstanding blocks.)

## Verification state

- Disk matches prior checkpoint (with one drift noted in DECISIONS.md).
- `npm run check` has not yet been run in this session. **Required before
  Phase 3, 4, and 5 commits**.
- Phase 1 commit landed locally (`46404cd`) — **not yet pushed**. The push
  is blocked by a pre-push hook that fails on untracked files in `public/`
  (the publication-surface artifact is exactly that). Phase 2 must commit
  the artifacts first; then the push (Phases 1+2 together) will pass.
- **Push order is now: Phase 1 + Phase 2 are pushed together, Phase 3
  pushed after, Phase 4 pushed after, Phase 5 pushed after.** The repo
  pre-push hook enforces this — it does not allow a push with untracked
  `public/`.
- `work.astro` audited at Phase 3 prep: no `var(--ab-*)` anywhere in the
  file (in either direction of the diff), no `@fontsource-variable/space-grotesk`
  or `@fontsource/crimson-pro` imports anywhere in the file. Migration is
  complete on the refactor side.
- `about.astro` audited at Phase 4 prep: bio paragraph at line 219, Nature
  citation `https://www.nature.com/articles/s41598-022-05972-8` (Dodgson &
  Raymond, *Scientific Reports*, 2022).

## What I have NOT done this session (explicit non-actions)

- No files added to git index yet for the *real* work (artifacts, refactor,
  bio, work card); the scaffold commit `46404cd` is the only commit so far.
- Phase 1 has not been pushed yet.
- `npm run check` has not been run in this session.
- No worktree operations.
- No edits to `src/`, `public/`, `CLAUDE.md`, or any pre-existing file beyond
  the journal files.
- No deletion of the prior checkpoint file.
