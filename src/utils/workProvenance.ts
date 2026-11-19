/**
 * Provenance rules for /work — what a tier is allowed to claim, checked
 * against what its evidence actually shows.
 *
 * Two layers, deliberately separate:
 *
 * - `structuralFindings` needs nothing but the entry. It runs in the unit
 *   tests, so a malformed entry fails `npm run test` before it ships.
 * - `attestationFindings` reads the record that
 *   `scripts/ops/verify-work-evidence.mjs` writes to
 *   `src/data/work-attestation.json`: every link opened, every GitHub source
 *   looked up. It catches what no schema can — a dead link, a source that
 *   went private, a tier that understates what is public (Context Synapse
 *   read "Self-reported" with a public, released repo until 2026-11-19).
 *
 * Pure and dependency-free (type imports only) so the Node script can import
 * this file directly through type stripping.
 */

import type { Evidence, Tier } from '../data/work';

export interface EntryLike {
  tier: Tier;
  /** The margin index, e.g. "01 · v0.4.0". A version here is a claim too. */
  idx?: string;
  note?: string;
  evidence?: Evidence[];
}

export interface RepoRecord {
  public: boolean;
  license: string | null;
  homepage: string | null;
  latestRelease: { tag: string; publishedAt: string } | null;
}

export interface LinkRecord {
  /** HTTP status of the final response; null when no response arrived. */
  status: number | null;
  ok: boolean;
  error?: string;
  /** Present when the link is a GitHub repository root. */
  repo?: RepoRecord;
}

export type Severity = 'error' | 'warn';

export interface Finding {
  entry: string;
  severity: Severity;
  rule: string;
  message: string;
}

export interface Attestation {
  /** When the run finished, ISO 8601. */
  checkedAt: string;
  /** Keyed by the exact href in the entry (absolute URL or site path). */
  links: Record<string, LinkRecord>;
  findings: Finding[];
}

const GITHUB_REPO = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)\/?$/;

// github.com/<x>/<y> paths that are site features, not owner/repo pairs —
// e.g. /advisories/GHSA-… (the vulnerability-research entry links three).
const GITHUB_RESERVED = new Set([
  'advisories', 'apps', 'collections', 'enterprises', 'events', 'features', 'marketplace',
  'orgs', 'organizations', 'settings', 'sponsors', 'topics', 'users',
]);

/** `{owner, repo}` when `href` is a repository root on github.com, else null. */
export function githubRepoOf(href: string): { owner: string; repo: string } | null {
  const m = GITHUB_REPO.exec(href);
  if (!m || GITHUB_RESERVED.has(m[1].toLowerCase())) return null;
  return { owner: m[1], repo: m[2] };
}

const VERSION = /v\d+\.\d+\.\d+/;

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Rules that need only the entry itself. */
export function structuralFindings(slug: string, entry: EntryLike): Finding[] {
  const out: Finding[] = [];
  const evidence = entry.evidence ?? [];
  if (entry.tier !== 'self' && evidence.length === 0) {
    out.push({
      entry: slug,
      severity: 'error',
      rule: 'tier-without-evidence',
      message: `tier "${entry.tier}" claims evidence but the entry links none`,
    });
  }
  if (entry.tier === 'self' && !entry.note?.trim()) {
    out.push({
      entry: slug,
      severity: 'error',
      rule: 'self-without-note',
      message: 'a self-reported entry must say in its note what is missing',
    });
  }
  return out;
}

/** A link that answered nothing, or answered "gone", is broken; anything else non-2xx is a warning. */
function linkSeverity(rec: LinkRecord): Severity {
  if (rec.status === null || rec.status === 404 || rec.status === 410) return 'error';
  return 'warn';
}

/** Rules that need the attestation record. */
export function attestationFindings(
  slug: string,
  entry: EntryLike,
  links: Record<string, LinkRecord>,
): Finding[] {
  const out: Finding[] = [];
  const evidence = (entry.evidence ?? []).filter((ev) => ev.href);
  const hosts = new Set(
    evidence.filter((ev) => isExternal(ev.href!)).map((ev) => new URL(ev.href!).host),
  );

  for (const ev of evidence) {
    const rec = links[ev.href!];
    if (!rec) continue;
    if (!rec.ok) {
      out.push({
        entry: slug,
        severity: linkSeverity(rec),
        rule: 'link-unreachable',
        message: `${ev.label} ${ev.href} → ${rec.status ?? rec.error ?? 'no response'}`,
      });
    }
    if (!rec.repo) continue;
    if (!rec.repo.public) {
      out.push({
        entry: slug,
        severity: 'error',
        rule: 'source-not-public',
        message: `${ev.href} is not public, so visitors cannot follow this link`,
      });
      continue;
    }
    const claimed = entry.idx ? VERSION.exec(entry.idx)?.[0] : undefined;
    const released = rec.repo.latestRelease?.tag;
    if (claimed && released && VERSION.test(released) && released !== claimed) {
      out.push({
        entry: slug,
        severity: 'warn',
        rule: 'version-behind',
        message: `idx claims ${claimed} but ${ev.href} has released ${released}`,
      });
    }
    if (entry.tier === 'self' && rec.repo.latestRelease) {
      out.push({
        entry: slug,
        severity: 'warn',
        rule: 'tier-understated',
        message: `tier is "self" but ${ev.href} is public with release ${rec.repo.latestRelease.tag}`,
      });
    }
    const home = rec.repo.homepage;
    const backlinked = home && isExternal(home) && hosts.has(new URL(home).host);
    if (!backlinked && hosts.size > 1) {
      out.push({
        entry: slug,
        severity: 'warn',
        rule: 'no-backlink',
        message: `${ev.href} homepage (${home || 'unset'}) does not point back to any site this entry links`,
      });
    }
  }
  return out;
}

const DAY = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "19 Nov 2026" from an ISO timestamp. */
export function formatCheckedDate(iso: string): string {
  return DAY.format(new Date(iso));
}

/** One short line describing what the last run saw for a link, or null if it never checked it. */
export function attestationLine(rec: LinkRecord | undefined, checkedAt: string): string | null {
  if (!rec) return null;
  const when = formatCheckedDate(checkedAt);
  if (!rec.ok) return `unreachable at last check, ${when}`;
  if (rec.repo?.public) {
    const parts = ['public'];
    if (rec.repo.license) parts.push(rec.repo.license);
    if (rec.repo.latestRelease) parts.push(rec.repo.latestRelease.tag);
    return `${parts.join(' · ')} · checked ${when}`;
  }
  return `checked ${when}`;
}
