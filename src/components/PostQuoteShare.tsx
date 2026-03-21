import { useEffect } from 'react';

type PostQuoteShareProps = {
  title: string;
  pathname: string;
};

type ShareEventName = 'quote_share_clicked' | 'quote_share_visited';

const BUTTON_CLASS = 'quote-share-button';
const HIGHLIGHT_CLASS = 'quote-share-highlight';
const PARAGRAPH_CLASS = 'quote-share-paragraph';
const SUCCESS_TIMEOUT_MS = 2500;
const VISITED_STORAGE_PREFIX = 'quote-share-visited';

function normalizePathname(pathname: string) {
  if (!pathname.startsWith('/')) {
    return '/';
  }

  if (pathname === '/') {
    return pathname;
  }

  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

function buildShareUrl(origin: string, pathname: string, quoteId: string) {
  const url = new URL(normalizePathname(pathname), origin);
  url.searchParams.set('quote', quoteId);
  url.searchParams.set('via', 'quote-share');
  return url.toString();
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', 'true');
  input.style.position = 'absolute';
  input.style.left = '-9999px';
  document.body.append(input);
  input.select();

  try {
    const copied = document.execCommand('copy');

    if (!copied) {
      throw new Error('Copy command failed.');
    }
  } finally {
    input.remove();
  }
}

async function sendShareEvent(event: ShareEventName, path: string, quoteId: string) {
  try {
    await fetch('/api/share-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event,
        path,
        quoteId,
      }),
      keepalive: true,
    });
  } catch {
    // Quote sharing should remain local-first even if measurement fails.
  }
}

export default function PostQuoteShare({ title, pathname }: PostQuoteShareProps) {
  useEffect(() => {
    const pageOrigin = window.location.origin;
    const normalizedPathname = normalizePathname(pathname);
    const paragraphs = Array.from(document.querySelectorAll<HTMLParagraphElement>('.prose > p'));

    if (!paragraphs.length) {
      return;
    }

    const cleanupHandlers: Array<() => void> = [];
    const feedbackTimeouts = new Map<HTMLButtonElement, number>();
    let highlightTimeout = 0;

    const resetButtonLabel = (button: HTMLButtonElement) => {
      button.textContent = button.dataset.defaultLabel || 'Share';
      button.classList.remove('is-success');
    };

    const showButtonFeedback = (button: HTMLButtonElement, label: 'Link copied' | 'Shared') => {
      const existingTimeout = feedbackTimeouts.get(button);

      if (existingTimeout) {
        window.clearTimeout(existingTimeout);
      }

      button.textContent = label;
      button.classList.add('is-success');

      const timeoutId = window.setTimeout(() => {
        resetButtonLabel(button);
        feedbackTimeouts.delete(button);
      }, SUCCESS_TIMEOUT_MS);

      feedbackTimeouts.set(button, timeoutId);
    };

    paragraphs.forEach((paragraph, index) => {
      paragraph.classList.add(PARAGRAPH_CLASS);
      cleanupHandlers.push(() => {
        paragraph.classList.remove(PARAGRAPH_CLASS);
        paragraph.classList.remove(HIGHLIGHT_CLASS);
      });

      if (!paragraph.id) {
        paragraph.id = `quote-${index + 1}`;
        cleanupHandlers.push(() => {
          paragraph.removeAttribute('id');
        });
      }

      const existingControl = Array.from(paragraph.children).find((child) =>
        child.classList.contains(BUTTON_CLASS),
      );

      if (existingControl instanceof HTMLButtonElement) {
        return;
      }

      const paragraphShareText = paragraph.textContent?.trim() || title;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = BUTTON_CLASS;
      button.dataset.defaultLabel = 'Share';
      button.textContent = 'Share';
      button.setAttribute('aria-label', `Share paragraph link from ${title}`);

      const onClick = async () => {
        const shareUrl = buildShareUrl(pageOrigin, normalizedPathname, paragraph.id);

        void sendShareEvent('quote_share_clicked', normalizedPathname, paragraph.id);

        try {
          if (typeof navigator.share === 'function') {
            await navigator.share({
              title,
              text: paragraphShareText,
              url: shareUrl,
            });
            showButtonFeedback(button, 'Shared');
            return;
          }

          await copyToClipboard(shareUrl);
          showButtonFeedback(button, 'Link copied');
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
        }
      };

      button.addEventListener('click', onClick);
      paragraph.append(button);

      cleanupHandlers.push(() => {
        button.removeEventListener('click', onClick);
        const timeoutId = feedbackTimeouts.get(button);

        if (timeoutId) {
          window.clearTimeout(timeoutId);
          feedbackTimeouts.delete(button);
        }

        button.remove();
      });
    });

    const quoteId = new URLSearchParams(window.location.search).get('quote');
    const targetParagraph = quoteId ? document.getElementById(quoteId) : null;

    if (targetParagraph instanceof HTMLParagraphElement && targetParagraph.matches('.prose > p')) {
      const targetQuoteId = targetParagraph.id;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      window.requestAnimationFrame(() => {
        targetParagraph.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'center',
        });
        targetParagraph.classList.add(HIGHLIGHT_CLASS);
      });

      highlightTimeout = window.setTimeout(() => {
        targetParagraph.classList.remove(HIGHLIGHT_CLASS);
      }, SUCCESS_TIMEOUT_MS);

      try {
        const visitKey = `${VISITED_STORAGE_PREFIX}:${normalizedPathname}:${targetQuoteId}`;

        if (!window.sessionStorage.getItem(visitKey)) {
          window.sessionStorage.setItem(visitKey, '1');
          void sendShareEvent('quote_share_visited', normalizedPathname, targetQuoteId);
        }
      } catch {
        void sendShareEvent('quote_share_visited', normalizedPathname, targetQuoteId);
      }
    }

    return () => {
      if (highlightTimeout) {
        window.clearTimeout(highlightTimeout);
      }

      cleanupHandlers.forEach((handler) => handler());
      feedbackTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      feedbackTimeouts.clear();
    };
  }, [pathname, title]);

  return null;
}
