/**
 * carousel.ts — pure: turn a carousel's slides.json into what the on-site
 * CarouselStrip renders. No astro:content, no fs, no import.meta.glob here
 * (collectDecks.ts owns that), so this is unit-testable with vitest.
 *
 * Source of truth: docs/social/<slug>/slides.json — the same file
 * scripts/carousel/build.py prints the PDF from. Web previews live at
 * public/social/<slug>/NN.webp (written by `build.py --ship`).
 *
 * Alt text is derived from the slide's own fields in reading order, so the
 * strip is as readable to a screen reader as the tagged PDF — never a
 * generic "Slide 3" label. Decks without a slides.json (the two legacy
 * image-only PDFs) never become a Deck, by design.
 */

// ── Types ────────────────────────────────────────────────────────────────
/** One slide as written in slides.json. Fields vary by `kind`; all optional here. */
export interface RawSlide {
  kind: string;
  label?: string;
  headword?: string;
  pos?: string;
  title?: string;
  headline?: string;
  struck?: string;
  definition?: string;
  body?: string;
  list?: string[];
  coda?: string;
  callout?: string;
  cta?: string;
  manifest?: [string, string][];
  manifest_file?: string;
  items?: [string, string][];
  exec?: string;
  exec_caption?: string;
}

export interface RawDeck {
  slug: string;
  title: string;
  url: string;
  eyebrow?: string;
  byline?: string;
  issued?: string;
  theme?: string;
  frame: { width: number; height: number };
  slides: RawSlide[];
}

export interface StripSlide {
  src: string;
  alt: string;
  index: number; // 1-based
}

export interface Deck {
  slug: string;
  title: string;
  postHref: string;
  pdfHref: string;
  issued?: string;
  eyebrow?: string;
  /** Aspect ratio of the frame, e.g. 1080/1350 = 0.8 */
  ratio: number;
  width: number;
  height: number;
  slides: StripSlide[];
}

// Must match build.py's WEB_WIDTH — the previews' intrinsic width.
export const PREVIEW_WIDTH = 864;

// ── Alt text ─────────────────────────────────────────────────────────────
const clean = (s?: string): string => (s ?? '').replace(/\s+/g, ' ').trim();

/** Join non-empty parts as sentences, adding a full stop where one is missing. */
function sentences(parts: (string | undefined)[]): string {
  return parts
    .map(clean)
    .filter(Boolean)
    .map((p) => (/[.?!:]$/.test(p) ? p : `${p}.`))
    .join(' ');
}

/**
 * Everything a sighted reader gets from the slide, in reading order.
 * Diff marks are spoken explicitly ("struck through: …") because the
 * strikethrough carries meaning, not decoration.
 */
export function slideAlt(s: RawSlide): string {
  const entry = s.headword ? `${s.headword}${s.pos ? `, ${s.pos}` : ''}` : undefined;
  const list = s.list?.length ? s.list.map(clean).join('; ') : undefined;
  const manifest = s.manifest?.length
    ? `${clean(s.manifest_file) || 'Schema'}: ` + s.manifest.map(([k, v]) => `${k}: ${v}`).join('; ')
    : undefined;
  const items = s.items?.length ? s.items.map(([src, claim]) => `${src} ${clean(claim)}`).join(' ') : undefined;

  switch (s.kind) {
    case 'cover':
      return sentences([entry, s.exec_caption, s.title, s.body]);
    case 'definition':
      return sentences([
        s.label,
        entry,
        s.struck ? `Struck through: ${s.struck}` : undefined,
        s.definition ? `Replaced with: ${s.definition}` : undefined,
        s.body,
      ]);
    case 'senses':
      return sentences([s.label, entry, list, s.body]);
    case 'manifest':
      return sentences([s.label, s.headline, manifest]);
    case 'evidence':
      return sentences([s.label, items, s.body]);
    case 'close':
      return sentences([s.label, s.callout, s.cta]);
    default: // statement and anything new: every text field, in order
      return sentences([s.label, entry, s.headline, s.body, list, s.coda, s.callout]);
  }
}

// ── Deck assembly ────────────────────────────────────────────────────────
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Turn `mazzeleczzare.com/blog/x` into a same-site path `/blog/x/`. */
export function postHrefFromUrl(url: string): string {
  const path = url.replace(/^https?:\/\//, '').replace(/^[^/]+/, '');
  return path.endsWith('/') ? path : `${path}/`;
}

export function toDeck(raw: RawDeck): Deck {
  if (!raw.slides?.length) throw new Error(`carousel ${raw.slug}: slides.json has no slides`);
  return {
    slug: raw.slug,
    title: raw.title,
    postHref: postHrefFromUrl(raw.url),
    pdfHref: `/social/${raw.slug}.pdf`,
    issued: raw.issued,
    eyebrow: raw.eyebrow,
    ratio: raw.frame.width / raw.frame.height,
    width: PREVIEW_WIDTH,
    height: Math.round((PREVIEW_WIDTH * raw.frame.height) / raw.frame.width),
    slides: raw.slides.map((s, i) => ({
      index: i + 1,
      src: `/social/${raw.slug}/${pad2(i + 1)}.webp`,
      alt: slideAlt(s),
    })),
  };
}

/** Newest first by `issued`, then title — for the /social/ index. */
export function sortDecks(decks: Deck[]): Deck[] {
  return [...decks].sort(
    (a, b) => (b.issued ?? '').localeCompare(a.issued ?? '') || a.title.localeCompare(b.title),
  );
}
