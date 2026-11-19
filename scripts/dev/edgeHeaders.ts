// Dev-only edge-header parity for `astro dev` (wired in astro.config.mjs).
//
// `astro dev` runs neither functions/_middleware.ts nor public/_headers, so
// without this the dev server sends no CSP, no frame policy and none of the
// _headers set. This plugin sends them from the same sources production uses:
//
//   - public/_headers, parsed at request time (minus HSTS, which has no meaning
//     on http://127.0.0.1 and must never be pinned to a dev host);
//   - functions/utils/csp.ts, sent as Content-Security-Policy-Report-Only with
//     `require-trusted-types-for 'script'` added, so every CSP violation and
//     every DOM XSS sink write is reported without breaking Vite's HMR client;
//   - X-Frame-Options, enforced exactly as production enforces it.
//
// Reports reach /__dev/csp-report three ways: a dev-only page script that
// forwards `securitypolicyviolation` events (immediate, every engine; see
// devCspReporter), the Reporting API `report-to` (Chromium, batched), and the
// legacy `report-uri` (Firefox, Safari). Each distinct violation prints once in
// the terminal; ones raised by dev tooling (Astro's toolbar, Vite deps) are
// recorded but not printed. GET /__dev/csp-report lists everything as JSON.
//
// Escape hatches: DEV_CSP=off drops the report-only CSP and the page script
// (headers stay); DEV_CSP_TOOLING=1 prints the tooling violations too.
//
// `npm run dev:edge` is the other half: real middleware, Functions, _headers
// and _redirects under wrangler, against a production build.

import { readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { AstroIntegration } from "astro";
import type { Plugin } from "vite";
import { policyFor } from "../../functions/utils/csp";

export const REPORT_PATH = "/__dev/csp-report";
const REPORT_GROUP = "csp-dev";
const MAX_REPORT_BYTES = 64 * 1024;
const DEV_SKIPPED_HEADERS = new Set(["strict-transport-security"]);

// ── public/_headers ──────────────────────────────────────────────────────────

export interface HeaderRule {
  pattern: string;
  matcher: RegExp;
  headers: Array<[name: string, value: string]>;
}

/** Cloudflare Pages _headers: an unindented path line, then indented `Name: value` lines. */
export function parseHeadersFile(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let current: HeaderRule | null = null;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    if (!/^\s/.test(raw)) {
      const pattern = raw.trim();
      current = { pattern, matcher: patternToRegExp(pattern), headers: [] };
      rules.push(current);
      continue;
    }
    const colon = raw.indexOf(":");
    if (!current || colon === -1) continue;
    current.headers.push([raw.slice(0, colon).trim(), raw.slice(colon + 1).trim()]);
  }
  return rules;
}

