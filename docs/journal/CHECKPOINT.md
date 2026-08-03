# CHECKPOINT — design-sync-css-parity

**Last updated:** 2026-08-02 (Phase 0 closed, Phase 1 not yet started)
**Branch:** `worktree-cv-work-integration` (worktree) → pushed directly to
`origin/main`. This branch currently tracks no upstream of its own — pushes
go via `git push origin worktree-cv-work-integration:main`, not `git push`.

## To resume

Read `PLAN.md` for phase order, `DECISIONS.md` for why each choice was made.
Next unchecked phase is **Phase 1 — diff `global.css`**. The stale-remote
finding from before this journal existed (missing `--cg-*` token block,
local lines 122–258) still needs re-confirming against current
`src/styles/global.css` before staging the write — don't assume it's still
accurate without a fresh `get_file`.

## Phase status

- [x] **Phase 0 — FieldFigure `/work` masthead.** Commit `3d7385e` on `main`
      (rebased from `7048b64` on this branch). New files
      `src/components/work/FieldFigure.tsx` + `FieldFigure.module.css`,
      mounted `client:visible` in `src/pages/work.astro`'s `.work-header`.
      Verified in-browser via `mcp__chrome-devtools__*` (claude-in-chrome was
      blocking new localhost ports this session) in both light and dark
      themes on `localhost:4399/work/` — plate visible, draw-in animation
      completes, h1/eyebrow stay legible. `npm run check` green pre- and
      post-rebase. Pushed clean (`7a7b436..3d7385e`).
- [ ] **Phase 1 — diff `global.css`.** Not started this journal cycle
      (finding carried over from before the scaffold, needs re-verification).
- [ ] **Phase 2 — diff `editorial.css`.** Remote content fetched previously,
      diff against local not yet done.
- [ ] **Phase 3 — diff `homepage.css`.** Not fetched from remote yet.
- [ ] **Phase 4 — push (needs user confirmation).**
- [ ] **Phase 5 — close.**

## Verification state

- FieldFigure: `npm run check` ✓ (39 pages, tsc clean), live browser
  screenshot ✓ (light + dark), pushed to `origin/main` ✓.
- Design-sync CSS parity: no verification yet this cycle — Phase 1 not
  started.

## Deferred / needs user

1. **Design-sync `write_files` call.** Gated on user confirmation once the
   full three-file diff is assembled (Phase 4). Do not push partial parity.
2. **`worktree-cv-work-integration` has no upstream tracking branch.** Pushes
   so far have used the explicit `origin/worktree-cv-work-integration:main`
   refspec successfully; flagged in case a plain `git push` is attempted later
   and fails for a different reason than expected.

## Non-actions (explicit)

- No remote CSS pulled back into `src/styles/` — sync direction is local →
  remote only, per `.design-sync/config.json`.
- No `finalize_plan`/`write_files` call made — all design-sync work so far has
  been read-only (`get_file`).
