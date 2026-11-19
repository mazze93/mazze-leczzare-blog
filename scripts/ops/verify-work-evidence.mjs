#!/usr/bin/env node
// verify-work-evidence.mjs — attest every evidence link on /work.
//
// Each /work entry claims a tier, and its evidence links are what back the
// claim. This script re-checks them by machine instead of trusting the claim:
//
//   - every external link is opened, following redirects
//   - every GitHub repository root is also looked up through the API:
//     public or not, license, homepage, latest release
//   - every site path (/blog/…, /papers/…) is resolved against dist/, when a
//     build is present (run `npm run build` first; skipped otherwise)
//   - the provenance rules in src/utils/workProvenance.ts run over the result
//
// It writes src/data/work-attestation.json, which /work renders as a
// "checked <date>" line under each link. Commit the result: git history is the
// record of what was checked and when. .github/workflows/verify-work-evidence.yml
// runs it weekly.
//
//   node scripts/ops/verify-work-evidence.mjs           # check and write
//   node scripts/ops/verify-work-evidence.mjs --check   # check, report, no write
//
// GITHUB_TOKEN, when set, is sent to api.github.com only (higher rate limit).
// Exits 1 when any error-level finding remains, after writing the record.
//
// Evidence that names a computed `ref` instead of an `href` is not checked:
// refs resolve in Astro code (src/data/work.ts) that this script cannot import.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  attestationFindings,
  githubRepoOf,
  isExternal,
  structuralFindings,
} from '../../src/utils/workProvenance.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const WORK_DIR = join(ROOT, 'src/content/work');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'src/data/work-attestation.json');
const check = process.argv.includes('--check');

const UA = 'mazzeleczzare-work-attestation/1 (+https://mazzeleczzare.com/work/)';
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 6;

const entries = readdirSync(WORK_DIR)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(WORK_DIR, f), 'utf8'))]);

const hrefs = [...new Set(entries.flatMap(([, e]) => (e.evidence ?? []).map((ev) => ev.href).filter(Boolean)))].sort();

async function openLink(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html,application/pdf,*/*;q=0.8' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    await res.body?.cancel();
    return { status: res.status, ok: res.ok };
  } catch (e) {
    return { status: null, ok: false, error: e.name === 'TimeoutError' ? 'timeout' : (e.cause?.code ?? e.message) };
  }
}

async function github(path) {
  const headers = { 'user-agent': UA, accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (res.status === 404) return null;
  if ((res.status === 403 || res.status === 429) && res.headers.get('x-ratelimit-remaining') === '0') {
    die(`GitHub API rate limit reached at ${path}. Set GITHUB_TOKEN and rerun; nothing was written`);
  }
  if (!res.ok) die(`GitHub API ${res.status} for ${path}; nothing was written`);
  return res.json();
}

// A failed lookup is not evidence about the repo, so the run stops rather
// than write a record that half-checks some links.
function die(msg) {
  console.error(`verify-work-evidence: ${msg}`);
  process.exit(2);
}

async function lookUpRepo({ owner, repo }) {
  // A 404 means private or gone; either way, not public.
  const meta = await github(`/repos/${owner}/${repo}`);
  if (!meta || meta.private) return { public: false, license: null, homepage: null, latestRelease: null };
  const rel = await github(`/repos/${owner}/${repo}/releases/latest`);
  return {
    public: true,
    license: meta.license?.spdx_id && meta.license.spdx_id !== 'NOASSERTION' ? meta.license.spdx_id : null,
    homepage: meta.homepage || null,
    latestRelease: rel ? { tag: rel.tag_name, publishedAt: rel.published_at } : null,
  };
}

function resolveInDist(path) {
  const clean = path.split(/[?#]/)[0];
  const file = clean.endsWith('/') ? join(DIST, clean, 'index.html') : join(DIST, clean);
  return existsSync(file) ? { status: 200, ok: true } : { status: 404, ok: false };
}

const haveDist = existsSync(join(DIST, 'index.html'));
if (!haveDist) console.warn('verify-work-evidence: no dist/ build, so site paths are not checked (run npm run build first)');

async function attest(href) {
  if (!isExternal(href)) return haveDist ? resolveInDist(href) : undefined;
  const rec = await openLink(href);
  const gh = githubRepoOf(href);
  if (gh) rec.repo = await lookUpRepo(gh);
  return rec;
}

const links = {};
for (let i = 0; i < hrefs.length; i += CONCURRENCY) {
  const batch = hrefs.slice(i, i + CONCURRENCY);
  const recs = await Promise.all(batch.map(attest));
  batch.forEach((href, k) => {
    if (recs[k]) links[href] = recs[k];
  });
}

const findings = entries.flatMap(([slug, e]) => [
  ...structuralFindings(slug, e),
  ...attestationFindings(slug, e, links),
]);

const record = { checkedAt: new Date().toISOString(), links, findings };

const checked = Object.keys(links).length;
console.log(`verify-work-evidence: ${checked}/${hrefs.length} links checked across ${entries.length} entries`);
for (const f of findings) console.log(`  ${f.severity === 'error' ? '×' : '!'} ${f.entry}: ${f.rule} — ${f.message}`);
if (findings.length === 0) console.log('  ✓ no findings');

if (!check) writeFileSync(OUT, `${JSON.stringify(record, null, 2)}\n`);
if (findings.some((f) => f.severity === 'error')) process.exit(1);
