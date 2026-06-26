type ShareEventName = "quote_share_clicked" | "quote_share_visited";

type ShareEventPayload = {
  event?: unknown;
  path?: unknown;
  quoteId?: unknown;
};

type KVNamespace = {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

type Env = {
  SHARE_ANALYTICS?: KVNamespace;
};
const ALLOWED_EVENTS = new Set<ShareEventName>([
  "quote_share_clicked",
  "quote_share_visited",
]);
const PATH_PATTERN = /^\/[A-Za-z0-9/_-]*$/;
const QUOTE_ID_PATTERN = /^quote-\d{1,4}$/;
function json(
  body: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidPath(path: string) {
  return (
    PATH_PATTERN.test(path) && !path.includes("//") && !path.includes("..")
  );
}

function getRequestOrigin(request: Request) {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      return null;
    }
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    try {
      return new URL(refererHeader).origin;
    } catch {
      return null;
    }
  }

  return null;
}

function hasMatchingOrigin(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const requestOrigin = getRequestOrigin(request);

  return requestOrigin === expectedOrigin;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (!hasMatchingOrigin(request)) {
    return json({ ok: false, error: "Forbidden origin." }, 403);
  }

  // Route-level rate limiting for Pages should be enforced in Cloudflare
  // dashboard rules rather than function bindings in `wrangler.toml`.

  let payload: ShareEventPayload;

  try {
    payload = (await request.json()) as ShareEventPayload;
  } catch {
    return json({ ok: false, error: "Invalid request payload." }, 400);
  }

  const event = toTrimmedString(payload.event);
  const pathValue = toTrimmedString(payload.path);
  const quoteId = toTrimmedString(payload.quoteId);

  if (!ALLOWED_EVENTS.has(event as ShareEventName)) {
    return json({ ok: false, error: "Unsupported event." }, 400);
  }

  if (!pathValue || pathValue.length > 180 || !isValidPath(pathValue)) {
    return json({ ok: false, error: "Invalid path." }, 400);
  }

  if (!quoteId || quoteId.length > 64 || !QUOTE_ID_PATTERN.test(quoteId)) {
    return json({ ok: false, error: "Invalid quote identifier." }, 400);
  }

  console.log(
    JSON.stringify({
      type: "share_event",
      event,
      path: pathValue,
      quoteId,
      receivedAt: new Date().toISOString(),
    }),
  );

  if (env.SHARE_ANALYTICS) {
    try {
      const key = `${event}:${pathValue}:${quoteId}`;
      const existing = await env.SHARE_ANALYTICS.get(key);
      const count = parseInt(existing ?? "0", 10);
      await env.SHARE_ANALYTICS.put(key, String(isNaN(count) ? 1 : count + 1));
    } catch {
      // Analytics failure is non-fatal
    }
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
