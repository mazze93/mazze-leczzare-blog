/**
 * /feed.json — the scholarly feed (JSON Feed 1.1).
 *
 * Rogue Scholar harvests this feed and registers a DOI for every item in it;
 * each DOI resolves back to the post's own URL on this site. /rss.xml stays
 * the reader feed (summaries, every published post); this one carries full
 * text, and only posts that pass isArchivable(): published, CC BY, and not
 * opted out with `archive: false`.
 *
 * The author entry's url is the ORCID iD, which is how Rogue Scholar's own
 * feeds name an author, so each registered record attaches to that ORCID.
 */
import type { APIContext } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getCollection, render } from 'astro:content';
import { getContainerRenderer as getMDXRenderer } from '@astrojs/mdx/container-renderer';
import {
  CONTENT_LICENSE,
  SITE_AUTHOR,
  SITE_AUTHOR_ORCID,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '../consts';
import { isArchivable, licenseFooterHtml, toFeedHtml } from '../utils/scholarlyFeed';

export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE_URL)).toString().replace(/\/+$/, '');
  const author = { name: SITE_AUTHOR, url: SITE_AUTHOR_ORCID };

  const posts = (await getCollection('blog', ({ data }) => isArchivable(data)))
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const renderers = await loadRenderers([getMDXRenderer()]);
  const container = await AstroContainer.create({ renderers });

  const items = [];
  for (const post of posts) {
    const { Content } = await render(post);
    const html = await container.renderToString(Content);
    const url = `${site}/blog/${post.id}/`;
    const tags = [post.data.category, ...(post.data.tags ?? [])].filter(
      (t): t is string => Boolean(t),
    );
    items.push({
      id: url,
      url,
      title: post.data.title,
      summary: post.data.description,
      content_html:
        toFeedHtml(html, site) +
        licenseFooterHtml(SITE_AUTHOR, post.data.pubDate.getUTCFullYear(), CONTENT_LICENSE),
      date_published: post.data.pubDate.toISOString(),
      date_modified: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
      authors: [author],
      language: 'en',
      ...(tags.length ? { tags } : {}),
    });
  }

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE_TITLE,
    home_page_url: `${site}/`,
    feed_url: `${site}/feed.json`,
    description: SITE_DESCRIPTION,
    language: 'en',
    authors: [author],
    _license: { name: CONTENT_LICENSE.name, url: CONTENT_LICENSE.url },
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}
