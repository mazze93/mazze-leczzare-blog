# Active Context

Last Updated: 2026-04-11

## Current Branch

- `main`

## Active Objective

- Ongoing site development and content publishing.

## Current State

- Astro 6 static site deployed on Cloudflare Pages.
- Homepage uses `HomepageLayout.astro` + `SignalHero.astro` (canvas particle animation).
- Routes: `/`, `/blog/`, `/blog/[slug]/`, `/contact/`, `/about/`, `/work/`, `/security/`, `/roadmap/`, `/rss.xml`.
- Ops scripts and memory framework are in place; post-commit hook is non-mutating.
- `npm run docs:check` validates command references and deployment terminology across docs.

## Known Constraints

- Main branch requires PR + checks before merge.
- Static output only — no SSR; all dynamic behaviour goes through Cloudflare Functions.

## Next Commands

- `bash scripts/ops/session-handoff.sh` to update this file and SESSION_LOG.md
- `bash scripts/ops/update-context-cache.sh` to refresh context cache
