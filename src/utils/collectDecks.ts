/**
 * collectDecks.ts — the only file that discovers carousel decks. Vite-only
 * (import.meta.glob), mirroring how collectNodes.ts is the only caller of
 * getCollection. All shaping is delegated to the pure carousel.ts.
 *
 * A deck exists when docs/social/<slug>/slides.json exists. Legacy decks
 * that only have a PDF (no slides.json) are intentionally not discovered —
 * they have no per-slide text, so the strip could not describe them.
 *
 * A deck is only mounted once its built output (public/social/<slug>/NN.webp
 * and public/social/<slug>.pdf, written by `build.py --ship`) is on disk.
 * Until then it is skipped with a build-log warning, so merging a
 * slides.json early never ships broken previews or a dead PDF link.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { toDeck, sortDecks, isShipped, type Deck, type RawDeck } from './carousel';

const modules = import.meta.glob<RawDeck>('/docs/social/*/slides.json', {
  eager: true,
  import: 'default',
});

const PUBLIC_DIR = join(process.cwd(), 'public');
const onDisk = (sitePath: string): boolean => existsSync(join(PUBLIC_DIR, sitePath));

const DECKS: Deck[] = sortDecks(
  Object.values(modules)
    .map(toDeck)
    .filter((deck) => {
      if (isShipped(deck, onDisk)) return true;
      console.warn(
        `[carousel] ${deck.slug}: previews or PDF missing in public/social/; ` +
          `strip hidden until \`build.py ${deck.slug} --ship\` output is committed`,
      );
      return false;
    }),
);
const BY_SLUG = new Map(DECKS.map((d) => [d.slug, d]));

export function allDecks(): Deck[] {
  return DECKS;
}

export function deckFor(slug: string | undefined): Deck | undefined {
  return slug ? BY_SLUG.get(slug) : undefined;
}
