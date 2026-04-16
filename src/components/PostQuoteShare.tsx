import { useEffect } from 'react';

type PostQuoteShareProps = {
  title: string;
  path: string;
};

type ShareEventName = 'quote_share_clicked' | 'quote_share_visited';

type FeedbackLabel = 'Link copied' | 'Shared';

const BUTTON_CLASS = 'quote-share-button';
const PARAGRAPH_CLASS = 'quote-share-paragraph';
const HIGHLIGHT_CLASS = 'quote-share-highlight';
const ACTIVE_CLASS = 'quote-share-active';
const SUCCESS_TIMEOUT_MS = 2500;
const HIGHLIGHT_TIMEOUT_MS = 4000;
const SHARE_SOURCE = 'quote-share';
const VISITED_STORAGE_PREFIX = 'quote-share-visited';
const QUOTE_ID_PATTERN = /^quote-\d{1,4}$/;
const QUOTE_SHARE_ID_ATTRIBUTE = 'data-quote-share-id';

type QuoteParagraph = HTMLParagraphElement & {
  dataset: DOMStringMap;
};

function normalizePath(path: string) {
  if (!path.startsWith('/')) {
    return '/';
  }

  if (path === '/') {
    return '/';
  }

  return path.endsWith('/') ? path : path + '/';
}

function truncateQuote(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim();

  if (normalized.length <= 220) {
    return normalized;
  }

  return normalized.slice(0, 217).trimEnd() + '...';
}

function getQuoteId(index: number) {
  return 'quote-' + String(index + 1);
}

function getQuoteParagraphs(prose: HTMLElement) {
  return Array.from(prose.children).filter(
    (node): node is QuoteParagraph =>
      node instanceof HTMLParagraphElement && Boolean(node.textContent?.trim()),
  );
}

function setQuoteIdentifier(paragraph: QuoteParagraph, quoteId: string) {
  paragraph.setAttribute(QUOTE_SHARE_ID_ATTRIBUTE, quoteId);

  if (!paragraph.id) {
    paragraph.id = quoteId;
    return () => {
      paragraph.removeAttribute('id');
      paragraph.removeAttribute(QUOTE_SHARE_ID_ATTRIBUTE);
    };
  }

  return () => {
    paragraph.removeAttribute(QUOTE_SHARE_ID_ATTRIBUTE);
  };
}

function buildShareUrl(origin: string, path: string, quoteId: string) {
  const url = new URL(path, origin);
  url.searchParams.set('quote', quoteId);
  url.searchParams.set('via', SHARE_SOURCE);
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
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.opacity = '0';
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

function sendShareEvent(event: ShareEventName, path: string, quoteId: string) {
  const body = JSON.stringify({ event, path, quoteId });

  if (navigator.sendBeacon) {
    const accepted = navigator.sendBeacon(
      '/api/share-event',
      new Blob([body], { type: 'application/json' }),
    );

    if (accepted) {
      return;
    }
  }

  void fetch('/api/share-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Measurement stays best-effort and must never block reading or sharing.
  });
}

function setButtonFeedback(
  button: HTMLButtonElement,
  label: FeedbackLabel,
  feedbackTimeouts: Map<HTMLButtonElement, number>,
) {
  const existingTimeout = feedbackTimeouts.get(button);

  if (existingTimeout) {
    window.clearTimeout(existingTimeout);
  }

  button.textContent = label;
  button.dataset.state = 'success';

  const timeoutId = window.setTimeout(() => {
    button.textContent = button.dataset.defaultLabel || 'Share';
    button.dataset.state = 'idle';
    feedbackTimeouts.delete(button);
  }, SUCCESS_TIMEOUT_MS);

  feedbackTimeouts.set(button, timeoutId);
}

