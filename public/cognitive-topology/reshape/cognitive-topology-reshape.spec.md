# Spec: cognitive-topology → Stratum ingress client (reshape)

**Spec id:** ct-reshape · **Spec version:** 0.7.0 (re-baselines 0.6.0 against Stratum source and the T1 build) · **Target:** cognitive-topology 0.2.0
**Status:** Ratified 2026-11-15 by Mazze ("Ratify the spec"). Recorded in Stratum's
`data/ingress-trace.jsonl` as `ig-006` (decision) and `ig-007` (ratification). Reframe direction
ratified 2026-08-18 ("full approval for 1"). 0.6.0 was never ratified as content: its header said
Draft while the changelog said ratified 2026-09-06. That date belongs to `ct-001`, which ratified
the reshape decision `ct-000`, not this document.
**Posture:** HIGH. **Date:** 2026-11-15 (direction 2026-08-18). **Executor:** Claude Code.

**Revision note, 0.7.0.** Folds the re-baseline the 2026-10-21 decision council asked for, and the
T1 build (Stratum PR #101, merged at `3553a6c`, verified as `ig-005`). §5 is corrected against
source in four places. `packages/*` paths become Stratum's real layout (`core/`, `worker/`, `cli/`,
`reference/`). T1 is marked delivered upstream. T3 is split out as ContextSynapse work. The open
questions are listed in §13. The phantom T6 and "five tiers" were already gone in 0.6.0. The
working record is Stratum `docs/journal/2026-11-11-ct-reshape-t1/REBASELINE.md`.

**Revision note.** v0.3.0 was a draft, never executed or committed to the ledger. v0.4.0 folded
seven defects from an external architectural review. v0.5.0 folds a review *of that correction*.
The honest diagnosis of the earlier defects, stated plainly: **the spec correctly articulated the
distinction between verified and axiomatic authority, then violated that distinction in its own
execution bookkeeping.** Because no version was ever posted, this supersedes the **draft
document**, not ledger history — no `dispute`/`supersession` events are warranted (that would be
performative event-sourcing). v0.5.0 refinements: `INGRESS-I1` restated as a *boundary* invariant,
not a rigid step order; idempotency defined as a digest of the canonical masked emission (semantic,
transport deferred to source); the ticket model reworked so every `verification` targets a real
proposition; and the legality of a `decision` born `pending_evidence` (§9) marked *itself*
`pending_evidence`. **v0.6.0** reads the actual repo (`github.com/mazze93/stratum`, via the file API,
2026-09-06) and resolves that open dependency from source: `_guard_originating` + the status LTS
confirm a `decision` may be born `pending_evidence` and verified to `validated` — so §5's envelope is
now *confirmed*, not proposed, and §9's ct-011/012 posts normally with the source read as its checked
evidence. The only remaining fill-in is the `schema_version` integer.

**Authority chain:** `RUNTIME.md` (constitutional) > `SPEC.md` > implementation. For the **event
contract**, `MEMORY_MODEL.md` rev 3 is the validated oracle (16/16 invariants) and governs §4.
**Grounded in (all read in full):** paper · RUNTIME · SPEC · IMPLEMENTATION · MEMORY_MODEL ·
TRUST · ARBITRATION · v0.4.0 reshape analysis · ENGRAM×ContextSynapse · deploy-verify v2.

---

## 0. For the executing agent — read first

You are the **Executor** on branch `reshape/stratum-ingress`.

### INGRESS-I1 — Deterministic interpretation boundary

Ingress emits a *deterministic interpretation* of an *explicit* interaction, never the raw
interaction stream. Only what was **said, written, checked, or ratified** may enter the canonical
event representation.

```
raw explicit interaction
  → authorized deterministic extraction         (recognize what explicitly happened)
  → sensitivity masking / minimization
  ══════════════ canonicalization boundary ══════════════   ← hard invariant below
  → canonical event construction (claim | evidence[] | marker type)
  → evidence derivation
  → canonical serialization → digest → stable emission identity
  → Stratum
```

