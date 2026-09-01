interface KVNamespace {
  get(key: string): Promise<string | null>;
}

interface Env {
  JWT_SECRET: string;
  JWT_REVOCATION_LIST?: KVNamespace;
}

// Cloudflare Workers runtime globals (not in standard TS lib)
interface HTMLRewriterElement {
  tagName: string;
  getAttribute(name: string): string | null;
  onEndTag(handler: () => void): void;
  remove(): void;
}
interface HTMLRewriterText {
  text: string;
  lastInTextNode: boolean;
}
interface HTMLRewriterHandler {
  element?(el: HTMLRewriterElement): void;
  text?(chunk: HTMLRewriterText): void;
}
declare class HTMLRewriter {
  on(selector: string, handler: HTMLRewriterHandler): HTMLRewriter;
  transform(response: Response): Response;
}

async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, payload, sig] = parts;
    const data = `${header}.${payload}`;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const b64decode = (s: string) =>
      atob(
        (s.replace(/-/g, "+").replace(/_/g, "/") + "====").slice(
          0,
          s.length + ((4 - (s.length % 4)) % 4)
        )
      );

    const sigBytes = Uint8Array.from(b64decode(sig), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );

    if (!valid) return null;

    const decoded = JSON.parse(b64decode(payload)) as Record<string, unknown>;
    if (decoded.exp && (decoded.exp as number) < Math.floor(Date.now() / 1000))
      return null;

    return decoded;
  } catch {
    return null;
  }
}

// ── Markdown for Agents ──────────────────────────────────────────────────────

const SKIP_TAGS = new Set([
  "script", "style", "noscript", "iframe", "svg", "canvas", "template",
]);

// These structural tags suppress output without contributing headings/text.
const STRUCTURAL_SKIP_TAGS = new Set(["nav", "header", "footer", "aside"]);

async function htmlToMarkdown(html: string): Promise<string> {
  const parts: string[] = [];
  let skipDepth = 0;
  const linkHrefs: string[] = [];

  const handler: HTMLRewriterHandler = {
    element(el) {
      const tag = el.tagName.toLowerCase();

      if (SKIP_TAGS.has(tag) || STRUCTURAL_SKIP_TAGS.has(tag)) {
        skipDepth++;
        el.onEndTag(() => {
          skipDepth = Math.max(0, skipDepth - 1);
        });
        return;
      }

      if (skipDepth > 0) return;

      switch (tag) {
        case "title":
          parts.push("\n# ");
          el.onEndTag(() => parts.push("\n\n"));
          break;
        case "h1":
          parts.push("\n# ");
          el.onEndTag(() => parts.push("\n"));
          break;
        case "h2":
          parts.push("\n## ");
          el.onEndTag(() => parts.push("\n"));
          break;
        case "h3":
          parts.push("\n### ");
          el.onEndTag(() => parts.push("\n"));
          break;
        case "h4":
          parts.push("\n#### ");
          el.onEndTag(() => parts.push("\n"));
          break;
        case "h5":
          parts.push("\n##### ");
          el.onEndTag(() => parts.push("\n"));
          break;
        case "h6":
          parts.push("\n###### ");
          el.onEndTag(() => parts.push("\n"));
          break;
        case "p":
          parts.push("\n\n");
          break;
        case "br":
          parts.push("\n");
          break;
        case "hr":
          parts.push("\n\n---\n\n");
          break;
        case "li":
          parts.push("\n- ");
          break;
        case "blockquote":
          parts.push("\n> ");
          el.onEndTag(() => parts.push("\n"));
          break;
        case "strong":
        case "b":
          parts.push("**");
          el.onEndTag(() => parts.push("**"));
          break;
        case "em":
        case "i":
          parts.push("_");
          el.onEndTag(() => parts.push("_"));
          break;
        case "code":
          parts.push("`");
          el.onEndTag(() => parts.push("`"));
          break;
        case "pre":
          parts.push("\n```\n");
          el.onEndTag(() => parts.push("\n```\n"));
          break;
        case "a": {
          const href = el.getAttribute("href") ?? "";
          const isSafe = href.startsWith("https://") || href.startsWith("http://") || href.startsWith("/");
          if (href && isSafe) {
            linkHrefs.push(href);
            el.onEndTag(() => {
              const h = linkHrefs.pop();
              if (h) parts.push(` (${h})`);
            });
          }
          break;
        }
      }
    },
    text(chunk) {
      if (skipDepth > 0) return;
      parts.push(chunk.text);
    },
  };

  const rewriter = new HTMLRewriter().on("*", handler);
  const transformed = rewriter.transform(
    new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  );
  await transformed.text();

  return parts
    .join("")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Security headers ─────────────────────────────────────────────────────────

const BASE_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "form-action 'self'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");

