import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../functions/api/contact';
import { HARDENING_SPRINT, serviceFromSearch } from '../data/services';

const env = {
  CONTACT_WEBHOOK_URL: 'https://receiver.invalid/contact',
  CONTACT_SUBJECT_PREFIX: 'Site inquiry',
  TURNSTILE_SECRET_KEY: 'test-only-fixture',
};

function payload(extra: Record<string, unknown> = {}) {
  return {
    name: 'Test Reader', email: 'reader@example.invalid',
    message: 'Please review the scope for our repository.',
    company: '', startedAt: Date.now() - 5000, turnstileToken: 'test-challenge',
    ...extra,
  };
}

function request(body: unknown, origin = 'https://site.example') {
  return new Request('https://site.example/api/contact', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body),
  });
}

let outbound: ReturnType<typeof vi.fn>;
beforeEach(() => {
  outbound = vi.fn(async (url: string) => url.includes('/siteverify')
    ? new Response(JSON.stringify({ success: true }), { status: 200 })
    : new Response(null, { status: 204 }));
  vi.stubGlobal('fetch', outbound);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('service-specific contact delivery', () => {
  it('uses the registered offer and forwards its context to the receiver', async () => {
    const response = await onRequestPost({ request: request(payload({ service: HARDENING_SPRINT.id, quotedPrice: '$1', offerVersion: 'forged' })), env });
    expect(response.status).toBe(200);
    expect((await response.json()).message).toContain('before any payment');
    expect(outbound).toHaveBeenCalledTimes(2);
    const delivered = JSON.parse(outbound.mock.calls[1][1].body as string);
    expect(delivered).toMatchObject({ service: 'github-hardening', offerVersion: '2026-10-30', quotedPrice: '$1,250 USD', email: 'reader@example.invalid' });
    expect(delivered.subject).toContain('GitHub Repository Hardening Sprint');
  });

  it('preserves ordinary contact requests without service metadata', async () => {
    const response = await onRequestPost({ request: request(payload()), env });
    expect(response.status).toBe(200);
    const delivered = JSON.parse(outbound.mock.calls[1][1].body as string);
    expect(delivered.subject).toBe('Site inquiry: Test Reader');
    expect(delivered).not.toHaveProperty('service');
  });

  it('accepts the service id from a form-encoded submission', async () => {
    const body = new URLSearchParams(Object.entries(payload({ service: HARDENING_SPRINT.id })).map(([key, value]) => [key, String(value)]));
    const req = new Request('https://site.example/api/contact', { method: 'POST', headers: { Origin: 'https://site.example' }, body });
    expect((await onRequestPost({ request: req, env })).status).toBe(200);
    expect(JSON.parse(outbound.mock.calls[1][1].body as string).service).toBe(HARDENING_SPRINT.id);
  });

  it.each(['unknown', 'github-hardening\r\nBcc: attacker', { id: 'github-hardening' }])('rejects unregistered service values before outbound requests: %j', async (service) => {
    const response = await onRequestPost({ request: request(payload({ service })), env });
    expect(response.status).toBe(400);
    expect(outbound).not.toHaveBeenCalled();
  });

  it.each([null, [], 'not-an-object'])('rejects malformed payload shapes: %j', async (body) => {
    expect((await onRequestPost({ request: request(body), env })).status).toBe(400);
    expect(outbound).not.toHaveBeenCalled();
  });

  it('preserves origin enforcement for service inquiries', async () => {
    const response = await onRequestPost({ request: request(payload({ service: HARDENING_SPRINT.id }), 'https://other.example'), env });
    expect(response.status).toBe(403);
    expect(outbound).not.toHaveBeenCalled();
  });

  it('does not deliver a honeypot submission', async () => {
    expect((await onRequestPost({ request: request(payload({ service: HARDENING_SPRINT.id, company: 'bot-filled' })), env })).status).toBe(200);
    expect(outbound).not.toHaveBeenCalled();
  });

  it('does not deliver without a successful challenge', async () => {
    outbound.mockResolvedValue(new Response(JSON.stringify({ success: false })));
    expect((await onRequestPost({ request: request(payload({ service: HARDENING_SPRINT.id })), env })).status).toBe(403);
    expect(outbound).toHaveBeenCalledTimes(1);
  });

  it('does not deliver a form submitted too quickly', async () => {
    expect((await onRequestPost({ request: request(payload({ service: HARDENING_SPRINT.id, startedAt: Date.now() })), env })).status).toBe(400);
    expect(outbound).toHaveBeenCalledTimes(1);
  });

  it('returns an error rather than success when the receiver fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    outbound.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }))).mockResolvedValueOnce(new Response(null, { status: 503 }));
    expect((await onRequestPost({ request: request(payload({ service: HARDENING_SPRINT.id })), env })).status).toBe(502);
  });
});

describe('offer selection', () => {
  it('selects only a known service without taking page copy from the URL', () => {
    expect(serviceFromSearch('?service=github-hardening&price=1')).toBe(HARDENING_SPRINT);
    expect(serviceFromSearch('?service=other')).toBeUndefined();
    expect(serviceFromSearch('')).toBeUndefined();
  });
});
