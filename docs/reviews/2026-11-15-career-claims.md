# Career claim corrections

Reviewed November 15, 2026 against the scoped proof-bank review in
[opportunity-ledger PR 6](https://github.com/mazze93/opportunity-ledger/pull/6).
Baseline: `0007c92110f44f803af72cba6ff5ef29af90291a`.

## Decisions

- Keep the banknote research contribution as first-hand work history. Remove
  the unsubstantiated Scientific Reports acknowledgment and its attribution tier.
- Distinguish Lab Manager Assistant in the Luck Lab from Junior Specialist in
  the Bliss-Moreau Lab. Use the degree wording with a parenthetical neuroscience
  emphasis. Retain self-reported employment dates where not otherwise corrected.
- Describe MAESTRO as a self-published comparative review of documented
  applications. Preserve the report and underlying case-study citations.
- Credit podcast production and hosting rather than founding; keep the count
  of 27 attributed to first-hand work history. Hold unsupported article-volume
  and community-growth metrics. Use Founder for Secure Pride while conflicting
  executive titles and founding dates remain unresolved.
- Add the dedicated Snyk advisory for CVE-2026-59868, which explicitly credits
  Mazze and rates it High 8.2. Preserve GitHub's separately attributed Moderate
  5.3 assessment. Correct the ambiguous analyst-count wording.
- Apply matching targeted corrections to the two identical downloadable CV
  copies. Also bound Stele's lexical coverage and historical test-count wording,
  remove signed-approval and cross-model-result overclaims, and label the
  unlinked MacProbe/kintsugi artifacts as in-progress or unverified prototypes.
  Original PDFs remain in git history. The historical publication-surface HTML
  snapshot is retained as historical evidence; current `/work` uses JSON entries.

## Validation and limits

- `npm run check`: passed; Astro built 60 pages and TypeScript completed.
- `npm test`: 264 tests passed in 12 files.
- `npm run docs:check`: exited 0, with two material verification limits. The
  legacy live-entry extractor found no live entries after content moved to JSON,
  so it did not verify those external live routes. Skill-source comparison was
  unavailable on this machine. Neither is counted as verified.
- Both corrected CV PDFs were rendered and visually inspected; text remains
  selectable. This is a bounded copy correction, not a full audit of every CV
  or website claim. Original source and previous document versions are retained.
- No deployment, live-route verification or cryptographic release-signature
  verification was performed in this correction pass.
- The Stratum CLI is unavailable in this environment. No live Stratum decision
  receipt is claimed; this committed record and the PR preserve the decisions.

## Handoff

The branch is reviewable independently of the proof-bank PR. Merge through the
normal protected workflow, then verify the changed public routes and CV on the
deployed revision. No application was submitted and no outreach was sent.
