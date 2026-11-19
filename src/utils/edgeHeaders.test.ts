import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  DEV_REPORTER_SCRIPT,
  REPORT_PATH,
  devReportOnlyCsp,
  isDevTooling,
  headersForPath,
  normaliseReports,
  parseHeadersFile,
} from "../../scripts/dev/edgeHeaders";
import { ARTIFACT_CSP, DEFAULT_CSP, policyFor } from "../../functions/utils/csp";

/**
 * The dev server's header parity (scripts/dev/edgeHeaders.ts). It is only worth
 * having if it reads the same sources production does, so these tests run the
 * real public/_headers and the real shared CSP, not fixtures.
 */

const realRules = parseHeadersFile(readFileSync(new URL("../../public/_headers", import.meta.url), "utf8"));

describe("public/_headers parsing", () => {
  it("applies the site-wide block to any page", () => {
    const h = headersForPath(realRules, "/blog/some-post/");
    expect(h.get("x-content-type-options")).toBe("nosniff");
    expect(h.get("cross-origin-opener-policy")).toBe("same-origin");
    expect(h.get("permissions-policy")).toContain("camera=()");
  });

  it("never sends HSTS from the dev server", () => {
    expect(headersForPath(realRules, "/").has("strict-transport-security")).toBe(false);
  });

  it("joins repeated names, so the homepage carries every discovery Link", () => {
    const link = headersForPath(realRules, "/").get("link") ?? "";
    expect(link).toContain('rel="api-catalog"');
    expect(link).toContain("/auth.md");
    expect(headersForPath(realRules, "/about/").has("link")).toBe(false);
  });

  it("matches splats and placeholders, and treats dots literally", () => {
    const rules = parseHeadersFile("/a/*\n  X-A: 1\n/u/:id/x\n  X-B: 2\n/f.txt\n  X-C: 3\n");
    expect(headersForPath(rules, "/a/b/c").get("x-a")).toBe("1");
    expect(headersForPath(rules, "/u/42/x").get("x-b")).toBe("2");
    expect(headersForPath(rules, "/u/4/2/x").has("x-b")).toBe(false);
    expect(headersForPath(rules, "/fXtxt").has("x-c")).toBe(false);
  });
});

describe("dev report-only CSP", () => {
  it("is built from the same policy production enforces", () => {
    expect(policyFor("/blog/x/").csp).toBe(DEFAULT_CSP);
    expect(policyFor("/artifacts/x.html").csp).toBe(ARTIFACT_CSP);
    const dev = devReportOnlyCsp(DEFAULT_CSP);
    for (const d of DEFAULT_CSP.split("; ").filter((d) => d !== "upgrade-insecure-requests")) {
      expect(dev).toContain(d);
    }
  });

  it("adds Trusted Types and both report channels, and drops upgrade-insecure-requests", () => {
    const dev = devReportOnlyCsp(DEFAULT_CSP);
    expect(dev).toContain("require-trusted-types-for 'script'");
    expect(dev).toContain("report-to csp-dev");
    expect(dev).toContain(`report-uri ${REPORT_PATH}`);
    expect(dev).not.toContain("upgrade-insecure-requests");
  });
});

describe("violation reports", () => {
  it("reads Reporting API bodies, including Trusted Types sink reports", () => {
    const [v] = normaliseReports([
      {
        type: "csp-violation",
        url: "http://127.0.0.1:4321/",
        body: {
          documentURL: "http://127.0.0.1:4321/",
          effectiveDirective: "require-trusted-types-for",
          blockedURL: "trusted-types-sink",
          sourceFile: "http://127.0.0.1:4321/src/components/PostQuoteShare.tsx",
          lineNumber: 40,
          columnNumber: 7,
          sample: "Element innerHTML|<button>",
        },
      },
    ]);
    expect(v).toEqual({
      directive: "require-trusted-types-for",
      blocked: "trusted-types-sink",
      source: "http://127.0.0.1:4321/src/components/PostQuoteShare.tsx:40:7",
      sample: "Element innerHTML|<button>",
      page: "http://127.0.0.1:4321/",
    });
  });

  it("reads legacy report-uri bodies", () => {
    const [v] = normaliseReports({
      "csp-report": {
        "document-uri": "http://127.0.0.1:4321/contact/",
        "violated-directive": "frame-src",
        "blocked-uri": "https://example.com",
      },
    });
    expect(v.directive).toBe("frame-src");
    expect(v.blocked).toBe("https://example.com");
    expect(v.page).toBe("http://127.0.0.1:4321/contact/");
  });

  it("ignores non-CSP reports and junk", () => {
    expect(normaliseReports([{ type: "deprecation", body: {} }, null, 7, "x"])).toEqual([]);
  });

  it("tells dev tooling apart from site code", () => {
    const at = (source: string) => ({ directive: "", blocked: "", source, sample: "", page: "" });
    expect(isDevTooling(at("http://127.0.0.1:4321/node_modules/.vite/deps/ui-library-D4E3Lh63.js:169"))).toBe(true);
    expect(isDevTooling(at("http://127.0.0.1:4321/@id/astro/runtime/client/dev-toolbar/entrypoint.js:328"))).toBe(true);
    expect(isDevTooling(at("http://127.0.0.1:4321/src/components/ContactForm.tsx:28"))).toBe(false);
  });

  it("the page reporter sends what normaliseReports reads", () => {
    let sent = "";
    const listeners: Array<(e: unknown) => void> = [];
    const page = {
      addEventListener: (_: string, fn: (e: unknown) => void) => listeners.push(fn),
      navigator: { sendBeacon: (_url: string, body: string) => ((sent = body), true) },
      location: { href: "http://127.0.0.1:4321/contact/" },
    };
    new Function("addEventListener", "navigator", "location", DEV_REPORTER_SCRIPT)(
      page.addEventListener,
      page.navigator,
      page.location,
    );
    listeners[0]({
      documentURI: "http://127.0.0.1:4321/contact/",
      effectiveDirective: "require-trusted-types-for",
      blockedURI: "trusted-types-sink",
      sourceFile: "http://127.0.0.1:4321/src/components/ContactForm.tsx",
      lineNumber: 28,
      columnNumber: 5,
      sample: "HTMLScriptElement src|https://challenges.cloudflare.com/",
      disposition: "report",
    });
    const [v] = normaliseReports(JSON.parse(sent));
    expect(v.source).toBe("http://127.0.0.1:4321/src/components/ContactForm.tsx:28:5");
    expect(v.directive).toBe("require-trusted-types-for");
  });
});
