/**
 * checkmateWitness.ts — pure logic behind the Checkmate plate on /work.
 *
 * Checkmate's public page asks readers to record its ledger head "anywhere
 * checkmate doesn't control". This site does: `src/data/checkmate-witness.json`
 * is a dated snapshot of that head. A weekly workflow refreshes it through
 * checkmate's private gateway and commits it, so git history here is an
 * independent record. checkmate itself has no public page: this site is its
 * only public surface. If checkmate's history were ever rewritten, the head it
 * reports later would no longer extend the one witnessed here.
 *
 * A SHA-256 head is 64 hex digits, and a chessboard has 64 squares. The plate
 * draws the head as a board, one nibble per square, in reading order from a8.
 *
 * The snapshot is input from another service, so it is validated field by
 * field. Nothing is passed through just because the endpoint returned it.
 */

/** Every head this site has witnessed: the git history of the snapshot. */
export const WITNESS_HISTORY_URL =
  'https://github.com/mazze93/mazze-leczzare-blog/commits/main/src/data/checkmate-witness.json';

const HEX64 = /^[0-9a-f]{64}$/;
const VERDICT_KEY = /^[a-z-]{1,32}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface WitnessSnapshot {
  /** Date the head was read, YYYY-MM-DD. */
  witnessedAt: string;
  /** checkmate's own timestamp for the projection, epoch ms. */
  generatedAt: number;
  head: string;
  /** Number of links in the chain at `head`. */
  length: number;
  /** Checkmate's own verification of the chain at read time. */
  intact: boolean;
  audits: number;
  /** Advisories filed upstream through the human-authorized gate. */
  filedThroughGate: number;
  verdicts: Record<string, number>;
}

const count = (v: unknown, field: string): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw new Error(`checkmate witness: ${field} must be a non-negative integer`);
  }
  return v;
};

/** Validate a snapshot. Throws on anything malformed rather than rendering it. */
export function parseWitness(raw: unknown): WitnessSnapshot {
  if (!raw || typeof raw !== 'object') throw new Error('checkmate witness: not an object');
  const r = raw as Record<string, unknown>;

  if (typeof r.witnessedAt !== 'string' || !ISO_DATE.test(r.witnessedAt)) {
    throw new Error('checkmate witness: witnessedAt must be YYYY-MM-DD');
  }
  if (typeof r.head !== 'string' || !HEX64.test(r.head)) {
    throw new Error('checkmate witness: head must be 64 lowercase hex digits');
  }
  if (typeof r.intact !== 'boolean') throw new Error('checkmate witness: intact must be boolean');

  const verdicts: Record<string, number> = {};
  if (!r.verdicts || typeof r.verdicts !== 'object') {
    throw new Error('checkmate witness: verdicts must be an object');
  }
  for (const [k, v] of Object.entries(r.verdicts as Record<string, unknown>)) {
    if (!VERDICT_KEY.test(k)) throw new Error(`checkmate witness: bad verdict key ${JSON.stringify(k)}`);
    verdicts[k] = count(v, `verdicts.${k}`);
  }

  return {
    witnessedAt: r.witnessedAt,
    generatedAt: count(r.generatedAt, 'generatedAt'),
    head: r.head,
    length: count(r.length, 'length'),
    intact: r.intact,
    audits: count(r.audits, 'audits'),
    filedThroughGate: count(r.filedThroughGate, 'filedThroughGate'),
    verdicts,
  };
}

export interface Square {
  /** e.g. "a8" */
  name: string;
  tone: 'light' | 'dark';
  /** The hex digit drawn on this square. */
  char: string;
  /** 0–15 */
  nibble: number;
}

const FILES = 'abcdefgh';

/** The head as 64 squares, rank 8 first, a→h, the way a diagram reads. */
export function headToBoard(head: string): Square[] {
  if (!HEX64.test(head)) throw new Error('checkmate witness: head must be 64 lowercase hex digits');
  return [...head].map((char, i) => {
    const file = i % 8;
    const rank = 8 - Math.floor(i / 8);
    return {
      name: `${FILES[file]}${rank}`,
      // a1 is dark: file index 0 + rank 1 is odd.
      tone: (file + rank) % 2 === 1 ? 'dark' : 'light',
      char,
      nibble: parseInt(char, 16),
    };
  });
}

export interface Annotation {
  key: string;
  glyph: string;
  label: string;
  count: number;
}

/**
 * Verdicts written in chess-annotation notation (the Informant set, where ∞
 * means "unclear" and … means "to move"). Known verdicts come first, in this
 * order. Any verdict checkmate adds later still renders, under its own key.
 */
const NOTATION: ReadonlyArray<Omit<Annotation, 'count'>> = [
  { key: 'class-closed', glyph: '#', label: 'class closed' },
  { key: 'did-not-hold', glyph: '?', label: 'claim failed' },
  { key: 'partially-held', glyph: '?!', label: 'partially held' },
  { key: 'inconclusive', glyph: '∞', label: 'unclear' },
  { key: 'open', glyph: '…', label: 'still to move' },
];

export function annotate(verdicts: Record<string, number>): Annotation[] {
  const known = NOTATION.filter((n) => (verdicts[n.key] ?? 0) > 0).map((n) => ({
    ...n,
    count: verdicts[n.key],
  }));
  const knownKeys = new Set(NOTATION.map((n) => n.key));
  const unknown = Object.entries(verdicts)
    .filter(([k, v]) => !knownKeys.has(k) && v > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ key: k, glyph: '·', label: k.replace(/-/g, ' '), count: v }));
  return [...known, ...unknown];
}

/**
 * The snapshot in checkmate's own ledger.json shape (the subset this site
 * keeps), served at /witness/checkmate.json. The witness-hub script that used
 * to read checkmate's public page reads this instead.
 */
export function toLedgerJson(w: WitnessSnapshot) {
  return {
    source: 'mazzeleczzare.com witness of checkmate',
    witnessedAt: w.witnessedAt,
    generatedAt: w.generatedAt,
    ledger: {
      audits: w.audits,
      verdicts: w.verdicts,
      filedThroughGate: w.filedThroughGate,
      chain: { ok: w.intact, length: w.length, head: w.head },
    },
  };
}
