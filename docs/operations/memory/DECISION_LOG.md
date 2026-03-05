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
