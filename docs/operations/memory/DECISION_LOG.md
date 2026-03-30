# Decision Log

## DECISION-001
Date: 2026-02-25
Category: Operations
Title: Establish persistent memory + protocol layer in-repo

Context:
Need auditability and cross-session continuity for future agents without relying on ephemeral chat context.

Decision:
Create `docs/operations/` with explicit protocol and structured memory files.

Why:
- Reduces onboarding time for future sessions.
- Improves consistency and accountability.
- Keeps operational state close to code and versioned.

Risks:
- Memory drift if files are not maintained.

Mitigation:
Add automation scripts and git hook context caching.

## DECISION-002
Date: 2026-02-25
Category: Tooling
Title: Use post-commit context cache snapshots

Context:
User requested reduced back-and-forth and better context reuse.

Decision:
Generate `context-cache/latest.md` and timestamped snapshots after each commit.

Why:
- Fast orientation for future agents.
- Captures factual repo state without secret material.

Risks:
- Snapshot noise or overgrowth.

Mitigation:
Keep snapshot concise and rotate by timestamp files.

## DECISION-003
Date: 2026-03-05
Category: Tooling
Title: Make post-commit hooks non-mutating for tracked files

Context:
Automatic post-commit cache writes changed tracked files immediately after commits and kept the tree dirty.

Decision:
Replace post-commit cache mutation with a reminder-only hook. Keep cache updates explicit via `git ctx` or script commands.

Why:
- Prevents dirty-tree churn after every commit.
- Reduces accidental cache-only follow-up commits.
- Keeps reviews focused on product changes.

Risks:
- Context cache may become stale if contributors forget manual refresh.

Mitigation:
- Install `git ctx` alias in `setup-hooks.sh`.
- Keep one-command `session-handoff.sh` for explicit updates.

## DECISION-004
Date: 2026-03-23
Category: Operations
Title: Treat external charters as benchmark overlays, not repo mechanics

Context:
External benchmark instructions and stale repo-local Copilot notes diverged from the actual repo scripts,
Astro config, Cloudflare usage, and context-cache workflow. That drift made it easy for agents to suggest
wrong commands and reintroduce cache churn into feature branches.

Decision:
Use external charters as quality and review overlays only. Keep repo-local instructions, `package.json`,
`astro.config.mjs`, `wrangler.toml`, and other concrete repo files authoritative for commands,
architecture, and deployment mechanics. Normalize context-cache policy to explicit refresh only, with
no tracked-file mutation as a side effect of commits or branch operations.

Why:
- Keeps build/deploy guidance accurate.
- Prevents benchmark guidance from silently rewriting repo architecture.
- Reduces PR noise from generated operational state.
- Makes conflicts between style guidance and repo mechanics easier to resolve.

Risks:
- Benchmark docs may be treated too loosely and lose influence on quality.

Mitigation:
- Reference benchmark docs in the instruction order as overlays.
- Keep repo-local mechanics docs current when scripts, bindings, or workflow rules change.
