#!/usr/bin/env node
// driver.cjs — smoke-test mazze-leczzare-blog via HTTP (no browser binaries needed)
// Run from project root: node .claude/skills/run-mazze-leczzare-blog/driver.cjs [port]
// Requires: dev server already running (npm run dev -- --port PORT)

const http = require('http');

const PORT = process.argv[2] || '4321';
const BASE = `http://localhost:${PORT}`;

// Routes → expected content substring present in HTML response
const ROUTES = [
  { path: '/',               expect: 'Mazze LeCzzare', label: 'Homepage' },
  { path: '/blog/',          expect: 'Writing',         label: 'Blog listing' },
  { path: '/about/',         expect: 'About',           label: 'About page' },
  { path: '/contact/',       expect: 'Contact',         label: 'Contact page' },
  { path: '/work/',          expect: 'Work',            label: 'Work page' },
  { path: '/signal/',        expect: 'Signal',          label: 'Signal page' },
  { path: '/security/',      expect: 'Security',        label: 'Security page' },
  { path: '/cipher-gothic/', expect: 'Cipher Gothic',   label: 'Cipher Gothic' },
  { path: '/roadmap/',       expect: 'Roadmap',         label: 'Roadmap page' },
];

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let body = '';
      res.on('data', d => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function waitForServer(timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { await get(BASE + '/'); return; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Dev server not responding at ${BASE} after ${timeout}ms`);
}

(async () => {
  console.log(`\nWaiting for dev server at ${BASE}...`);
  await waitForServer();
  console.log('Server ready.\n');

  let failed = 0;

  for (const route of ROUTES) {
    try {
      const res = await get(BASE + route.path);
      const ok = res.status === 200 && res.body.includes(route.expect);
      if (!ok) failed++;
      console.log(`  ${ok ? '✓' : '✗'}  ${route.path.padEnd(22)}  HTTP ${res.status}  "${route.label}"`);
    } catch (err) {
      console.log(`  ✗  ${route.path.padEnd(22)}  ERROR: ${err.message}`);
      failed++;
    }
  }

  // Discover and spot-check one blog post
  try {
    const listing = await get(BASE + '/blog/');
    const match = listing.body.match(/href="(\/blog\/[^/"]+\/)"/);
    if (match) {
      const postPath = match[1];
      const post = await get(BASE + postPath);
      const ok = post.status === 200;
      if (!ok) failed++;
      console.log(`  ${ok ? '✓' : '✗'}  ${postPath.padEnd(22)}  HTTP ${post.status}  "Blog post"`);
    }
  } catch {}

  console.log(`\n── Summary ─────────────────────────────────────────────────`);
  if (failed === 0) {
    console.log('  All routes passed.\nSMOKE PASSED\n');
  } else {
    console.log(`  ${failed} route(s) failed.\nSMOKE FAILED\n`);
    process.exit(1);
  }
})().catch(err => {
  console.error('SMOKE FAILED:', err.message);
  process.exit(1);
});
