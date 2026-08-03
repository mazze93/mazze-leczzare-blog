# CHECKPOINT — design-sync-css-parity

**Last updated:** 2026-08-03 (Phase 5 — closed)
**Branch:** `worktree-cv-work-integration` (worktree) → pushed directly to
`origin/main`. This branch currently tracks no upstream of its own — pushes
go via `git push origin worktree-cv-work-integration:main`, not `git push`.

## To resume

Task is complete. `src/styles/{global.css,editorial.css,homepage.css}` and
the claude.ai/design project's `uploads/*.css` are in parity as of this
close. Re-run the same diff procedure (fresh `get_file` per remote file,
diff against current local) if local styles change again — do not assume
parity holds indefinitely; nothing re-checks this automatically.

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
- [x] **Phase 1 — diff `global.css`.** 383-line diff. Remote predated the
      Kintsugi palette migration (`5f650a2`), the Haven/Ink light-mode wiring
      (`a4b6166`), and the whole Cipher Gothic additive-token block.
- [x] **Phase 2 — diff `editorial.css`.** Tokens identical; only the
      site-rot-sweep "dead config" header comment diverged.
- [x] **Phase 3 — diff `homepage.css`.** Byte-identical to remote — no write.
- [x] **Phase 4 — push.** User confirmed ("push both") via `AskUserQuestion`.
      `finalize_plan` (`plan_019e1ccb00cb7782_55abde3bd1c3`) → `write_files`
      for `uploads/global.css` + `uploads/editorial.css`. `written: 2`.
- [x] **Phase 5 — close.** Fresh `get_file` read-back of `uploads/global.css`
      confirmed exact match to local content.

## Verification state

- FieldFigure: `npm run check` ✓ (39 pages, tsc clean), live browser
  screenshot ✓ (light + dark), pushed to `origin/main` ✓.
- Design-sync CSS parity: `global.css` write verified via read-back ✓.
  `editorial.css` write verified via read-back ✓ — matches local exactly,
  including the "dead config" header comment.
- `homepage.css`: confirmed identical pre-write, untouched.

## Deferred / needs user

1. **`worktree-cv-work-integration` has no upstream tracking branch.** Pushes
   so far have used the explicit `origin/worktree-cv-work-integration:main`
   refspec successfully; flagged in case a plain `git push` is attempted later
   and fails for a different reason than expected.

## Non-actions (explicit)

- No remote CSS pulled back into `src/styles/` — sync direction is local →
  remote only, per `.design-sync/config.json`.
- `homepage.css` not written — remote already matched local exactly.
