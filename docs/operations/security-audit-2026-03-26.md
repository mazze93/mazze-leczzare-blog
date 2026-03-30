# Repo And Git Security Audit

Date: 2026-03-26
Repo: `/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog`
Auditor: Codex

## Executive Summary

The current repo state is mostly clean from a secret-handling perspective: no tracked `.env` or `.dev.vars` files were found, the worktree is clean, the `origin` remote uses HTTPS, the credential helper is macOS Keychain, and the project publishes both `SECURITY.md` and `.well-known/security.txt`.

The highest-impact issue is the contact submission endpoint. It is publicly reachable and forwards email or webhook traffic, but it has no server-side rate limiter and no origin check. Its current anti-bot controls are a honeypot field and a client-supplied timestamp, both of which are trivial to bypass from a script. That makes the endpoint usable as a spam relay or webhook flood source.

The next most important Git issue is local ref pollution: `.git/refs/.DS_Store` exists and causes `git fsck --full --no-reflogs` to fail with `badRefName`. This is a local integrity problem, not a tracked-file problem, but it should be cleaned up immediately.

## Scope

- Git worktree state
- Git local config relevant to trust and credential posture
- Tracked secret exposure risk
- Runtime-facing serverless handlers in `functions/`
- Dependency vulnerability posture from `npm audit --omit=dev --audit-level=moderate --json`

## Findings

### High

#### F-01: Contact endpoint can be abused for spam and downstream webhook flooding

- Severity: High
- Location:
  - `functions/api/contact.ts:103`
  - `functions/api/contact.ts:141`
  - `functions/api/contact.ts:205`
  - `src/components/ContactForm.tsx:25`
  - `src/components/ContactForm.tsx:42`
  - `src/components/ContactForm.tsx:69`
- Evidence:
  - The server accepts anonymous POST requests and proceeds directly to delivery after validating only field shape plus `company` and `startedAt`.
  - `startedAt` is supplied by the browser client in the request body, so an attacker can forge any acceptable elapsed time.
  - No rate limiter is configured for contact delivery, while `wrangler.toml` only provisions `SHARE_EVENT_RATE_LIMITER` for `/api/share-event`.
  - No same-origin validation exists in the contact handler, unlike `functions/api/share-event.ts`.
- Impact:
  - Any actor who can reach the public site can script repeated POSTs to `/api/contact` and trigger mailbox delivery or webhook posts.
  - Operational consequences: inbox spam, webhook abuse, third-party automation churn, log noise, potential quota burn, and harder incident triage.
