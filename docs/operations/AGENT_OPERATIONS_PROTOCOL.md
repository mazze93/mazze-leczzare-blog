# Agent Operations Protocol (Audit Baseline)

Status: Active
Last Updated: 2026-02-25
Scope: This repository

## Visual Legend (Color + Label)
- 🟩 GO: proceed autonomously
- 🟨 CHECK: verify before claiming done
- 🟦 NOTE: context or background
- 🟧 DECISION: log rationale and trade-offs
- 🟥 ESCALATE: stop and request explicit human approval

## Mission
Build and ship production-safe changes with command-first verification, honest certainty boundaries, and strong context continuity across sessions.

## At-a-Glance Dashboard
- 🟩 Build Flow: `Understand -> Verify -> Design -> Build -> Validate -> Deploy`
- 🟩 Execution Mode: CLI-first, evidence-first
- 🟩 Memory Mode: persistent files + auto context-cache snapshots
- 🟩 Memory Mode: persistent files + explicit context-cache refresh
- 🟨 Confidence Rule: no "works" claim without validation evidence
- 🟥 Escalation Triggers: sensitive data handling, legal/policy calls, destructive irreversible actions

## Instruction Order
1. Platform/system/runtime safety rules
2. Active developer instructions
3. User request for current task
4. Repo-local instruction files (`AGENTS.md`, `.github/copilot-instructions.md`, docs in this repo)
5. External benchmark docs (Mindful Development Charter, Secure Pride Copilot Instructions)

Conflict rule: if any repo-local or external benchmark guidance conflicts with platform/developer/user runtime instructions, follow platform/developer/user order and treat lower-priority guidance as non-authoritative context.

## Operating Loop
### 1) Understand
- 🟨 Confirm objective, constraints, and success criteria.
- 🟨 Identify unknowns and risk boundaries.

### 2) Verify
- 🟨 Verify tools, APIs, permissions, and current repo state before edits.
- 🟨 Prefer direct evidence (`gh`, `curl`, `dig`, builds) over assumptions.

### 3) Design
- 🟧 For high-impact decisions, capture rationale in `docs/operations/memory/DECISION_LOG.md`.
- 🟨 Keep changes minimal, reversible, and aligned to existing project patterns.

### 4) Build
- 🟩 Execute CLI-first and implement directly.
- 🟨 Avoid destructive commands unless explicitly approved.

### 5) Validate
- 🟨 Run command-first checks.
- 🟨 Distinguish between verified facts and unverified assumptions.

### 6) Deploy / Handoff
- 🟨 Provide exact next actions and any manual/UI steps.
- 🟩 Write/update handoff context so future agents can continue with low friction.

## Autonomy Matrix
- 🟩 Autonomous: implementation details, refactors, bug fixes, docs, scripts, local verification.
- 🟧 Document before action: security posture changes, schema changes, infra/deploy behavior shifts.
- 🟥 Explicit approval required: credential scope expansion, sensitive data handling, legal/policy interpretation, irreversible destructive operations.

## Docs & Deployment Wording Rule
- 🟨 Any `package.json` script add/remove/rename must update canonical docs in the same PR (`README.md`, `AGENTS.md`, `.github/copilot-instructions.md`, and relevant ops docs).
- 🟨 Deployment terminology must use Cloudflare Pages wording unless runtime adapter/functions are intentionally introduced and configured.
- 🟩 Treat `package.json` and `astro.config.mjs` as source-of-truth; docs must defer to them.

## Quality Bar
- 🟨 No "works" claim without validation evidence.
- 🟨 If validation is blocked, state what was not verified and the exact command to verify.
- 🟨 Keep outputs ADHD-friendly: short sections, clear labels, strong signal-to-noise ratio.

## Security and Privacy Baseline
- 🟨 Least privilege by default.
- 🟨 No secret leakage in logs or docs.
- 🟨 Explicitly report security posture deltas and remaining gaps.

## Persistent Memory Framework
All session continuity artifacts live under `docs/operations/memory/`.

Required files:
- `ACTIVE_CONTEXT.md`: live snapshot of current state and blockers.
- `DECISION_LOG.md`: high-impact decisions with rationale.
- `SESSION_LOG.md`: chronological ops ledger.
- `HANDOFF_TEMPLATE.md`: standard handoff format.

Context cache artifacts:
- `context-cache/latest.md`
- `context-cache/YYYY-MM-DDTHHMMSSZ.md`

## Prompt/Context Caching Policy
- 🟩 Enabled through explicit command (`git ctx` or script), not automatic hook mutation.
- 🟨 Cache contains operational context only (no secrets).
- 🟨 `post-commit` must remain non-mutating for tracked files.
- 🟩 Keep only the latest 30 timestamped snapshots via `scripts/ops/prune-context-cache.sh` (manual or scheduled).
- 🟩 Use `scripts/ops/session-handoff.sh` for one-command memory updates.
- 🟨 Script references in this protocol must map to real paths in `scripts/ops/`; remove or update stale references immediately.

## File Ownership
- This protocol is authoritative for future agents operating in this repo.
- Changes should be logged in `DECISION_LOG.md`.
