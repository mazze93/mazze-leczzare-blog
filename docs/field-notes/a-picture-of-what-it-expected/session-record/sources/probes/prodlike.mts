// Serve dist/ through the real middleware, so the browser sees production headers.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { onRequest } from "/home/claude/mazze93/mazze-leczzare-blog/functions/_middleware.ts";
const DIST = "/home/claude/mazze93/mazze-leczzare-blog/dist";
const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json", ".md": "text/markdown" };
async function staticFile(path: string): Promise<Response> {
  let p = decodeURIComponent(path); if (p.endsWith("/")) p += "index.html";
  try { const body = await readFile(join(DIST, p)); return new Response(body, { headers: { "Content-Type": TYPES[extname(p)] ?? "application/octet-stream" } }); }
  catch { return new Response("not found", { status: 404, headers: { "Content-Type": "text/plain" } }); }
}
http.createServer(async (req, res) => {
  const url = `http://localhost:4400${req.url}`;
  const r = await onRequest({ request: new Request(url, { headers: req.headers as HeadersInit }), next: () => staticFile(new URL(url).pathname), env: {} as never });
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(4400, () => console.log("prod-like server on :4400"));
