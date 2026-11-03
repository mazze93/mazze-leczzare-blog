import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { applyProposal, bearingAnalysis, buildCarousel, reportHTML, wordCount, slugify } from "../../public/editorial/engine.mjs";

describe("Editorial Desk pure engine", () => {
  it("changes exactly the selected passage", () => {
    const original = "Alpha. Beta. Gamma.";
    const result = applyProposal(original, { start: 7, end: 12, before: "Beta.", after: "Delta." });
    assert.equal(result, "Alpha. Delta. Gamma.");
    assert.equal(original, "Alpha. Beta. Gamma.");
  });
  it("refuses stale or impossible selections", () => {
    assert.throws(() => applyProposal("Alpha. Beta.", { start: 7, end: 12, before: "wrong", after: "new" }), /Source changed/);
    assert.throws(() => applyProposal("Alpha. Beta.", { start: -1, end: 4, before: "", after: "new" }), /Source changed/);
  });
  it("identifies heuristic prompts, without evidence grades", () => {
    const findings = bearingAnalysis("Everyone always agrees with 99% of these claims.");
    assert.ok(findings.some(f => f.kind === "certainty"));
    assert.ok(findings.some(f => f.kind === "quantification"));
  });
  it("generates an eight to nine slide lexicon deck compatible with existing renderer", () => {
    const d = buildCarousel({ title: "A Test Essay", slug: "a-test-essay", issued: "2026-11-03", body: "A premise with enough words to carry the opening.\n\n## The proof\nA complete supporting point.\n\n## The objection\nA meaningful counterpoint." });
    assert.equal(d.theme, "lexicon");
    assert.deepEqual(d.frame, { width: 1080, height: 1350 });
    assert.ok(d.slides.length >= 8 && d.slides.length <= 9);
    assert.equal(d.slides[0].kind, "cover");
    assert.equal(d.slides.at(-1).kind, "close");
    assert.ok(d.slides.filter(s => s.kind === "statement").every(s => !!s.source));
  });
  it("escapes user text in PDF-ready report HTML", () => {
    const html = reportHTML({ title: "<img src=x>", body: "<script>alert('x')</script>", findings: [], revisions: [] });
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /<img src=x>/);
    assert.match(html, /No imported Bearing graph/);
  });
  it("uses the original Bearing fold and excludes provenance-only author frames", () => {
    const source = readFileSync(new URL("../../public/editorial/bearing-fold.js", import.meta.url), "utf8");
    const scope = {};
    vm.runInNewContext(source, scope);
    const ledger = [
      { seq: 1, type: "assert", claim: "claim/a" },
      { seq: 2, type: "evidence", to: "claim/a", rel: "supports", fromId: "source/x", frame: "field" },
      { seq: 3, type: "evidence", to: "claim/a", rel: "supports", fromId: "source/y", frame: "theory" },
      { seq: 4, type: "evidence", to: "claim/a", rel: "supports", fromId: "fragment/own", frame: "author" },
    ];
    const fold = scope.BearingFold.fold;
    assert.equal(fold(ledger, ["claim/a"], 4, new Set(["field","theory","author"]), new Set(["author"]))["claim/a"].tier, "robust");
    assert.equal(fold(ledger, ["claim/a"], 4, new Set(["field","author"]), new Set(["author"]))["claim/a"].tier, "fragile");
    assert.equal(fold(ledger, ["claim/a"], 1, new Set(["field","theory"]), new Set(["author"]))["claim/a"].tier, "gone");
  });
  it("counts words and creates safe slugs", () => {
    assert.equal(wordCount("one two—three"), 3);
    assert.equal(slugify("The Jingle of Me"), "the-jingle-of-me");
  });
});