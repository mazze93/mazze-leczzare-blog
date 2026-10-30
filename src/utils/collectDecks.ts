/**
 * collectDecks.ts — the only file that discovers carousel decks. Vite-only
 * (import.meta.glob), mirroring how collectNodes.ts is the only caller of
 * getCollection. All shaping is delegated to the pure carousel.ts.
 *
 * A deck exists when docs/social/<slug>/slides.json exists. Legacy decks
 * that only have a PDF (no slides.json) are intentionally not discovered —
 * they have no per-slide text, so the strip could not describe them.
 */
import { toDeck, sortDecks, type Deck, type RawDeck } from './carousel';

const modules = import.meta.glob<RawDeck>('/docs/social/*/slides.json', {
  eager: true,
  import: 'default',
});

const DECKS: Deck[] = sortDecks(Object.values(modules).map(toDeck));
const BY_SLUG = new Map(DECKS.map((d) => [d.slug, d]));

export function allDecks(): Deck[] {
  return DECKS;
}

export function deckFor(slug: string | undefined): Deck | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}
