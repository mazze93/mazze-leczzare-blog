import { describe, it, expect } from "vitest";
import { aggregateNodes, titleize, type RawEntry } from "./nodes";

function entry(
  id: string,
  type: "blog" | "signal",
  data: Partial<RawEntry["data"]> & { title: string; pubDate: Date },
): RawEntry {
  return { id, type, data: { ...data } as RawEntry["data"] };
}

describe("titleize", () => {
  it("converts a slug to title case", () => {
    expect(titleize("merchants-of-war")).toBe("Merchants Of War");
  });
});

describe("aggregateNodes", () => {
  it("ignores entries with no project", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", pubDate: new Date("2026-01-01") }),
    ]);
    expect(nodes).toHaveLength(0);
  });

  it("groups pieces by project slug", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01") }),
      entry("b", "signal", { title: "B", project: "mow", pubDate: new Date("2026-02-01") }),
      entry("c", "blog", { title: "C", project: "sp", pubDate: new Date("2026-01-15") }),
    ]);
    expect(nodes).toHaveLength(2);
    const mow = nodes.find((n) => n.slug === "mow")!;
    expect(mow.count).toBe(2);
  });

  it("uses the max of updatedDate/pubDate across pieces as lastTouched", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01"), updatedDate: new Date("2026-03-10") }),
      entry("b", "blog", { title: "B", project: "mow", pubDate: new Date("2026-02-01") }),
    ]);
    expect(nodes[0].lastTouched).toBe(new Date("2026-03-10").toISOString());
  });

  it("prefers updatedDate over pubDate for a single piece", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01"), updatedDate: new Date("2026-04-01") }),
    ]);
    expect(nodes[0].lastTouched).toBe(new Date("2026-04-01").toISOString());
  });

  it("seals the node if any piece is committed", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "mow", pubDate: new Date("2026-01-01") }),
      entry("b", "blog", { title: "B", project: "mow", pubDate: new Date("2026-02-01"), committed: true }),
    ]);
    expect(nodes[0].committed).toBe(true);
  });

  it("lists pieces newest-first", () => {
    const nodes = aggregateNodes([
      entry("old", "blog", { title: "Old", project: "mow", pubDate: new Date("2026-01-01") }),
      entry("new", "blog", { title: "New", project: "mow", pubDate: new Date("2026-05-01") }),
    ]);
    expect(nodes[0].pieces.map((p) => p.id)).toEqual(["new", "old"]);
  });

  it("derives a titleized display name from the slug", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "merchants-of-war", pubDate: new Date("2026-01-01") }),
    ]);
    expect(nodes[0].title).toBe("Merchants Of War");
  });

  it("sorts nodes by lastTouched, newest-first", () => {
    const nodes = aggregateNodes([
      entry("a", "blog", { title: "A", project: "stale", pubDate: new Date("2026-01-01") }),
      entry("b", "blog", { title: "B", project: "fresh", pubDate: new Date("2026-05-01") }),
    ]);
    expect(nodes.map((n) => n.slug)).toEqual(["fresh", "stale"]);
  });
});
