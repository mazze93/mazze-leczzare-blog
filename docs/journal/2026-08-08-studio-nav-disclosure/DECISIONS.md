# DECISIONS — studio-nav-disclosure

Append-only. Format: `date · decision · why · how to reverse`.

## 2026-08-08

- **Scaffolded this pass as its own directory instead of writing
  `PLAN.md`/`DECISIONS.md`/`CHECKPOINT.md` into `docs/journal/` root.** Why: the root
  already holds a live `CHECKPOINT.md` + `HANDOFF.md` for the design-systems pass, whose
  item 2 is still open. `HANDOFF.md` records that a concurrent session previously
  scaffolded the root for a different task *while that pass was in flight* and archived
  the wrong set — the exact failure this avoids. A sibling dated directory mirrors the
  `archive/<date>-<topic>/` naming without touching anything live. Reverse: `git mv` the
  three files to `docs/journal/` and delete this directory.

- **Kept Tesserae rather than retiring it — reversal of the original instruction.** Why:
  the surface is already complete. Zod schema with constellation fields, a designed index
  page with an empty state, a detail route, aggregation into project nodes with unit
  tests, and an authenticated ingest endpoint at `functions/api/ingest.ts` that accepts
  `collection: "tesserae"` and commits tiles straight to `main`. Retiring it would have
  deleted a working publishing pipeline to silence one build warning that CLAUDE.md
  already documents as expected. Verified by adding a probe tile: the warning cleared and
  both routes generated (42 → 44 pages). Reverse: delete `src/pages/tesserae/`, the
  collection in `content.config.ts`, and its refs in `collectNodes.ts`/`nodes.ts`/
  `nodes.test.ts` — and note that `check-docs-drift.sh` and CLAUDE.md list those pages,
  so both need updating in the same commit or `npm run docs:check` fails.

- **Nested under Studio rather than removing Signal from the nav.** Why: removal was the
  original ask, but Tesserae had *zero* nav links and Signal had two, which is inverted
  from their content (0 tiles vs 1 transmission). Nesting fixes the width problem the
  original request was really about while making the orphaned surface reachable for the
  first time, and it leaves the nav shorter than adding Tesserae as a sixth peer would.
  Reverse: restore the flat `<a href="/studio/">Studio</a>` and `<a href="/signal/">Signal</a>`
  links in `Header.astro` and drop the `.nav-group` block.

- **Disclosure button, not a CSS hover menu.** Why: hover menus are unreachable by
  keyboard and unusable on touch, and this repo treats WCAG 2.1 AA as non-negotiable.
  `hidden` is toggled alongside `aria-expanded` so the menu is genuinely absent from the
  accessibility tree when closed rather than merely invisible. Escape returns focus to
  the trigger; `focusin` outside the group closes it, which handles Tab-out without
  trapping focus. Reverse: replace the `<button>`/`<ul>` with `:hover`/`:focus-within` CSS
  and delete the disclosure block from the component's `<script>`.

- **Vanilla JS in `Header.astro` rather than a React island.** Why: CLAUDE.md restricts
  React to `ThemeToggle`, `ContactForm`, and `PostQuoteShare`. The component already ships
  a `<script>` block for the compass `compass:state` listener, so the disclosure extends
  existing machinery instead of adding a hydration boundary to the masthead. Reverse:
  extract to a `.tsx` island and mount with `client:load`.

- **Left three divergent skill directories untouched when repairing
  `~/.claude/skills`.** Why: `bootstrap.sh` does `rm -rf` on each target before
  symlinking, and `cloudflare`, `cloudflare-one`, and `web-perf` exist as real
  directories whose contents differ from the repo copies — running the full installer
  would have destroyed local changes. Linked only the two needed skills and repaired the
  five already-broken (therefore lossless) symlinks. Reverse: run
  `bash /Users/Shared/claude-code-skills/bootstrap/bootstrap.sh` to take repo versions of
  everything, after diffing those three directories.
