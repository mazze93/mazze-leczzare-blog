import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import attestation from '../data/work-attestation.json';
import {
  attestationFindings,
  attestationLine,
  githubRepoOf,
  structuralFindings,
  type Attestation,
  type EntryLike,
  type LinkRecord,
} from './workProvenance';

const WORK_DIR = join(process.cwd(), 'src/content/work');
const entries = readdirSync(WORK_DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(WORK_DIR, f), 'utf8'))] as [string, EntryLike]);

const SITE = 'https://example.mazzeleczzare.com/';
const REPO = 'https://github.com/mazze93/example';

function repoRecord(over: Partial<NonNullable<LinkRecord['repo']>> = {}): LinkRecord {
  return {
    status: 200,
    ok: true,
    repo: { public: true, license: 'MIT', homepage: SITE, latestRelease: { tag: 'v1.0.0', publishedAt: '2026-01-01T00:00:00Z' }, ...over },
  };
}

const withSiteAndSource = (tier: EntryLike['tier']): EntryLike => ({
  tier,
  note: 'note',
  evidence: [
    { label: 'Live', title: 'site', href: SITE, external: true },
    { label: 'Source', title: 'repo', href: REPO, external: true },
  ],
});

describe('every /work entry', () => {
  it('passes the structural provenance rules', () => {
    expect(entries.length).toBeGreaterThan(0);
    const findings = entries.flatMap(([slug, e]) => structuralFindings(slug, e));
    expect(findings).toEqual([]);
  });

  it('has no error-level finding in the committed attestation', () => {
    const errors = (attestation as Attestation).findings.filter((f) => f.severity === 'error');
    expect(errors).toEqual([]);
  });
});

describe('structuralFindings', () => {
  it('rejects a non-self tier with no evidence', () => {
    expect(structuralFindings('x', { tier: 'live' }).map((f) => f.rule)).toEqual(['tier-without-evidence']);
  });

  it('rejects a self entry that does not say what is missing', () => {
    expect(structuralFindings('x', { tier: 'self', note: '  ' }).map((f) => f.rule)).toEqual(['self-without-note']);
  });
});

describe('attestationFindings', () => {
  it('flags a self tier whose source is public and released (the Context Synapse case)', () => {
    const f = attestationFindings('x', withSiteAndSource('self'), { [REPO]: repoRecord() });
    expect(f.map((x) => x.rule)).toEqual(['tier-understated']);
  });

  it('accepts a live entry whose public source links back to its site', () => {
    expect(attestationFindings('x', withSiteAndSource('live'), { [REPO]: repoRecord() })).toEqual([]);
  });

  it('flags a source repo whose homepage does not point back', () => {
    const f = attestationFindings('x', withSiteAndSource('live'), { [REPO]: repoRecord({ homepage: null }) });
    expect(f.map((x) => x.rule)).toEqual(['no-backlink']);
  });

  it('flags an idx version behind the latest release (the Stratum v0.4.0 case)', () => {
    const entry = { ...withSiteAndSource('live'), idx: '01 · v0.4.0' };
    const stale = attestationFindings('x', entry, { [REPO]: repoRecord({ latestRelease: { tag: 'v0.5.0', publishedAt: '' } }) });
    const current = attestationFindings('x', entry, { [REPO]: repoRecord({ latestRelease: { tag: 'v0.4.0', publishedAt: '' } }) });
    expect(stale.map((x) => x.rule)).toEqual(['version-behind']);
    expect(current).toEqual([]);
  });

  it('treats a private source as an error', () => {
    const f = attestationFindings('x', withSiteAndSource('live'), { [REPO]: repoRecord({ public: false }) });
    expect(f).toMatchObject([{ rule: 'source-not-public', severity: 'error' }]);
  });

  it('grades a 404 as an error and a 403 as a warning', () => {
    const dead = attestationFindings('x', withSiteAndSource('live'), { [SITE]: { status: 404, ok: false } });
    const blocked = attestationFindings('x', withSiteAndSource('live'), { [SITE]: { status: 403, ok: false } });
    expect(dead).toMatchObject([{ rule: 'link-unreachable', severity: 'error' }]);
    expect(blocked).toMatchObject([{ rule: 'link-unreachable', severity: 'warn' }]);
  });
});

describe('githubRepoOf', () => {
  it('matches repository roots only', () => {
    expect(githubRepoOf('https://github.com/mazze93/stele')).toEqual({ owner: 'mazze93', repo: 'stele' });
    expect(githubRepoOf('https://github.com/mazze93/stele/')).toEqual({ owner: 'mazze93', repo: 'stele' });
    expect(githubRepoOf('https://github.com/Secure-Pride')).toBeNull();
    expect(githubRepoOf('https://github.com/mazze93/stele/releases/tag/v1')).toBeNull();
    expect(githubRepoOf('https://github.com/advisories/GHSA-52cp-r559-cp3m')).toBeNull();
  });
});

describe('attestationLine', () => {
  const at = '2026-11-19T08:00:00Z';
  it('describes a public repo', () => {
    expect(attestationLine(repoRecord(), at)).toBe('public · MIT · v1.0.0 · checked 19 Nov 2026');
  });
  it('admits a failed check', () => {
    expect(attestationLine({ status: 404, ok: false }, at)).toBe('unreachable at last check, 19 Nov 2026');
  });
  it('says nothing about a link it never checked', () => {
    expect(attestationLine(undefined, at)).toBeNull();
  });
});
