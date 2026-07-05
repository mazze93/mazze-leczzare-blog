// ── Content ingest endpoint ──────────────────────────────────────────────────
//
// Accepts modular Markdown drafts (tesserae, signal transmissions, blog
// essays/artifacts) from authenticated machine callers (Obsidian export
// script, GitHub Actions, etc.) and publishes them by committing a new file
// straight to `main` via the GitHub Contents API — which triggers this
// repo's existing Cloudflare Pages build. There is no local filesystem to
// write to inside a Pages Function, so "ingest" necessarily means "commit
// to git", not "write to disk".
//
// Design notes (read before changing collection shapes):
// - Files are always written with a `.md` extension, never `.mdx`, even for
//   the `blog` collection (which otherwise accepts .mdx elsewhere in this
//   repo). MDX evaluates embedded JSX expressions at build time; accepting
//   arbitrary MDX from a network caller would mean executing caller-
//   supplied expressions during the site build. Plain Markdown has no such
//   execution surface.
// - `heroImage` is intentionally NOT ingestible: in src/content.config.ts it
//   resolves through Astro's `image()` helper against a real asset file on
//   disk, which cannot exist yet for freshly-ingested content. Add hero
//   images to the file by hand after ingestion.
// - The schemas and field lists below intentionally duplicate a subset of
//   src/content.config.ts. That file's `defineCollection`/`z` come through
//   the `astro:content` virtual module, which only resolves inside Astro's
//   own build graph — it is not importable from a Pages Function, which
//   bundles independently via wrangler/esbuild. If the content schema
//   changes, update both places.
// - No code-level rate limiting here, matching /api/login and
//   /api/share-event in this repo: route-level limits are configured as
//   Cloudflare dashboard WAF rules, not wrangler.toml bindings. Because this
//   route writes to the repo (higher blast radius than login or analytics),
//   set a *stricter* dashboard rule for `/api/ingest` than the other routes.

import { z } from "zod";

interface Env {
  INGEST_SECRET?: string;
  GITHUB_INGEST_TOKEN?: string;
}

const REPO_OWNER = "mazze93";
const REPO_NAME = "mazze-leczzare-blog";
const REPO_BRANCH = "main";
const GITHUB_API = "https://api.github.com";
const MAX_CONTENT_LENGTH = 200_000;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ── Per-collection frontmatter schemas ───────────────────────────────────────
// `.strict()` so unrecognized fields fail loudly (400) instead of being
// silently dropped or silently persisted.

const blogFrontmatterSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    subtitle: z.string().max(200).optional(),
    category: z.string().max(60).optional(),
    author: z.string().max(80).optional(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    readingTime: z.string().max(20).optional(),
    heroImageOG: z.string().url().max(500).optional(),
    heroImageAlt: z.string().max(200).optional(),
    featured: z.boolean().optional(),
    slug: z.string().max(100).regex(SLUG_PATTERN).optional(),
    draft: z.boolean().optional(),
    contentType: z.enum(["artifact", "dispatch", "field-note"]).optional(),
    repoUrl: z.string().url().max(300).optional(),
    artifactNote: z.string().max(2000).optional(),
    sessionTranscript: z.string().max(500).optional(),
    project: z.string().max(80).optional(),
    committed: z.boolean().optional(),
  })
  .strict();

const signalFrontmatterSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    transmissionId: z.string().max(80).optional(),
    cycle: z.string().max(40).optional(),
    classification: z.string().max(120).optional(),
    status: z.string().max(40).optional(),
    origin: z.string().max(200).optional(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    slug: z.string().max(100).regex(SLUG_PATTERN).optional(),
    project: z.string().max(80).optional(),
    committed: z.boolean().optional(),
  })
  .strict();

const tesseraeFrontmatterSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().max(40)).max(20).optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    slug: z.string().max(100).regex(SLUG_PATTERN).optional(),
    project: z.string().max(80).optional(),
    committed: z.boolean().optional(),
  })
  .strict();

const COLLECTION_SCHEMAS = {
  blog: blogFrontmatterSchema,
  signal: signalFrontmatterSchema,
  tesserae: tesseraeFrontmatterSchema,
} as const;

