# DECISIONS — cv-work-integration (resume session)

Append-only. Date · decision · why · how to reverse.

---

## 2026-07-28 · Resume, not re-scaffold

**Decision:** Continue the existing checkpoint file (`docs/journal/2026-07-28-1543-cv-integration-checkpoint.md`) by adding a new scaffold — `PLAN.md`, `DECISIONS.md`, `CHECKPOINT.md` — alongside it, rather than rewriting from scratch.

**Why:** The session-journal skill says *append, never re-scaffold*. The prior checkpoint already captures the state of the five-file change in detail; rewriting it would discard useful context. The new scaffold picks up where the old one left off.

**How to reverse:** If the prior session's checkpoint is judged stale, delete it explicitly. Don't silently overwrite.

---

## 2026-07-28 · Bio paragraph is its own commit

**Decision:** The new UC Davis / Luck Lab paragraph in `about.astro` belongs in a separate `docs(about):` commit, not bundled with the page refactor.

**Why:** Page refactor (token migration) and editorial copy (bio addition) are orthogonal concerns. The prior session surfaced this as question #2 and the user picked "split."

**How to reverse:** `git reset --soft HEAD~1` then re-commit with the refactor; the bio paragraph will rejoin the refactor diff. Or amend the commit message. (Note: as of the work-card decision, the "refactor" set is now Just about.astro without the bio paragraph, and the work card is its own commit. The reverse is multi-step.)

---

## 2026-07-28 · Worktree direction = FF to main after push

**Decision:** Once both code commits land on `main` and are pushed, fast-forward the `cv-work-integration` branch to `origin/main` so the worktree's branch contains the artifacts.

**Why:** User answered "FF to main after push" out of three options. The worktree was a leftover staging area; FF makes it a real consumer of the work without a separate branch history.

**How to reverse:** `git -C .claude/worktrees/cv-work-integration reset --hard e5250b2` to put the worktree branch back where it was. The worktree itself stays.

---

## 2026-07-28 · Repo pre-push hook forces push ordering

**Decision:** Phase 1's push is deferred until Phase 2 (artifacts commit) lands. The repo's pre-push hook `.git/hooks/pre-push` (installed by `scripts/ops/setup-hooks.sh`) refuses to push when `public/` contains untracked files — and `public/artifacts/publication-surface-v1.2.2.html` is exactly that file. The scaffold commit and the artifact commit will be two separate commits on `main`, but the *push* will carry both of them.

**Why:** Respect the safety hook — it exists for the reason stated in the message (Cloudflare Pages won't deploy untracked files). Bypassing it via `--no-verify` is not acceptable.

**How to reverse:** If the user explicitly wants a "push scaffold alone" experiment, that would require either (a) asking the user whether to drop the artifact from the deployment set temporarily, or (b) removing the hook — both are irreversible. Don't do either unprompted.

---

## 2026-07-28 · Rebase detour while classifier paused

**Decision:** Between the Phase 1 commit and the Phase 1+2 push, four remote commits landed on `origin/main` (Greptile gaps #154, postcss #156, playwright #155, ci-node #147). I `git pull --rebase`'d my two commits onto the updated `origin/main`, `git stash pop`'d my unstaged page changes (with an auto-merge of `CLAUDE.md`), and pushed.

**Why:** I would have had to rebase eventually — the remote was strictly ahead of my local commits and the push refused. Doing it now (after Phase 1's commit, before Phase 2's commit) was a convenient moment because the page changes were still unstaged and could be stashed cleanly. The auto-merge of `CLAUDE.md` succeeded because the Greptile commit and my fonts-row fix touched different lines of the file.

**How to reverse:** Not relevant — the rebase landed on `origin/main`; reversing it would be a force-push. The merge result is correct.

---

## 2026-07-28 · Commit order: artifacts → refactor → bio

**Decision:** Sequence is `(1) docs: artifacts`, `(2) refactor(about,work)`, `(3) docs(about): bio paragraph`, `(4) feat(work): banknote-authentication flagship card`. Each is pushed before the next is started. (See separate decision about the work card.)

**Why:** User picked the recommended path. Docs artifacts first because they're the safest, most-isolated change. Refactor next because it's verifiable by `npm run check`. Bio last because it's pure editorial copy and shipping it last lets the user read the rest of the result before committing to the new paragraph.

**How to reverse:** `git rebase -i e5250b2` to reorder. The three commits are local + pushed; changing their order is a force-push to `main`, which is on the irreversible list — ask first.

---

## 2026-07-28 · Stage-1 commit naming

**Decision:** First commit is `docs: scaffold session-journal for cv-work-integration resume`. This includes the new `PLAN.md`, `DECISIONS.md`, `CHECKPOINT.md` *and* the prior checkpoint file at `docs/journal/2026-07-28-1543-cv-integration-checkpoint.md`.

**Why:** The scaffold is *meta* — it lives in `docs/journal/`, not the public site. Keeping it as its own commit lets the user roll it back independently of the real work. Including the prior checkpoint file in the same commit ensures the journal archive ships as a coherent set (otherwise the prior checkpoint would be untracked on a fresh clone, defeating the point of having it).

**How to reverse:** `git reset --soft HEAD~1` then re-make the commit with the scaffold files grouped into the next commit, or just drop them entirely. Add the prior checkpoint by `git add docs/journal/2026-07-28-1543-cv-integration-checkpoint.md`.

---

## 2026-07-28 · Work.astro bio also needs its own commit

**Decision:** The original plan was "refactor + bio (about.astro paragraph)" as two commits. Mid-session audit of `work.astro` revealed it also contains a new `banknote-authentication` flagship card (with new CSS: `flagship` field, `tag--gold` class, `.work-card--flagship` rules). The new plan is **three commits**: refactor, about paragraph, work card.

**Why:** The work card is feature work (new field, new CSS, new entry), not refactor. Bundling it with the token migration would mix concerns the same way the original two-commit split was trying to avoid. The user confirmed via AskUserQuestion.

**How to reverse:** `git rebase -i e5250b2` to merge the bio and card commits into the refactor; the user picked the three-commit split on this evidence, so this reversal would require re-litigating the choice.

---

## 2026-07-28 · Bio-paragraph isolation strategy

**Decision:** Phase 4 will use `git add -p` to isolate the bio paragraph hunk from the rest of `about.astro` if the diff is cleanly separated; fall back to a temporary `Edit` (remove paragraph → commit Phase 3 → re-add paragraph → commit Phase 4) if hunks are intermixed.

**Why:** Two commits both touching `about.astro` requires the bio paragraph to be removeable from Phase 3's commit. The prior session's description ("one substantive editorial paragraph added in the bio section") suggests it is a bounded hunk, but the diff itself is the ground truth — verify at Phase 3 entry.

**How to reverse:** None needed; this is implementation strategy, not a state change.

---

## 2026-07-28 · Assumptions verified before writing

**Decision:** Before scaffolding, ran four checks against the filesystem (branch, HEAD, status, journal dir, worktree). One drift found: the checkpoint says the two artifacts were "staged" but they are actually *untracked* (`??` in column 2, not `M` in column 1). Conclusion: no functional difference — the resume recipe in the prior checkpoint already handles this with `git add` rather than `git restore --staged`. No correction needed.

**Why:** The skill's "Phase 0 — pre-flight" requires it. Recording the verification *and* the drift, so a future session reading this doesn't re-do the check.

**How to reverse:** None — this is a record, not a state change.
