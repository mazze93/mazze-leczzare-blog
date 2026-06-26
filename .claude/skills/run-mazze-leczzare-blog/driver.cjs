#!/usr/bin/env node
// driver.cjs — smoke-test mazze-leczzare-blog via Playwright
// Run from project root: node .claude/skills/run-mazze-leczzare-blog/driver.cjs [port] [outdir]
// Requires: dev server already running (npm run dev -- --port PORT)

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = process.argv[2] || '4321';
const OUT = process.argv[3] || '/tmp/mazze-blog-screenshots';
const BASE = `http://localhost:${PORT}`;

fs.mkdirSync(OUT, { recursive: true });

// ── Resolve playwright ────────────────────────────────────────────────────────
let playwright;
try {
  playwright = require('playwright');
} catch {
  console.log('playwright not found — installing as devDependency...');
  execSync('npm install --save-dev playwright', { stdio: 'inherit', cwd: path.resolve(__dirname, '../../..') });
  playwright = require('playwright');
}

const { chromium } = playwright;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function ss(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  screenshot → ${file}`);
  return file;
}

async function waitForServer(url, timeout = 30000) {
  const http = require('http');
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 500));
    try {
      await new Promise((resolve, reject) => {
        http.get(url, r => resolve(r)).on('error', reject);
      });
      return;
    } catch {}
  }
  throw new Error(`Dev server not responding at ${url} after ${timeout}ms`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\nWaiting for dev server at ${BASE}...`);
  await waitForServer(BASE);
  console.log('Server ready.\n');

  const browser = await chromium.launch();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  const results = [];

  // 1. Homepage
  console.log('1. Homepage');
  await page.goto(BASE + '/');
  results.push({ route: '/', title: await page.title(), file: await ss(page, '01-home-dark') });

  // 2. Theme toggle (dark → light)
  const themeBtn = page.locator('button[aria-label^="Activate"]').first();
  if (await themeBtn.count()) {
    await themeBtn.click();
    await page.waitForTimeout(500);
    await ss(page, '02-home-light');
    console.log('   theme toggled to light');
    // Toggle back to dark
    const toggleBack = page.locator('button[aria-label^="Activate"]').first();
    if (await toggleBack.count()) await toggleBack.click();
  }

  // 3. Blog listing
  console.log('2. Blog listing');
  await page.goto(BASE + '/blog/');
  results.push({ route: '/blog/', title: await page.title(), file: await ss(page, '03-blog') });

  // 4. First blog post
  console.log('3. Blog post');
  const postLinks = page.locator('a[href^="/blog/"]');
  const count = await postLinks.count();
  let postHref = null;
  for (let i = 0; i < count; i++) {
    const h = await postLinks.nth(i).getAttribute('href');
    if (h && h !== '/blog/' && h.split('/').length > 3) { postHref = h; break; }
  }
  if (postHref) {
    await page.goto(BASE + postHref);
    results.push({ route: postHref, title: await page.title(), file: await ss(page, '04-post') });
  }

  // 5. About
  console.log('4. About');
  await page.goto(BASE + '/about/');
  results.push({ route: '/about/', title: await page.title(), file: await ss(page, '05-about') });

  // 6. Contact — fill form (does not submit; CF Functions not present in dev)
  console.log('5. Contact form');
  await page.goto(BASE + '/contact/');
  await page.locator('input[name="name"]').fill('Test Agent');
  await page.locator('input[name="email"]').fill('test@example.com');
  await page.locator('textarea[name="message"]').fill('Smoke test from run-skill driver.');
  results.push({ route: '/contact/', title: await page.title(), file: await ss(page, '06-contact') });

  // 7. Work
  console.log('6. Work');
  await page.goto(BASE + '/work/');
  results.push({ route: '/work/', title: await page.title(), file: await ss(page, '07-work') });

  await browser.close();

  console.log('\n── Results ──────────────────────────────────────────────────');
  for (const r of results) {
    console.log(`  ${r.route.padEnd(35)} "${r.title}"`);
  }
  console.log(`\nScreenshots in: ${OUT}`);
  console.log('SMOKE PASSED\n');
})().catch(err => {
  console.error('SMOKE FAILED:', err.message);
  process.exit(1);
});
