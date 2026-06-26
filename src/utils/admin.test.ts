/**
 * Tests for the pure-logic functions embedded in src/pages/admin/index.astro.
 *
 * Because Astro frontmatter cannot be imported directly, each function is
 * replicated verbatim here (same algorithm, same types) so we can drive it
 * with controlled inputs.  Any change to the logic in index.astro must be
 * mirrored here and should be caught by the tests failing first.
 */
import { describe, it, expect } from "vitest";

// ─── Type helpers ────────────────────────────────────────────────────────────

type Gap = "tags" | "hero" | "category";

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

// ─── Replicated logic (mirrors index.astro frontmatter exactly) ──────────────

function filterPosts(allPosts: Post[]): { published: Post[]; drafts: Post[] } {
  const sorted = [...allPosts].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  const published = sorted.filter((p) => !p.data.draft);
  const drafts = sorted.filter((p) => p.data.draft);
  return { published, drafts };
}

function computeDaysSinceLast(published: Post[], now: number): number | null {
  if (published.length === 0) return null;
  return Math.floor(
    (now - published[0].data.pubDate.valueOf()) / 86_400_000
  );
}

function buildTagCounts(
  published: Post[]
): [string, number][] {
  const tagCounts: Record<string, number> = {};
  for (const post of published) {
    for (const tag of post.data.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
}

function buildNeedsAttention(
  published: Post[]
): { post: Post; gaps: Gap[] }[] {
  const GAP_LABEL: Record<Gap, string> = {
    tags: "no tags",
    hero: "no hero image",
    category: "no category",
  };
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
    const body =
      ("body" in post ? (post.body as string) : "") ?? "";
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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const NOW = Date.UTC(2026, 4, 23); // 2026-05-23

function makePost(overrides: { id?: string; body?: string; data?: Partial<PostData> } = {}): Post {
  return {
    id: "test-post",
    body: "",
    ...overrides,
    data: {
      title: "Test Post",
      pubDate: new Date(NOW - 7 * DAY_MS),
      draft: false,
      tags: ["tech"],
      heroImage: "/images/hero.jpg",
      category: "general",
      ...overrides.data,
    },
  };
}

// ─── filterPosts ─────────────────────────────────────────────────────────────

describe("filterPosts", () => {
  it("separates published posts from drafts", () => {
    const pub = makePost({ id: "pub", data: { draft: false } });
    const draft = makePost({ id: "draft", data: { draft: true } });
    const { published, drafts } = filterPosts([pub, draft]);
    expect(published).toHaveLength(1);
    expect(published[0].id).toBe("pub");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].id).toBe("draft");
  });

  it("treats posts with no draft field as published", () => {
    const post = makePost({ id: "nodraft", data: {} });
    delete (post.data as Partial<PostData>).draft;
    const { published, drafts } = filterPosts([post]);
    expect(published).toHaveLength(1);
    expect(drafts).toHaveLength(0);
  });

  it("returns empty published and drafts for an empty collection", () => {
    const { published, drafts } = filterPosts([]);
    expect(published).toHaveLength(0);
    expect(drafts).toHaveLength(0);
  });

  it("returns all posts as published when none are drafts", () => {
    const posts = [
      makePost({ id: "a", data: { draft: false } }),
      makePost({ id: "b", data: { draft: false } }),
    ];
    const { published, drafts } = filterPosts(posts);
    expect(published).toHaveLength(2);
    expect(drafts).toHaveLength(0);
  });

  it("returns all posts as drafts when every post is a draft", () => {
    const posts = [
      makePost({ id: "a", data: { draft: true } }),
      makePost({ id: "b", data: { draft: true } }),
    ];
    const { published, drafts } = filterPosts(posts);
    expect(published).toHaveLength(0);
    expect(drafts).toHaveLength(2);
  });

  it("sorts by pubDate descending (newest first)", () => {
    const older = makePost({
      id: "older",
      data: { pubDate: new Date(NOW - 10 * DAY_MS), draft: false },
    });
    const newer = makePost({
      id: "newer",
      data: { pubDate: new Date(NOW - 1 * DAY_MS), draft: false },
    });
    const { published } = filterPosts([older, newer]);
    expect(published[0].id).toBe("newer");
    expect(published[1].id).toBe("older");
  });

  it("sort is stable relative to equal dates (both appear)", () => {
    const a = makePost({ id: "a", data: { pubDate: new Date(NOW), draft: false } });
    const b = makePost({ id: "b", data: { pubDate: new Date(NOW), draft: false } });
    const { published } = filterPosts([a, b]);
    expect(published).toHaveLength(2);
  });
});

// ─── computeDaysSinceLast ────────────────────────────────────────────────────

describe("computeDaysSinceLast", () => {
  it("returns null when there are no published posts", () => {
    expect(computeDaysSinceLast([], NOW)).toBeNull();
  });

  it("returns 0 when the last post was published today", () => {
    const post = makePost({ data: { pubDate: new Date(NOW) } });
    expect(computeDaysSinceLast([post], NOW)).toBe(0);
  });

  it("returns 1 when the last post was published exactly one day ago", () => {
    const post = makePost({ data: { pubDate: new Date(NOW - DAY_MS) } });
    expect(computeDaysSinceLast([post], NOW)).toBe(1);
  });

  it("floors a partial day to the integer below", () => {
    // 1.9 days ago → should floor to 1
    const post = makePost({ data: { pubDate: new Date(NOW - 1.9 * DAY_MS) } });
    expect(computeDaysSinceLast([post], NOW)).toBe(1);
  });

  it("counts large gaps correctly (365 days)", () => {
    const post = makePost({ data: { pubDate: new Date(NOW - 365 * DAY_MS) } });
    expect(computeDaysSinceLast([post], NOW)).toBe(365);
  });

  it("uses the first (most recent) post from the pre-sorted published list", () => {
    // published is expected to be sorted newest-first already
    const newer = makePost({ id: "newer", data: { pubDate: new Date(NOW - 3 * DAY_MS) } });
    const older = makePost({ id: "older", data: { pubDate: new Date(NOW - 10 * DAY_MS) } });
    expect(computeDaysSinceLast([newer, older], NOW)).toBe(3);
  });
});

// ─── buildTagCounts ──────────────────────────────────────────────────────────

describe("buildTagCounts", () => {
  it("returns an empty array when no published posts", () => {
    expect(buildTagCounts([])).toEqual([]);
  });

  it("returns an empty array when all posts have no tags", () => {
    const post = makePost({ data: { tags: [] } });
    expect(buildTagCounts([post])).toEqual([]);
  });

  it("counts a single tag across one post", () => {
    const post = makePost({ data: { tags: ["astro"] } });
    const result = buildTagCounts([post]);
    expect(result).toEqual([["astro", 1]]);
  });

  it("accumulates the same tag across multiple posts", () => {
    const posts = [
      makePost({ id: "a", data: { tags: ["astro"] } }),
      makePost({ id: "b", data: { tags: ["astro"] } }),
    ];
    const result = buildTagCounts(posts);
    expect(result).toEqual([["astro", 2]]);
  });

  it("sorts tags by frequency descending", () => {
    const posts = [
      makePost({ id: "a", data: { tags: ["rare"] } }),
      makePost({ id: "b", data: { tags: ["common", "rare"] } }),
      makePost({ id: "c", data: { tags: ["common"] } }),
    ];
    const result = buildTagCounts(posts);
    // Both tags have count 2; tie order is not guaranteed
    expect(result).toHaveLength(2);
    expect(result.map(([tag]) => tag)).toContain("common");
    expect(result.map(([tag]) => tag)).toContain("rare");
    expect(result.every(([, count]) => count === 2)).toBe(true);
  });

  it("handles posts with multiple tags each", () => {
    const post = makePost({ data: { tags: ["a", "b", "c"] } });
    const result = buildTagCounts([post]);
    expect(result).toHaveLength(3);
    expect(result.every(([, count]) => count === 1)).toBe(true);
  });

  it("treats undefined tags as an empty list (nullish coalescing)", () => {
    const post = makePost({ data: {} });
    delete (post.data as Partial<PostData>).tags;
    const result = buildTagCounts([post]);
    expect(result).toEqual([]);
  });

  it("puts the most-used tag first", () => {
    const posts = [
      makePost({ id: "a", data: { tags: ["x", "y"] } }),
      makePost({ id: "b", data: { tags: ["x"] } }),
      makePost({ id: "c", data: { tags: ["x"] } }),
    ];
    const result = buildTagCounts(posts);
    expect(result[0][0]).toBe("x");
    expect(result[0][1]).toBe(3);
  });
});

// ─── buildNeedsAttention ─────────────────────────────────────────────────────

describe("buildNeedsAttention", () => {
  it("returns empty array when all posts are fully annotated", () => {
    const post = makePost({
      data: {
        tags: ["tech"],
        heroImage: "/img.jpg",
        category: "blog",
      },
    });
    expect(buildNeedsAttention([post])).toEqual([]);
  });

  it("flags a post missing tags", () => {
    const post = makePost({ data: { tags: [] } });
    const result = buildNeedsAttention([post]);
    expect(result).toHaveLength(1);
    expect(result[0].gaps).toContain("tags");
  });

  it("flags a post with undefined tags as missing tags", () => {
    const post = makePost({ data: {} });
    delete (post.data as Partial<PostData>).tags;
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toContain("tags");
  });

  it("flags a post missing heroImage", () => {
    const post = makePost({ data: { heroImage: undefined } });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toContain("hero");
  });

  it("flags a post missing category", () => {
    const post = makePost({ data: { category: undefined } });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toContain("category");
  });

  it("reports all three gaps for a bare-minimum post", () => {
    const post = makePost({
      data: {
        title: "Bare",
        pubDate: new Date(NOW),
        draft: false,
        // no tags, heroImage, or category
      },
    });
    delete (post.data as Partial<PostData>).tags;
    delete (post.data as Partial<PostData>).heroImage;
    delete (post.data as Partial<PostData>).category;
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toEqual(["tags", "hero", "category"]);
  });

  it("only flags posts with at least one gap", () => {
    const full = makePost({ id: "full", data: { tags: ["x"], heroImage: "/h.jpg", category: "c" } });
    const partial = makePost({ id: "partial", data: { tags: [], heroImage: "/h.jpg", category: "c" } });
    const result = buildNeedsAttention([full, partial]);
    expect(result).toHaveLength(1);
    expect(result[0].post.id).toBe("partial");
  });

  it("returns the original post reference in each result", () => {
    const post = makePost({ id: "ref-check", data: { tags: [] } });
    const result = buildNeedsAttention([post]);
    expect(result[0].post).toBe(post);
  });

  it("handles an empty published list", () => {
    expect(buildNeedsAttention([])).toEqual([]);
  });
});

// ─── computeCorpusEntropy ────────────────────────────────────────────────────

describe("computeCorpusEntropy", () => {
  it("returns zero entropy and dash string for no published posts", () => {
    const r = computeCorpusEntropy([]);
    expect(r.totalWords).toBe(0);
    expect(r.entropy).toBe(0);
    expect(r.entropyBits).toBe("—");
    expect(r.uniqueWordCount).toBe(0);
  });

  it("returns zero entropy for a single unique word (max certainty)", () => {
    const post = makePost({ body: "hello", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(1);
    expect(r.entropy).toBeCloseTo(0, 10);
    expect(r.entropyBits).toBe("0.00");
    expect(r.uniqueWordCount).toBe(1);
  });

  it("returns 1 bit of entropy for a perfectly uniform two-word corpus", () => {
    // "hello world" → p(hello)=0.5, p(world)=0.5 → H = 1 bit
    const post = makePost({ body: "hello world", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.entropy).toBeCloseTo(1.0, 10);
    expect(r.entropyBits).toBe("1.00");
    expect(r.uniqueWordCount).toBe(2);
    expect(r.totalWords).toBe(2);
  });

  it("returns log2(n) bits for n equally-frequent words", () => {
    // 4 unique words each appearing once → H = log2(4) = 2
    const post = makePost({ body: "a b c d", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.entropy).toBeCloseTo(2.0, 10);
  });

  it("lowercases all words before counting", () => {
    const post = makePost({ body: "Hello HELLO hello", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.uniqueWordCount).toBe(1);
    expect(r.totalWords).toBe(3);
    expect(r.wordFreq["hello"]).toBe(3);
  });

  it("strips non-alpha characters (numbers, punctuation)", () => {
    const post = makePost({ body: "word123 test! foo, bar.", data: {} });
    const r = computeCorpusEntropy([post]);
    // Numbers become spaces, punctuation becomes spaces → "word", "test", "foo", "bar"
    expect(r.wordFreq["word"]).toBe(1);
    expect(r.wordFreq["test"]).toBe(1);
    expect(r.wordFreq["foo"]).toBe(1);
    expect(r.wordFreq["bar"]).toBe(1);
    expect(Object.keys(r.wordFreq).every((w) => /^[a-z]+$/.test(w))).toBe(true);
  });

  it("filters empty tokens from multi-space splits", () => {
    const post = makePost({ body: "a   b   c", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(3);
  });

  it("aggregates words across multiple posts", () => {
    const postA = makePost({ id: "a", body: "alpha beta", data: {} });
    const postB = makePost({ id: "b", body: "alpha gamma", data: {} });
    const r = computeCorpusEntropy([postA, postB]);
    expect(r.totalWords).toBe(4);
    expect(r.wordFreq["alpha"]).toBe(2);
    expect(r.wordFreq["beta"]).toBe(1);
    expect(r.wordFreq["gamma"]).toBe(1);
  });

  it("handles a post with no body gracefully (empty body)", () => {
    const post = makePost({ body: "", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(0);
    expect(r.entropyBits).toBe("—");
  });

  it("handles a post where body property is absent", () => {
    const post: Post = {
      id: "nobody",
      data: { title: "No body", pubDate: new Date(NOW), draft: false },
    };
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(0);
    expect(r.entropyBits).toBe("—");
  });

  it("entropyBits is formatted to 2 decimal places", () => {
    // Use 3 words: 'a','a','b' → p(a)=2/3, p(b)=1/3
    const post = makePost({ body: "a a b", data: {} });
    const r = computeCorpusEntropy([post]);
    const expected = (-(2 / 3) * Math.log2(2 / 3) - (1 / 3) * Math.log2(1 / 3)).toFixed(2);
    expect(r.entropyBits).toBe(expected);
  });

  it("returns strictly positive entropy for any diverse corpus", () => {
    const post = makePost({ body: "the quick brown fox jumps over the lazy dog", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.entropy).toBeGreaterThan(0);
  });

  it("uniqueWordCount equals the number of distinct lowercase tokens", () => {
    const post = makePost({ body: "Foo foo BAR bar baz", data: {} });
    const r = computeCorpusEntropy([post]);
    // foo, bar, baz
    expect(r.uniqueWordCount).toBe(3);
  });

  it("a repeated-word corpus has lower entropy than a uniform corpus of the same size", () => {
    const uniform = makePost({ id: "u", body: "a b c d e f g h", data: {} });
    const skewed = makePost({ id: "s", body: "a a a a a a a b", data: {} });
    const rUniform = computeCorpusEntropy([uniform]);
    const rSkewed = computeCorpusEntropy([skewed]);
    expect(rUniform.entropy).toBeGreaterThan(rSkewed.entropy);
  });

  it("returns em-dash and zero totals when body contains only non-letter characters", () => {
    const post = makePost({ body: "!!! 123 @@@", data: {} });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(0);
    expect(r.entropyBits).toBe("—");
    expect(r.uniqueWordCount).toBe(0);
  });
});

// ─── additional edge-case tests ──────────────────────────────────────────────

describe("filterPosts – mutation safety", () => {
  it("does not mutate the original input array order", () => {
    const posts = [
      makePost({ id: "early", data: { pubDate: new Date(NOW - 100 * DAY_MS), draft: false } }),
      makePost({ id: "late", data: { pubDate: new Date(NOW - 1 * DAY_MS), draft: false } }),
    ];
    const originalIds = posts.map((p) => p.id);
    filterPosts(posts);
    expect(posts.map((p) => p.id)).toEqual(originalIds);
  });
});

describe("computeDaysSinceLast – boundary and negative cases", () => {
  it("returns 0 when last post was published exactly half a day ago", () => {
    const post = makePost({ data: { pubDate: new Date(NOW - 0.5 * DAY_MS) } });
    expect(computeDaysSinceLast([post], NOW)).toBe(0);
  });

  it("returns a negative number for a post with a future pubDate", () => {
    const post = makePost({ data: { pubDate: new Date(NOW + DAY_MS) } });
    // Math.floor(-1.0) = -1
    expect(computeDaysSinceLast([post], NOW)).toBe(-1);
  });
});

describe("buildNeedsAttention – falsy field detection", () => {
  it("flags empty string heroImage as a missing hero", () => {
    const post = makePost({ data: { heroImage: "" } });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toContain("hero");
  });

  it("flags empty string category as a missing category", () => {
    const post = makePost({ data: { category: "" } });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toContain("category");
  });

  it("gaps are always in the canonical order tags → hero → category", () => {
    const post = makePost({
      data: { title: "Order test", pubDate: new Date(NOW), draft: false },
    });
    delete (post.data as Partial<PostData>).tags;
    delete (post.data as Partial<PostData>).heroImage;
    delete (post.data as Partial<PostData>).category;
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toEqual(["tags", "hero", "category"]);
  });
});

describe("buildTagCounts – round-trip with frequency ranking", () => {
  it("the first element is always the tag with the highest count", () => {
    const posts = [
      makePost({ id: "a", data: { tags: ["top", "mid", "low"] } }),
      makePost({ id: "b", data: { tags: ["top", "mid"] } }),
      makePost({ id: "c", data: { tags: ["top"] } }),
    ];
    const result = buildTagCounts(posts);
    expect(result[0][0]).toBe("top");
    expect(result[0][1]).toBe(3);
  });

  it("tags with equal frequency appear after those with higher frequency", () => {
    const posts = [
      makePost({ id: "a", data: { tags: ["x", "y", "z"] } }),
      makePost({ id: "b", data: { tags: ["x"] } }),
    ];
    const result = buildTagCounts(posts);
    // x has count 2; y and z have count 1
    expect(result[0][0]).toBe("x");
    expect(result[0][1]).toBe(2);
    const rest = result.slice(1);
    expect(rest.every(([, c]) => c === 1)).toBe(true);
  });
});
