import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext/browser';

interface ContactEmailBinding {
  send(message: EmailMessage): Promise<void>;
}

interface Env {
  CONTACT_EMAIL?: ContactEmailBinding;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  CONTACT_SUBJECT_PREFIX?: string;
  CONTACT_WEBHOOK_URL?: string;
  CONTACT_WEBHOOK_AUTH_HEADER?: string;
}

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  company?: unknown;
  startedAt?: unknown;
};

type ParsedContactPayload = {
  name: string;
  email: string;
  message: string;
  company: string;
  startedAt: number | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHeader(value: string) {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function parseStartedAt(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
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
  };
}

async function deliverViaWebhook(
  webhookUrl: string,
  authHeader: string | undefined,
  payload: Record<string, string>,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed with status ${response.status}.`);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const webhookUrl = toTrimmedString(env.CONTACT_WEBHOOK_URL);
  const webhookAuthHeader = toTrimmedString(env.CONTACT_WEBHOOK_AUTH_HEADER);
  const hasEmailBinding = Boolean(env.CONTACT_EMAIL && typeof env.CONTACT_EMAIL.send === 'function');

  if (!webhookUrl && !hasEmailBinding) {
    return json(
      {
        ok: false,
        error:
          'Contact delivery is not configured yet. Set CONTACT_WEBHOOK_URL for Pages or provide a CONTACT_EMAIL send binding.',
      },
      500,
    );
  }

  if (!webhookUrl && !env.CONTACT_TO_EMAIL) {
    return json(
      {
        ok: false,
        error: 'Contact delivery is not configured yet. Set CONTACT_TO_EMAIL in Cloudflare Pages settings.',
      },
      500,
    );
  }

  let payload: ContactPayload;

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = (await request.json()) as ContactPayload;
    } else {
      const formData = await request.formData();
      payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        company: formData.get('company'),
        startedAt: Number(formData.get('startedAt') || 0),
      };
    }
  } catch {
    return json({ ok: false, error: 'Invalid request payload.' }, 400);
  }

  const { name, email, message, company, startedAt } = parseContactPayload(payload);

  if (company) {
    return json({ ok: true, message: 'Message sent.' });
  }

  if (startedAt === null) {
    return json({ ok: false, error: 'Submission rejected. Please refresh the page and try again.' }, 400);
  }

  const elapsedMs = Date.now() - startedAt;

  if (elapsedMs < 1500) {
    return json({ ok: false, error: 'Submission rejected. Please try again.' }, 400);
  }

  if (name.length < 2 || name.length > 80) {
    return json({ ok: false, error: 'Please enter your name.' }, 400);
  }

  if (!emailPattern.test(email) || email.length > 120) {
    return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
  }

  if (message.length < 20 || message.length > 4000) {
    return json({ ok: false, error: 'Please enter a message with at least 20 characters.' }, 400);
  }

  const replyTo = escapeHeader(email);
  const safeName = escapeHeader(name);
  const subjectPrefix = escapeHeader(env.CONTACT_SUBJECT_PREFIX || 'Mazze Contact');
  const fromAddress = escapeHeader(env.CONTACT_FROM_EMAIL || 'contact@mazzeleczzare.com');
  const submittedAt = new Date().toISOString();

  const textBody = [
    'New contact form submission',
    '',
    `Name: ${safeName}`,
    `Email: ${replyTo}`,
    `Submitted: ${submittedAt}`,
    '',
    message,
  ].join('\n');
  const safeMessageHtml = escapeHtml(message);

  const htmlBody = `
    <h1>New contact form submission</h1>
    <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(replyTo)}</p>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <hr />
    <pre style="white-space: pre-wrap; font: 16px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;">${safeMessageHtml}</pre>
  `;

  const deliveryPayload = {
    subject: `${subjectPrefix}: ${safeName}`,
    submittedAt,
    name: safeName,
    email: replyTo,
    message,
    text: textBody,
    html: htmlBody,
  };

  if (webhookUrl) {
    try {
      await deliverViaWebhook(webhookUrl, webhookAuthHeader || undefined, deliveryPayload);
      return json({ ok: true, message: 'Message sent. Thanks for reaching out.' });
    } catch (error) {
      console.error('Contact webhook delivery failed', error);
      return json({ ok: false, error: 'Unable to send your message right now. Please try again later.' }, 502);
    }
  }
  const recipient = escapeHeader(env.CONTACT_TO_EMAIL || '');
  const mimeMessage = createMimeMessage();
  mimeMessage.setSender({ name: 'Mazzeleczzare.com contact form', addr: fromAddress });
  mimeMessage.setRecipient(recipient);
  mimeMessage.setSubject(`${subjectPrefix}: ${safeName}`);
  mimeMessage.addMessage({
    contentType: 'text/plain',
    data: textBody,
  });
  mimeMessage.addMessage({
    contentType: 'text/html',
    data: htmlBody,
  });
  mimeMessage.setHeader('Reply-To', replyTo);

  try {
    const emailMessage = new EmailMessage(fromAddress, recipient, mimeMessage.asRaw());
    await env.CONTACT_EMAIL?.send(emailMessage);
    return json({ ok: true, message: 'Message sent. Thanks for reaching out.' });
  } catch (error) {
    console.error('Contact form delivery failed', error);
    return json({ ok: false, error: 'Unable to send your message right now. Please try again later.' }, 502);
  }
}
