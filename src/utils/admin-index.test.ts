/**
 * Tests for the data-transformation logic defined in src/pages/admin/index.astro.
 *
 * Because .astro frontmatter cannot be imported directly, each function under
 * test is a faithful inline re-implementation of the corresponding block in the
 * frontmatter.  This approach lets us cover every computation branch with plain
 * Vitest without spinning up the Astro build pipeline.
 */

import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal post-shape helpers
// ─────────────────────────────────────────────────────────────────────────────

interface PostData {
  title: string;
  pubDate: Date;
  draft?: boolean;
  tags?: string[];
  heroImage?: string;
  category?: string;
}

interface Post {
  id: string;
  data: PostData;
  body?: string;
}

function makePost(overrides: Partial<PostData> & { id?: string; body?: string } = {}): Post {
  const { id = "post-1", body = "", ...data } = overrides;
  return {
    id,
    body,
    data: {
      title: data.title ?? "Untitled",
      pubDate: data.pubDate ?? new Date("2024-01-01"),
      draft: data.draft,
      tags: data.tags,
      heroImage: data.heroImage,
      category: data.category,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-implementations of the frontmatter logic (kept in sync with index.astro)
// ─────────────────────────────────────────────────────────────────────────────

function splitPosts(allPosts: Post[]) {
  const sorted = [...allPosts].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  const published = sorted.filter((p) => !p.data.draft);
  const drafts = sorted.filter((p) => p.data.draft);
  return { sorted, published, drafts };
}

const DAY_MS = 86_400_000;

function daysSinceLast(published: Post[], now: number = Date.now()): number | null {
  if (published.length === 0) return null;
  return Math.floor((now - published[0].data.pubDate.valueOf()) / DAY_MS);
}

function computeTagCounts(published: Post[]): Record<string, number> {
  const tagCounts: Record<string, number> = {};
  for (const post of published) {
    for (const tag of post.data.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  return tagCounts;
}

function sortTagsByCount(tagCounts: Record<string, number>): [string, number][] {
  return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
}

type Gap = "tags" | "hero" | "category";

const GAP_LABEL: Record<Gap, string> = {
  tags: "no tags",
  hero: "no hero image",
  category: "no category",
};

function computeNeedsAttention(published: Post[]): { post: Post; gaps: Gap[] }[] {
  return published
    .map((post) => {
      const gaps: Gap[] = [];
      if (!post.data.tags || post.data.tags.length === 0) gaps.push("tags");
      if (!post.data.heroImage) gaps.push("hero");
      if (!post.data.category) gaps.push("category");
      return { post, gaps };
    })
    .filter(({ gaps }) => gaps.length > 0);
}

function computeCorpusEntropy(published: Post[]): {
  wordFreq: Record<string, number>;
  totalWords: number;
  entropy: number;
  entropyBits: string;
  uniqueWordCount: number;
} {
  const wordFreq: Record<string, number> = {};
  let totalWords = 0;
  for (const post of published) {
    const body = ("body" in post ? (post.body as string) : "") ?? "";
    const words = body
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] ?? 0) + 1;
      totalWords++;
    }
  }
  let entropy = 0;
  if (totalWords > 0) {
    for (const count of Object.values(wordFreq)) {
      const p = count / totalWords;
      entropy -= p * Math.log2(p);
    }
  }
  const entropyBits = totalWords > 0 ? entropy.toFixed(2) : "—";
  const uniqueWordCount = Object.keys(wordFreq).length;
  return { wordFreq, totalWords, entropy, entropyBits, uniqueWordCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests: splitPosts / published + drafts separation
// ─────────────────────────────────────────────────────────────────────────────

describe("splitPosts", () => {
  it("returns empty published and drafts arrays for an empty input", () => {
    const { published, drafts } = splitPosts([]);
    expect(published).toHaveLength(0);
    expect(drafts).toHaveLength(0);
  });

  it("classifies posts without a draft field as published", () => {
    const { published, drafts } = splitPosts([makePost()]);
    expect(published).toHaveLength(1);
    expect(drafts).toHaveLength(0);
  });

  it("classifies posts with draft=false as published", () => {
    const { published, drafts } = splitPosts([makePost({ draft: false })]);
    expect(published).toHaveLength(1);
    expect(drafts).toHaveLength(0);
  });

  it("classifies posts with draft=true as drafts", () => {
    const { published, drafts } = splitPosts([makePost({ draft: true })]);
    expect(published).toHaveLength(0);
    expect(drafts).toHaveLength(1);
  });

  it("correctly splits a mixed collection", () => {
    const posts = [
      makePost({ id: "a", draft: false }),
      makePost({ id: "b", draft: true }),
      makePost({ id: "c" }),
      makePost({ id: "d", draft: true }),
    ];
    const { published, drafts } = splitPosts(posts);
    expect(published).toHaveLength(2);
    expect(drafts).toHaveLength(2);
  });

  it("sorts posts by pubDate descending", () => {
    const posts = [
      makePost({ id: "old", pubDate: new Date("2023-01-01") }),
      makePost({ id: "new", pubDate: new Date("2025-06-01") }),
      makePost({ id: "mid", pubDate: new Date("2024-03-15") }),
    ];
    const { sorted } = splitPosts(posts);
    expect(sorted[0].id).toBe("new");
    expect(sorted[1].id).toBe("mid");
    expect(sorted[2].id).toBe("old");
  });

  it("published array preserves descending date order", () => {
    const posts = [
      makePost({ id: "old", pubDate: new Date("2022-01-01"), draft: false }),
      makePost({ id: "new", pubDate: new Date("2025-01-01"), draft: false }),
    ];
    const { published } = splitPosts(posts);
    expect(published[0].id).toBe("new");
    expect(published[1].id).toBe("old");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: daysSinceLast
// ─────────────────────────────────────────────────────────────────────────────

describe("daysSinceLast", () => {
  it("returns null when there are no published posts", () => {
    expect(daysSinceLast([])).toBeNull();
  });

  it("returns 0 when the most recent post was published today", () => {
    const now = Date.now();
    const post = makePost({ pubDate: new Date(now) });
    expect(daysSinceLast([post], now)).toBe(0);
  });

  it("returns 1 for a post published exactly one day ago", () => {
    const now = Date.now();
    const post = makePost({ pubDate: new Date(now - DAY_MS) });
    expect(daysSinceLast([post], now)).toBe(1);
  });

  it("returns the correct integer for several days ago", () => {
    const now = Date.now();
    const post = makePost({ pubDate: new Date(now - 30 * DAY_MS) });
    expect(daysSinceLast([post], now)).toBe(30);
  });

  it("floors fractional days (does not round up)", () => {
    const now = Date.now();
    // 1.9 days ago — should be 1, not 2
    const post = makePost({ pubDate: new Date(now - 1.9 * DAY_MS) });
    expect(daysSinceLast([post], now)).toBe(1);
  });

  it("uses the first (most recent) published post when multiple exist", () => {
    const now = Date.now();
    const posts = [
      makePost({ id: "recent", pubDate: new Date(now - 2 * DAY_MS) }),
      makePost({ id: "older", pubDate: new Date(now - 10 * DAY_MS) }),
    ];
    // published is already sorted desc by splitPosts; simulate that here
    expect(daysSinceLast(posts, now)).toBe(2);
  });

  it("returns a large value for very old posts", () => {
    const now = Date.now();
    const post = makePost({ pubDate: new Date(now - 365 * DAY_MS) });
    expect(daysSinceLast([post], now)).toBe(365);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: computeTagCounts
// ─────────────────────────────────────────────────────────────────────────────

describe("computeTagCounts", () => {
  it("returns an empty map for no posts", () => {
    expect(computeTagCounts([])).toEqual({});
  });

  it("returns an empty map when no post has tags", () => {
    const posts = [makePost({ id: "a" }), makePost({ id: "b" })];
    expect(computeTagCounts(posts)).toEqual({});
  });

  it("handles posts with an empty tags array (nullish coalescing fallback)", () => {
    const post = makePost({ tags: [] });
    expect(computeTagCounts([post])).toEqual({});
  });

  it("handles posts where tags is undefined via nullish coalescing", () => {
    const post = makePost({ tags: undefined });
    expect(computeTagCounts([post])).toEqual({});
  });

  it("counts a single tag on a single post", () => {
    const post = makePost({ tags: ["astro"] });
    expect(computeTagCounts([post])).toEqual({ astro: 1 });
  });

  it("counts multiple tags on a single post", () => {
    const post = makePost({ tags: ["astro", "react", "typescript"] });
    expect(computeTagCounts([post])).toEqual({ astro: 1, react: 1, typescript: 1 });
  });

  it("accumulates tag counts across multiple posts", () => {
    const posts = [
      makePost({ id: "a", tags: ["astro", "react"] }),
      makePost({ id: "b", tags: ["astro", "typescript"] }),
      makePost({ id: "c", tags: ["astro"] }),
    ];
    expect(computeTagCounts(posts)).toEqual({ astro: 3, react: 1, typescript: 1 });
  });

  it("handles duplicate tags within the same post", () => {
    const post = makePost({ tags: ["astro", "astro", "react"] });
    expect(computeTagCounts([post])).toEqual({ astro: 2, react: 1 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: sortTagsByCount
// ─────────────────────────────────────────────────────────────────────────────

describe("sortTagsByCount", () => {
  it("returns empty array for empty tag map", () => {
    expect(sortTagsByCount({})).toEqual([]);
  });

  it("returns a single entry for a single tag", () => {
    expect(sortTagsByCount({ astro: 5 })).toEqual([["astro", 5]]);
  });

  it("sorts tags by count descending", () => {
    const result = sortTagsByCount({ astro: 3, react: 7, typescript: 1 });
    expect(result[0]).toEqual(["react", 7]);
    expect(result[1]).toEqual(["astro", 3]);
    expect(result[2]).toEqual(["typescript", 1]);
  });

  it("places highest-count tag first in a larger map", () => {
    const tagCounts = { a: 2, b: 10, c: 5, d: 1 };
    const [first] = sortTagsByCount(tagCounts);
    expect(first).toEqual(["b", 10]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: computeNeedsAttention
// ─────────────────────────────────────────────────────────────────────────────

describe("computeNeedsAttention", () => {
  it("returns an empty array when there are no published posts", () => {
    expect(computeNeedsAttention([])).toHaveLength(0);
  });

  it("returns an empty array when all posts have complete metadata", () => {
    const posts = [
      makePost({
        id: "a",
        tags: ["astro"],
        heroImage: "/img/hero.jpg",
        category: "tech",
      }),
    ];
    expect(computeNeedsAttention(posts)).toHaveLength(0);
  });

  it("flags a post missing tags", () => {
    const post = makePost({ heroImage: "/img/hero.jpg", category: "tech" });
    const result = computeNeedsAttention([post]);
    expect(result).toHaveLength(1);
    expect(result[0].gaps).toContain("tags");
    expect(result[0].gaps).not.toContain("hero");
    expect(result[0].gaps).not.toContain("category");
  });

  it("flags a post with an empty tags array", () => {
    const post = makePost({ tags: [], heroImage: "/img.jpg", category: "x" });
    const result = computeNeedsAttention([post]);
    expect(result[0].gaps).toContain("tags");
  });

  it("flags a post missing heroImage", () => {
    const post = makePost({ tags: ["foo"], category: "tech" });
    const result = computeNeedsAttention([post]);
    expect(result).toHaveLength(1);
    expect(result[0].gaps).toContain("hero");
    expect(result[0].gaps).not.toContain("tags");
    expect(result[0].gaps).not.toContain("category");
  });

  it("flags a post missing category", () => {
    const post = makePost({ tags: ["foo"], heroImage: "/img.jpg" });
    const result = computeNeedsAttention([post]);
    expect(result).toHaveLength(1);
    expect(result[0].gaps).toContain("category");
  });

  it("flags a post missing all three metadata fields", () => {
    const post = makePost({ id: "bare" });
    const result = computeNeedsAttention([post]);
    expect(result).toHaveLength(1);
    expect(result[0].gaps).toEqual(["tags", "hero", "category"]);
  });

  it("includes the original post reference in the result", () => {
    const post = makePost({ id: "ref-check" });
    const result = computeNeedsAttention([post]);
    expect(result[0].post.id).toBe("ref-check");
  });

  it("handles multiple posts, only including those with gaps", () => {
    const posts = [
      makePost({ id: "ok", tags: ["t"], heroImage: "/h.jpg", category: "c" }),
      makePost({ id: "nogaps-at-all", tags: ["t"], heroImage: "/h.jpg", category: "c" }),
      makePost({ id: "missing-hero", tags: ["t"], category: "c" }),
      makePost({ id: "missing-all" }),
    ];
    const result = computeNeedsAttention(posts);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.post.id)).toEqual(["missing-hero", "missing-all"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: GAP_LABEL mapping
// ─────────────────────────────────────────────────────────────────────────────

describe("GAP_LABEL", () => {
  it("maps 'tags' to 'no tags'", () => {
    expect(GAP_LABEL["tags"]).toBe("no tags");
  });

  it("maps 'hero' to 'no hero image'", () => {
    expect(GAP_LABEL["hero"]).toBe("no hero image");
  });

  it("maps 'category' to 'no category'", () => {
    expect(GAP_LABEL["category"]).toBe("no category");
  });

  it("produces the correct joined string for multiple gaps", () => {
    const gaps: Gap[] = ["tags", "hero", "category"];
    expect(gaps.map((g) => GAP_LABEL[g]).join(" · ")).toBe(
      "no tags · no hero image · no category"
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests: computeCorpusEntropy
// ─────────────────────────────────────────────────────────────────────────────

describe("computeCorpusEntropy", () => {
  it("returns em-dash entropyBits and zero counts for empty published list", () => {
    const result = computeCorpusEntropy([]);
    expect(result.totalWords).toBe(0);
    expect(result.uniqueWordCount).toBe(0);
    expect(result.entropy).toBe(0);
    expect(result.entropyBits).toBe("—");
  });

  it("returns 0 bits entropy for a corpus of a single repeated word", () => {
    // p=1 for that one word, H = -(1 * log2(1)) = 0
    const post = makePost({ body: "hello hello hello" });
    const result = computeCorpusEntropy([post]);
    expect(result.entropy).toBeCloseTo(0, 10);
    expect(result.entropyBits).toBe("0.00");
    expect(result.uniqueWordCount).toBe(1);
    expect(result.totalWords).toBe(3);
  });

  it("returns 1 bit entropy for two equally probable words", () => {
    // p=0.5 each, H = -(0.5*log2(0.5) + 0.5*log2(0.5)) = 1
    const post = makePost({ body: "apple banana apple banana" });
    const result = computeCorpusEntropy([post]);
    expect(result.entropy).toBeCloseTo(1.0, 5);
    expect(result.entropyBits).toBe("1.00");
  });

  it("returns 2 bits entropy for four equally probable words", () => {
    // p=0.25 each, H = -(4 * 0.25*log2(0.25)) = 2
    const post = makePost({ body: "a b c d a b c d a b c d a b c d" });
    const result = computeCorpusEntropy([post]);
    expect(result.entropy).toBeCloseTo(2.0, 5);
  });

  it("strips non-letter characters before tokenising", () => {
    const post = makePost({ body: "hello, world! hello123 world." });
    const result = computeCorpusEntropy([post]);
    // 'hello,' → 'hello', 'world!' → 'world', 'hello123' → 'hello  ' → 'hello'
    // 'world.' → 'world'  — so wordFreq = { hello: 2, world: 2 }
    expect(result.wordFreq["hello"]).toBe(2);
    expect(result.wordFreq["world"]).toBe(2);
    expect(result.uniqueWordCount).toBe(2);
  });

  it("lowercases words before counting", () => {
    const post = makePost({ body: "Hello HELLO hello" });
    const result = computeCorpusEntropy([post]);
    expect(result.wordFreq["hello"]).toBe(3);
    expect(result.uniqueWordCount).toBe(1);
  });

  it("ignores whitespace-only tokens (filter(Boolean))", () => {
    const post = makePost({ body: "  foo   bar  " });
    const result = computeCorpusEntropy([post]);
    expect(result.totalWords).toBe(2);
  });

  it("accumulates word frequencies across multiple posts", () => {
    const posts = [
      makePost({ id: "p1", body: "the quick brown fox" }),
      makePost({ id: "p2", body: "the lazy dog the" }),
    ];
    const result = computeCorpusEntropy(posts);
    expect(result.wordFreq["the"]).toBe(3);
    expect(result.totalWords).toBe(8); // 4 words in p1 + 4 words in p2
  });

  it("handles posts without a body field gracefully (defaults to empty string)", () => {
    const postWithoutBody = { id: "no-body", data: makePost().data } as Post;
    const result = computeCorpusEntropy([postWithoutBody]);
    expect(result.totalWords).toBe(0);
    expect(result.entropyBits).toBe("—");
  });

  it("returns entropyBits as a string with 2 decimal places when corpus is non-empty", () => {
    const post = makePost({ body: "alpha beta gamma" });
    const result = computeCorpusEntropy([post]);
    expect(result.entropyBits).toMatch(/^\d+\.\d{2}$/);
  });

  it("uniqueWordCount equals the number of distinct words in the corpus", () => {
    const post = makePost({ body: "cat cat dog bird bird bird" });
    const result = computeCorpusEntropy([post]);
    expect(result.uniqueWordCount).toBe(3);
  });

  it("higher diversity corpus has greater entropy than lower diversity corpus", () => {
    const lowDiversity = makePost({ id: "low", body: "a a a a a a a a a a" });
    const highDiversity = makePost({ id: "high", body: "a b c d e f g h i j" });
    const low = computeCorpusEntropy([lowDiversity]);
    const high = computeCorpusEntropy([highDiversity]);
    expect(high.entropy).toBeGreaterThan(low.entropy);
  });

  it("numbers in the body are stripped and do not appear as tokens", () => {
    const post = makePost({ body: "hello 42 world 99" });
    const result = computeCorpusEntropy([post]);
    expect(result.wordFreq["42"]).toBeUndefined();
    expect(result.wordFreq["99"]).toBeUndefined();
    expect(result.wordFreq["hello"]).toBe(1);
    expect(result.wordFreq["world"]).toBe(1);
  });
});
