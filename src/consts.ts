export const SITE_TITLE = "Mazze LeCzzare";
export const SITE_DESCRIPTION =
  "Security engineer, content strategist, and founder of Secure Pride. Essays and infrastructure for systems with real human stakes.";
export const SITE_URL = "https://mazzeleczzare.com";
export const SITE_AUTHOR = "Mazze LeCzzare";
// The author's ORCID iD. Carried in the scholarly feed (/feed.json) and in each
// post's citation metadata so DOI registrars (Rogue Scholar) attach every
// archived essay to the right ORCID record.
export const SITE_AUTHOR_ORCID = "https://orcid.org/0009-0005-9661-4780";
// Default licence for essay text. Code in this repository stays MIT (LICENSE);
// essay text is CC BY 4.0 unless a post sets `license: "all-rights-reserved"`.
// Images are not covered unless a post says so. See LICENSE-CONTENT.md.
export const CONTENT_LICENSE = {
  id: "cc-by-4.0",
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
} as const;
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

// Retired store announcement. The shared navigation now points to the sprint
// and the footer no longer mounts StoreAnnounce.astro.
export const STORE_ANNOUNCE_ENABLED = false;
