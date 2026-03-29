# Instruction & Documentation Conflict Audit

Date: 2026-03-25
Status: Findings resolved on 2026-03-25 via docs/process updates
Scope: repository-local agent instructions and operational docs

## Executive summary

This repo contains **instruction drift** between baseline agent guidance (`AGENTS.md`), Copilot guidance (`.github/copilot-instructions.md`), and runtime/project reality (`package.json`, `astro.config.mjs`, `README.md`).

The most impactful conflicts involve:

1. **Deployment/runtime model mismatch** (Workers adapter guidance vs static Pages config).
2. **Command mismatch** (documented scripts that do not exist).
3. **Potential instruction precedence confusion** between the operations protocol and benchmark docs referenced there.

## Findings

### 1) Deployment model conflict: Cloudflare Workers vs Cloudflare Pages static

- `.github/copilot-instructions.md` states the project is deployed to Cloudflare Workers using `@astrojs/cloudflare` and references adapter-specific behavior (`platformProxy.enabled`).
- Actual `astro.config.mjs` sets `output: "static"` and does **not** configure a Cloudflare adapter.
- `README.md` explicitly describes Cloudflare Pages static deployment.

**Risk:** Agents may apply wrong build/deploy assumptions, modify non-existent adapter config, or run incorrect validation workflows.

### 2) Script/command conflict in Copilot instructions

`.github/copilot-instructions.md` lists commands that are currently absent from `package.json`:

- `npm run cf-typegen` (missing)
- `npm run check` described as `astro build && tsc && wrangler deploy --dry-run`, but actual `check` is `astro build && tsc`
- `npm run preview` described as `build + wrangler dev`, but actual script is `astro preview`

**Risk:** Automated workflows and humans following those instructions will hit command failures or validate incorrect behavior.

### 3) AGENTS note ambiguity about landing page path

Root `AGENTS.md` says `index.astro` at root is likely landing page.

Actual landing page is `src/pages/index.astro`.

**Risk:** Low-to-medium; mostly navigation friction for contributors and agents.

### 4) Instruction precedence may be interpreted inconsistently

`docs/operations/AGENT_OPERATIONS_PROTOCOL.md` defines precedence and includes benchmark docs (Mindful Development Charter / Secure Pride Copilot Instructions) above repo-local Copilot instructions.

Those benchmark docs are not stored in this repo and may conflict with active platform/developer instructions in interactive sessions.

**Risk:** Medium; can cause agents to over-apply external meta-instructions (e.g., mandatory multi-phase workflow/approval gates) even when task scope is simple documentation or audit.

### 5) Optional operations artifacts referenced but potentially absent from workflow

The operations protocol references scripts such as `scripts/ops/prune-context-cache.sh` and `scripts/ops/session-handoff.sh`.

If these scripts are expected by operators but missing or not wired into routine commands, the memory policy can become performative instead of enforceable.

**Risk:** Low-to-medium unless those scripts are actively expected in automation.

## Recommended fixes (priority order)

1. **Update `.github/copilot-instructions.md` first** to match current runtime model and package scripts exactly.
2. **Align all command docs** (`README.md`, AGENTS, Copilot instructions) to one canonical command list from `package.json`.
3. **Clarify precedence language** in `AGENT_OPERATIONS_PROTOCOL.md` to explicitly defer to platform/developer/user runtime instructions when conflicts occur.
4. **Tighten AGENTS wording** from "index.astro at root" to "`src/pages/index.astro`".
5. **Validate operations script references** and either add missing scripts or remove references to avoid dead guidance.

## Suggested policy guardrail

Add a lightweight docs integrity check in CI that verifies:

- Every command documented in Copilot/agent docs exists in `package.json` scripts.
- Mentioned deployment mode (Workers vs Pages/static) matches `astro.config.mjs`.

A simple scripted check can prevent future drift.

## Confidence

High confidence for findings #1-#3 (directly verified against source files).
Medium confidence for findings #4-#5 (process-risk based, dependent on external runtime context and whether referenced ops scripts are actually expected).