type CollectionName = keyof typeof COLLECTION_SCHEMAS;

// ── Frontmatter field order + type, per collection (drives serialization) ──

type FieldType = "string" | "date" | "boolean" | "stringArray";
type FieldSpec = { key: string; type: FieldType };

const BLOG_FIELDS: FieldSpec[] = [
  { key: "title", type: "string" },
  { key: "description", type: "string" },
  { key: "pubDate", type: "date" },
  { key: "updatedDate", type: "date" },
  { key: "subtitle", type: "string" },
  { key: "category", type: "string" },
  { key: "author", type: "string" },
  { key: "tags", type: "stringArray" },
  { key: "readingTime", type: "string" },
  { key: "heroImageOG", type: "string" },
  { key: "heroImageAlt", type: "string" },
  { key: "featured", type: "boolean" },
  { key: "slug", type: "string" },
  { key: "draft", type: "boolean" },
  { key: "contentType", type: "string" },
  { key: "repoUrl", type: "string" },
  { key: "artifactNote", type: "string" },
  { key: "sessionTranscript", type: "string" },
  { key: "project", type: "string" },
  { key: "committed", type: "boolean" },
];

const SIGNAL_FIELDS: FieldSpec[] = [
  { key: "title", type: "string" },
  { key: "description", type: "string" },
  { key: "pubDate", type: "date" },
  { key: "updatedDate", type: "date" },
  { key: "transmissionId", type: "string" },
  { key: "cycle", type: "string" },
  { key: "classification", type: "string" },
  { key: "status", type: "string" },
  { key: "origin", type: "string" },
  { key: "tags", type: "stringArray" },
  { key: "featured", type: "boolean" },
  { key: "draft", type: "boolean" },
  { key: "slug", type: "string" },
  { key: "project", type: "string" },
  { key: "committed", type: "boolean" },
];

const TESSERAE_FIELDS: FieldSpec[] = [
  { key: "title", type: "string" },
  { key: "description", type: "string" },
  { key: "pubDate", type: "date" },
  { key: "updatedDate", type: "date" },
  { key: "tags", type: "stringArray" },
  { key: "featured", type: "boolean" },
  { key: "draft", type: "boolean" },
  { key: "slug", type: "string" },
  { key: "project", type: "string" },
  { key: "committed", type: "boolean" },
];

const COLLECTION_FIELDS: Record<CollectionName, FieldSpec[]> = {
  blog: BLOG_FIELDS,
  signal: SIGNAL_FIELDS,
  tesserae: TESSERAE_FIELDS,
};

// ── Request envelope ─────────────────────────────────────────────────────────

const requestSchema = z.object({
  collection: z.enum(["blog", "signal", "tesserae"]),
  frontmatter: z.record(z.string(), z.unknown()),
  content: z.string().min(1).max(MAX_CONTENT_LENGTH),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Constant-time comparison, same construction as functions/api/login.ts:
// signs `a` with a fresh random HMAC key and verifies against `b`.
// crypto.subtle.verify is constant-time; the random key prevents
// pre-computation, and this handles different-length inputs safely.
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(a));
  return crypto.subtle.verify("HMAC", key, sig, enc.encode(b));
}

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

// Cloudflare Workers' `btoa` only handles Latin1; ingested Markdown is UTF-8,
// so encode to bytes first.
function toBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

// `JSON.stringify` on a string produces valid YAML double-quoted scalar
// syntax (YAML's double-quoted scalars are a superset of JSON string
// escaping), which safely handles quotes, backslashes, and newlines without
// a YAML library and without risk of breaking out of the frontmatter block.
function serializeYamlScalar(value: unknown, type: FieldType): string {
  switch (type) {
    case "string":
      return JSON.stringify(String(value));
    case "boolean":
      return String(Boolean(value));
    case "date": {
      const date = value instanceof Date ? value : new Date(String(value));
      return date.toISOString().slice(0, 10);
    }
    case "stringArray": {
      const items = Array.isArray(value) ? value : [];
      return `[${items.map((item) => JSON.stringify(String(item))).join(", ")}]`;
    }
  }
}

