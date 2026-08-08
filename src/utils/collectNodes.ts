import { getCollection } from "astro:content";
import { aggregateNodes, type RawEntry, type NodeRecord } from "./nodes";

/** Single source of truth: aggregate blog + signal + tesserae frontmatter
 *  into project nodes. Every published piece is a node constituent —
 *  essays, transmissions, and tiles alike. */
export async function collectAllNodes(): Promise<NodeRecord[]> {
  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const signal = await getCollection("signal", ({ data }) => !data.draft);
  const tesserae = await getCollection("tesserae", ({ data }) => !data.draft);
  const entries: RawEntry[] = [
    ...blog.map((e) => ({ id: e.id, type: "blog" as const, data: e.data })),
    ...signal.map((e) => ({ id: e.id, type: "signal" as const, data: e.data })),
    ...tesserae.map((e) => ({ id: e.id, type: "tesserae" as const, data: e.data })),
  ];
  return aggregateNodes(entries);
}
