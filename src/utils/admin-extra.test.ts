/**
 * Supplementary tests for the admin/index.astro frontmatter logic.
 *
 * This file targets edge cases not covered by admin.test.ts or
 * admin-index.test.ts: empty-string falsy fields, future pubDates,
 * case-sensitive tag handling, body-content edge cases, and mutation safety.
 *
 * Functions are re-implemented identically to the frontmatter source so they
 * can be driven by plain Vitest without the Astro build pipeline.
 */

import { describe, it, expect } from "vitest";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Re-implementations (mirrors index.astro frontmatter exactly) ─────────────

function filterPosts(allPosts: Post[]): {
  sorted: Post[];
  published: Post[];
  drafts: Post[];
} {
  const sorted = [...allPosts].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  const published = sorted.filter((p) => !p.data.draft);
  const drafts = sorted.filter((p) => p.data.draft);
  return { sorted, published, drafts };
}

function computeDaysSinceLast(published: Post[], now: number): number | null {
  if (published.length === 0) return null;
  return Math.floor((now - published[0].data.pubDate.valueOf()) / 86_400_000);
}

function buildTagCounts(published: Post[]): [string, number][] {
  const tagCounts: Record<string, number> = {};
  for (const post of published) {
    for (const tag of post.data.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
}

function buildNeedsAttention(published: Post[]): { post: Post; gaps: Gap[] }[] {
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const NOW = Date.UTC(2026, 4, 23); // 2026-05-23 (fixed epoch for deterministic tests)

function makePost(
  overrides: { id?: string; body?: string; data?: Partial<PostData> } = {}
): Post {
  return {
    id: overrides.id ?? "test-post",
    body: overrides.body ?? "",
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

// ─── filterPosts – additional edge cases ─────────────────────────────────────

describe("filterPosts – additional edge cases", () => {
  it("sorted array contains ALL posts, including drafts", () => {
    const pub = makePost({ id: "pub", data: { draft: false } });
    const draft = makePost({ id: "draft", data: { draft: true } });
    const { sorted } = filterPosts([pub, draft]);
    expect(sorted).toHaveLength(2);
    expect(sorted.map((p) => p.id)).toContain("pub");
    expect(sorted.map((p) => p.id)).toContain("draft");
  });

  it("does not mutate the original input array", () => {
    const posts = [
      makePost({ id: "b", data: { pubDate: new Date(NOW - 1 * DAY_MS) } }),
      makePost({ id: "a", data: { pubDate: new Date(NOW - 10 * DAY_MS) } }),
    ];
    const originalOrder = posts.map((p) => p.id);
    filterPosts(posts);
    expect(posts.map((p) => p.id)).toEqual(originalOrder);
  });

  it("drafts within sorted are in descending pubDate order", () => {
    const olderDraft = makePost({
      id: "older-draft",
      data: { draft: true, pubDate: new Date(NOW - 20 * DAY_MS) },
    });
    const newerDraft = makePost({
      id: "newer-draft",
      data: { draft: true, pubDate: new Date(NOW - 5 * DAY_MS) },
    });
    const { drafts } = filterPosts([olderDraft, newerDraft]);
    expect(drafts[0].id).toBe("newer-draft");
    expect(drafts[1].id).toBe("older-draft");
  });

  it("post with a future pubDate appears first in sorted order", () => {
    const future = makePost({
      id: "future",
      data: { pubDate: new Date(NOW + 10 * DAY_MS), draft: false },
    });
    const past = makePost({
      id: "past",
      data: { pubDate: new Date(NOW - 10 * DAY_MS), draft: false },
    });
    const { sorted, published } = filterPosts([past, future]);
    expect(sorted[0].id).toBe("future");
    expect(published[0].id).toBe("future");
  });

  it("a single post ends up in both sorted and published (if not draft)", () => {
    const post = makePost({ id: "solo", data: { draft: false } });
    const { sorted, published, drafts } = filterPosts([post]);
    expect(sorted).toHaveLength(1);
    expect(published).toHaveLength(1);
    expect(drafts).toHaveLength(0);
  });
});

// ─── computeDaysSinceLast – additional edge cases ────────────────────────────

describe("computeDaysSinceLast – additional edge cases", () => {
  it("returns a negative number when the most recent post has a future pubDate", () => {
    // A future post scheduled 3 days ahead
    const post = makePost({ data: { pubDate: new Date(NOW + 3 * DAY_MS) } });
    const result = computeDaysSinceLast([post], NOW);
    expect(result).toBe(-3);
  });

  it("returns exactly 0 when pubDate equals now to the millisecond", () => {
    const post = makePost({ data: { pubDate: new Date(NOW) } });
    expect(computeDaysSinceLast([post], NOW)).toBe(0);
  });

  it("is insensitive to ordering of the published array (uses index 0)", () => {
    // If the caller passes an unsorted list the function still uses index 0.
    // This test documents the contract: published MUST already be sorted desc.
    const olderFirst = makePost({ id: "old", data: { pubDate: new Date(NOW - 10 * DAY_MS) } });
    const newerSecond = makePost({ id: "new", data: { pubDate: new Date(NOW - 2 * DAY_MS) } });
    // Intentionally unsorted – should pick olderFirst at index 0
    expect(computeDaysSinceLast([olderFirst, newerSecond], NOW)).toBe(10);
  });

  it("handles a gap of exactly half a day (floors to 0)", () => {
    const post = makePost({ data: { pubDate: new Date(NOW - DAY_MS / 2) } });
    expect(computeDaysSinceLast([post], NOW)).toBe(0);
  });
});

// ─── buildTagCounts – additional edge cases ───────────────────────────────────

describe("buildTagCounts – additional edge cases", () => {
  it("treats tag casing as significant ('React' and 'react' are distinct tags)", () => {
    const posts = [
      makePost({ id: "a", data: { tags: ["React"] } }),
      makePost({ id: "b", data: { tags: ["react"] } }),
    ];
    const result = buildTagCounts(posts);
    const tagNames = result.map(([tag]) => tag);
    expect(tagNames).toContain("React");
    expect(tagNames).toContain("react");
    expect(result).toHaveLength(2);
  });

  it("a tag appearing in every post has count equal to post count", () => {
    const N = 5;
    const posts = Array.from({ length: N }, (_, i) =>
      makePost({ id: `p${i}`, data: { tags: ["universal"] } })
    );
    const result = buildTagCounts(posts);
    expect(result[0]).toEqual(["universal", N]);
  });

  it("result entries are [string, number] tuples", () => {
    const post = makePost({ data: { tags: ["foo", "bar"] } });
    const result = buildTagCounts([post]);
    for (const entry of result) {
      expect(typeof entry[0]).toBe("string");
      expect(typeof entry[1]).toBe("number");
    }
  });

  it("a tag with zero occurrences does not appear in output", () => {
    // Impossible by construction, but verify empty-tags post produces no entries
    const post = makePost({ data: { tags: [] } });
    expect(buildTagCounts([post])).toEqual([]);
  });

  it("handles a large flat tag list without error", () => {
    const tags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
    const post = makePost({ data: { tags } });
    const result = buildTagCounts([post]);
    expect(result).toHaveLength(100);
    expect(result.every(([, count]) => count === 1)).toBe(true);
  });
});

// ─── buildNeedsAttention – additional edge cases ──────────────────────────────

describe("buildNeedsAttention – additional edge cases", () => {
  it("treats an empty string heroImage as a missing hero (falsy check)", () => {
    const post = makePost({ data: { tags: ["x"], heroImage: "", category: "c" } });
    const result = buildNeedsAttention([post]);
    expect(result).toHaveLength(1);
    expect(result[0].gaps).toContain("hero");
  });

  it("treats an empty string category as missing category (falsy check)", () => {
    const post = makePost({ data: { tags: ["x"], heroImage: "/h.jpg", category: "" } });
    const result = buildNeedsAttention([post]);
    expect(result).toHaveLength(1);
    expect(result[0].gaps).toContain("category");
  });

  it("gaps array preserves the order: tags → hero → category", () => {
    const post = makePost({
      data: { tags: [], heroImage: "", category: "" },
    });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toEqual(["tags", "hero", "category"]);
  });

  it("a post with only tags missing has exactly one gap", () => {
    const post = makePost({ data: { tags: [], heroImage: "/h.jpg", category: "c" } });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toHaveLength(1);
    expect(result[0].gaps[0]).toBe("tags");
  });

  it("a post with only hero missing has exactly one gap", () => {
    const post = makePost({ data: { tags: ["x"], heroImage: "", category: "c" } });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toHaveLength(1);
    expect(result[0].gaps[0]).toBe("hero");
  });

  it("a post with only category missing has exactly one gap", () => {
    const post = makePost({ data: { tags: ["x"], heroImage: "/h.jpg", category: "" } });
    const result = buildNeedsAttention([post]);
    expect(result[0].gaps).toHaveLength(1);
    expect(result[0].gaps[0]).toBe("category");
  });

  it("a non-empty whitespace-only heroImage string is truthy and not flagged", () => {
    // "   " is truthy in JS — matches real runtime behaviour
    const post = makePost({ data: { tags: ["x"], heroImage: "   ", category: "c" } });
    const result = buildNeedsAttention([post]);
    // hero gap should NOT appear because "   " is truthy
    const hasHeroGap = result.some(({ gaps }) => gaps.includes("hero"));
    expect(hasHeroGap).toBe(false);
  });

  it("counts total gaps correctly across a large collection", () => {
    const allMissing = Array.from({ length: 10 }, (_, i) =>
      makePost({ id: `bare${i}`, data: { tags: [], heroImage: "", category: "" } })
    );
    const result = buildNeedsAttention(allMissing);
    expect(result).toHaveLength(10);
    for (const { gaps } of result) {
      expect(gaps).toHaveLength(3);
    }
  });
});

// ─── computeCorpusEntropy – additional edge cases ─────────────────────────────

describe("computeCorpusEntropy – additional edge cases", () => {
  it("body containing only numeric characters yields empty word frequency", () => {
    const post = makePost({ body: "1234 5678 90" });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(0);
    expect(r.uniqueWordCount).toBe(0);
    expect(r.entropyBits).toBe("—");
  });

  it("body containing only punctuation yields empty word frequency", () => {
    const post = makePost({ body: "!!! ??? ... ---" });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(0);
    expect(r.entropyBits).toBe("—");
  });

  it("body with only whitespace characters yields empty word frequency", () => {
    const post = makePost({ body: "   \t  \n  " });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(0);
    expect(r.entropyBits).toBe("—");
  });

  it("body with a mix of letters and numbers strips numbers but keeps letters", () => {
    const post = makePost({ body: "abc123def" });
    const r = computeCorpusEntropy([post]);
    // "abc123def" → replace non-alpha → "abc   def" → split → ["abc", "def"]
    expect(r.wordFreq["abc"]).toBe(1);
    expect(r.wordFreq["def"]).toBe(1);
    expect(r.totalWords).toBe(2);
  });

  it("entropy is bounded above by log2(uniqueWordCount)", () => {
    const post = makePost({ body: "apple banana cherry date elderberry" });
    const r = computeCorpusEntropy([post]);
    const maxPossibleEntropy = Math.log2(r.uniqueWordCount);
    expect(r.entropy).toBeLessThanOrEqual(maxPossibleEntropy + 1e-10);
  });

  it("entropy does not change when word order changes (permutation invariance)", () => {
    const postA = makePost({ id: "a", body: "cat dog bird" });
    const postB = makePost({ id: "b", body: "bird cat dog" });
    const rA = computeCorpusEntropy([postA]);
    const rB = computeCorpusEntropy([postB]);
    expect(rA.entropy).toBeCloseTo(rB.entropy, 10);
  });

  it("wordFreq keys are all lowercase even when input is mixed case", () => {
    const post = makePost({ body: "The Quick Brown Fox" });
    const r = computeCorpusEntropy([post]);
    for (const key of Object.keys(r.wordFreq)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it("totalWords is the sum of all token occurrences, not unique count", () => {
    // "the" appears 3 times, "cat" appears 2 times → totalWords = 5
    const post = makePost({ body: "the the the cat cat" });
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(5);
    expect(r.uniqueWordCount).toBe(2);
  });

  it("adding a post with empty body does not change entropy of existing corpus", () => {
    const contentPost = makePost({ id: "content", body: "alpha beta gamma" });
    const emptyPost = makePost({ id: "empty", body: "" });
    const withEmpty = computeCorpusEntropy([contentPost, emptyPost]);
    const withoutEmpty = computeCorpusEntropy([contentPost]);
    expect(withEmpty.entropy).toBeCloseTo(withoutEmpty.entropy, 10);
    expect(withEmpty.totalWords).toBe(withoutEmpty.totalWords);
  });

  it("entropyBits is always non-negative (entropy cannot be negative)", () => {
    const posts = [
      makePost({ id: "a", body: "foo bar baz foo" }),
      makePost({ id: "b", body: "bar bar qux" }),
    ];
    const r = computeCorpusEntropy(posts);
    expect(r.entropy).toBeGreaterThanOrEqual(0);
  });

  it("handles body set to null via nullish coalescing (defaults to empty)", () => {
    const post: Post = {
      id: "null-body",
      body: undefined,
      data: {
        title: "Null body",
        pubDate: new Date(NOW),
        draft: false,
      },
    };
    const r = computeCorpusEntropy([post]);
    expect(r.totalWords).toBe(0);
    expect(r.entropyBits).toBe("—");
  });

  it("regression: mixed post with content and one without does not throw", () => {
    const withBody = makePost({ id: "w", body: "hello world" });
    const withoutBody: Post = {
      id: "wo",
      data: { title: "No body", pubDate: new Date(NOW), draft: false },
    };
    expect(() => computeCorpusEntropy([withBody, withoutBody])).not.toThrow();
  });
});
