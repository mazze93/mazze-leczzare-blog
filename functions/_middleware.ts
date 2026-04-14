interface Env {
  JWT_SECRET: string;
}

async function verifyJWT(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

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

    if (!valid) return false;

    const decoded = JSON.parse(b64decode(payload));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000))
      return false;

    return true;
  } catch {
    return false;
  }
}

export async function onRequest(context: {
  request: Request;
  next(): Promise<Response>;
  env: Env;
}): Promise<Response> {
  const { request, next, env } = context;
  const url = new URL(request.url);

  // Only protect /admin routes
  if (!url.pathname.startsWith("/admin")) {
    return next();
  }

  const cookie = request.headers.get("Cookie") ?? "";
  const tokenMatch = cookie.match(/auth_token=([^;]+)/);
  const token = tokenMatch?.[1];

  if (!token || !(await verifyJWT(token, env.JWT_SECRET))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", url.pathname);
    return Response.redirect(loginUrl.toString(), 302);
  }

  return next();
}