**Hard invariant: no unmasked representation crosses the canonicalization boundary** — nothing
unmasked becomes durable, canonical, hashable, retryable, or loggable. Masking may *follow*
extraction (so the extractor can still recognize an explicit event) but must precede everything
below the boundary. The **stable emission identity is a deterministic function of the canonical
masked emission**; idempotency is *semantic* (dedupe on that identity); its transport — event id,
idempotency header, request key, or server-side — is a §5 source-confirmation question.

Depth: ContextSynapse and Stratum enforce the **same** epistemic boundary at different layers —
"explainable purely by past explicit interactions" (ENGRAM×CS §II) is Stratum's
"said/written/ratified." That shared boundary is the spine of the reshape. INGRESS-I1 is defined
once here and referenced elsewhere; it is not redefined.

### Source-confirmed (2026-09-06, re-checked 2026-11-11 at Stratum `fe353a6`)

The event contract (§4), the **HTTP envelope + auth + idempotency** (§5), and the **birth-status
legality** (§9) are confirmed against `github.com/mazze93/stratum` (`worker/src/index.ts`,
`core/src/contract.ts`, `core/src/serialize.ts`, `reference/tessera_projection.py`). Stratum's
`docs/API.md` is the cited upstream reference. Work order: **T1 is delivered** (Stratum
`cli/lib/ingress.mjs` and `stratum emit`). T2 and T4 wait on a home for the plugin source (§13).
T3 is split out (§7). Then **T5a (verify) → T5b (human ratify).**

## 1. Intent

Reshape `topology-core` from a standalone reimplementation of ledger/memory concepts into
**Stratum's first orchestration + ingress client**: it emits explicit decisions into Stratum as
events and reads status back as a fold. Integration, not deletion — the two run in different
runtimes (in-editor skills vs. a Cloudflare Worker + Durable Object ledger).

## 2. Ratified premise — recorded as a `decision` + `ratification`

The reframe is an originating **`decision`** (ct-000), birth status `asserted`. The user's "full
approval" is a **`ratification`** marker (ct-001) targeting it → folds to `ratified` → tier
**`authoritative_axiomatic`** (declared by a human, no checked evidence — MEMORY_MODEL §5). It is
*not* a `verification`; collapsing human-declared authority into evidence-backed is the exact
defect §5 names. Rationale → `claim`. Reversibility: medium.

## 3. Constraints

- **INGRESS-I1** governs every emission (§0).
- **Status is a fold, never stored** (MEMORY_MODEL §2, §10). `/tessera` renders a projection; it
  never writes one.
- **Never rewrite committed history** (RUNTIME I12/§10.6; MEMORY_MODEL I2): invalidating a prior
  decision appends a marker citing it; `contradicted`/`superseded` never delete — the projection
  renders the revision chain.
- **Masking is a boundary, not a step** (INGRESS-I1): no unmasked representation crosses the
  canonicalization boundary — nothing unmasked becomes canonical, hashable (incl. the emission
  identity), retryable, or loggable. Hard requirement for `secure-pride` (deploy-verify Scope note:
  no live-write probing either).
- **Idempotent emission.** Stable emission identity = deterministic function of the *canonical
  masked* emission (§0). Semantic idempotency: a retry of the same emission must not create a
  second historical event — critical in an append-only authority system. Transport confirmed
  against source in T1; **do not invent a header or field now.**
- **Tessera generation is Chronicle-only, serialized per session** (RUNTIME §8.2). The role is
  **Chronicle**, not "Historian." `/tessera` is a read.
- **Replay-compatible provenance** (RUNTIME I6, §11.4): every event records enough to replay to
  identical effect.
- **Context Synapse boundary (hard stop):** emit only what was said, written, or ratified — never
  inferred operational context (IMPLEMENTATION §7).
- **Stack:** Stratum = TS + Workers + DO, bearer auth, one DO per log, `stratum tessera` CLI.
  cognitive-topology = Claude Code plugin, no build step. Aux: `gh`, Linear, ENGRAM, ContextSynapse.
- **Degradation is two distinct modes** (§6): a configured-but-unavailable ledger is an integrity
  failure, not graceful degradation.

