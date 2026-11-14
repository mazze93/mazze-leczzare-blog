import { WITNESS_HISTORY_URL } from '../utils/checkmateWitness';

/**
 * The work model — one entry per piece of work, stored as
 * `src/content/work/<slug>.json` and rendered by `components/work/WorkEntry`.
 *
 * The load-bearing idea is the tier: every claim carries its own evidence
 * grade, and the weaker the evidence the quieter the entry reads. Pick the
 * tier honestly. If it is not deployed, published, or in someone else's
 * record, it is `self` — and `note` must say what is missing.
 */

export const TIERS = ['live', 'published', 'acknowledged', 'self'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABEL: Record<Tier, string> = {
  live: 'Live',
  published: 'Published',
  acknowledged: 'Acknowledged',
  self: 'Self-reported',
};

export const WORK_SECTIONS = [
  { id: 'instruments', rn: '§ I', label: 'Instruments' },
  { id: 'record', rn: '§ II', label: 'The Written Record' },
  { id: 'editorial', rn: '§ III', label: 'Editorial Practice' },
  { id: 'provenance', rn: '§ IV', label: 'Provenance' },
] as const;
export type WorkSectionId = (typeof WORK_SECTIONS)[number]['id'];
export const WORK_SECTION_IDS = WORK_SECTIONS.map((s) => s.id) as [WorkSectionId, ...WorkSectionId[]];

/**
 * Named links whose URL is computed in code, so a JSON entry can point at
 * them without copying the value (and drifting from it).
 */
export const EVIDENCE_REFS = {
  'checkmate-witness-history': WITNESS_HISTORY_URL,
} as const;
export type EvidenceRef = keyof typeof EVIDENCE_REFS;
export const EVIDENCE_REF_IDS = Object.keys(EVIDENCE_REFS) as [EvidenceRef, ...EvidenceRef[]];

export interface Evidence {
  label: string;
  title: string;
  href?: string;
  ref?: EvidenceRef;
  external?: boolean;
}

export interface WorkEntryData {
  section: WorkSectionId;
  order: number;
  idx: string;
  tier: Tier;
  /** Authored HTML, rendered with set:html so thesis phrases can carry <em>. */
  title: string;
  subtitle?: string;
  body: string[];
  evidence?: Evidence[];
  /** The apparatus caveat. This is where an entry admits what it is not. */
  note?: string;
  projectHref?: string;
  flagship?: boolean;
  /** A full-width plate above the entry — show first, then tell. */
  figure?: 'checkmate';
}

export function evidenceHref(ev: Evidence): string {
  if (ev.href) return ev.href;
  if (ev.ref && ev.ref in EVIDENCE_REFS) return EVIDENCE_REFS[ev.ref];
  throw new Error(`evidence "${ev.title}" has neither href nor a known ref`);
}

/** Sections in page order, each with its entries sorted by `order`. Empty sections are dropped. */
export function groupWork<T extends { data: WorkEntryData }>(entries: T[]) {
  return WORK_SECTIONS.map((section) => ({
    ...section,
    entries: entries
      .filter((e) => e.data.section === section.id)
      .sort((a, b) => a.data.order - b.data.order),
  })).filter((s) => s.entries.length > 0);
}
