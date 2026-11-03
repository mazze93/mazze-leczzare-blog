#!/usr/bin/env node
/**
 * Editorial Desk offline PDF compiler.
 *
 * Input: HTML report exported by /admin/editorial/ (not arbitrary URLs).
 * Output: tagged, selectable-text PDF using locally installed Chromium.
 * The command never fetches remote assets or mutates the source.
 *
 * node scripts/editorial/compile-report.mjs report.html --out report.pdf
 */
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { chromium } from "playwright";

function usage() {
  throw new Error("Usage: npm run editorial:pdf -- <report.html> --out <report.pdf>");
}
const args = process.argv.slice(2);
if (args.length !== 3 || args[1] !== "--out") usage();
const input = resolve(args[0]), output = resolve(args[2]);
if (input === output) throw new Error("Refusing to overwrite source HTML.");
if (extname(input).toLowerCase() !== ".html" || extname(output).toLowerCase() !== ".pdf") usage();
const file = await stat(input);
if (!file.isFile() || file.size > 8_000_000) throw new Error("Invalid or oversized HTML report (>8 MB).");
const html = await readFile(input, "utf8");
if (!html.includes("EDITORIAL DESK") || !html.includes("editorial report")) {
  throw new Error("Input does not look like an Editorial Desk report. Refusing unrelated HTML.");
}
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route("**/*", (route) => route.abort());
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  const bytes = await page.pdf({
    format: "A4", preferCSSPageSize: true, printBackground: true,
    tagged: true, displayHeaderFooter: false,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  if (bytes.length < 1000 || bytes.subarray(0, 5).toString() !== "%PDF-") {
    throw new Error("Chromium did not return a valid PDF.");
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, bytes, { flag: "wx" });
  console.log(`Editorial PDF: ${output} (${bytes.length} bytes, tagged output requested)`);
} finally {
  await browser?.close();
}