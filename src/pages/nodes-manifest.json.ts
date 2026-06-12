import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { aggregateNodes, type RawEntry } from "../utils/nodes";

export const GET: APIRoute = async () => {
  const blog = await getCollection("blog", ({ data }) => !data.draft);
  const signal = await getCollection("signal", ({ data }) => !data.draft);

  const entries: RawEntry[] = [
    ...blog.map((e) => ({ id: e.id, type: "blog" as const, data: e.data })),
    ...signal.map((e) => ({ id: e.id, type: "signal" as const, data: e.data })),
  ];

  const nodes = aggregateNodes(entries);
  const generatedAt = nodes.length > 0 ? nodes[0].lastTouched : null;
  const body = JSON.stringify({
    generatedAt,
    nodes,
  });

  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
