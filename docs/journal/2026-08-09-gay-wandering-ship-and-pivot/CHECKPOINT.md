# CHECKPOINT — gay-wandering ship & secure-pride pivot

**Opened:** 2026-08-09 (ship of /gay-wandering/ page, then pivot to secure-pride)
**Branch:** `main`, in sync with `origin/main`. Working tree clean.
**Predecessor journals:**
- `docs/journal/CHECKPOINT.md` + `HANDOFF.md` — design-systems pass (still the live pass; the astrolabe chrome task is the open item).
- `docs/journal/2026-08-08-studio-nav-disclosure/` — closed nav pass (Studio ▾ disclosure, PR #168).

## What shipped this session

| Commit | What |
| --- | --- |
| `15183b6` | `chore(assets): commit two blog hero images staged for future posts` (dreaming_of_moondrift.png, firedust_on_riverbend.png) |

**Already on `main` from upstream (rebased under, not authored this session):**
- `f6d52ee` — `feat(nav): nest Signal and Tesserae under a Studio disclosure` (#168) — header now `Work · Writing · About · Studio ▾ · │ · Stratum● · Stele●`.
- `5513090` — `Worktree giggly greeting corbato` (#167) — ArtifactEmbed + tree-of-knowledge fixes.
- `f54c14e` — Dependabot: astro 7.1.6 → 7.2.0, @types/react bumps (#169).

**Effectively shipped (was already on main at session start):**
- `cd18581` — `feat(gay-wandering): commit launch page, assets, and commerce notes` (#166) — `src/pages/gay-wandering/index.astro` + 3 cover/og images + `docs/gay-wandering-commerce.md`.

## Live verification

- `https://mazzeleczzare.com/gay-wandering/` returns **HTTP 200** with full Cloudflare security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy).
- Both CTAs show **"Join the first-edition list"** → `/contact/?subject=Gay%20Wandering` (correct fallback, `PUBLIC_GAY_WANDERING_CHECKOUT_URL` is unset).
- Schema.org `Book` offer is correctly **omitted** (no `Offer` block in the JSON-LD since `checkoutReady` is false).
- CI: ✅ success on `15183b6`; CodeQL still in flight at session close (non-blocking).

## Validation

- `npm run check` — ✅ 43 pages built.
- `npm run test` — ✅ 194 tests passed (6 files).
- `npm run docs:check` — ✅ no drift.
- Note: page count is 43, not 44. The 44-page figure from PR #168 (after a probe tesserae tile) is not reflected here — the probe tile was never committed, so the count reverts. The `tesserae` collection is still empty and prints its expected "does not exist or is empty" warning. Per `docs:check`, that's expected and not a regression.

## Key ship facts for the next session

- **Launch page IS shipped.** It is live, reachable, and shows fallback CTAs as designed.
- **Commerce is NOT activated.** No Lemon Squeezy store is wired. To activate:
  1. Create the Lemon Squeezy product per `docs/gay-wandering-commerce.md`.
  2. Set `PUBLIC_GAY_WANDERING_CHECKOUT_URL` in Cloudflare Pages production env (and preview, if you want previews to test checkout).
  3. Run the 7-step manual E2E test in that file (purchase at lowest testable amount → confirm ZIP receipt → verify offline reader → `shasum -a 256 -c`).
  4. Confirm the live page flips to "Get the complete reader" copy.
- **Income expectation:** the page exists; the product is configured; the *pay* function requires the activation above. There is no sales pipeline in the repo, no analytics, no fulfillment automation. The repo is the marketing surface and the deliverable file, not the cash register.

## Hard follow-up: manual E2E commerce test

Per `docs/gay-wandering-commerce.md` §"Required end-to-end test":

1. Purchase once with the product temporarily discounted to its lowest testable amount. **Do not publish the launch announcement first.**
2. Confirm checkout returns successfully and the receipt contains the ZIP.
3. Download and unzip the bundle on a second device.
4. Open `gay-wandering-reader.html` with networking disabled.
5. Run `shasum -a 256 -c MANIFEST.sha256` from inside the unzipped folder.
6. Restore the $15 minimum and $28 suggested price.
7. Confirm the production page shows "Get the complete reader," not "Join the first-edition list."

**Pass criteria:** all 7 steps clean. **Failure mode:** any mismatch (missing ZIP, broken offline reader, manifest hash mismatch, stale CTA copy) blocks the public launch announcement.

## Open items (carried from the design-systems pass)

These are **not closed** by this session; they remain in `docs/journal/HANDOFF.md`:

- **Item 2 (astrolabe chrome)** is the live next task in the design-systems pass.
- Items 3, 4, 5 in the design-systems HANDOFF remain open.

## What's next: secure-pride pivot

Per mazze's instruction (2026-08-09): pivot hard to secure-pride after this safe checkpoint. See `HANDOFF.md` in this directory for the secure-pride inputs.
