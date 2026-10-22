import { describe, expect, it } from 'vitest';
import snapshot from '../data/checkmate-witness.json';
import { annotate, headToBoard, parseWitness } from './checkmateWitness';

const HEAD = '2e93ff8697d95fd97edd56b8c496ecb1649ff4fc66799a110010d3e87a16cedb';
const valid = {
  witnessedAt: '2026-10-22',
  head: HEAD,
  length: 177,
  intact: true,
  audits: 10,
  filedThroughGate: 0,
  verdicts: { open: 3, 'did-not-hold': 2 },
};

describe('parseWitness', () => {
  it('accepts the committed snapshot', () => {
    expect(() => parseWitness(snapshot)).not.toThrow();
  });

  it('accepts a well-formed snapshot and drops unknown top-level fields', () => {
    const w = parseWitness({ ...valid, extra: '<script>' });
    expect(w).toEqual(valid);
    expect('extra' in w).toBe(false);
  });

  it.each([
    ['uppercase head', { head: HEAD.toUpperCase() }],
    ['short head', { head: HEAD.slice(1) }],
    ['negative length', { length: -1 }],
    ['fractional count', { audits: 1.5 }],
    ['string count', { filedThroughGate: '0' }],
    ['non-boolean intact', { intact: 'true' }],
    ['bad date', { witnessedAt: '22/10/2026' }],
    ['markup in a verdict key', { verdicts: { '<b>': 1 } }],
    ['negative verdict', { verdicts: { open: -2 } }],
  ])('rejects %s', (_name, patch) => {
    expect(() => parseWitness({ ...valid, ...patch })).toThrow();
  });
});

describe('headToBoard', () => {
  const board = headToBoard(HEAD);

  it('lays the 64 digits out a8→h1 in reading order', () => {
    expect(board).toHaveLength(64);
    expect(board[0]).toMatchObject({ name: 'a8', char: '2', nibble: 2 });
    expect(board[7].name).toBe('h8');
    expect(board[63]).toMatchObject({ name: 'h1', char: 'b', nibble: 11 });
    expect(board.map((s) => s.char).join('')).toBe(HEAD);
  });

  it('colours squares like a real board (a1 dark, h1 light, a8 light)', () => {
    const at = (n: string) => board.find((s) => s.name === n)!.tone;
    expect(at('a1')).toBe('dark');
    expect(at('h1')).toBe('light');
    expect(at('a8')).toBe('light');
    expect(at('h8')).toBe('dark');
  });
});

describe('annotate', () => {
  it('orders known verdicts by the notation table and skips zeros', () => {
    const a = annotate({ open: 3, 'class-closed': 2, inconclusive: 0 });
    expect(a.map((x) => x.glyph)).toEqual(['#', '…']);
  });

  it('still renders a verdict it has no glyph for', () => {
    const a = annotate({ 'claim-withdrawn': 1 });
    expect(a).toEqual([{ key: 'claim-withdrawn', glyph: '·', label: 'claim withdrawn', count: 1 }]);
  });
});
