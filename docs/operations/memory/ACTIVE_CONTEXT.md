# Active Context

Last Updated: 2026-03-05 13:05:17Z

## Current Branch
- `codex/security-txt-rfc9116`

## Active Objective
- Maintain auditable operations baseline and low-friction agent handoff.

## Current State
- Ops protocol, memory framework, and toolbelt scripts are present in-repo.
- Hook automation updates cache snapshots and retention policy on each commit.

## Known Constraints
- Main branch requires PR + checks before merge.

## Next Commands
- `git add docs/operations scripts/ops .githooks scripts/bootstrap-dev-toolbelt.sh`
- `git commit -m 'Establish operations baseline with memory framework and automation'`
- `git push`
