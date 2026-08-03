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
- [ ] **Phase 1 — diff `global.css`.** Already confirmed stale on remote
      (missing the entire `--cg-*` additive token block + mixin classes,
      local lines 122–258). Re-confirm against current local file, stage the
      write.
- [ ] **Phase 2 — diff `editorial.css`.** Remote fetched last session, not yet
      diffed against `src/styles/editorial.css`. Do the diff, stage the write
      if divergent.
- [ ] **Phase 3 — diff `homepage.css`.** Not yet fetched from remote at all.
      Fetch, diff, stage the write if divergent.
- [ ] **Phase 4 — push.** Present the full diff set to the user, get
      confirmation (DesignSync `finalize_plan` is permission-gated), then
      `write_files`.
- [ ] **Phase 5 — close.** Verify remote files match local via a fresh
      `get_file` read-back; update CHECKPOINT.

## Known constraints

- `DesignSync get_file` caps at 256KB — none of the three files are near that,
  no chunking needed.
- This is a one-way sync (local → remote). Never pull remote CSS back into
  `src/styles/` — the blog is the source of truth per `.design-sync/config.json`.
- `finalize_plan` / `write_files` require explicit user approval before any
  remote write — do not call `write_files` on an assumption of consent.
