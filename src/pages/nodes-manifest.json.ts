import type { APIRoute } from "astro";
import { collectAllNodes } from "../utils/collectNodes";

export const GET: APIRoute = async () => {
  const nodes = await collectAllNodes();
  const generatedAt = nodes.length > 0 ? nodes[0].lastTouched : null;
  const body = JSON.stringify({
    generatedAt,
    nodes,
  });
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
