/**
 * Editorial Desk deterministic helpers.
 * No AI calls, network requests or mutation of source documents.
 * Findings are editorial prompts, not independently verified facts.
 */
const compact = (s) => String(s || "").replace(/\s+/g, " ").trim();
export const wordCount = (s) => (String(s || "").match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) || []).length;
export const slugify = (s) => compact(s).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "untitled";
export const escapeHTML = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function applyProposal(body, proposal) {
  const { start, end, before, after } = proposal;
  if (![start, end].every(Number.isSafeInteger) || start < 0 || end < start ||
      end > body.length || body.slice(start, end) !== before) {
    throw new Error("Source changed: review this proposal against the latest draft before applying.");
  }
  return body.slice(0, start) + after + body.slice(end);
}

const CHECKS = [
  { id: "certainty", severity: "review", pattern: /\b(always|never|everyone|nobody|completely|inevitably|guaranteed|eliminates?)\b/gi,
    note: "Absolute language: identify scope, exception, or supporting evidence." },
  { id: "causality", severity: "review", pattern: /\b(causes?|proves?|therefore|ensures?|makes? .*? inevitable)\b/gi,
    note: "Causal leap: separate a correlation or prediction from a demonstrated intervention." },
  { id: "quantification", severity: "source", pattern: /\b\d+(?:\.\d+)?\s?(?:%|percent|million|billion|times)(?=\W|$)/gi,
    note: "Quantitative claim: verify source, denominator, context, and measurement date." },
  { id: "attribution", severity: "review", pattern: /\b(research shows|studies show|experts say|according to research)\b/gi,
    note: "Attributed claim: link the actual source and check that the inference follows." },
  { id: "dichotomy", severity: "review", pattern: /\b(not merely|not just|either .*? or|the only)\b/gi,
    note: "Framing: check whether the contrast omits an important third possibility." },
];
export function bearingAnalysis(body) {
  const source = String(body || "");
  const findings = [];
  for (const check of CHECKS) {
    const regex = new RegExp(check.pattern.source, check.pattern.flags);
    for (const match of source.matchAll(regex)) {
      const start = match.index || 0;
      findings.push({
        id: `${check.id}:${start}`, kind: check.id, severity: check.severity,
        start, end: start + match[0].length, excerpt: match[0], note: check.note,
        context: compact(source.slice(Math.max(0, start - 75), Math.min(source.length, start + match[0].length + 75))),
      });
      if (findings.length >= 250) break;
    }
  }
  const paragraphs = source.split(/\n\s*\n/).map(compact).filter(x => x.length > 110);
  const seen = new Map();
  for (const text of paragraphs) {
    const key = text.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, "");
    if (seen.has(key)) findings.push({ id: `repeat:${findings.length}`, kind: "repetition", severity: "review", excerpt: text.slice(0, 130), context: text.slice(0, 180), note: "Repeated paragraph: intentional refrain or accidental duplicate?" });
    seen.set(key, true);
  }
  return findings.sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity));
}