## 4. The event contract cognitive-topology emits into — COMMITTED (MEMORY_MODEL rev 3)

Verified against the validated reference. Evidence: MEMORY_MODEL §§1–8, `checked_at` = 2026-08-18.

- **Two disjoint field groups** (§1): `evidence[]` — checkable (file hash, test exit, diff SHA,
  signed approval, policy-authority signature); `claim` — LLM prose, never authoritative.
  `checked_at == null` = *cited, not checked* (**I1**: no `validated` without ≥1 checked evidence).
- **Ten-event ontology** (§4): originating — `decision`, `foreclosure`; evidence-scoped —
  `invalidation`; markers — `verification`, `supersession`, `contradiction`, `ratification`,
  `rejection`, `dispute`, `trust_root_revoked`.
- **Single-parent lineage (v1)** (§4): originating ≤1 `targets`; marker targets exactly one id.
  **Multi-parent DAGs rejected at write time** — never emit a diamond.
- **Status is a fold** (§2): `status_at(event, epoch) = fold(birth_status, markers with seq ≤
  epoch, ordered by logical seq)`. Wall-clock ignored. **Legal transitions (cited from §3, not
  memory):** `asserted → ratified/disputed`; `pending_evidence` (entry-only) `→
  validated/rejected/disputed`; `validated → contradicted/superseded`; `disputed →
  validated/rejected`. **`validated` is unreachable from `asserted`** — the phantom `asserted →
  pending_evidence` edge was removed by `test_ontology_covers_status_space`. A fact you want
  verified must be *born* `pending_evidence` (§9, and its open legality caveat).
- **Four authority tiers** (§5): `authoritative_verified` (validated) · `authoritative_axiomatic`
  (ratified) · `authoritative_provisional` (pending/under review) · `narrative` (claim/asserted).
- **Fail-closed** (§8): an authoritative field with no backing event raises `IncompleteProjection`.

**Emission tiering — the core correctness property:** a user spec ratification → `ratification`
(axiomatic); tests green with a captured exit code / diff SHA → `verification` with checked
`evidence[]` (verified); the model's reasoning → `claim` (narrative). Mis-tiering is a defect
class, gated by §6 tests.

## 5. The event envelope — CONFIRMED from source (github.com/mazze93/stratum; checked 2026-09-06, corrected 2026-11-11)

Read directly via the repo file API — no longer proposed. `POST /api/logs/{logId}/events` (Hono →
`StratumLogDO`, one DO per log, single-writer gate). Body is one snake_case event **record** — the
persisted form from `reference/tessera_projection.py::event_to_record`; `core/src/contract.ts` is the
byte-identical TS port (the Python is the semantics oracle).

```
POST /api/logs/{logId}/events             # logId in the PATH
Authorization: Bearer {STRATUM_TOKEN}      # wrangler secret; non-demo/playground logs need auth to read AND write
Content-Type: application/json
{
  "id": "<stable deterministic id>",           # the idempotency key — see below
  "type": "decision|foreclosure|verification|supersession|contradiction|ratification|rejection|dispute|invalidation|trust_root_revoked",
  "agent_id": "cognitive-topology",            # the ingress client's identity
  "schema_version": 1 | 2,                    # PER EVENT; above 2 refused (contract.ts:118)
  "birth_status": "asserted|pending_evidence|ratified",  # required on EVERY record (serialize.ts:223-225); markers carry "asserted"; ratified requires is_trust_root
  "claim": { "narrative": "<LLM prose>" },     # claim is a DICT with a narrative key; never authoritative
  "evidence": [ { "kind": "<string>",          # free string, no wire enum (serialize.ts:192-193)
                  "ref": "<value>", "checked_at": "<ISO-8601|null>", "signer": null,
                  "binding": { "type": "reproducible_check", "command": "<cmd>", "repo": "<host/owner/name>",
                               "commit": "<40-hex>", "expect_exit": 0 } } ],  # v2 only; see below
  "targets": ["<event-id>"],                   # originating ≤1; markers/invalidation exactly 1; [] for roots
  "is_trust_root": false,
  "timestamp": "<ISO-8601>"                    # optional
}
```
Unknown keys are dropped, not refused (`serialize.ts:209-261`).
Responses: 201 append · 400 parse · **409 guard violation or duplicate id (ambiguous)** · 401
unauthorized · 404 unknown event · 413 cap (5000 events) · 500 `load_failure`.

