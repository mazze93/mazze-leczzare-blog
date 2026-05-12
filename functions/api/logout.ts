interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

interface Env {
  JWT_SECRET?: string;
  JWT_REVOCATION_LIST?: KVNamespace;
}

const CLEAR_COOKIE =
  "__Host-auth_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0";

function b64decode(s: string): string {
  return atob(
    (s.replace(/-/g, "+").replace(/_/g, "/") + "====").slice(
      0,
      s.length + ((4 - (s.length % 4)) % 4)
    )
  );
}

async function verifyAndDecodeJWT(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
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

    const sigBytes = Uint8Array.from(b64decode(sig), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(data)
    );

    if (!valid) return null;

    return JSON.parse(b64decode(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  const cookie = request.headers.get("Cookie") ?? "";
  const tokenMatch = cookie.match(/__Host-auth_token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (token && env.JWT_SECRET && env.JWT_REVOCATION_LIST) {
    const decoded = await verifyAndDecodeJWT(token, env.JWT_SECRET);
    if (decoded && typeof decoded.jti === "string") {
      const now = Math.floor(Date.now() / 1000);
      const exp = typeof decoded.exp === "number" ? decoded.exp : now;
      const ttl = Math.max(60, exp - now);
      try {
        await env.JWT_REVOCATION_LIST.put(`revoked:${decoded.jti}`, "1", {
          expirationTtl: ttl,
        });
      } catch (err) {
        console.error(
          JSON.stringify({ type: "logout_revocation_failed", error: String(err), receivedAt: new Date().toISOString() })
        );
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": CLEAR_COOKIE,
    },
  });
}
