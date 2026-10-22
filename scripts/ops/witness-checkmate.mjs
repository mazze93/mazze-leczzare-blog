#!/usr/bin/env node
// witness-checkmate.mjs — record checkmate's current ledger head on this site.
//
// checkmate has no public page. Its aggregates are read through the private,
// read-only CI gateway, which accepts only a Cloudflare Access service token.
// This script keeps a whitelisted handful of fields and rewrites
// src/data/checkmate-witness.json. Commit the result: the commit is the
// witness. .github/workflows/witness-checkmate.yml runs it weekly.
//
//   CHECKMATE_LEDGER_URL=…  CF_ACCESS_CLIENT_ID=…  CF_ACCESS_CLIENT_SECRET=… \
//     node scripts/ops/witness-checkmate.mjs           # write the snapshot
//   … node scripts/ops/witness-checkmate.mjs --check   # report only, no write
//
// CHECKMATE_LEDGER_URL is the gateway's /ci/public/ledger.json URL. It names
// an account-specific host, so it lives in a secret, never in this repo.
//
// The response is untrusted input. Only integer counts, a boolean, and a
// 64-hex head are copied. Anything else is ignored or makes the script fail.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../../src/data/checkmate-witness.json', import.meta.url));
const check = process.argv.includes('--check');

const die = (msg) => {
  console.error(`witness-checkmate: ${msg}`);
  process.exit(1);
};
const int = (v, f) => (Number.isInteger(v) && v >= 0 ? v : die(`${f} is not a non-negative integer`));

const { CHECKMATE_LEDGER_URL, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET } = process.env;
if (!CHECKMATE_LEDGER_URL || !CF_ACCESS_CLIENT_ID || !CF_ACCESS_CLIENT_SECRET) {
  die('set CHECKMATE_LEDGER_URL, CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET');
}
if (!CHECKMATE_LEDGER_URL.startsWith('https://')) die('CHECKMATE_LEDGER_URL must be https');

// redirect: 'error' because a missing or rejected token answers with a
// redirect to the Access login page, and that must fail rather than parse.
const res = await fetch(CHECKMATE_LEDGER_URL, {
  headers: {
    accept: 'application/json',
    'cf-access-client-id': CF_ACCESS_CLIENT_ID,
    'cf-access-client-secret': CF_ACCESS_CLIENT_SECRET,
  },
  redirect: 'error',
}).catch((e) => die(`fetch failed (${e.cause?.code ?? e.message}). A redirect here usually means the Access token was refused`));
// Never echo the URL: it names the gateway host.
if (!res.ok) die(`HTTP ${res.status} from the checkmate gateway`);
const body = await res.json();
const ledger = body?.ledger ?? die('response has no ledger');
const chain = ledger.chain ?? die('response has no chain');

if (typeof chain.head !== 'string' || !/^[0-9a-f]{64}$/.test(chain.head)) die('head is not 64 lowercase hex digits');
if (typeof chain.ok !== 'boolean') die('chain.ok is not boolean');

const verdicts = {};
for (const [k, v] of Object.entries(ledger.verdicts ?? {})) {
  if (!/^[a-z-]{1,32}$/.test(k)) die(`unexpected verdict key ${JSON.stringify(k)}`);
  verdicts[k] = int(v, `verdicts.${k}`);
}

const next = {
  witnessedAt: new Date().toISOString().slice(0, 10),
  generatedAt: int(body.generatedAt, 'generatedAt'),
  head: chain.head,
  length: int(chain.length, 'chain.length'),
  intact: chain.ok,
  audits: int(ledger.audits, 'audits'),
  filedThroughGate: int(ledger.filedThroughGate, 'filedThroughGate'),
  verdicts,
};

let prev = null;
try {
  prev = JSON.parse(readFileSync(OUT, 'utf8'));
} catch {
  // first witness
}

if (!next.intact) console.warn('witness-checkmate: WARNING checkmate reports its chain is NOT intact. Recording that as-is.');
if (prev && next.length < prev.length) {
  console.warn(
    `witness-checkmate: WARNING chain is shorter than the last witness (${prev.length} -> ${next.length}). ` +
      'An append-only ledger should never shrink. Investigate before committing.',
  );
}
if (prev && prev.head === next.head) {
  console.log(`unchanged: head ${next.head.slice(0, 12)}… at link ${next.length}`);
} else {
  console.log(`head ${prev ? prev.head.slice(0, 12) + '… → ' : ''}${next.head.slice(0, 12)}… at link ${next.length}`);
}

if (!check) {
  writeFileSync(OUT, JSON.stringify(next, null, 2) + '\n');
  console.log(`wrote ${OUT}`);
}
