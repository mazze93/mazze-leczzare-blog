import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { TURNSTILE_SITE_KEY } from '../consts';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

type ContactApiResponse = { ok?: boolean; error?: string; message?: string };

type FormState = {
  name: string;
  email: string;
  message: string;
  company: string;
};

const initialState: FormState = {
  name: '',
  email: '',
  message: '',
  company: '',
};

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

let turnstileScriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script.')));
        return;
      }

      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Turnstile script.'));
      document.head.appendChild(script);
    });
  }

  return turnstileScriptPromise;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [feedback, setFeedback] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const startedAt = useMemo(() => Date.now(), []);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !widgetContainerRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(widgetContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => setTurnstileToken(''),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFeedback('Unable to load the human verification widget. Please refresh and try again.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetTurnstile() {
    setTurnstileToken('');
    if (window.turnstile && widgetIdRef.current) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitState === 'submitting') {
      return;
    }

    if (!turnstileToken) {
      setSubmitState('error');
      setFeedback('Please complete the verification challenge before sending.');
      return;
    }

    setSubmitState('submitting');
    setFeedback('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          startedAt,
          turnstileToken,
        }),
      });

      const payload = (await response.json()) as ContactApiResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || 'Unable to send your message right now.');
      }

      setSubmitState('success');
      setFeedback(payload.message || 'Message sent.');
      setForm(initialState);
    } catch (error) {
      setSubmitState('error');
      setFeedback(error instanceof Error ? error.message : 'Unable to send your message right now.');
    } finally {
      resetTurnstile();
    }
  }

  return (
    <form className="contact-form" onSubmit={onSubmit} action="/api/contact" method="post" noValidate>
      <input type="hidden" name="startedAt" value={String(startedAt)} />

      <div className="field-group honeypot" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          autoComplete="off"
          tabIndex={-1}
          value={form.company}
          onChange={(event) => updateField('company', event.target.value)}
        />
      </div>

      <div className="field-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={form.name}
          onChange={(event) => updateField('name', event.target.value)}
        />
      </div>

      <div className="field-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
        />
      </div>

      <div className="field-group">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={8}
          required
          minLength={20}
          maxLength={4000}
          value={form.message}
          onChange={(event) => updateField('message', event.target.value)}
        />
      </div>

      <div className="field-group turnstile-widget" ref={widgetContainerRef} />

      <div className="form-footer">
        <button type="submit" disabled={submitState === 'submitting' || !turnstileToken}>
          {submitState === 'submitting' ? 'Sending...' : 'Send message'}
        </button>
        <p className="form-note">Messages route privately. Mailbox addresses are not published here.</p>
      </div>

      {feedback && (
        <p className={`form-status ${submitState}`} role="status" aria-live="polite">
          {feedback}
        </p>
      )}
    </form>
  );
}
