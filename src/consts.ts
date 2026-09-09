export const SITE_TITLE = "Mazze LeCzzare";
export const SITE_DESCRIPTION =
  "Security engineer, content strategist, and founder of Secure Pride. Essays and infrastructure for systems with real human stakes.";
export const SITE_URL = "https://mazzeleczzare.com";
export const SITE_AUTHOR = "Mazze LeCzzare";
export const SITE_EMAIL = "mailto:security@mazzeleczzare.com";
export const SITE_GITHUB_URL = "https://github.com/mazze93";
export const SITE_TWITTER = "@southerncunning";
export const SITE_REPO_URL = "https://github.com/mazze93/mazze-leczzare-blog";
export const SITE_DEFAULT_OG_IMAGE = "/mazze-leczzare-social-preview.png";
export const COMPASS_LABEL = "Mazze LeCzzare — home";
// Turnstile site keys are public by design (paired with a server-side secret
// key that never leaves Cloudflare Functions env vars) — safe to inline here.
export const TURNSTILE_SITE_KEY = "0x4AAAAAAEYJ6c3cC0X8i_-F";

// The live Gumroad listing for *Gay Wandering — Reader No. 01*. Used as the
// checkout default so the sale does not depend on a build env var being set;
// PUBLIC_GAY_WANDERING_CHECKOUT_URL still overrides it.
export const GAY_WANDERING_CHECKOUT_URL =
  'https://mazzeleczzare.gumroad.com/l/gay-wandering';

// The skills-and-plugins storefront (Claude Code plugins + skills). A distinct
// surface from the Gumroad book listing above; `/store` is the on-site writeup
// that points here.
export const SITE_STORE_URL = 'https://store.mazzeleczzare.com';

// One-time, dismissable corner announcement for the store (StoreAnnounce.astro,
// mounted in Footer). Ships OFF — set to true when you want every visitor to
// see it once. It never blocks the page, honours prefers-reduced-motion, and
// its dismissal persists in localStorage.
export const STORE_ANNOUNCE_ENABLED = false;
