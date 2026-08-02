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
