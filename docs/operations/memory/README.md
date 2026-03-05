# Memory Framework

Purpose: persistent, audit-friendly operational memory for future agent sessions.

## Files
- `ACTIVE_CONTEXT.md`: current branch, goal, blockers, next commands.
- `DECISION_LOG.md`: major decisions with rationale and risk notes.
- `SESSION_LOG.md`: chronological timeline of concrete actions.
- `HANDOFF_TEMPLATE.md`: copy/paste template for consistent handoff notes.
- `context-cache/`: auto-generated summaries from git hooks.

## Ops Commands
- `bash scripts/ops/session-handoff.sh`: one-command update for `ACTIVE_CONTEXT.md` + `SESSION_LOG.md`.
- `bash scripts/ops/update-context-cache.sh`: refresh `context-cache/latest.md` + timestamped snapshot.
- `bash scripts/ops/prune-context-cache.sh 30`: retain latest 30 timestamped snapshots.
- `bash scripts/ops/setup-hooks.sh`: install local git hooks for automatic cache update/prune on commit.

## Guardrails
- Do not store secrets, API keys, tokens, or personal data.
- Keep entries short and factual.
- Prefer evidence-backed statements over speculation.
