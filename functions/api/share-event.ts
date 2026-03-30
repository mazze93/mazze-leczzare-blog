type ShareEventName = 'quote_share_clicked' | 'quote_share_visited';

type ShareEventPayload = {
  event?: unknown;
  path?: unknown;
  quoteId?: unknown;
};

type RateLimitResult = {
  success: boolean;
};

type RateLimitBinding = {
  limit(options: { key: string }): Promise<RateLimitResult>;
};

type Env = {
  SHARE_EVENT_RATE_LIMITER?: RateLimitBinding;
};

const ALLOWED_EVENTS = new Set<ShareEventName>(['quote_share_clicked', 'quote_share_visited']);
const PATH_PATTERN = /^\/[A-Za-z0-9/_-]*$/;
const QUOTE_ID_PATTERN = /^quote-\d{1,4}$/;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_SECONDS = 60;

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidPath(path: string) {
  return PATH_PATTERN.test(path) && !path.includes('//') && !path.includes('..');
}

function getRequestOrigin(request: Request) {
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      return null;
    }
  }

  const refererHeader = request.headers.get('referer');
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

async function buildRateLimitKey(request: Request) {
  const ipAddress = toTrimmedString(request.headers.get('cf-connecting-ip')) || 'unknown-ip';
  const userAgent = toTrimmedString(request.headers.get('user-agent')).slice(0, 160) || 'unknown-ua';
  const input = new TextEncoder().encode(ipAddress + ':' + userAgent);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

async function enforceRateLimit(request: Request, rateLimiter?: RateLimitBinding) {
  if (!rateLimiter || typeof rateLimiter.limit !== 'function') {
    console.error(
      JSON.stringify({
        type: 'share_event_rate_limiter_unavailable',
        route: '/api/share-event',
        receivedAt: new Date().toISOString(),
      }),
    );

    return json(
      {
        ok: false,
        error: 'Share tracking is temporarily unavailable.',
      },
      503,
    );
  }

  const rateLimitKey = await buildRateLimitKey(request);
  const rateLimitResult = await rateLimiter.limit({ key: rateLimitKey });

  if (rateLimitResult.success) {
    return null;
  }

  console.warn(
    JSON.stringify({
      type: 'share_event_rate_limited',
      route: '/api/share-event',
      receivedAt: new Date().toISOString(),
    }),
  );

  return json(
    {
      ok: false,
      error: 'Rate limit exceeded. Please slow down and try again shortly.',
    },
    429,
    {
      'Retry-After': String(RATE_LIMIT_WINDOW_SECONDS),
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
      'X-RateLimit-Window': String(RATE_LIMIT_WINDOW_SECONDS),
    },
  );
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  if (!hasMatchingOrigin(request)) {
    return json({ ok: false, error: 'Forbidden origin.' }, 403);
  }

  const rateLimitResponse = await enforceRateLimit(request, env.SHARE_EVENT_RATE_LIMITER);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let payload: ShareEventPayload;

  try {
    payload = (await request.json()) as ShareEventPayload;
  } catch {
    return json({ ok: false, error: 'Invalid request payload.' }, 400);
  }

  const event = toTrimmedString(payload.event);
  const pathValue = toTrimmedString(payload.path);
  const quoteId = toTrimmedString(payload.quoteId);

  if (!ALLOWED_EVENTS.has(event as ShareEventName)) {
    return json({ ok: false, error: 'Unsupported event.' }, 400);
  }

  if (!pathValue || pathValue.length > 180 || !isValidPath(pathValue)) {
    return json({ ok: false, error: 'Invalid path.' }, 400);
  }

  if (!quoteId || quoteId.length > 64 || !QUOTE_ID_PATTERN.test(quoteId)) {
    return json({ ok: false, error: 'Invalid quote identifier.' }, 400);
  }

  console.log(
    JSON.stringify({
      type: 'share_event',
      event,
      path: pathValue,
      quoteId,
      receivedAt: new Date().toISOString(),
    }),
  );

  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
      'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
      'X-RateLimit-Window': String(RATE_LIMIT_WINDOW_SECONDS),
    },
  });
}
