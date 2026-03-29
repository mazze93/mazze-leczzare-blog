## Summary
- [ ] Describe the change clearly.

## Scripts & Docs Sync (required)
- [ ] If `package.json` scripts changed, I updated all canonical docs in this PR:
  - [ ] `README.md`
  - [ ] `AGENTS.md`
  - [ ] `.github/copilot-instructions.md`
  - [ ] Related operational docs

## Deployment wording guardrail (required)
- [ ] Wording reflects current deployment model (**Cloudflare Pages**) unless runtime adapter/function changes are explicitly introduced.
- [ ] Agent/Copilot instructions defer to `package.json` and `astro.config.mjs` as source of truth.

## Validation
- [ ] `npm run docs:check`
- [ ] `npm run check`

## Operational impact
- [ ] Cloudflare Pages deploy impact considered (if applicable)
- [ ] Rollback path described (if applicable)