function patternToRegExp(pattern: string): RegExp {
  const body = pattern
    .split(/(\*|:[A-Za-z]\w*)/)
    .map((part) => {
      if (part === "*") return ".*";
      if (/^:[A-Za-z]\w*$/.test(part)) return "[^/]+";
      return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("");
  return new RegExp(`^${body}$`);
}

/** Every header the matching rules set for a path. Repeated names join with ", ", as Pages does. */
export function headersForPath(rules: HeaderRule[], pathname: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const rule of rules) {
    if (!rule.matcher.test(pathname)) continue;
    for (const [name, value] of rule.headers) {
      const key = name.toLowerCase();
      if (DEV_SKIPPED_HEADERS.has(key)) continue;
      const prev = out.get(key);
      out.set(key, prev ? `${prev}, ${value}` : value);
    }
  }
  return out;
}

// ── CSP, report-only ─────────────────────────────────────────────────────────

/**
 * The production policy as a dev report-only policy. `upgrade-insecure-requests`
 * is dropped because browsers ignore it in report-only mode and warn about it.
 */
export function devReportOnlyCsp(csp: string): string {
  const directives = csp
    .split(";")
    .map((d) => d.trim())
    .filter((d) => d && d !== "upgrade-insecure-requests");
  directives.push("require-trusted-types-for 'script'", `report-to ${REPORT_GROUP}`, `report-uri ${REPORT_PATH}`);
  return directives.join("; ");
}

// ── Violation reports ────────────────────────────────────────────────────────

export interface Violation {
  directive: string;
  blocked: string;
  source: string;
  sample: string;
  page: string;
}

type Json = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

/** Normalise Reporting API (`application/reports+json`) and legacy (`application/csp-report`) bodies. */
export function normaliseReports(payload: unknown): Violation[] {
  const items: unknown[] = Array.isArray(payload) ? payload : [payload];
  const out: Violation[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const legacy = (item as Json)["csp-report"];
    if (legacy && typeof legacy === "object") {
      const r = legacy as Json;
      out.push({
        directive: str(r["effective-directive"]) || str(r["violated-directive"]),
        blocked: str(r["blocked-uri"]),
        source: location(str(r["source-file"]), str(r["line-number"]), str(r["column-number"])),
        sample: str(r["script-sample"]),
        page: str(r["document-uri"]),
      });
      continue;
    }
    const report = item as Json;
    if (report.type !== "csp-violation" || !report.body || typeof report.body !== "object") continue;
    const b = report.body as Json;
    out.push({
      directive: str(b.effectiveDirective),
      blocked: str(b.blockedURL),
      source: location(str(b.sourceFile), str(b.lineNumber), str(b.columnNumber)),
      sample: str(b.sample),
      page: str(b.documentURL) || str(report.url),
    });
  }
  return out;
}

function location(file: string, line: string, column: string): string {
  if (!file) return "";
  return [file, line, column].filter(Boolean).join(":");
}

export const violationKey = (v: Violation): string => `${v.directive}|${v.blocked}|${v.source}`;

/**
 * Violations raised by dev-only tooling (Astro's dev toolbar, Vite's
 * pre-bundled deps and client). None of it ships, and the toolbar alone writes
 * innerHTML ~30 times per page, so it is recorded but kept off the terminal.
 */
export function isDevTooling(v: Violation): boolean {
  return /\/node_modules\/|\/@id\/astro\/runtime\/client\/dev-toolbar|\/@vite\/client/.test(v.source);
}

/**
 * Dev-only page script: forwards every `securitypolicyviolation` event (fired
 * for report-only violations and Trusted Types sinks too) straight to the
 * report endpoint. Chromium batches Reporting API deliveries for up to a
 * minute, and some embedded browsers never send them; the event is immediate
 * and works in every engine. The body uses the Reporting API shape.
 */
export const DEV_REPORTER_SCRIPT = `addEventListener("securitypolicyviolation",function(e){try{navigator.sendBeacon(${JSON.stringify(
  REPORT_PATH,
)},JSON.stringify({type:"csp-violation",url:location.href,body:{documentURL:e.documentURI,effectiveDirective:e.effectiveDirective,blockedURL:e.blockedURI,sourceFile:e.sourceFile,lineNumber:e.lineNumber,columnNumber:e.columnNumber,sample:e.sample,disposition:e.disposition}}))}catch(_){}});`;

/** Astro integration half: injects DEV_REPORTER_SCRIPT on `astro dev` only. */
export function devCspReporter(): AstroIntegration {
  return {
    name: "dev-csp-reporter",
    hooks: {
      "astro:config:setup": ({ command, injectScript }) => {
        if (command !== "dev" || process.env.DEV_CSP === "off") return;
        injectScript("head-inline", DEV_REPORTER_SCRIPT);
      },
    },
  };
}

// ── Vite plugin ──────────────────────────────────────────────────────────────

type Seen = Map<string, Violation & { count: number; tooling: boolean }>;

export function edgeHeaders(options: { headersFile: string }): Plugin {
  const seen: Seen = new Map();

  return {
    name: "dev-edge-headers",
    apply: "serve",
    configureServer(server) {
      const log = server.config.logger;

      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url ?? "/", "http://dev.local");

        if (url.pathname === REPORT_PATH) {
          handleReportEndpoint(req, res, seen, (line) => log.warn(line, { timestamp: true }));
          return;
        }

        let rules: HeaderRule[] = [];
        try {
          rules = parseHeadersFile(readFileSync(options.headersFile, "utf8"));
        } catch {
          // A missing or unreadable _headers must not take the dev server down.
        }
        for (const [name, value] of headersForPath(rules, url.pathname)) res.setHeader(name, value);

        const { csp, frameOptions } = policyFor(url.pathname);
        res.setHeader("X-Frame-Options", frameOptions);
        if (process.env.DEV_CSP !== "off") {
          const origin = `http://${req.headers.host ?? "127.0.0.1"}`;
          res.setHeader("Reporting-Endpoints", `${REPORT_GROUP}="${origin}${REPORT_PATH}"`);
          res.setHeader("Content-Security-Policy-Report-Only", devReportOnlyCsp(csp));
        }
        next();
      });
    },
  };
}

function handleReportEndpoint(
  req: IncomingMessage,
  res: ServerResponse,
  seen: Seen,
  warn: (line: string) => void,
): void {
  const showTooling = process.env.DEV_CSP_TOOLING === "1";
  if (req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify([...seen.values()], null, 2));
    return;
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end();
    return;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  req.on("data", (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX_REPORT_BYTES) {
      res.statusCode = 413;
      res.end();
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", () => {
    if (res.writableEnded) return;
    let payload: unknown;
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      res.statusCode = 400;
      res.end();
      return;
    }
    for (const v of normaliseReports(payload)) {
      const key = violationKey(v);
      const prior = seen.get(key);
      if (prior) {
        prior.count += 1;
        continue;
      }
      const tooling = isDevTooling(v);
      if (tooling && !showTooling && ![...seen.values()].some((s) => s.tooling)) {
        warn(`[csp report-only] dev-toolbar/Vite violations recorded, not printed (DEV_CSP_TOOLING=1 to print; GET ${REPORT_PATH} lists all)`);
      }
      seen.set(key, { ...v, count: 1, tooling });
      if (tooling && !showTooling) continue;
      const where = v.source ? ` at ${v.source}` : "";
      const sample = v.sample ? ` "${v.sample.slice(0, 80)}"` : "";
      warn(`[csp report-only] ${v.directive} blocked ${v.blocked || "(inline)"}${where}${sample} on ${v.page}`);
    }
    res.statusCode = 204;
    res.end();
  });
}
