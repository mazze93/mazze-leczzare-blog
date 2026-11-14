import { describe, expect, it } from 'vitest';
import {
  absolutizeUrls,
  isArchivable,
  licenseFooterHtml,
  stripForFeed,
  toFeedHtml,
} from './scholarlyFeed';

const SITE = 'https://mazzeleczzare.com';

describe('isArchivable', () => {
  it('defaults a published post into the feed', () => {
    expect(isArchivable({})).toBe(true);
  });
  it('keeps drafts out', () => {
    expect(isArchivable({ draft: true })).toBe(false);
  });
  it('keeps all-rights-reserved posts out', () => {
    expect(isArchivable({ license: 'all-rights-reserved' })).toBe(false);
  });
  it('honours archive: false on a CC BY post', () => {
    expect(isArchivable({ license: 'cc-by-4.0', archive: false })).toBe(false);
  });
});

describe('absolutizeUrls', () => {
  it('rewrites root-relative src and href', () => {
    expect(absolutizeUrls('<img src="/_astro/a.webp"><a href=\'/blog/x/\'>x</a>', SITE)).toBe(
      `<img src="${SITE}/_astro/a.webp"><a href='${SITE}/blog/x/'>x</a>`,
    );
  });
  it('leaves absolute, protocol-relative, anchor and relative URLs alone', () => {
    const html = '<a href="https://x.org/">a</a><img src="//cdn/x.png"><a href="#s">b</a><a href="./c">c</a>';
    expect(absolutizeUrls(html, SITE)).toBe(html);
  });
  it('rewrites each srcset candidate', () => {
    expect(absolutizeUrls('<img srcset="/a.webp 1x, /b.webp 2x">', `${SITE}/`)).toBe(
      `<img srcset="${SITE}/a.webp 1x, ${SITE}/b.webp 2x">`,
    );
  });
});

describe('stripForFeed', () => {
  it('keeps prose that quotes an event handler', () => {
    const html = '<p>Payloads like onerror="alert(1)" still render as text.</p>';
    expect(stripForFeed(html)).toBe(html);
  });

  it('drops a handler whose value contains the other quote', () => {
    expect(stripForFeed(`<img src="/a.png" onerror="alert('x')">`)).toBe('<img src="/a.png">');
  });

  it('drops scripts, styles, handlers and Astro scoping attributes', () => {
    const html =
      '<p data-astro-cid-abc12 onclick="x()">Hi</p><script>alert(1)</script><style>p{}</style><p data-astro-source-file="f">Yo</p>';
    expect(stripForFeed(html)).toBe('<p>Hi</p><p>Yo</p>');
  });
  it('keeps iframes, figures and links', () => {
    const html = '<figure><iframe src="/artifacts/a.html" title="a"></iframe></figure><a href="/x">x</a>';
    expect(stripForFeed(html)).toBe(html);
  });
});

describe('toFeedHtml', () => {
  it('strips then absolutizes', () => {
    expect(toFeedHtml(' <script>x</script><img src="/a.png"> ', SITE)).toBe(`<img src="${SITE}/a.png">`);
  });
});

describe('licenseFooterHtml', () => {
  it('names the author, year and licence', () => {
    expect(
      licenseFooterHtml('Mazze LeCzzare', 2026, {
        name: 'CC BY 4.0',
        url: 'https://creativecommons.org/licenses/by/4.0/',
      }),
    ).toBe(
      '<p><small>© 2026 Mazze LeCzzare. Text licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</small></p>',
    );
  });
});