const DEFAULT_CSP = `${BASE_CSP}; style-src 'self' 'unsafe-inline'; font-src 'self'; frame-ancestors 'none'`;
const ARTIFACT_CSP = `${BASE_CSP}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'self'`;

function withSecurityHeaders(response: Response, isArtifact: boolean): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", isArtifact ? ARTIFACT_CSP : DEFAULT_CSP);
  headers.set("X-Frame-Options", isArtifact ? "SAMEORIGIN" : "DENY");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ── Main middleware ──────────────────────────────────────────────────────────

export async function onRequest(context: {
  request: Request;
  next(): Promise<Response>;
  env: Env;
}): Promise<Response> {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const isArtifact = url.pathname.startsWith("/artifacts/");

  // Protect /admin routes (redirect — CSP not needed on redirects)
  if (url.pathname.startsWith("/admin")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    const redirectToLogin = () => Response.redirect(loginUrl.toString(), 302);

    // Fail closed: misconfigured or weak secret means no valid session is possible
    if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
      console.error(JSON.stringify({ type: "middleware_weak_secret", receivedAt: new Date().toISOString() }));
      return redirectToLogin();
    }

    const cookie = request.headers.get("Cookie") ?? "";
    const tokenMatch = cookie.match(/__Host-auth_token=([^;]+)/);
    const token = tokenMatch?.[1];

    const jwtPayload = token ? await verifyJWT(token, env.JWT_SECRET) : null;
    if (!jwtPayload) {
      return redirectToLogin();
    }

    if (env.JWT_REVOCATION_LIST && typeof jwtPayload.jti === "string") {
      const revoked = await env.JWT_REVOCATION_LIST.get(`revoked:${jwtPayload.jti}`);
      if (revoked !== null) {
        return redirectToLogin();
      }
    }

    return withSecurityHeaders(await next(), false);
  }

  // Markdown for Agents: serve text/markdown when the client prefers it
  const accept = request.headers.get("Accept") ?? "";
  if (accept.includes("text/markdown")) {
    const response = await next();
    const contentType = response.headers.get("Content-Type") ?? "";

    if (contentType.includes("text/html")) {
      const html = await response.text();
      const markdown = await htmlToMarkdown(html);
      const tokenCount = Math.ceil(markdown.length / 4);

      const headers = new Headers(response.headers);
      headers.set("Content-Type", "text/markdown; charset=utf-8");
      headers.set("Vary", "Accept");
      headers.set("x-markdown-tokens", String(tokenCount));
      headers.set("Content-Security-Policy", isArtifact ? ARTIFACT_CSP : DEFAULT_CSP);
      headers.set("X-Frame-Options", isArtifact ? "SAMEORIGIN" : "DENY");

      return new Response(markdown, { status: response.status, headers });
    }

    return withSecurityHeaders(
      new Response(response.body, { status: response.status, headers: new Headers(response.headers) }),
      isArtifact
    );
  }

  return withSecurityHeaders(await next(), isArtifact);
}
