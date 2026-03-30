# Contributing

Thanks for contributing to `mazze-leczzare-blog`.

## Required rules for scripts and deployment wording

1. **Script changes require docs updates in the same PR**
   - If you add, remove, or rename any `package.json` script, update all canonical docs in the same pull request:
     - `README.md`
     - `AGENTS.md`
     - `.github/copilot-instructions.md`
     - operational docs that reference scripts

2. **Deployment wording must match current runtime model**
   - Use **Cloudflare Pages** terminology for this repo's deployment unless runtime adapter/functions are intentionally introduced and configured.
   - Avoid stale adapter-specific wording unless it is actually present in `astro.config.mjs` and `package.json` workflows.

3. **Source of truth order**
   - `package.json` scripts and `astro.config.mjs` deployment config are authoritative.
   - Agent/Copilot instructions and README must defer to that source of truth.

## Verification before requesting review

Run:

```bash
npm run docs:check
npm run check
```

If either command fails, fix drift before requesting review.
