// Single source for the site's Content-Security-Policy.
//
// Imported by functions/_middleware.ts (production, enforced) and by
// scripts/dev/edgeHeaders.ts (astro dev, report-only). Before this file the
// policy lived only in the middleware, so `astro dev` and `astro preview`
// served no CSP at all and two real breakages were found only on the live site
// (the 2026-10-08 frame-src miss below; Rocket Loader in #202/#203). Change the
// policy here and both sides move together. Pinned by src/utils/csp.test.ts.

const BASE_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://challenges.cloudflare.com",
  // 'self' lets a post embed its own /artifacts/*.html (ArtifactEmbed). Without
  // it every embed was blank in production: the parent page's frame-src only
  // allowed Turnstile. Found 2026-10-08 by loading the live
  // /blog/the-break-is-the-record/ in Chromium; `astro preview` runs no
  // middleware, so no local check could see it. The artifact side already
  // permits it (frame-ancestors 'self'); every other page keeps 'none'.
  "frame-src 'self' https://challenges.cloudflare.com",
  "form-action 'self'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const DEFAULT_CSP = `${BASE_CSP}; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'`;
export const ARTIFACT_CSP = `${BASE_CSP}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self'`;

/** /artifacts/* is the only path granted the relaxed policy. */
export function isArtifactPath(pathname: string): boolean {
  return pathname.startsWith("/artifacts/");
}

/** The enforced CSP and X-Frame-Options production sends for a path. */
export function policyFor(pathname: string): { csp: string; frameOptions: "DENY" | "SAMEORIGIN" } {
  return isArtifactPath(pathname)
    ? { csp: ARTIFACT_CSP, frameOptions: "SAMEORIGIN" }
    : { csp: DEFAULT_CSP, frameOptions: "DENY" };
}
