# DECISIONS — gay-wandering ship & secure-pride pivot (2026-08-09)

## 1. Ship = deploy the page, not activate the commerce

The user asked to "ship" gay-wandering. Two readings:

- **Reading A:** ship the launch page (deploy the repo work; the page is live and visible).
- **Reading B:** ship the *commerce* (the page is meaningless without the buy button; the income is in the checkout).

**Decision: A.** I asked the user explicitly via AskUserQuestion before invoking the publish skill. The reasoning:

- The page IS the product, not the marketing of a separate store. Without the page, there is no commerce surface to point buyers to.
- The commerce activation is gated by an external service (Lemon Squeezy) and a secret (the store URL). Neither is in the repo by design — secrets stay out. Activating it requires a manual step that only the user can take (set the env var in Cloudflare Pages dashboard, then run a 7-step E2E test).
- A repo that is "shipped" but where commerce fails open to a contact link is **graceful degradation**, not a regression. The fallback is in the page's own logic, not a 404.

**Reverse:** if the user later wants Reading B, the work is: create the Lemon Squeezy store, set the env var, run the E2E. All written down in `docs/gay-wandering-commerce.md`.

## 2. E2E test deferred to HANDOFF, not silently dropped

The 7-step manual test in the commerce doc is the gate between "page is up" and "buyer can actually purchase." I did not run it because:

- It requires the actual Lemon Squeezy store (no test mode in the repo).
- It requires a real payment at a temporary low price.
- It requires a second device for the offline-reader check.
- It requires the page to be in production, not preview.

**Decision:** write the test verbatim into the new CHECKPOINT under "Hard follow-up: manual E2E commerce test" with explicit pass/fail criteria. The next session inherits the procedure, not the result.

**Reverse:** if the user wants the E2E run *now* instead of after the secure-pride pivot, the steps are in the CHECKPOINT. Estimated time: 20–40 minutes once the Lemon Squeezy store is set up.

## 3. Two untracked images committed as assets-only, no post wired

`dreaming_of_moondrift.png` and `firedust_on_riverbend.png` were untracked. I asked the user:

- Option A (recommended, accepted): commit them as assets with a deferred wire-in decision.
- Option B: move to stash / outside repo (lose on worktree cleanup).
- Option C: find or create a post that should reference them.

**Decision: A.** Both images are 1672×941 and 1536×1024 — landscape orientation, suitable for blog hero images. They are not referenced by any post or page. I did not invent a post for them, because:

- The blog content surface is the user's voice, not the agent's.
- Wiring them in wrongly (e.g., a forced fit) is a worse outcome than leaving them orphaned in `src/assets/images/blog/`.
- They are now in git history, recoverable, and visible to the next session as a "wire-in decision" item.

**Reverse:** trivial. Add a `heroImage:` to any post frontmatter.

## 4. New sibling journal directory, not overwriting the design-systems journal

The design-systems pass's `HANDOFF.md` and `CHECKPOINT.md` are live (item 2 — astrolabe chrome — is open). PR #168 created `docs/journal/2026-08-08-studio-nav-disclosure/` as a sibling, explicitly *because* the design-systems journal had been clobbered by a concurrent worktree before. I followed that pattern: created `docs/journal/2026-08-09-gay-wandering-ship-and-pivot/` with its own CHECKPOINT and HANDOFF, leaving the design-systems journal untouched.

**Reverse:** none. The design-systems pass is the right home for astrolabe-chrome work; the secure-pride pivot belongs here, not there.

## 5. PUBLICATION_LOG.md created, not pre-existing

The publish skill assumes a `PUBLICATION_LOG.md` exists. It did not. I created it with the schema header and a single row for `15183b6`. Going forward, every `publish` invocation appends a row here.

**Reverse:** none. The file is a log, append-only. If the user wants a different format, it is a one-time migration.

## 6. Did not push to `main` without rebase, did not force-push

When the local `git push` was rejected (remote ahead by 3 commits), I used `git pull --rebase origin main` per the design-systems HANDOFF guidance. I did not force-push. The rebase succeeded because my single commit (`dd128a4`) had no overlap with the three remote commits (`f6d52ee`, `5513090`, `f54c14e`). After the rebase, the commit was renumbered to `15183b6` and pushed successfully.

**Reverse:** none. This is the standard "remote moved while I was working" handling.

## 7. Pivoting to secure-pride without inheriting its broken state silently

The user's CLAUDE.md says secure-pride is broken: static landing, dead nav, tools inaccessible. I will not pretend those don't exist when I open the secure-pride repo. The new `HANDOFF.md` in this journal calls out the known-broken state explicitly so the next session starts with honest priors.

**Reverse:** none. Surfacing broken state is non-negotiable per the user's stated preference.