function stripMarkdown(text) {
  return compact(String(text || "").replace(/<[^>]+>/g, "").replace(/!?\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/^[#>\-*+ ]+/gm, "").replace(/[\*_\`~]/g, ""));
}
const short = (s, n) => { const t = stripMarkdown(s); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t; };
function sectionsOf(body) {
  const sections = [];
  let current = { heading: "The premise", body: [] };
  for (const line of String(body || "").split("\n")) {
    const h = line.match(/^#{1,3}\s+(.+)$/);
    if (h) { if (current.body.some(x => x.trim())) sections.push(current); current = { heading: stripMarkdown(h[1]), body: [] }; }
    else if (!/^\s*---\s*$/.test(line)) current.body.push(line);
  }
  if (current.body.some(x => x.trim())) sections.push(current);
  return sections;
}

/**
 * Produces slides.json compatible with scripts/carousel/build.py and the
 * existing lexicon renderer. The distilled copy is an EXTRACTIVE STARTING
 * POINT, not approved/published text. Source section is carried per slide.
 */
export function buildCarousel({ title, body, slug, issued }) {
  const id = slugify(slug || title);
  const sections = sectionsOf(body);
  const selected = sections.slice(0, 7);
  const summary = sections.flatMap(s => s.body).find(s => stripMarkdown(s).length > 30) || title;
  const slides = [{
    kind: "cover", headword: "essay", pos: "n.", title: short(title, 100),
    body: short(summary, 150), exec: "read(source)", exec_caption: "Read the full source essay",
    source: "Source title and opening paragraph",
  }];
  for (const s of selected) {
    const p = s.body.join("\n").split(/\n\s*\n/).map(stripMarkdown).filter(Boolean);
    slides.push({ kind: "statement", label: short(s.heading, 60), headline: short(p[0] || s.heading, 145),
      body: short(p[1] || "", 220), source: `Section: ${s.heading}`, guide: short(s.heading, 28) });
  }
  while (slides.length < 7) {
    const i = slides.length;
    const paragraphs = String(body).split(/\n\s*\n/).map(stripMarkdown).filter(s => s.length > 35);
    const p = paragraphs[i] || paragraphs[paragraphs.length - 1] || title;
    slides.push({ kind: "statement", label: `Excerpt ${i}`, headline: short(p, 170),
      source: `Paragraph candidate ${i + 1} — verify before publication` });
  }
  slides.push({ kind: "close", label: "Read the full essay", callout: short(title, 100),
    cta: "Full essay:", source: "Link to source publication" });
  return {
    slug: id, title: String(title || "Untitled"), url: `mazzeleczzare.com/blog/${id}`,
    eyebrow: "Essay · Editorial Desk", byline: "Mazze LeCzzare",
    issued: issued || new Date().toISOString().slice(0,10), theme: "lexicon",
    frame: { width: 1080, height: 1350 }, slides,
  };
}

export function reportHTML({ title, body, findings = [], revisions = [], bearingGraph = null, source = "Working draft", timestamp }) {
  const published = escapeHTML(timestamp || new Date().toISOString());
  const titleSafe = escapeHTML(title || "Untitled");
  const row = (f) => `<li><strong>${escapeHTML(f.kind)}</strong> — ${escapeHTML(f.note)}
    <blockquote>${escapeHTML(f.context || f.excerpt)}</blockquote></li>`;
  const rev = (r) => `<li><time>${escapeHTML(r.at)}</time> — ${escapeHTML(r.action)}:
    ${escapeHTML(r.before?.slice(0,150) || "")}</li>`;
  const safeBody = escapeHTML(body || "").replace(/\n/g, "<br>");
  const bearingRows = bearingGraph?.claims ? Object.entries(bearingGraph.claims).map(([id, state]) => `<li><strong>${escapeHTML(id)}</strong> — ${escapeHTML(state?.tier || "not yet asserted")} · independent frames: ${escapeHTML(state?.frames?.join(", ") || "none")}</li>`).join("") : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${titleSafe} — editorial report</title><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
@page{size:A4;margin:19mm 18mm}*{box-sizing:border-box}body{font:11pt/1.6 Georgia,serif;max-width:760px;margin:4rem auto;color:#17212b;padding:0 1.5rem}
h1,h2{font-family:system-ui,sans-serif;line-height:1.25}h1{font-size:2.1rem}h2{border-top:1px solid #aab;padding-top:1rem;margin-top:2rem}
.meta{color:#465767;font:9pt/1.4 monospace}.prose{white-space:normal;overflow-wrap:anywhere}
blockquote{border-left:2px solid #b58b47;margin:.65rem 0 1rem;padding:.3rem 1rem;color:#465767}
li{margin:0 0 1rem;break-inside:avoid}button{padding:.6rem 1rem}
@media print{body{max-width:none;margin:0;padding:0}button{display:none}h1,h2{break-after:avoid}}
</style></head><body><button type="button" onclick="window.print()">Print / Save as PDF</button>
<header><p class="meta">EDITORIAL DESK · WORKING COPY · NOT AN INDEPENDENT FACT CHECK</p><h1>${titleSafe}</h1>
<p class="meta">Source: ${escapeHTML(source)} · Generated: ${published}</p>
<p class="meta">Words: ${wordCount(body)} · Prose prompts: ${findings.length} · Recorded revisions: ${revisions.length}</p></header>
<main><h2>Revision record</h2><ol>${revisions.map(rev).join("") || "<li>No accepted edits recorded.</li>"}</ol>
<h2>Bearing evidence fold</h2><p>${bearingGraph ? "Read-point " + escapeHTML(bearingGraph.point) + "; selected frames: " + escapeHTML(bearingGraph.frames.join(", ")) : "No imported Bearing graph; no evidentiary verdict available."}</p><ol>${bearingRows || "<li>No derived claim state.</li>"}</ol>
<h2>Prose review prompts (non-evidentiary)</h2><ol>${findings.map(row).join("") || "<li>No configured heuristic matches. This is not evidence of factual accuracy.</li>"}</ol>
<h2>Working source text</h2><div class="prose">${safeBody}</div></main>
<footer><p class="meta">Source-text preservation is the governing constraint. Findings require editorial review.</p></footer>
</body></html>`;
}