# HANDOFF — gay-wandering ship & secure-pride pivot (2026-08-09)

Written at a safe checkpoint. Ordered so a local model can pick up the baton.

> **Scope of this handoff.** The design-systems pass is **still live**; this
> handoff does not retire it. Item 2 of `docs/journal/HANDOFF.md` (astrolabe
> chrome) is the open design-systems task and remains the right home for that
> work. This directory is the secure-pride pivot's home.

---

## What's at the safe checkpoint

- `main` in sync with `origin/main`. Working tree clean.
- Latest commit: `15183b6` — `chore(assets): commit two blog hero images staged for future posts`.
- All three PRs landed since session start: #167, #168, #169, integrated via rebase.
- CI green on `15183b6`; CodeQL in flight (non-blocking).
- `npm run check` ✅ (43 pages) · `npm run test` ✅ (194) · `npm run docs:check` ✅.

---

## What was just shipped (gay-wandering)

**Live at `https://mazzeleczzare.com/gay-wandering/`.**

- The launch page is shipped and reachable. Full Cloudflare security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy).
- Both CTAs are in **fallback mode** (correct, by design — `PUBLIC_GAY_WANDERING_CHECKOUT_URL` is unset): "Join the first-edition list" → `/contact/?subject=Gay%20Wandering`.
- Schema.org `Book` JSON-LD is present; `Offer` block is correctly omitted until commerce activates.
- Income: **none yet.** The page exists; the commerce is not wired.

**To activate commerce (when mazze is ready):**

1. Create the Lemon Squeezy product per `docs/gay-wandering-commerce.md` (Ebook tax category, $15 minimum, $28 suggested).
2. Set `PUBLIC_GAY_WANDERING_CHECKOUT_URL` in Cloudflare Pages production env.
3. Run the 7-step E2E test in `docs/gay-wandering-commerce.md` §"Required end-to-end test" — see the hard follow-up below.
4. Confirm the live page shows "Get the complete reader" not "Join the first-edition list".

---

## Hard follow-up: gay-wandering commerce E2E test

This is a **hard follow-up** that must happen before any public launch announcement or income claim. The full procedure is in `docs/gay-wandering-commerce.md`; the pass/fail criteria:

| Step | Pass |
| --- | --- |
| 1. Purchase at lowest testable amount | Checkout returns success |
| 2. Confirm receipt contains the ZIP | Download link present in email |
| 3. Download + unzip on a second device | File unzips clean |
| 4. Open `gay-wandering-reader.html` with networking disabled | Reader loads fully offline |
| 5. `shasum -a 256 -c MANIFEST.sha256` from inside the unzipped folder | All hashes match |
| 6. Restore $15 minimum / $28 suggested price | Store reflects new price |
| 7. Live page shows "Get the complete reader" not "Join the first-edition list" | CTA copy flipped |

Any failure on any step blocks the public announcement. Do not announce a product that has not been paid for, downloaded, opened, and verified end-to-end on a second device.

---

## Deferred / unblocked work (do not lose)

**Carried from the design-systems pass** (lives in `docs/journal/HANDOFF.md`):
- Item 2: astrolabe chrome over the constellation geometry (the live next task of the design-systems pass).
- Items 3, 4, 5: smaller open items (cipher-gothic doc reconciliation, CLAUDE.md design-systems section, smaller fixes).

**New from this session:**
- Wire `dreaming_of_moondrift.png` and `firedust_on_riverbend.png` into posts (or decide they are not needed and retire them).
- If user wants to publicize gay-wandering: run the 7-step E2E test first.

---

## What's next: secure-pride pivot

User instruction: pivot hard to secure-pride. Inputs the next session needs:

### Known state of secure-pride (per user's CLAUDE.md)
- **Broken.** Static landing page only; nav is dead; tools are inaccessible.
- **Hard stops (non-negotiable):**
  - No localStorage.
  - No public container commits.
  - MAX posture at all times.
- **Production deployment:** Cloudflare Pages.
- **Org context:** LGBTQ+ nonprofit; SOGI data is encryption-by-default, never logged, RBAC + quarterly audit, no third-party sharing.
- **Related work in this monorepo:** SP tools are Python + zsh scripts + Docker; the `aegis` firewall is a macOS hardening tool at v2.1.

### Open questions to surface (don't assume)
1. What is the "static landing" — is the secure-pride repo a separate checkout, or is it a route in this blog repo, or a different repo entirely?
2. What "tools" need to be reachable? Aegis firewall? DLP scanner? Both?
3. Is the pivot about *fixing the broken state* or *shipping new work*?
4. What does "MAX posture" mean concretely in the current build? (Was the user inferring this from a design intent, or is there a written spec?)

### First concrete action for the next session
1. **Locate the secure-pride code.** `gh repo list mazze93` or similar; check `~/Projects/` and `~/Code/` for a `secure-pride` or `securepride.org` checkout. Do not start coding until the codebase is found and read.
2. **Read the user's known-broken description literally.** If the landing is static and nav is dead, that's a routing or hydration bug, not a missing-feature bug. Reproduce first.
3. **Surface the open questions above to the user before proposing an implementation plan.** Hard stops need explicit user confirmation, not assumption.
4. **Do not introduce localStorage, do not commit container config, do not lower posture** under any framing. If a fix seems to require it, surface the conflict and stop.

---

## Guardrails for whoever picks this up

- **The `HANDOFF.md` you just read is scoped to the secure-pride pivot.** The design-systems pass is not closed; its HANDOFF still owns the astrolabe chrome task.
- **Gay-wandering commerce is a hard follow-up, not a "ship" milestone.** Don't claim income or announce until the 7-step E2E passes.
- **Secure-pride hard stops are real.** No localStorage, no public container commits, MAX posture. If you find yourself about to violate one of those, you are about to do the wrong thing.
- **`npm run check && npm run test && npm run docs:check` before every commit** in this repo.
- **Resolve paths, don't grep them.** Two wrong conclusions came from substring-matching `/fonts/` in past sessions. If a claim is "this file is unused" or "this reference is broken," resolve it against its base and `stat` it.
- **Push to main is permitted in this repo** (no PR-required branch protection in the design-sync / current state). Single-commit, GPG-signed, with a clear message.
