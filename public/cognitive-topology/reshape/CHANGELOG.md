# Changelog — cognitive-topology

All notable versions, in semantic order from origin to head. Format: [Keep a Changelog];
versioning: [SemVer]. Two version lines run here and are kept aligned:

- **marketplace** — the installable plugin (`topology-core`). Origin `0.1.0` → head target `0.2.0`.
- **ct-reshape spec** — the execution spec that carries the marketplace from `0.1.0` to `0.2.0`.
  It iterated `0.2.0 → 0.7.0` as a *document*; only `0.7.0` is ratified (2026-11-15).

The genesis ledger (`data/cognitive-topology-trace.jsonl`, events `ct-000…ct-012`) is the
machine record of the decisions below; this changelog is its human-readable projection.

---

## marketplace 0.2.0 — TARGET (ratified, not yet executed) · tag `v0.2.0`
Reshape `topology-core` into Stratum's first orchestration + ingress client. Executed by Claude
Code against **ct-reshape@0.7.0**; completion is recorded as ledger events, then tagged.
T1 (the ingress client) shipped upstream in Stratum as `stratum emit` (PR #101); T2 and T4 wait
on a home for the plugin source; T3 is split out as ContextSynapse work.
- **Added** — Stratum ingress client (`POST /api/logs/{logId}/events`, confirmed envelope);
  `/tessera` reads `GET …/projection?epoch=`; executable envelope fixtures.
- **Changed** — `memory` skill defers ranking to ContextSynapse's fold, carries + protects the
  Lighthouse; role renamed **Historian → Chronicle** (serialized single-writer, RUNTIME §8.2).
- **Removed / Archived** — `templates/tessera.schema.yaml` (the YAML-writer contract) → `docs/superseded/`.
- **Invariant** — `INGRESS-I1`: interpret, don't transcript; no unmasked representation crosses
  the canonicalization boundary; idempotency = `digest(canonical masked emission)` as the event `id`.

## marketplace 0.1.0 — origin (in `outputs/`, pre-reshape) · tag `v0.1.0`
Standalone marketplace built from the Cognitive Architecture paper, before Stratum was known.
- **Added** — `topology-core`: `/tessera`, `memory` skill, spec/tessera/handoff templates,
  `docs/topology.md` (12-role map), `docs/roadmap.md`.
- **Superseded by** — the reshape (foreclosed `ct-002`, `ct-003`, `ct-004`): this version
  reimplemented Stratum's shipped ledger. Kept for provenance; **do not install as-is**.

---

### ct-reshape spec — document revision history (only 0.7.0 is ratified)

| Ver | State | What changed |
|---|---|---|
| 0.7.0 | **Ratified 2026-11-15** | Re-baselined against Stratum source and the T1 build: §5 corrected in four places (`birth_status` on every record, no `kind` enum, `schema_version` per event 1 or 2, 409 ambiguous); real paths; T1 delivered upstream; T3 split out; `ct-012` flagged as not postable until rebound as v2. Ratified by Mazze ("Ratify the spec"); Stratum `ig-006`/`ig-007`. |
| 0.6.0 | draft | Envelope + birth-status legality read from `mazze93/stratum` source. This row previously said "Ratified 2026-09-06", but the spec's own header said Draft; the 2026-09-06 ratification (`ct-001`) was of the reshape decision `ct-000`, not this document. |
| 0.5.0 | draft | `INGRESS-I1` restated as a boundary invariant; idempotency = digest of canonical masked emission; proposition-based tickets; ct-011 legality held open as `pending_evidence` + fallback. |
| 0.4.0 | draft | Seven defects from external architectural review folded in; `INGRESS-I1` elevated. Diagnosis: *articulated verified-vs-axiomatic, then violated it in its own bookkeeping.* |
| 0.3.0 | draft | Event schema committed from `MEMORY_MODEL.md` (validated reference); HTTP envelope isolated as the one residual. |
| 0.2.0 | draft | First reshape spec after the reframe was ratified; honest "read the schema from source at T1." |

---

## Tagging plan (annotated, GPG-signed to match repo posture)

The marketplace repo mirrors Stratum's conventions: **SHA-pinned actions, signed tags, generated
records never hand-edited.** Tag at each shippable state; the ledger event is the source of truth,
the tag is the git checkpoint.

```sh
cd ~/code/cognitive-topology
git init && git add -A && git commit -S -m "cognitive-topology 0.1.0: topology-core (pre-reshape)"
git tag -s v0.1.0 -m "marketplace 0.1.0 — standalone (superseded by reshape)"

# after Claude Code executes ct-reshape@0.7.0 and the genesis trace posts:
git add -A && git commit -S -m "cognitive-topology 0.2.0: Stratum ingress client (ct-reshape@0.7.0)"
git tag -s v0.2.0 -m "marketplace 0.2.0 — ingress client; genesis ct-000..ct-012"
git push --follow-tags
```

Doc version headers are aligned to this table: `marketplace.json`/`plugin.json` read the marketplace
version; `specs/…spec.md` reads `0.7.0`; `data/cognitive-topology-trace.jsonl` is `schema_version: 1`.
`VERSION` holds the marketplace version. The spec's **Date** field reads `2026-11-15` (content
ratification), with the direction's `2026-08-18` beside it; genesis (`ct-000`, `ct-001`) is
`2026-09-06`.
