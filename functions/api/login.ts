interface Env {
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
}

const JWT_SECRET_MIN_LENGTH = 32;

// ── Constant-time comparison ─────────────────────────────────────────────────
// Signs `a` with a fresh random key then verifies the signature against `b`.
// crypto.subtle.verify is guaranteed constant-time; the random key prevents
// pre-computation. Handles different-length inputs safely.
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

// ── JWT ──────────────────────────────────────────────────────────────────────

function b64urlEncode(obj: object): string {
  return btoa(JSON.stringify(obj))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

async function signJWT(payload: object, secret: string): Promise<string> {
  const header = b64urlEncode({ alg: "HS256", typ: "JWT" });
  const body = b64urlEncode(payload);
  const data = `${header}.${body}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${sig}`;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;

  // Fail closed: secrets must be configured
  if (!env.ADMIN_PASSWORD || !env.JWT_SECRET) {
    console.error(
      JSON.stringify({
        type: "login_misconfigured",
        receivedAt: new Date().toISOString(),
      }),
    );
    return json({ error: "Service unavailable." }, 503);
  }

  if (env.JWT_SECRET.length < JWT_SECRET_MIN_LENGTH) {
    console.error(
      JSON.stringify({
        type: "login_weak_secret",
        receivedAt: new Date().toISOString(),
      }),
    );
    return json({ error: "Service unavailable." }, 503);
  }

  // Route-level rate limiting for Pages should be enforced in Cloudflare
  // dashboard rules rather than function bindings in `wrangler.toml`.

  // Parse credential
  let password: string | undefined;
  const contentType = request.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { password?: string };
    password = body.password;
  } else {
    const form = await request.formData();
    password = form.get("password")?.toString();
  }

  // Constant-time password check
  if (!password || !(await timingSafeEqual(password, env.ADMIN_PASSWORD))) {
    return json({ error: "Invalid credentials." }, 401);
  }

  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const token = await signJWT(
    { sub: "admin", iat: now, exp: now + 60 * 60 * 24, jti },
    env.JWT_SECRET,
  );

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // __Host- prefix: enforces Secure + Path=/ + no Domain, binding the
      // cookie strictly to this origin and preventing subdomain override.
      "Set-Cookie": `__Host-auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
    },
  });
}
