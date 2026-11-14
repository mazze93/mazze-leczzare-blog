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
 * Every post is authored in this repository, but the feed is archived and
 * rendered by other services, so each removal repeats until nothing changes
 * (a removal can't splice a new `<script` or `on…=` together) and end tags
 * match loosely (`</script >`).
 */
export function stripForFeed(html: string): string {
  let out = replaceUntilStable(html, /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi, '');
  out = replaceUntilStable(out, /<style\b[^>]*>[\s\S]*?<\/style\b[^>]*>/gi, '');
  // An opening tag with no end tag would hide everything after it from the
  // block patterns above; drop any that are left.
  out = replaceUntilStable(out, /<\/?(?:script|style)\b[^>]*>/gi, '');
  return out.replace(/<[a-z][^>]*>/gi, stripTagAttributes);
}

/**
 * Removes inline event handlers (quoted or unquoted) and Astro scoping
 * attributes from one opening tag. Runs per tag, so prose that quotes
 * `onerror="…"` keeps its text.
 */
function stripTagAttributes(tag: string): string {
  const withoutHandlers = replaceUntilStable(
    tag,
    /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    '',
  );
  return withoutHandlers.replace(/\s+data-astro-[a-z0-9-]+(?:=(?:"[^"]*"|'[^']*'))?/gi, '');
}

/** Applies `pattern` repeatedly until the string stops changing. */
function replaceUntilStable(input: string, pattern: RegExp, replacement: string): string {
  let previous: string;
  let current = input;
  do {
    previous = current;
    current = current.replace(pattern, replacement);
  } while (current !== previous);
  return current;
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
