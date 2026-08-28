import { signOutboundRequest } from "../utils/webBotAuth";

interface Env {
  CONTACT_FROM_EMAIL?: string;
  CONTACT_SUBJECT_PREFIX?: string;
  CONTACT_WEBHOOK_URL?: string;
  CONTACT_WEBHOOK_AUTH_HEADER?: string;
  TURNSTILE_SECRET_KEY?: string;
  WEB_BOT_AUTH_PRIVATE_KEY?: string;
}

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  company?: unknown;
  startedAt?: unknown;
  turnstileToken?: unknown;
};

type ParsedContactPayload = {
  name: string;
  email: string;
  message: string;
  company: string;
  startedAt: number | null;
  turnstileToken: string;
};

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

async function verifyTurnstileToken(
  secretKey: string,
  token: string,
  remoteIp: string | null,
): Promise<boolean> {
  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      return false;
    }

    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification request failed", error);
    return false;
  }
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

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

function parseStartedAt(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function parseContactPayload(payload: ContactPayload): ParsedContactPayload {
  return {
    name: toTrimmedString(payload.name),
    email: toTrimmedString(payload.email).toLowerCase(),
    message: toTrimmedString(payload.message),
    company: toTrimmedString(payload.company),
    startedAt: parseStartedAt(payload.startedAt),
    turnstileToken: toTrimmedString(payload.turnstileToken),
  };
}

async function deliverViaWebhook(
  webhookUrl: string,
  authHeader: string | undefined,
  payload: Record<string, string>,
  webBotAuthPrivateKey: string | undefined,
) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
  });

  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  if (webBotAuthPrivateKey) {
    await signOutboundRequest(webhookUrl, headers, webBotAuthPrivateKey);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed with status ${response.status}.`);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const configuredFromEmail = toTrimmedString(env.CONTACT_FROM_EMAIL);
  const webhookUrl = toTrimmedString(env.CONTACT_WEBHOOK_URL);
  const webhookAuthHeader = toTrimmedString(env.CONTACT_WEBHOOK_AUTH_HEADER);
  const turnstileSecretKey = toTrimmedString(env.TURNSTILE_SECRET_KEY);

  if (!webhookUrl) {
    return json(
      {
        ok: false,
        error:
          "Contact delivery is not configured yet. Set CONTACT_WEBHOOK_URL.",
      },
      500,
    );
  }

  if (!turnstileSecretKey) {
    return json(
      {
        ok: false,
        error:
          "Contact delivery is not configured yet. Set TURNSTILE_SECRET_KEY.",
      },
      500,
    );
  }

  if (!hasMatchingOrigin(request)) {
    return json({ ok: false, error: "Forbidden origin." }, 403);
  }

  let payload: ContactPayload;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = (await request.json()) as ContactPayload;
    } else {
      const formData = await request.formData();
      payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
        company: formData.get("company"),
        startedAt: Number(formData.get("startedAt") || 0),
        turnstileToken:
          formData.get("turnstileToken") || formData.get("cf-turnstile-response"),
      };
    }
  } catch {
    return json({ ok: false, error: "Invalid request payload." }, 400);
  }

  const { name, email, message, company, startedAt, turnstileToken } =
    parseContactPayload(payload);

  if (company) {
    return json({ ok: true, message: "Message sent." });
  }

  if (startedAt === null) {
    return json(
      {
        ok: false,
        error: "Submission rejected. Please refresh the page and try again.",
      },
      400,
    );
  }

  if (!turnstileToken) {
    return json(
      {
        ok: false,
        error: "Please complete the verification challenge before sending.",
      },
      400,
    );
  }

  const turnstileValid = await verifyTurnstileToken(
    turnstileSecretKey,
    turnstileToken,
    request.headers.get("CF-Connecting-IP"),
  );

  if (!turnstileValid) {
    return json(
      {
        ok: false,
        error: "Verification failed. Please try again.",
      },
      403,
    );
  }

  const elapsedMs = Date.now() - startedAt;

  if (elapsedMs < 1500) {
    return json(
      { ok: false, error: "Submission rejected. Please try again." },
      400,
    );
  }

  if (name.length < 2 || name.length > 80) {
    return json({ ok: false, error: "Please enter your name." }, 400);
  }

  if (!emailPattern.test(email) || email.length > 120) {
    return json(
      { ok: false, error: "Please enter a valid email address." },
      400,
    );
  }

  if (message.length < 20 || message.length > 4000) {
    return json(
      {
        ok: false,
        error: "Please enter a message with at least 20 characters.",
      },
      400,
    );
  }

  const safeName = escapeHeader(name);
  const subjectPrefix = escapeHeader(
    env.CONTACT_SUBJECT_PREFIX || "Mazze Contact",
  );
  const submittedAt = new Date().toISOString();

  const deliveryPayload = {
    subject: `${subjectPrefix}: ${safeName}`,
    submittedAt,
    name: safeName,
    email,
    message,
    ...(configuredFromEmail ? { fromEmail: configuredFromEmail } : {}),
  };

  try {
    await deliverViaWebhook(
      webhookUrl,
      webhookAuthHeader || undefined,
      deliveryPayload,
      env.WEB_BOT_AUTH_PRIVATE_KEY,
    );
    return json({
      ok: true,
      message: "Message sent. Thanks for reaching out.",
    });
  } catch (error) {
    console.error("Contact webhook delivery failed", error);
    return json(
      {
        ok: false,
        error: "Unable to send your message right now. Please try again later.",
      },
      502,
    );
  }
}
