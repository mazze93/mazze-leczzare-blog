import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WITNESS_HISTORY_URL } from '../utils/checkmateWitness';
import { WORK_SECTIONS, evidenceHref, groupWork, type WorkEntryData } from './work';

const dir = join(__dirname, '../content/work');
const entries = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ id: f, data: JSON.parse(readFileSync(join(dir, f), 'utf8')) as WorkEntryData }));

describe('work model', () => {
  it('resolves a named ref to the computed URL', () => {
    expect(evidenceHref({ label: 'Live', title: 't', ref: 'checkmate-witness-history' })).toBe(WITNESS_HISTORY_URL);
  });

  it('throws on evidence with no destination', () => {
    expect(() => evidenceHref({ label: 'x', title: 'broken' })).toThrow(/neither href/);
  });

  it('groups by section in page order, sorted by order, dropping empty sections', () => {
    const mk = (section: WorkEntryData['section'], order: number) =>
      ({ data: { section, order, idx: '', tier: 'self', title: `${section}${order}`, body: ['x'] } as WorkEntryData });
    const out = groupWork([mk('record', 1), mk('instruments', 2), mk('record', 0), mk('instruments', 0)]);
    expect(out.map((s) => s.id)).toEqual(['instruments', 'record']);
    expect(out[1].entries.map((e) => e.data.title)).toEqual(['record0', 'record1']);
  });
});

describe('work content', () => {
  it('has unique, gapless order within each section', () => {
    for (const { id } of WORK_SECTIONS) {
      const orders = entries.filter((e) => e.data.section === id).map((e) => e.data.order).sort((a, b) => a - b);
      expect(orders, id).toEqual(orders.map((_, i) => i));
    }
  });

  it('gives every self-reported entry a note saying what is missing', () => {
    const silent = entries.filter((e) => e.data.tier === 'self' && !e.data.note).map((e) => e.id);
    expect(silent).toEqual([]);
  });
});
