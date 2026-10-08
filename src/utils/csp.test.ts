import { describe, expect, it } from "vitest";
import { onRequest } from "../../functions/_middleware";

/**
 * Pins the CSP contract that ArtifactEmbed depends on. `astro preview` runs no
 * middleware, so a broken frame policy is invisible locally — this test is the
 * only pre-deploy check that a post can frame its own /artifacts/*.html.
 */

const env = {} as never; // non-admin paths never read env

async function cspFor(path: string): Promise<{ csp: string; xfo: string | null }> {
  const res = await onRequest({
    request: new Request(`https://mazzeleczzare.com${path}`),
    next: async () => new Response("<!doctype html><title>t</title>", { headers: { "Content-Type": "text/html" } }),
    env,
  });
  return { csp: res.headers.get("Content-Security-Policy") ?? "", xfo: res.headers.get("X-Frame-Options") };
}

function directive(csp: string, name: string): string[] {
  const d = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + " "));
  return d ? d.split(/\s+/).slice(1) : [];
}

describe("content security policy", () => {
  it("lets ordinary pages frame same-origin artifacts and Turnstile, nothing else", async () => {
    const { csp } = await cspFor("/blog/a-picture-of-what-it-expected/");
    expect(directive(csp, "frame-src").sort()).toEqual(["'self'", "https://challenges.cloudflare.com"].sort());
  });

  it("still refuses to let ordinary pages be framed", async () => {
    const { csp, xfo } = await cspFor("/blog/a-picture-of-what-it-expected/");
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(xfo).toBe("DENY");
  });

  it("lets artifacts be framed by the same origin only", async () => {
    const { csp, xfo } = await cspFor("/artifacts/a-picture-of-what-it-expected.html");
    expect(directive(csp, "frame-ancestors")).toEqual(["'self'"]);
    expect(xfo).toBe("SAMEORIGIN");
  });
});
