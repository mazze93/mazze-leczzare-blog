type ShareEventName = 'quote_share_clicked' | 'quote_share_visited';

type ShareEventPayload = {
  event?: unknown;
  path?: unknown;
  quoteId?: unknown;
};

const ALLOWED_EVENTS = new Set<ShareEventName>(['quote_share_clicked', 'quote_share_visited']);
const PATH_PATTERN = /^\/[A-Za-z0-9/_-]*$/;
const QUOTE_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidPath(path: string) {
  return PATH_PATTERN.test(path) && !path.includes('//') && !path.includes('..');
}

export async function onRequestPost(context: { request: Request }) {
  const { request } = context;

  let payload: ShareEventPayload;

  try {
    payload = (await request.json()) as ShareEventPayload;
  } catch {
    return json({ ok: false, error: 'Invalid request payload.' }, 400);
  }

  const event = toTrimmedString(payload.event);
  const path = toTrimmedString(payload.path);
  const quoteId = toTrimmedString(payload.quoteId);

  if (!ALLOWED_EVENTS.has(event as ShareEventName)) {
    return json({ ok: false, error: 'Unsupported event.' }, 400);
  }

  if (!path || path.length > 180 || !isValidPath(path)) {
    return json({ ok: false, error: 'Invalid path.' }, 400);
  }

  if (!quoteId || quoteId.length > 64 || !QUOTE_ID_PATTERN.test(quoteId)) {
    return json({ ok: false, error: 'Invalid quote identifier.' }, 400);
  }

  console.log(
    JSON.stringify({
      type: 'share_event',
      event,
      path,
      quoteId,
      receivedAt: new Date().toISOString(),
    }),
  );

  return new Response(null, {
    status: 204,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