function buildFrontmatter(
  fields: FieldSpec[],
  data: Record<string, unknown>,
): string {
  const lines: string[] = ["---"];
  for (const { key, type } of fields) {
    const value = data[key];
    if (value === undefined || value === null) continue;
    lines.push(`${key}: ${serializeYamlScalar(value, type)}`);
  }
  lines.push("---");
  return lines.join("\n");
}

// ── GitHub Contents API ──────────────────────────────────────────────────────

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "mazze-leczzare-ingest",
  };
}

async function githubFileExists(path: string, token: string): Promise<boolean> {
  const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}?ref=${REPO_BRANCH}`;
  const response = await fetch(url, { headers: githubHeaders(token) });

  if (response.status === 404) return false;
  if (response.ok) return true;

  throw new Error(`GitHub existence check failed with status ${response.status}`);
}

async function githubCommitFile(
  path: string,
  message: string,
  fileContent: string,
  token: string,
): Promise<{ sha: string | null; htmlUrl: string | null }> {
  const url = `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${encodeURIComponent(path)}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      message,
      content: toBase64Utf8(fileContent),
      branch: REPO_BRANCH,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `GitHub commit failed with status ${response.status}: ${detail.slice(0, 300)}`,
    );
  }

  const result = (await response.json()) as {
    content?: { sha?: string; html_url?: string };
  };

  return {
    sha: result.content?.sha ?? null,
    htmlUrl: result.content?.html_url ?? null,
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Fail closed: secrets must be configured.
  if (!env.INGEST_SECRET || !env.GITHUB_INGEST_TOKEN) {
    console.error(
      JSON.stringify({
        type: "ingest_misconfigured",
        receivedAt: new Date().toISOString(),
      }),
    );
    return json({ ok: false, error: "Service unavailable." }, 503);
  }

  const token = extractBearerToken(request);
  if (!token || !(await timingSafeEqual(token, env.INGEST_SECRET))) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const contentTypeHeader = request.headers.get("Content-Type") ?? "";
  if (!contentTypeHeader.includes("application/json")) {
    return json({ ok: false, error: "Expected application/json." }, 415);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, 400);
  }

  const envelope = requestSchema.safeParse(rawBody);
  if (!envelope.success) {
    return json(
      {
        ok: false,
        error: "Invalid request shape.",
        issues: envelope.error.issues.map((issue) => issue.message),
      },
      400,
    );
  }

  const { collection, frontmatter, content } = envelope.data;
  const schema = COLLECTION_SCHEMAS[collection];
  const fields = COLLECTION_FIELDS[collection];

  const parsedFrontmatter = schema.safeParse(frontmatter);
  if (!parsedFrontmatter.success) {
    return json(
      {
        ok: false,
        error: "Invalid frontmatter for collection.",
        issues: parsedFrontmatter.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        ),
      },
      400,
    );
  }

  const data = parsedFrontmatter.data as Record<string, unknown>;
  const explicitSlug = typeof data.slug === "string" ? data.slug : "";
  const slug = explicitSlug || slugify(String(data.title));

  if (!SLUG_PATTERN.test(slug) || slug.length === 0) {
    return json(
      { ok: false, error: "Could not derive a valid slug from title/slug." },
      400,
    );
  }

  const path = `src/content/${collection}/${slug}.md`;
  const frontmatterBlock = buildFrontmatter(fields, data);
  const fileBody = `${frontmatterBlock}\n\n${content.trim()}\n`;

  try {
    const exists = await githubFileExists(path, env.GITHUB_INGEST_TOKEN);
    if (exists) {
      return json({ ok: false, error: `File already exists at ${path}.` }, 409);
    }

    const commit = await githubCommitFile(
      path,
      `content: ingest ${collection}/${slug}`,
      fileBody,
      env.GITHUB_INGEST_TOKEN,
    );

    return json(
      {
        ok: true,
        collection,
        path,
        commitSha: commit.sha,
        htmlUrl: commit.htmlUrl,
      },
      201,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        type: "ingest_github_failure",
        error: String(error),
        receivedAt: new Date().toISOString(),
      }),
    );
    return json(
      {
        ok: false,
        error: "Unable to publish content right now. Please try again later.",
      },
      502,
    );
  }
}
