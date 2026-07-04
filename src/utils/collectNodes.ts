import { getCollection } from "astro:content";
import { aggregateNodes, type RawEntry, type NodeRecord } from "./nodes";

/** Single source of truth: aggregate blog + signal frontmatter into project nodes. */
export async function collectAllNodes(): Promise<NodeRecord[]> {
  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const signal = await getCollection("signal", ({ data }) => !data.draft);
  const entries: RawEntry[] = [
    ...blog.map((e) => ({ id: e.id, type: "blog" as const, data: e.data })),
    ...signal.map((e) => ({ id: e.id, type: "signal" as const, data: e.data })),
  ];
  return aggregateNodes(entries);
}
