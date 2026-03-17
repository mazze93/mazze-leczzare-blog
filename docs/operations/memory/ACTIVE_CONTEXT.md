# Active Context

Last Updated: 2026-03-05 13:35:00Z

## Current Branch
- `codex/ops-baseline-clean`

## Active Objective
- Maintain auditable operations baseline with explicit, non-mutating context refresh.

## Current State
- Ops protocol, memory framework, and toolbelt scripts are present in-repo.
- Post-commit hook is non-mutating; context refresh runs only on explicit command.

## Known Constraints
- Main branch requires PR + checks before merge.

## Next Commands
- `bash scripts/ops/setup-hooks.sh`
- `git ctx`
- `bash scripts/ops/prune-context-cache.sh 30`
