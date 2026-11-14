# Self-review of PLAN revision 2 (2026-11-14 01:20Z)

These are weak points found before mazze's review, ordered by how much each could change
the plan. None of them has been applied to PLAN.md yet; each is waiting on mazze's call.

## 1. "Fully loaded" collides with decay

Verified in code.

- A node's date is the newest piece date: `nodes.ts:43-45,64`.
- Its zone comes from that age: `decay.ts:25-51`. Under 30 days is `experiment`; from 30
  days it drifts; at 180+ days it is `undefined` ("in erasure"). `committed` and `resolved`
  override age.
- A registry project with **no pieces has no date, so it has no zone**. Burst 2 does not say
  what happens.
- And if every project is loaded, most of the 22 `/work` items (Teaching, ERPLAB, Lab Ops,
  Bloom) land **in erasure**, faint at the edge. Fully loaded but mostly invisible.

**Decision needed:** what counts as "touching" a project?

- Blog, signal and tesserae pieces only (today's rule).
- Or also repo commits and deploys. Stratum deployed on 2026-11-13, so it is plainly alive,
  yet it has 0 pieces and no node.
- And which projects should be sealed `committed` so they never fade.

The decay is the constellation's meaning (the fortress that forgets), so this is an
editorial call, not a technical one.

## 2. The taxonomy has no home for creative work and music

Alidade's six bearings are writing, research, instruments, editions, bench and about. There
is no creative, music or studio bearing, yet mazze names Studio (creative work and music)
as a destination. Perdurabo, the book, the verse and fragments (signal, tesserae) and
Studio would scatter across "editions" and "bench".

**Proposal for burst 1:** consider a seventh bearing, or replace "editions" with a broader
creative bearing.

## 3. Visible progress comes late

The airlock, which mazze calls key, is burst 4, behind three measuring and data bursts
(0, 2, 3) and one decision burst (1). That is sound engineering but slow feedback.

**Option:** run an airlock design spike on a branch, in parallel with bursts 0–2. It would
render against hard-coded bearings, be discarded or adopted at burst 4, and never merge
before the registry exists.

## 4. The edge gate needs a Cloudflare token stored in CI

Burst 3b, as written, puts a read-only Cloudflare API token in GitHub secrets for a public
repo's CI. That is new credential exposure on a HIGH-posture repo.

**Alternatives:**

- run 3b as a scheduled local job (launchd), which writes a report;
- run it as a Cloudflare Worker cron with its own scoped token, so no GitHub secret is
  needed;
- or accept CI with a token scoped to read-only on one zone and one account.

Decide before burst 3.

## 5. Intents are mazze's, not mine

Burst 0 drafts each page's "intent" from source comments and copy. That risks me
authoring the site's meaning.

**Fix:** label every intent `source-stated` (quoted, with file:line) or `proposed` (mine,
needs mazze). Burst 1 only ratifies; it never infers.

## 6. Scope is ten bursts plus a track

Bursts 8 (8 repos, each with its own deploy mechanism) and 9 (indexing) are large, and
external to the apex.

**Minimum legible core:** 0 → 1 → 2 → 3a → 4 → 5 → 6 delivers the junction, the full
bench and constellation, and a gated link graph. 3b, 7, 8 and 9 can follow as separate
efforts without blocking that.

## 7. Smaller items

- Renaming `/studio/` to `/bench/` touches the footer, the header, `CLAUDE.md` and the
  sitemap, and any external links. The `_redirects` 301 covers visitors; the drift check
  and route tables must change in the same commit.
- Fieldnotes appears in bursts 7 and 8, and its deployed commit is missing locally. Burst
  8's provenance step must run before burst 7 changes any copy on that host.
- Alidade contributes only its bearings. Its instrument UI (rim, reader preview, search)
  is not considered for burst 4. Either say it was rejected, or list it as a candidate.
- Checkmate's exclusion from apex links rests on a CLAUDE.md owner decision. The new
  inventory should carry it as `publication policy: deliberately-unlinked`, so the gates
  don't flag it as an orphan.
