# PLAN — design-sync-css-parity

**Repo/files in scope:** `docs/journal/*` (this scaffold); `src/styles/global.css`,
`src/styles/editorial.css`, `src/styles/homepage.css` (local, source of truth);
`uploads/global.css`, `uploads/editorial.css`, `uploads/homepage.css` in the
claude.ai/design project `019e1ccb-00cb-7782-8451-738a76f22b4e` (remote, kept
in parity per `.design-sync/config.json`).

**Request:** keep the hand-crafted Cipher Gothic design-sync project's
`uploads/*.css` current with the blog's local `src/styles/*.css`. This project
is `"shape": "reference"` — not a component-library sync target, so the full
converter skill doesn't apply. The only job is manual CSS parity via
`DesignSync get_file` / `write_files`.

## Phases

- [x] **Phase 0 — FieldFigure /work masthead (already shipped, logged here for
      continuity).** Not part of this plan's original scope but completed
      immediately prior in the same session. See CHECKPOINT for detail.
- [x] **Phase 1 — diff `global.css`.** Re-confirmed stale on remote — 383-line
      diff. Remote predated the Kintsugi palette migration, the Haven/Ink
      light-mode import, and the entire Cipher Gothic additive-token block.
      Staged for write.
- [x] **Phase 2 — diff `editorial.css`.** Tokens byte-identical; only the
      site-rot-sweep "dead config, not imported anywhere" header comment
      differed. Staged for write (parity means the annotation ships too).
- [x] **Phase 3 — diff `homepage.css`.** Fetched from remote — byte-identical
      to `src/styles/homepage.css`. No write needed.
- [x] **Phase 4 — push.** User confirmed via AskUserQuestion ("push both").
      `finalize_plan` → `write_files` for `uploads/global.css` and
      `uploads/editorial.css`. `written: 2`.
- [x] **Phase 5 — close.** Fresh `get_file` read-back of `uploads/global.css`
      confirms exact match to local (Kintsugi tokens, Haven/Ink import,
      Cipher Gothic block, Inter `@font-face`, `.tag` rgba-triplet fix all
      present). CHECKPOINT updated.

## Known constraints

- `DesignSync get_file` caps at 256KB — none of the three files are near that,
  no chunking needed.
- This is a one-way sync (local → remote). Never pull remote CSS back into
  `src/styles/` — the blog is the source of truth per `.design-sync/config.json`.
- `finalize_plan` / `write_files` require explicit user approval before any
  remote write — do not call `write_files` on an assumption of consent.
