import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { slideAlt, toDeck, postHrefFromUrl, sortDecks, PREVIEW_WIDTH, type RawDeck } from "./carousel";

// The real shipped deck — tests run against the data the site actually renders.
const SLUG = "the-attack-surface-of-security-language";
const raw = JSON.parse(readFileSync(join("docs/social", SLUG, "slides.json"), "utf8")) as RawDeck;

describe("slideAlt", () => {
  it("speaks diff marks explicitly on definition slides", () => {
    const alt = slideAlt(raw.slides[2]);
    expect(alt).toContain("anomalous, adj.");
    expect(alt).toContain("Struck through: a threat.");
    expect(alt).toContain("Replaced with: A distance from a chosen baseline.");
  });

  it("includes every list item, not just the headline", () => {
    const alt = slideAlt(raw.slides[7]);
    for (const item of raw.slides[7].list ?? []) expect(alt).toContain(item);
  });

  it("reads manifest keys and values", () => {
    expect(slideAlt(raw.slides[5])).toContain("owner: who may change it");
  });

  it("never yields an empty or generic label for any shipped slide", () => {
    for (const s of raw.slides) {
      const alt = slideAlt(s);
      expect(alt.length).toBeGreaterThan(40);
      expect(alt).not.toMatch(/^slide \d/i);
    }
  });

  it("does not double punctuation", () => {
    expect(slideAlt({ kind: "statement", headline: "Done.", body: "Ask?" })).toBe("Done. Ask?");
  });
});

describe("toDeck", () => {
  const deck = toDeck(raw);

  it("maps every slide to a preview path that exists on disk", () => {
    expect(deck.slides).toHaveLength(raw.slides.length);
    for (const s of deck.slides) expect(existsSync(join("public", s.src))).toBe(true);
  });

  it("derives same-site post and PDF links", () => {
    expect(deck.postHref).toBe(`/blog/${SLUG}/`);
    expect(deck.pdfHref).toBe(`/social/${SLUG}.pdf`);
    expect(existsSync(join("public", deck.pdfHref))).toBe(true);
  });

  it("carries intrinsic dimensions matching the 4:5 frame", () => {
    expect(deck.width).toBe(PREVIEW_WIDTH);
    expect(deck.height).toBe(1080);
    expect(deck.ratio).toBeCloseTo(0.8);
  });

  it("refuses a deck with no slides instead of rendering an empty strip", () => {
    expect(() => toDeck({ ...raw, slides: [] })).toThrow(/no slides/);
  });
});

describe("postHrefFromUrl", () => {
  it("strips scheme and host and adds the trailing slash the site requires", () => {
    expect(postHrefFromUrl("mazzeleczzare.com/blog/x")).toBe("/blog/x/");
    expect(postHrefFromUrl("https://mazzeleczzare.com/blog/x/")).toBe("/blog/x/");
  });
});

describe("sortDecks", () => {
  it("orders newest issued first, undated last", () => {
    const d = toDeck(raw);
    const sorted = sortDecks([{ ...d, slug: "a", issued: undefined }, { ...d, slug: "b", issued: "2026-11-01" }, d]);
    expect(sorted.map((x) => x.slug)).toEqual(["b", SLUG, "a"]);
  });
});