- **Evidence by version.** Under v1 a typed `checked_at` counts as checked. Under v2 `checked_at` is
  metadata, and only a well-formed `reproducible_check` binding counts (`contract.ts:134-155`), so
  automated verifications are emitted as v2. A v2 `ratification` is refused until the authority
  registry exists (`core/src/log.ts`, ADR-003 §4); ratifications stay v1 until then.
- **Idempotency — confirmed, with one correction.** `EpisodicLog.append` refuses a duplicate `id`, so
  the client's stable emission identity **is** the event `id`, a digest of the canonical masked
  emission (§0), and no duplicate is ever created. But every guard refusal is also 409
  (`worker/src/index.ts:23-24`, `core/src/log.ts:49-51`), so status alone can't tell "already landed"
  from "refused". On 409 the client reads the event back (`GET /api/logs/{logId}/events/{id}`) and
  compares. There is no header to invent.
- **`/tessera` read — confirmed.** `GET /api/logs/{logId}/projection?epoch=N` returns the fold
  (`recent_decisions` + `foreclosed_options`, each with `authority`/`status`/`revision_chain`); omit
  `epoch` for head. CLI equivalent: `stratum tessera`.
- **Birth-status legality — RESOLVED (§9).** `_guard_originating` permits `{asserted, pending_evidence,
  ratified}` for `decision`/`foreclosure`; `TRANSITIONS[pending_evidence] ⊇ {validated}` via a checked
  `verification` (I1). A `decision` born `pending_evidence` → `validated` is legal in both the Python
  oracle and the TS port. No fallback needed.
- **Choices left to the client:** the `agent_id` string, and `schema_version` per event (2 for
  verifications, 1 for ratifications until the registry exists). Neither is a held-open dependency.

## 6. Acceptance criteria (falsifiable)

T1's criteria were met upstream in Stratum rather than in the plugin, because the plugin source
has no repository (§13). See the T1 row in §7 and Stratum `cli/test/ingress.test.ts`.

- [ ] `/tessera` **reads a fold** and renders the projection at the current epoch.
- [ ] `templates/tessera.schema.yaml` **removed as a writable state file** (archived, T4).
- [ ] Ingress client exists; envelope + idempotency transport + §9 legality confirmed against
      source, recorded in `docs/stratum-ingress.md` with `checked_at`.
- [ ] **Executable envelope (not prose):** T1 ships a canonical validator + fixtures —
      `stratum-event.valid.json`, `stratum-verification-unchecked.invalid.json` (I1),
      `stratum-multiparent.invalid.json` (single-parent). Lightweight, no build step.
- [ ] **Emission-tiering test:** ratification → `ratification` (axiomatic); green test →
      `verification` with a checked evidence ref; LLM rationale only in `claim`; a `verification`
      with `checked_at: null` is **rejected** (I1); a >1-`targets` emit is rejected.
- [ ] **Idempotency:** retrying the same deterministic emission cannot create a duplicate event;
      identity = digest of the canonical masked emission; the transport is documented and tested.
- [ ] **Masking boundary:** on a `secure-pride` simulation, no unmasked identifier crosses the
      canonicalization boundary — not into construction, evidence, identity, retry, or logs.
- [ ] **Unconfigured mode** (`STRATUM_URL` unset): no network op, no local shadow ledger, notice
      `"Stratum ingress unavailable: event not persisted"`; command succeeds only where persistence
      is non-required.
- [ ] **Configured-but-failing mode** (URL set; network/auth/write fails): **fail visibly**; never
      silently downgrade to no-op — an integrity failure, not graceful degradation.
