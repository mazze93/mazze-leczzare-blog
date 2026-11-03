/* fold.js — the browser twin of engine/src/bearing/fold.py (default policy:
 * ADR-0006, a tested-by edge counts only once its latest run of that check held).
 *
 * Pure and deterministic: fold(ledger, claimIds, point, activeFrames, ignored) derives
 * every claim's bearing from the exported ledger (window.CORPUS.ledger). It must
 * agree with the Python fold exactly — engine/tests/test_js_parity.py runs both
 * over every read-point and a set of frame knock-outs and fails on any drift.
 *
 * Works as a browser global (window.BearingFold) and as a CommonJS module (node).
 */
(function (root) {
  "use strict";

  const SUPPORT = new Set(["supports", "tested-by", "derives-from"]);

  /* entries at or before the read-point */
  function cut(ledger, point) {
    return ledger.filter(e => e.seq <= point);
  }

  /* seqs of evidence withdrawn by retract entries (ADR-0005) */
  function retracted(entries) {
    return new Set(entries.filter(e => e.type === "retract").map(e => e.target));
  }

  /* latest run result per check for one claim (entries are seq-ordered: last wins) */
  function checkOutcomes(entries, id) {
    const out = new Map();
    for (const e of entries) if (e.type === "run" && e.claim === id) out.set(e.checkId, e.result);
    return out;
  }

  /* ADR-0006: a tested-by edge counts only once its check has been run and held */
  function counts(e, outcomes) {
    if (!SUPPORT.has(e.rel)) return false;
    return e.rel !== "tested-by" || outcomes.get(e.fromId) === "held";
  }

  function tierOf(refuted, n) {
    if (refuted) return "refuted";
    if (n >= 2) return "robust";
    return n === 1 ? "fragile" : "gone";
  }

  /* one claim over entries ALREADY cut at the read-point; null = not asserted.
     `ignored` holds provenance-only frames (ADR-0009): recorded, never counted. */
  function foldClaim(entries, id, active, ignored) {
    const skip = ignored || new Set();
    if (!entries.some(e => e.type === "assert" && e.claim === id)) return null;
    const dead = retracted(entries);
    const live = entries.filter(e => e.type === "evidence" && e.to === id && !dead.has(e.seq));
    const withdrawn = entries.filter(e => e.type === "evidence" && e.to === id && dead.has(e.seq));
    const outcomes = checkOutcomes(entries, id);
    const available = [...new Set(live.filter(e => counts(e, outcomes) && !skip.has(e.frame))
                                      .map(e => e.frame))].sort();
    const frames = available.filter(f => active.has(f));
    const refuted = entries.find(e => e.type === "refute" && e.claim === id) || null;
    return { tier: tierOf(refuted, frames.length), robustness: frames.length,
             frames, available, live, withdrawn, refuted };
  }

  function fold(ledger, claimIds, point, active, ignored) {
    const entries = cut(ledger, point);
    const out = {};
    for (const id of claimIds) out[id] = foldClaim(entries, id, active, ignored);
    return out;
  }

  const api = { fold, foldClaim, cut, retracted, checkOutcomes, SUPPORT };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BearingFold = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
