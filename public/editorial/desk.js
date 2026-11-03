import { wordCount, slugify, applyProposal, bearingAnalysis, buildCarousel, reportHTML } from "/editorial/engine.mjs";

/**
 * Local-first drafting board. Never sends draft bytes to a server. IndexedDB
 * is a browser cache, NOT encrypted storage or a substitute for exported backups.
 */
const $ = (id) => document.getElementById(id);
const storageName = "mazze-editorial-desk-v1";
let db, drafts = [], active = null, selection = null, selectedProposalId = null, saveTimer = null;
let findings = [], currentTool = "write";
const status = (message) => { $("save-state").textContent = message; };
const fail = (message) => { $("desk-error").textContent = String(message); $("desk-error").hidden = false; status("Action failed"); };
const clearError = () => { $("desk-error").hidden = true; };

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(storageName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "id" });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
function transaction(mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", mode);
    const store = tx.objectStore("drafts");
    const req = operation(store);
    let result;
    req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("Local database transaction aborted."));
  });
}
const storeDraft = (draft) => transaction("readwrite", (store) => store.put(structuredClone(draft)));
const loadDrafts = () => transaction("readonly", (store) => store.getAll());
const when = () => new Date().toISOString();
function createDraft(title, body = "", source = null) {
  return { id: crypto.randomUUID(), title, slug: slugify(title), body, source, status: "draft",
    createdAt: when(), updatedAt: when(), proposals: [], revisions: [], snapshots: [],
    carousel: null, carouselSource: null };
}
const current = () => { if (!active) throw new Error("Open a working copy first."); return active; };
function queueSave() {
  const draft = current();
  draft.updatedAt = when();
  clearTimeout(saveTimer);
  status("Unsaved changes…");
  // Capture a concrete immutable snapshot; switching documents cannot cross-write.
  saveTimer = setTimeout(async () => {
    try { await storeDraft(draft); status("Saved locally · " + new Date().toLocaleTimeString()); renderList(); }
    catch (error) { fail("Local save failed: " + error.message + ". Export an archive before closing."); }
  }, 420);
}
async function flush() {
  if (!active) return;
  clearTimeout(saveTimer);
  await storeDraft(active);
  status("Saved locally");
}
function renderList() {
  const list = $("draft-list");
  list.replaceChildren();
  drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const d of drafts) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-current", String(active?.id === d.id));
    const title = document.createElement("span"); title.textContent = d.title || "Untitled";
    const sub = document.createElement("small"); sub.textContent = d.status + " · " + new Date(d.updatedAt).toLocaleDateString();
    button.append(title, sub);
    button.addEventListener("click", () => choose(d).catch(e => fail(e.message)));
    list.append(button);
  }
}
async function choose(d) {
  await flush(); active = d; selection = null; selectedProposalId = null; findings = [];
  clearError();
  $("empty").hidden = true; $("editing").hidden = false;
  $("draft-title").value = d.title;
  $("draft-slug").value = d.slug;
  $("draft-status").value = d.status;
  $("draft-body").value = d.body;
  $("selected-text").value = ""; $("replacement-text").value = ""; $("revision-reason").value = "";
  updateBodyUI(); renderProposals(); renderSnapshots(); renderCarousel();
  $("bearing-findings").replaceChildren();
  renderList(); status("Saved locally · " + d.status);
}
async function addDraft(d) {
  drafts.push(d); await storeDraft(d); await choose(d);
}
function updateBodyUI() {
  if (!active) return;
  $("word-count").textContent = wordCount(active.body) + " words";
  const preview = $("preview"); preview.replaceChildren();
  // DOM-only Markdown subset; never parses user markup as active HTML.
  const blocks = active.body.split(/\n\s*\n/);
  for (const block of blocks) {
    const raw = block.trim(); if (!raw) continue;
    const heading = raw.match(/^(#{1,3})\s+(.+)/);
    const quote = raw.startsWith("> ");
    const ul = raw.split("\n").every(line => /^\s*[-*+]\s+/.test(line));
    const element = document.createElement(heading ? "h" + Math.min(heading[1].length + 1, 4) : quote ? "blockquote" : ul ? "ul" : "p");
    if (ul) {
      for (const line of raw.split("\n")) { const li = document.createElement("li"); li.textContent = line.replace(/^\s*[-*+]\s+/, ""); element.append(li); }
    } else element.textContent = heading ? heading[2] : quote ? raw.replace(/^>\s?/gm, "") : raw;
    preview.append(element);
  }
}
function checkpoint(label) {
  const d = current();
  d.snapshots.push({ id: crypto.randomUUID(), at: when(), label,
    title: d.title, slug: d.slug, body: d.body, status: d.status });
  queueSave(); renderSnapshots();
}
function renderSnapshots() {
  const select = $("snapshot-list"); select.replaceChildren();
  for (const s of [...current().snapshots].reverse()) {
    const opt = document.createElement("option"); opt.value = s.id;
    opt.textContent = new Date(s.at).toLocaleString() + " · " + s.label;
    select.append(opt);
  }
}
function capture() {
  const ta = $("draft-body"), start = ta.selectionStart, end = ta.selectionEnd;
  if (start === end) throw new Error("Select a passage in the manuscript before capturing.");
  selection = { draftId: current().id, start, end, before: ta.value.slice(start, end) };
  $("selected-text").value = selection.before;
  $("replacement-text").value = selection.before;
  $("replacement-text").focus();
}
function addProposal() {
  const d = current();
  if (!selection || selection.draftId !== d.id) throw new Error("Capture a passage in this draft first.");
  const after = $("replacement-text").value;
  const reason = $("revision-reason").value.trim();
  if (!reason) throw new Error("Record an editorial reason before proposing an edit.");
  if (after === selection.before) throw new Error("No change in the proposed replacement.");
  // The proposal is immutable and survives rejection.
  const p = { ...selection, after, reason, id: crypto.randomUUID(), status: "proposed", at: when() };
  d.proposals.push(p); selectedProposalId = p.id; queueSave(); renderProposals();
}
function renderProposals() {
  const el = $("proposals"); el.replaceChildren();
  for (const p of [...current().proposals].reverse()) {
    const box = document.createElement("div");
    const b = document.createElement("button"); b.type = "button";
    b.textContent = (selectedProposalId === p.id ? "● " : "○ ") + p.status + " · " + p.reason;
    b.addEventListener("click", () => { selectedProposalId = p.id; renderProposals(); });
    const before = document.createElement("pre"); before.textContent = "− " + p.before;
    const after = document.createElement("pre"); after.textContent = "+ " + p.after;
    box.append(b, before, after); el.append(box);
  }
}
function decide(accept) {
  const d = current(), p = d.proposals.find(p => p.id === selectedProposalId);
  if (!p || p.status !== "proposed") throw new Error("Select a pending proposal.");
  if (accept) {
    // Exact-range compare prevents changing prose after intervening edits.
    const result = applyProposal(d.body, p);
    checkpoint("Before accepted revision");
    d.body = result; $("draft-body").value = result;
    p.status = "accepted";
    // The offsets of every other proposal may now be invalid.
    for (const other of d.proposals) if (other.status === "proposed") other.status = "stale";
    d.revisions.push({ id: p.id, action: "accepted", at: when(), before: p.before,
      after: p.after, reason: p.reason, sourceOffset: p.start });
    updateBodyUI(); checkpoint("Accepted revision"); findings = [];
    $("bearing-findings").replaceChildren();
  } else {
    p.status = "rejected";
    d.revisions.push({ id: p.id, action: "rejected", at: when(), before: p.before, after: p.after, reason: p.reason });
  }
  selectedProposalId = null; selection = null; queueSave(); renderProposals();
}
function runBearing() {
  findings = bearingAnalysis(current().body);
  const el = $("bearing-findings"); el.replaceChildren();
  if (!findings.length) {
    const p = document.createElement("p");
    p.textContent = "No configured pattern matched. This does not establish correctness.";
    el.append(p);
  }
  for (const f of findings) {
    const b = document.createElement("button"); b.type = "button";
    b.textContent = f.kind.toUpperCase() + " · " + f.context + " — " + f.note;
    b.addEventListener("click", () => {
      document.querySelector('[data-tool="write"]').click();
      if (Number.isInteger(f.start)) {
        $("draft-body").focus(); $("draft-body").setSelectionRange(f.start, f.end);
      }
    });
    el.append(b);
  }
}
function renderCarousel() {
  const el = $("slide-list"); el.replaceChildren();
  const deck = active?.carousel; if (!deck) return;
  if (active.carouselSource !== active.body) {
    const warn = document.createElement("p"); warn.className = "hint";
    warn.textContent = "Manuscript changed since deck generation. Existing slide edits are preserved; regenerate intentionally.";
    el.append(warn);
  }
  deck.slides.forEach((slide, index) => {
    const box = document.createElement("article");
    const h = document.createElement("h3"); h.textContent = "Slide " + (index + 1) + " · " + slide.kind;
    box.append(h);
    for (const field of ["label", "title", "headline", "body", "callout", "cta", "source"]) {
      if (!(field in slide)) continue;
      const label = document.createElement("label"); label.textContent = field;
      const input = field === "body" || field === "headline" ? document.createElement("textarea") : document.createElement("input");
      input.value = slide[field] || ""; input.setAttribute("aria-label", "Slide " + (index + 1) + " " + field);
      input.addEventListener("input", () => { slide[field] = input.value; queueSave(); });
      box.append(label, input);
    }
    el.append(box);
  });
}
function download(name, data, mime) {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
function manuscript() {
  const d = current();
  // An imported published essay is intentionally exported body-only: its
  // canonical frontmatter must remain intact when reviewed in GitHub.
  if (d.source) return d.body + "\n";
  const description = d.body.replace(/[#*_\n]/g, " ").replace(/\s+/g, " ").trim().slice(0,180) || "Working essay";
  const yaml = ["---", "title: " + JSON.stringify(d.title),
    "description: " + JSON.stringify(description),
    "pubDate: " + new Date().toISOString().slice(0,10),
    "draft: true", "---"];
  return yaml.join("\n") + "\n\n" + d.body + "\n";
}
async function archive() {
  await flush();
  download("editorial-desk-backup-" + new Date().toISOString().slice(0,10) + ".json",
    JSON.stringify({ schema: "editorial-desk/1", exportedAt: when(), drafts }, null, 2), "application/json");
}
async function restore(file) {
  if (!file || file.size > 20_000_000) throw new Error("Invalid archive or file exceeds 20 MB.");
  const raw = JSON.parse(await file.text());
  if (raw.schema !== "editorial-desk/1" || !Array.isArray(raw.drafts)) throw new Error("Not an Editorial Desk archive.");
  await flush();
  let restored = 0;
  for (const value of raw.drafts) {
    if (!value || typeof value.id !== "string" || typeof value.title !== "string" ||
        typeof value.body !== "string" || value.body.length > 2_000_000) throw new Error("Malformed draft in archive; restore cancelled.");
  }
  for (const value of raw.drafts) {
    const d = structuredClone(value);
    // Never overwrite a local draft during restore, even if the IDs coincide.
    if (drafts.some(local => local.id === d.id)) d.id = crypto.randomUUID();
    d.proposals = Array.isArray(d.proposals) ? d.proposals : [];
    d.revisions = Array.isArray(d.revisions) ? d.revisions : [];
    d.snapshots = Array.isArray(d.snapshots) ? d.snapshots : [];
    d.updatedAt = when();
    drafts.push(d); await storeDraft(d); restored++;
  }
  renderList(); status("Restored " + restored + " working copies; existing work preserved.");
}
function compiled() {
  const d = current();
  return reportHTML({ title: d.title, body: d.body, findings: bearingAnalysis(d.body),
    revisions: d.revisions, source: d.source ? "Published original: " + d.source + " (working revision)" : "New unpublished draft" });
}
function bind(id, callback) {
  $(id).addEventListener("click", async () => { clearError(); try { await callback(); } catch (error) { fail(error.message || String(error)); } });
}
async function init() {
  try { db = await openDB(); drafts = await loadDrafts(); renderList(); }
  catch (error) { fail("IndexedDB unavailable; editing is disabled to prevent accidental data loss: " + error.message); return; }
  bind("new-draft", async () => addDraft(createDraft("Untitled essay")));
  document.querySelectorAll(".source-import").forEach(b => b.addEventListener("click", async () => {
    clearError(); try {
      const source = document.querySelector('#published-seeds textarea[data-id="' + CSS.escape(b.dataset.source) + '"]');
      if (!source) throw new Error("Published source not found.");
      const d = createDraft(source.dataset.title, source.value, source.dataset.id);
      d.slug = slugify(source.dataset.id); checkpointIfBlank(d);
      await addDraft(d);
    } catch (e) { fail(e.message); }
  }));
  bind("snapshot", () => { checkpoint("Manual checkpoint"); return flush(); });
  bind("restore-snapshot", async () => {
    const d = current(), snap = d.snapshots.find(s => s.id === $("snapshot-list").value);
    if (!snap) throw new Error("Select an existing checkpoint.");
    checkpoint("Before restore");
    d.title = snap.title; d.slug = snap.slug; d.body = snap.body; d.status = snap.status;
    for (const p of d.proposals) if (p.status === "proposed") p.status = "stale";
    await choose(d); await flush();
  });
  bind("capture", capture); bind("propose", addProposal); bind("accept", () => decide(true)); bind("reject", () => decide(false));
  bind("run-bearing", runBearing);
  bind("generate-carousel", () => {
    const d = current(); d.carousel = buildCarousel(d); d.carouselSource = d.body;
    queueSave(); renderCarousel();
  });
  bind("export-carousel", async () => {
    const d = current(); if (!d.carousel) throw new Error("Generate a carousel first.");
    await flush(); download(d.slug + "-slides.json", JSON.stringify(d.carousel, null, 2), "application/json");
  });
  bind("print-report", () => {
    const url = URL.createObjectURL(new Blob([compiled()], { type: "text/html;charset=utf-8" }));
    const w = window.open(url, "_blank");
    if (!w) { URL.revokeObjectURL(url); throw new Error("Your browser blocked the printable report tab. Download HTML report instead."); }
    w.opener = null; setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  bind("export-report", () => { const d = current(); download(d.slug + "-editorial-report.html", compiled(), "text/html"); });
  bind("export-md", () => { const d = current(); download(d.slug + (d.source ? "-body.mdx" : ".mdx"), manuscript(), "text/markdown"); });
  bind("export-archive", archive);
  $("archive-file").addEventListener("change", async (event) => {
    try { await restore(event.target.files?.[0]); } catch (e) { fail(e.message); } finally { event.target.value = ""; }
  });
  for (const [id, key] of [["draft-title","title"],["draft-body","body"],["draft-slug","slug"],["draft-status","status"]]) {
    $(id).addEventListener(id === "draft-status" ? "change" : "input", () => {
      if (!active) return;
      active[key] = $(id).value;
      if (key === "body") { findings = []; updateBodyUI(); $("bearing-findings").replaceChildren(); }
      queueSave();
    });
  }
  document.querySelectorAll("[data-tool]").forEach(button => button.addEventListener("click", () => {
    currentTool = button.dataset.tool;
    document.querySelectorAll("[data-tool]").forEach(b => b.setAttribute("aria-selected", String(b === button)));
    for (const name of ["write","bearing","carousel","report"]) $("tool-" + name).hidden = name !== currentTool;
  }));
}
function checkpointIfBlank(d) {
  d.snapshots.push({ id: crypto.randomUUID(), at: when(), label: "Imported untouched original",
    title: d.title, slug: d.slug, status: d.status, body: d.body });
}
init();