- Recommendation:
  - Best path: mirror the `share-event` pattern in the contact handler and add a dedicated `CONTACT_RATE_LIMITER` binding in [`wrangler.toml`](/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/wrangler.toml#L15).
  - Add same-origin enforcement for browser form submissions.
  - Keep the honeypot as a low-cost filter, but stop treating it as primary protection.
  - If unsolicited traffic remains high, add Cloudflare Turnstile after the server-side rate limiter is in place.
- Mitigation if not fixed immediately:
  - Put an explicit Cloudflare WAF rule or rate limit in front of `/api/contact`.

### Medium

#### F-02: Local Git refs namespace is polluted by Finder metadata

- Severity: Medium
- Location:
  - `.git/refs/.DS_Store`
- Evidence:
  - `git fsck --full --no-reflogs` returns:
    - `error: refs/.DS_Store: badRefName: invalid refname format`
    - `error: refs/.DS_Store: badRefContent:`
  - `ls -la .git/refs` shows `.DS_Store` inside the Git refs directory.
- Impact:
  - Git integrity checks currently fail.
  - Tooling that enumerates refs may misbehave or require special handling.
  - This is also evidence that local macOS metadata is being written into the repository internals, which expands failure modes during maintenance.
- Recommendation:
  - Best path: remove `.git/refs/.DS_Store` and any other `.DS_Store` files under `.git/`, then rerun `git fsck --full --no-reflogs`.
  - Avoid opening `.git/` in Finder.
- Mitigation if not fixed immediately:
  - Treat the local clone as slightly tainted for Git-integrity tooling until `fsck` passes cleanly.

#### F-03: Dependency tree has one high and thirteen moderate vulnerabilities

- Severity: Medium
- Location:
  - [`package.json`](/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/package.json#L5)
- Evidence:
  - `npm audit --omit=dev --audit-level=moderate --json` reports:
    - 1 high: `picomatch` ReDoS and glob-matching issues
    - 13 moderate findings through `astro`, `vite`, `@astrojs/mdx`, `@astrojs/react`, `smol-toml`, `tinyglobby`, and related dependencies
  - Direct versions in use include:
    - `astro` `5.18.0`
    - `@astrojs/mdx` `4.3.0`
    - `@astrojs/react` `^4.4.2`
- Impact:
  - Most of this risk is concentrated in the build and tooling chain, not the public request path.
  - The operational consequence is supply-chain exposure in local builds and CI, plus higher drag during future upgrades because fixes are blocked upstream.
- Recommendation:
  - Best path: schedule a framework dependency refresh led by `astro` and its integrations instead of piecemeal transitive patching.
  - Re-run `npm audit` after bumping Astro and integration packages together.
- False positive / nuance:
  - This is not equivalent to confirmed remote code execution on the live site. It is still real supply-chain and maintenance risk.

#### F-04: Git authenticity and transport integrity hardening are not enabled locally

- Severity: Medium
- Location:
  - Local Git config
- Evidence:
  - `credential.helper osxkeychain` is configured, which is good.
  - `commit.gpgsign`, `tag.gpgsign`, `user.signingkey`, `gpg.format`, `fetch.fsckObjects`, `transfer.fsckObjects`, and `receive.fsckObjects` are unset.
  - Recent commits show `N` in `%G?`, meaning they are not signed.
- Impact:
  - Commits and tags are easier to spoof socially because authenticity is not being asserted cryptographically.
  - Malformed objects are not being proactively rejected on fetch/push by local policy.
- Recommendation:
  - Best path: enable SSH or GPG commit signing and set `fetch.fsckObjects=true` and `transfer.fsckObjects=true` in the local or global Git config.
  - This is especially relevant because this repo is being modified by multiple agent-created branches and worktrees.

### Low

#### F-05: Remote branch surface is larger than necessary and mostly unmerged

- Severity: Low
- Location:
  - Remote refs under `origin/*`
- Evidence:
  - `git branch -r --merged origin/main` returns only `origin/main`.
  - `git branch -r --no-merged origin/main` returns numerous agent-created and patch branches, including `claude/*`, `codex/*`, `copilot/*`, `dependabot/*`, and `mazze93-patch-*`.
- Impact:
  - More unmerged remote branches mean more stale code paths, more review surface, and more places for outdated dependencies or unsafe drafts to persist.
  - This is operational risk, not proof of a code exploit.
- Recommendation:
  - Best path: prune or merge intentionally; delete abandoned remote branches after confirming they are not still needed.

#### F-06: Browser hardening headers are not visible in repo code

- Severity: Low
- Location:
  - [`src/components/BaseHead.astro`](/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/src/components/BaseHead.astro#L57)
- Evidence:
  - The shared head component defines metadata and an inline theme bootstrap script.
  - No CSP, `frame-ancestors`, `X-Frame-Options`, `Referrer-Policy`, or `X-Content-Type-Options` policy is visible in repo code.
- Impact:
  - If the edge is not already adding these headers, the site is missing common browser-enforced defense-in-depth controls.
- Recommendation:
  - Best path: verify live response headers at the Cloudflare edge, then set them there rather than trying to simulate them piecemeal in HTML.
- False positive / nuance:
  - This may already be solved in Cloudflare Pages or a separate edge configuration. It is simply not visible from the repo.

## Verified Good State

- No tracked `.env` or `.dev.vars` secrets were found. Only [`.dev.vars.example`](/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/.dev.vars.example#L1) is tracked.
- The current worktree is clean: `git status --short --branch` shows no tracked-file modifications.
- The `origin` remote uses HTTPS.
- The macOS Keychain credential helper is configured.
- No active custom Git hooks are configured through `core.hooksPath`.
- Security reporting is published in both [`SECURITY.md`](/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/SECURITY.md#L1) and [`public/.well-known/security.txt`](/Users/daedalus/🚀 PROJECTS/personal/mazze-leczzare-blog/public/.well-known/security.txt#L1).
- The share-event endpoint has better abuse controls than the contact endpoint: same-origin checking plus a configured rate limiter.

## Recommended Order Of Operations

1. Fix `F-01` first: add server-side rate limiting and same-origin enforcement to `/api/contact`.
2. Fix `F-02` second: remove `.git/refs/.DS_Store` and rerun `git fsck`.
3. Fix `F-04` third: enable signed commits and Git fsck enforcement.
4. Plan `F-03` as a bounded dependency refresh.
5. Clean up `F-05` after confirming which remote branches still matter.
6. Verify live edge headers for `F-06`.

## Commands Used

```bash
git status --short --branch
git remote -v
git config --show-origin --get-regexp '^(remote\..*url|core\.hooksPath|commit\.gpgsign|user\.signingkey|gpg\.format|pull\.rebase|fetch\.prune|safe\.directory)$'
git config --show-origin --get-regexp '^(credential\.helper|credential\..*|commit\.gpgsign|tag\.gpgsign|user\.signingkey|gpg\.format|gpg\.ssh\.allowedSignersFile|fetch\.prune|transfer\.fsckObjects|fetch\.fsckObjects|receive\.fsckObjects)$'
git worktree list --porcelain
git for-each-ref --format='%(refname:short) %(upstream:short) %(objectname:short) %(committerdate:short)' refs/heads refs/remotes
git branch -r --merged origin/main
git branch -r --no-merged origin/main
git fsck --full --no-reflogs
git ls-files -z | xargs -0 rg -n --hidden --glob '!.git' --glob '!node_modules' --glob '!dist' --glob '!coverage' '(?i)(api[_-]?key|secret|token|password|passwd|private[_-]?key|BEGIN [A-Z ]+PRIVATE KEY|ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]+|AKIA[0-9A-Z]{16}|xox[baprs]-)'
npm audit --omit=dev --audit-level=moderate --json
```
