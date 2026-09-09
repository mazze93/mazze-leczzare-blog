# Build Journal — mazze-leczzare-blog

This is the operating manual for working on this project across sessions, including
autonomous/looped sessions where no human is watching each step. It has two halves:
a **cookbook** (how to run a burst of work) and a **ledger discipline** (how decisions
get recorded so nothing is lost and nothing has to be re-litigated). Read this before
starting any burst, whether you're Mazze or an agent picking this project back up cold.

The epistemic ledger is [Stratum](https://stratum.mazzeleczzare.com) — live, append-only,
event-sourced, canon at [github.com/mazze93/stratum](https://github.com/mazze93/stratum).
This project's decisions live on their own Stratum log, `mazze-leczzare-blog`, kept
separate from the general `workspace` log so the trail is scoped and exportable on its
own — the log id is also recorded in `.stratum-log` at the repo root, and
`scripts/burst-summary.sh` / `scripts/stratum-link.sh` read it automatically. Override
the log per-command with `--log mazze-leczzare-blog`, or export
`STRATUM_LOG=mazze-leczzare-blog` for a whole session.

> **One-time activation.** The `stratum` CLI is installed and its endpoint resolves
> (`stratum health` → `stratum.mazzeleczzare.com`), but this machine has no
> `~/.config/stratum/config.json` yet, so `stratum tessera` / `decide` return
> `✗ unauthorized`. Run once:
> ```
> stratum init --token <TOKEN> --log mazze-leczzare-blog --agent claude
> ```
> then record the genesis decision (see **Genesis** at the bottom). Everything else in
> this file — the git side, `burst-summary.sh` — works without it.

## Why this exists

The mandate is to make forward motion durable even in short, interrupted, or unattended
bursts — commit often, decide out loud, never let a burst end with only-in-context state.
Adapt the specifics below to what this project actually is; don't let the ritual outweigh
the work. For this repo specifically: the standing checks are `npm run check` (astro
build + tsc, 48 pages), `npm test` (vitest, 194), `npm run docs:check`, and
`scripts/ops/check-docs-drift.sh` — a burst isn't checkpointable until those are green.

## The burst workflow

Work happens in **bursts**: one modular, self-contained unit of progress, small enough to
finish and checkpoint even if the session ends immediately after. Do not start a burst
you can't checkpoint within it.

1. **Open the burst** — `stratum tessera --log mazze-leczzare-blog` to see the current
   decision state before touching anything. Don't re-decide something already settled;
   check `stratum status <id> --log mazze-leczzare-blog` if a prior decision looks
   relevant.
2. **Do the work** — one concrete unit, scoped to something committable on its own. On
   this repo that means: isolate in a git worktree (`.claude/worktrees/`), make the
   change, run the standing checks, commit, fast-forward `main`, push.
3. **Record the decision** — `stratum decide "…" --log mazze-leczzare-blog --shadow "…"`
   for anything that involved a real choice (an approach taken, an alternative rejected,
   an assumption made). The `--shadow` is mandatory for any non-trivial choice — it's
   where the "why," the road not taken, and an honest certainty level live. Don't decide
   obvious mechanical steps; decide the things a future reader would otherwise have to
   reconstruct or re-argue. Add `--pending` only if you intend to back the claim with
   real evidence afterward via `verify` / `stratum-link.sh` — a plain `decide` is born
   `asserted` and can only reach `ratified` (human-only) or `disputed`, never
   `validated` directly.
4. **Checkpoint.** This machine has no global auto-commit hook, so
   `git add -A && git commit` is your manual checkpoint and IS mandatory at the end of
   every burst — a burst that ends without a commit did not happen as far as the next
   session is concerned. A deliberate commit narrating the burst references the Stratum
   decision id in its body (`Ref: dec-…`).
4b. **Correlate the two trails with this project's own scripts, not by hand.**
   - `scripts/burst-summary.sh` — read-only. Lists commits and files changed since the
     last commit that referenced a Stratum decision, and prints a `stratum decide`
     template to fill in. Run it before step 3 if you're not sure what's accumulated.
   - `scripts/stratum-link.sh <dec-id> [commit-ish]` — the one place besides
     `decide`/`foreclose` that this project makes a live Stratum call, always explicit
     and manual. Attaches the actual commit as checked evidence via `verify`. Only
     works on a `--pending` decision — running it against a plain `asserted` one will
     correctly fail with a guard refusal, which is the contract working, not a bug.
5. **Close the burst** — if this was the last burst of the session, or the session is
   about to be cut off, write/update `HANDOFF.md` per the standing session handoff
   protocol: what was completed, what was blocked and why, exact next steps with file
   paths and commands. The next session (human or agent) reads `HANDOFF.md` first, then
   this file, then `stratum tessera --log mazze-leczzare-blog` for the decision trail.

Loop by repeating steps 1–4. Each burst is independently checkpointed, so looping and
iterating autonomously is safe: worst case, a failed or interrupted burst loses only the
work since the last commit, never the whole session.

## Relationship to `docs/journal/`

This repo already keeps `docs/journal/DECISIONS.md` + `CHECKPOINT.md` — a prose burst
sequence, human-readable, committed with the work. That stays. Stratum is the
**structured** layer underneath it: `docs/journal/` is the narrative a person reads to
catch up; the Stratum log is the queryable, event-sourced, tier-tracked reasoning trail
(`asserted` → `validated` → `axiomatic`, shadow traces, foreclosed roads). Record the
same decision in both when it's load-bearing; don't force trivia into Stratum.

## Ledger discipline (append-only, no exceptions)

- **Never hand-edit decision history.** Stratum is event-sourced — every `decide`,
  `verify`, `ratify`, `dispute`, `foreclose` appends a new event; nothing is ever
  mutated in place. If a prior decision was wrong, record a new one that says so in its
  text (`--supersedes` only fires from a `validated` status — it specifically closes out
  evidence-backed claims, it's not a general "this replaces that"). The wrongness itself
  is information.
- **Tiers mean something — don't inflate them.** A `decide` starts as `narrative`
  (asserted, unverified). It only becomes `authoritative_verified` via
  `stratum verify <id> --ref "…"` against real checked evidence — a passing test, a
  live URL, an actual observation, never "looks right." `ratify` (→ axiomatic) is
  reserved for explicit human sign-off — don't self-ratify from an autonomous burst.
- **Foreclose roads explicitly.** When an approach is considered and rejected, that's
  `stratum foreclose "…" --shadow "…"` — a ghost edge, not silence. Silence about a
  rejected alternative is exactly what lets it get re-proposed and re-litigated later.
- **The shadow trace is the point.** The clean decision text is what happened; the
  `--shadow` is why, what else was considered, and how sure this really is. Never skip
  it — an undocumented "why" is the single biggest cause of work getting silently redone.
- **Certainty is honest, not optimistic.** A shaky assumption gets a low certainty
  weight, not a confident-sounding sentence.
- **Git commits and Stratum decisions cross-reference.** A commit that resolves or acts
  on a decision says so in its message (`Ref: dec-…`); a decision that produced a commit
  notes the commit hash once it exists, via `scripts/stratum-link.sh` or a follow-up
  `decide`. Neither ledger is authoritative alone — git is the artifact history, Stratum
  is the reasoning history.

## Resuming cold

1. Read `HANDOFF.md` if present — it will not be, once this file exists and the
   discipline above is followed consistently, since every burst ends checkpointed and
   HANDOFF.md is only for a genuinely interrupted session.
2. Read `CLAUDE.md` for what this project is.
3. Run `stratum tessera --log mazze-leczzare-blog` for the full decision projection, and
   `stratum export --log mazze-leczzare-blog` if you need the raw event history.
4. Run `git log --oneline` for the artifact history, `docs/journal/CHECKPOINT.md` for
   the prose state.
5. Resume at the burst workflow above.

## Genesis

- **Stratum genesis decision — pending activation.** Once `stratum init` is run (see the
  activation note near the top), record it:
  ```
  stratum decide "Genesis: mazze-leczzare-blog gets a dedicated Stratum log for its build decisions, alongside the existing prose docs/journal/. The project is the static-first Astro studio + blog at mazzeleczzare.com (Cloudflare Pages, agent-discoverable, Cipher Gothic design system)." \
    --log mazze-leczzare-blog \
    --shadow "Dedicated log rather than the shared workspace log so this site's decision trail is scoped and exportable on its own — it has its own long-running design/architecture arc (constellation decay engine, Kintsugi tokens, agent surfaces) that deserves an isolated ledger. docs/journal/ stays as the human-readable narrative; Stratum is the structured layer under it."
  ```
  Then paste the returned `dec-…` id here.
- Git commit — this setup landed with the `chore(stratum): scaffold the build-journal
  workflow` commit; see `git log` for the hash.
