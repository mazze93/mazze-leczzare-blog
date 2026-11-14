/**
 * Scholarly feed helpers — pure, no astro:content import, so they are
 * unit-testable (see scholarlyFeed.test.ts).
 *
 * /feed.json is the feed Rogue Scholar harvests to register a DOI for each
 * essay. Its rules: full post text in the feed, CC BY licence, a title, an
 * author and a date per post, and a public landing page per post. These
 * helpers decide which posts qualify and turn rendered post HTML into
 * self-contained feed HTML.
 */

export type PostLicense = 'cc-by-4.0' | 'all-rights-reserved';

export interface ArchivablePostData {
  draft?: boolean;
  license?: PostLicense;
  archive?: boolean;
}

/**
 * A post enters the scholarly feed only when it is published, CC BY, and not
 * opted out with `archive: false`. Missing fields take the schema defaults
 * (license "cc-by-4.0", archive true).
 */
export function isArchivable(data: ArchivablePostData): boolean {
  if (data.draft) return false;
  if ((data.license ?? 'cc-by-4.0') !== 'cc-by-4.0') return false;
  return data.archive ?? true;
}

// Root-relative URL attributes: src="/x", href='/x', poster="/x".
// A leading "//" is protocol-relative and is left alone.
const ROOT_RELATIVE_ATTR = /\b(src|href|poster)=(["'])\/(?!\/)/g;
// srcset holds a comma-separated list; each candidate may be root-relative.
const SRCSET_ATTR = /\bsrcset=(["'])([^"']*)\1/g;

/** Rewrites root-relative URLs to absolute ones on `siteUrl`. */
export function absolutizeUrls(html: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/+$/, '');
  return html
    .replace(ROOT_RELATIVE_ATTR, (_m, attr, quote) => `${attr}=${quote}${base}/`)
    .replace(SRCSET_ATTR, (_m, quote, list: string) => {
      const fixed = list
        .split(',')
        .map((candidate) => candidate.trim().replace(/^\/(?!\/)/, `${base}/`))
        .join(', ');
      return `srcset=${quote}${fixed}${quote}`;
    });
}

/**
 * Removes what a feed reader or archive should not execute or restyle:
 * <script> and <style> blocks, inline event handlers, and Astro's scoping
 * attributes. Text, links, images, figures and iframes stay.
 *
 * This is cleanup of our own build output, not a sanitizer for untrusted
 * input: every post is authored in this repository.
 */
export function stripForFeed(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[a-z][^>]*>/gi, stripTagAttributes);
}

/**
 * Removes inline event handlers and Astro scoping attributes from one opening
 * tag. Runs per tag, so prose that quotes `onerror="…"` keeps its text.
 */
function stripTagAttributes(tag: string): string {
  return tag
    .replace(/\s+on[a-z]+=(["'])(?:(?!\1)[\s\S])*\1/gi, '')
    .replace(/\s+data-astro-[a-z0-9-]+(=(["'])[^"']*\2)?/gi, '');
}

/** Rendered post HTML → self-contained feed HTML. */
export function toFeedHtml(html: string, siteUrl: string): string {
  return absolutizeUrls(stripForFeed(html), siteUrl).trim();
}

/** The licence line appended to every archived post in the feed. */
export function licenseFooterHtml(
  author: string,
  year: number,
  license: { name: string; url: string },
): string {
  return `<p><small>© ${year} ${author}. Text licensed under <a href="${license.url}">${license.name}</a>.</small></p>`;
}