export default function PostQuoteShare({ title, path }: PostQuoteShareProps) {
  useEffect(() => {
    const prose = document.querySelector<HTMLElement>('.prose');
    if (!prose) {
      return;
    }

    const normalizedPath = normalizePath(path);
    const paragraphs = getQuoteParagraphs(prose);

    if (!paragraphs.length) {
      return;
    }

    const cleanupHandlers: Array<() => void> = [];
    const feedbackTimeouts = new Map<HTMLButtonElement, number>();
    const buttonById = new Map<string, HTMLButtonElement>();
    let highlightTimeout = 0;

    paragraphs.forEach((paragraph, index) => {
      const quoteId = getQuoteId(index);
      const quoteText = truncateQuote(paragraph.textContent ?? title);
      const button = document.createElement('button');

      paragraph.classList.add(PARAGRAPH_CLASS);
      const cleanupQuoteIdentifier = setQuoteIdentifier(paragraph, quoteId);
      button.className = BUTTON_CLASS;
      button.type = 'button';
      button.textContent = 'Share';
      button.dataset.defaultLabel = 'Share';
      button.dataset.state = 'idle';
      button.setAttribute('aria-label', 'Share paragraph ' + String(index + 1) + ' from ' + title);
      button.setAttribute('title', 'Copy or share a direct link to this paragraph');

      const onClick = async () => {
        const shareUrl = buildShareUrl(window.location.origin, normalizedPath, quoteId);
        let feedbackLabel: FeedbackLabel | null = null;

        try {
          if (typeof navigator.share === 'function') {
            await navigator.share({
              title,
              text: '"' + quoteText + '"',
              url: shareUrl,
            });
            feedbackLabel = 'Shared';
          } else {
            await copyToClipboard(shareUrl);
            feedbackLabel = 'Link copied';
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }

          try {
            await copyToClipboard(shareUrl);
            feedbackLabel = 'Link copied';
          } catch {
            return;
          }
        }

        sendShareEvent('quote_share_clicked', normalizedPath, quoteId);
        setButtonFeedback(button, feedbackLabel, feedbackTimeouts);
      };

      button.addEventListener('click', onClick);
      paragraph.append(button);
      buttonById.set(quoteId, button);

      cleanupHandlers.push(() => {
        button.removeEventListener('click', onClick);
        const timeoutId = feedbackTimeouts.get(button);
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          feedbackTimeouts.delete(button);
        }
        button.remove();
        paragraph.classList.remove(PARAGRAPH_CLASS, HIGHLIGHT_CLASS);
        cleanupQuoteIdentifier();
      });
    });

    const onSelectionChange = () => {
      const selection = window.getSelection();
      paragraphs.forEach((p) => p.classList.remove(ACTIVE_CLASS));

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }

      const anchor = selection.getRangeAt(0).commonAncestorContainer;
      const matched = paragraphs.find((p) => p.contains(anchor));
      if (matched) {
        matched.classList.add(ACTIVE_CLASS);
      }
    };

    document.addEventListener('selectionchange', onSelectionChange);
    cleanupHandlers.push(() => {
      document.removeEventListener('selectionchange', onSelectionChange);
      paragraphs.forEach((p) => p.classList.remove(ACTIVE_CLASS));
    });

    const searchParams = new URLSearchParams(window.location.search);
    const quoteId = searchParams.get('quote');
    const shareSource = searchParams.get('via');
    const targetParagraph = quoteId
      ? prose.querySelector<HTMLParagraphElement>(`p[${QUOTE_SHARE_ID_ATTRIBUTE}="${quoteId}"]`)
      : null;

    if (
      quoteId &&
      QUOTE_ID_PATTERN.test(quoteId) &&
      targetParagraph instanceof HTMLParagraphElement &&
      targetParagraph.matches('.prose > p')
    ) {
      const targetButton = buttonById.get(quoteId);
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
      }, HIGHLIGHT_TIMEOUT_MS);

      if (shareSource === SHARE_SOURCE) {
        if (targetButton) {
          setButtonFeedback(targetButton, 'Shared', feedbackTimeouts);
        }

        try {
          const visitKey = VISITED_STORAGE_PREFIX + ':' + normalizedPath + ':' + quoteId;

          if (!window.sessionStorage.getItem(visitKey)) {
            window.sessionStorage.setItem(visitKey, '1');
            sendShareEvent('quote_share_visited', normalizedPath, quoteId);
          }
        } catch {
          sendShareEvent('quote_share_visited', normalizedPath, quoteId);
        }
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
  }, [path, title]);

  return null;
}