- [ ] `memory` skill defers ranking to **ContextSynapse's ForwardPass fold**; **carries the
      Lighthouse** (`projects.md ## Lighthouse`, explicit, never inferred); `/tessera` **protects**
      it (rot warning; never reassign — ENGRAM×CS §VII).
- [ ] Docs + manifests repositioned; role name **Chronicle**; marketplace + plugin bump **0.2.0**.
- [ ] The reshape's own decisions (§9) recorded in Stratum. Minimal diff — files not in §7 untouched.

## 7. Tickets (branch-per-agent; each verification targets a real proposition)

A `verification` marker targets a **proposition** — an originating event born `pending_evidence` —
not "the ticket." A `supersession` targets the prior contract directly. A `decision` that is an act
of authority is born `asserted` and ratified at T5b.

| # | Role | Change → proposition | Files | Emits |
|---|---|---|---|---|
| **T1** | Researcher→Executor | Confirm §5 envelope + idempotency + legality; build client + validator + fixtures. Proposition (born `pending_evidence`, §9): *"envelope, idempotency, and birth-status model match Stratum source."* | **Delivered upstream:** Stratum `cli/lib/ingress.mjs`, `stratum emit`, `docs/API.md` (PR #101, `3553a6c`). The plugin path `plugins/topology-core/lib/stratum.<ext>` had no home (`ig-002`). | `verification` → Stratum `ig-000`, recorded as `ig-005` (v2, bound to the ingress suite at `3553a6c`) |
| **T2** | Executor | Repoint `/tessera` to **read the projection**; delete YAML path; Historian→Chronicle. **Held** until the plugin source has a home (§13) | `commands/tessera.md` | `supersession` → the Tessera-as-file contract |
| **T3** | — | **Split out.** Reducing the `memory` skill toward ContextSynapse's fold is ContextSynapse work, not ingress. It is not executed under this spec. | — | — |
| **T4** | Architect | Reposition docs + manifests; bump 0.2.0; archive superseded contracts with a carry-forward note. **Held** with T2 (§13) | `topology.md`, `README.md`, both manifests, `templates/tessera.schema.yaml`→`docs/superseded/` | `decision` (asserted; "v0.2.0 ingress positioning adopted"), ratified at T5b |
| **T5a** | Verifier | Run §11. Proposition (born `pending_evidence`, §9): *"the reshape meets §6."* Emit verification with the acceptance suite as checked evidence | — | `verification` → the T5a proposition |
| **T5b** | Human authority | Review T5a evidence; **ratify** the completed reshape | — | `ratification` → the reshape/release decision (axiomatic) |

The `pending_evidence` propositions (T5a, ct-011) share **one** dependency — the §9 legality —
so one confirmation clears them and one fallback covers them. Survivors (do not touch):
`spec.template.md`, `handoff.schema.yaml`. Superseded contracts are archived, never deleted.

## 8. Foreclosed options — recorded as `foreclosure` events

**Cathedral target, not retired.** The twelve roles, the memory tiers and the cognitive workbench
are deferred to later bricks. A foreclosure here closes an option for this reshape only; the
*Reopen* line says when it comes back.

- `/tessera` as a YAML writer — *reason:* a hand-editable state file can lie; violates the fold and
  Chronicle serialization. *Reopen:* never.
- Reimplementing the ledger inside the plugin — *reason:* Stratum owns it. *Reopen:* if Stratum retired.
- Shipping the twelve roles now — *reason:* ledger-first sequencing (sb-004). *Reopen:* after ingress proven.
- Hard runtime coupling, no offline path — *reason:* must degrade gracefully. *Reopen:* never.
- Inventing the HTTP envelope / idempotency transport as fact — *reason:* §5 confirms against source. *Reopen:* never.
- Silent no-op when Stratum is configured-but-unavailable — *reason:* masks an integrity failure as
  success (deploy-verify "fail loudly"). *Reopen:* never.
- Masking after canonicalization/identity derivation — *reason:* leaks identifiers into hashes, the
  idempotency key, logs, retry, telemetry (INGRESS-I1). *Reopen:* never.
- Time-based memory decay — *reason:* wrong axis (ENGRAM×CS §III-A; MEMORY_MODEL §2 ignores
  wall-clock). *Reopen:* only as an absolute backstop.
- Implementing precedent decay — *reason:* unresolved research (ARBITRATION §4, no corpus). *Reopen:*
  after a real stale-precedent incident.

## 9. Recording plan — genesis-in-itself

Sequenced so **nothing posts on an ontology not yet verified.**

**Post immediately (no dependency; born `asserted`):**
- `ct-000` **decision** — reframe to ingress client. Root.
- `ct-001` **ratification** → `ct-000` — the user's full approval (axiomatic). Legal: `asserted → ratified`.
- `ct-002…010` **foreclosure** — the nine §8 options (ratified with the spec).

**Schema-facts provenance (legality now confirmed from source — post normally):**
- `ct-011` **decision**, `birth_status: pending_evidence`, `claim: {narrative: "<the §4 schema facts>"}`,
  `evidence: []`. Distinct from `ct-000` — it asserts the *contract's content*, not the reframe.
- `ct-012` **verification** → `ct-011`, `evidence: [{kind: file_hash, ref: "reference/tessera_projection.py@main",
  checked_at: 2026-09-06}, {kind: file_hash, ref: "core/src/contract.ts@main", checked_at: 2026-09-06}]`
  → folds `ct-011` to `validated` / `authoritative_verified`.
  **Not postable as written (0.7.0).** These are v1 `file_hash` entries with a `ref` of `…@main` and a
  typed `checked_at`: no digest, no commit. Posted as is, `ct-012` would fold `ct-011` to verified on
  a timestamp a model typed. Rewrite it as a v2 verification with a `reproducible_check` binding
  (`stratum verify ct-011 --run "<check>"`) before it is posted.

> **Resolved — the dependency was checked at the guard level.** Whether an originating `decision` may be
> *born* `pending_evidence` is answered by `reference/tessera_projection.py::_guard_originating`, which
> permits `{ASSERTED, PENDING_EVIDENCE, RATIFIED}` for `decision`/`foreclosure`, and by
> `_TRANSITIONS[PENDING_EVIDENCE] ⊇ {VALIDATED}` driven by a `verification` that carries checked evidence
> (I1). `core/src/contract.ts` is the byte-identical TS port. **A `decision` born `pending_evidence`,
> verified to `validated`, is legal in both implementations.** The v0.5.0 structural inference held; it is
> now checked evidence, not inference. The `asserted`-adoption fallback is withdrawn — unneeded.

Ticket-close events follow §7. No `dispute`/`supersession` for the earlier draft defects: the drafts
were never posted, so nothing entered the ledger to correct. Had they shipped, the review would be a
`dispute` and this a `supersession` — the same revision chain the contract exists to make honest.

## 10. Perimeter — what this does NOT guarantee (MEMORY_MODEL voice)

Recording makes the log trustworthy *as a record*; it does not make the decisions *sound*. A
`decision` can be `validated` by a green test that asserts nothing; evidence can reference the wrong
artifact; the ingress is only as correct as T1's confirmation and the semantic adequacy of the
evidence refs. This reshape relocates risk from invisible drift to "the adequacy of T1 and the
acceptance tests" — the trade Stratum already argues for. Acknowledging the perimeter is the guarantee.

## 11. Verification / test checklist

0. **Birth-status legality — DONE (2026-09-06).** Confirmed at the guard level:
   `reference/tessera_projection.py::_guard_originating` permits `pending_evidence` for `decision`, and
   the status LTS folds `pending_evidence --verification(checked)--> validated`; `core/src/contract.ts`
   is the byte-identical port. No fallback needed.
1. **Envelope + idempotency evidence — DONE upstream (T1).** Stratum `docs/API.md` cites
   `worker/src/index.ts`, `core/src/contract.ts` and `core/src/serialize.ts`; `stratum emit` sends the
   confirmed record shape; idempotency by `id`, including the read-back on an ambiguous 409, is
   tested in `cli/test/ingress.test.ts`.
2. **Executable fixtures:** valid fixture passes the validator; unchecked-verification and
   multi-parent fixtures are rejected.
3. **Fold, not file:** no writer path to `tessera.schema.yaml`; `/tessera` renders a projection or
   enters unconfigured-mode notice.
4. **Tiering:** ratification→axiomatic, verification→checked-evidence, prose→claim; `checked_at:
   null` verification rejected; >1-`targets` rejected.
5. **Masking boundary:** secure-pride simulation shows no unmasked identifier below the
   canonicalization boundary (construction/evidence/identity/retry/logs).
6. **Two-mode degradation:** unset → notice, command succeeds where persistence non-required;
   configured+failing → visible failure, no silent no-op.
7. **Round-trip (ledger configured):** run workflow → events appear → `/tessera` reflects them at
   the new epoch. **Version + archive:** manifests read 0.2.0; superseded contracts archived.

## 12. Handoff packet (§6.7)

```yaml
handoff:
  from_agent: architect
  to_agent: executor            # Claude Code, on the machine with the stratum repo
  reason: "execute the ratified cognitive-topology → Stratum ingress reshape (v0.7.0)"
  spec_ref: ct-reshape@0.7.0
  acceptance_criteria: [see §6]
  context_refs:
    - specs/cognitive-topology-reshape.spec.md
    - cognitive-topology/ (v0.1.0, in outputs)
    - core/ + worker/ + cli/ + reference/tessera_projection.py   # Stratum layout; docs/API.md is the cited reference
    - MEMORY_MODEL.md rev 3                     # §4 event contract (validated oracle)
    - RUNTIME.md §1,§8.2,§10.6,I6               # emission discipline, Chronicle, no-rewrite
    - ENGRAM×ContextSynapse spec §III,§VII      # memory ranking + Lighthouse
  invariants:
    - "INGRESS-I1: interpret, don't transcript; no unmasked representation crosses canonicalization"
  constraints:
    - "status is a fold, never authored"
    - "tier emissions: ratification=axiomatic, verification=checked-evidence, prose=claim"
    - "single-parent only; reject diamonds client-side"
    - "never rewrite committed history; supersede by appending a marker"
    - "idempotency = digest(canonical masked emission) used as the event id; 409 is dup OR refused, so read the event back"
    - "two-mode degradation: unconfigured = graceful; configured-but-unavailable = integrity failure"
    - "emit only said/written/ratified, never inferred context"
  confirmed_envelope:                     # §5, read from source 2026-09-06, corrected 2026-11-11
    - "POST /api/logs/{logId}/events (logId in path); Bearer STRATUM_TOKEN; body = snake_case record"
    - "record: {id, type, agent_id, schema_version, birth_status, claim:{narrative}, evidence[], targets[], is_trust_root, timestamp?}"
    - "GET /api/logs/{logId}/projection?epoch= for the /tessera read; CLI: stratum tessera"
    - "schema_version per event: 2 for verifications (bound evidence only), 1 for ratifications until the registry"
  prior_findings:
    - "three collisions with shipped Stratum: tessera-as-file, tiers-as-stores, roles-now"
    - "Historian renamed Chronicle, serialized single-writer (RUNTIME §8.2)"
    - "seven defects (external review) + boundary/idempotency/proposition refinements (v0.4–0.5)"
    - "v0.6.0: envelope + birth-status legality confirmed from mazze93/stratum source"
    - "v0.7.0: §5 corrected in four places; T1 delivered upstream; T3 split out; ratified 2026-11-15"
```

## 13. Open questions (not settled by the 2026-11-15 ratification)

1. **Where the plugin source lives.** The cognitive-topology plugin is in no GitHub repository (the
   changelog puts it at `~/code/cognitive-topology`, local). T2 and T4 can't start until it has a
   home that a session can read and write.
2. **A narrower token for automated writers** (Stratum `ig-004`). Today one `STRATUM_TOKEN` reads
   every private log and writes to all of them. A write-only token scoped to one log is proposed and
   awaits Mazze. Ratifying this spec does not adopt it.
