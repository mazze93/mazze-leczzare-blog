# Astro Content Ingest Pipeline (Cloudflare Adapter)

This pipeline handles ingestion of your modular Markdown drafts (tesserae, essays) via an API endpoint running on Cloudflare Pages/Workers, and surfaces them via Astro Content Collections (Astro 5+).

## 1. Setup Cloudflare Adapter

Ensure your `astro.config.mjs` is configured for Cloudflare edge execution.

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server', // or 'static' with targeted prerender=false depending on your caching strategy
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
```

Ensure your `wrangler.jsonc` or `wrangler.toml` is configured if you're using KV for draft storage or caching before hitting Astro's file system:

```jsonc
// wrangler.jsonc
{
  "name": "mazzeleczzare-com",
  "compatibility_date": "2026-06-14",
  "pages_build_output_dir": "./dist"
}
```

## 2. Define the Content Collection (Astro 5 API)

Create `src/content.config.ts` to define the schema for your pieces (tesserae, essays).

```typescript
import { z, defineCollection } from "astro:content";
import { glob } from "astro/loaders";

const draftCollection = defineCollection({
  // Use glob loader to pull from your markdown files
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/drafts" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    date: z.date(),
    status: z.enum(['draft', 'publish-ready', 'published']).default('draft'),
    project: z.string().optional(), // e.g., "Go South for Cunning", "Intentional Fragility"
  }),
});

export const collections = {
  drafts: draftCollection,
};
```

## 3. Webhook / API Endpoint for Ingestion

Create an API endpoint at `src/pages/api/ingest.ts` to handle incoming pushes from Obsidian, GitHub Actions, or your custom pipeline.

```typescript
export const prerender = false; // Force server-side rendering for this route
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  // Optional: Authenticate the request via an environment variable
  const authHeader = request.headers.get('Authorization');
  const envAuth = process.env.INGEST_SECRET || import.meta.env.INGEST_SECRET; // Or access via locals.runtime.env for Cloudflare

  if (authHeader !== `Bearer ${envAuth}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const data = await request.json();
    const { title, content, project, tags } = data;

    // Validate payload
    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Missing title or content' }), { status: 400 });
    }

    // In a fully automated pipeline with Cloudflare, you might push this to GitHub via the GitHub API,
    // or store it in Cloudflare D1/KV if you're building a dynamic DB-backed content layer.
    // Assuming a GitHub-backed workflow here:

    /* 
      // Pseudo-code for pushing directly back to GitHub repository
      await fetch(`https://api.github.com/repos/YOUR_USER/YOUR_REPO/contents/src/content/drafts/${slugify(title)}.md`, {
        method: 'PUT',
        headers: { 'Authorization': `token ${locals.runtime.env.GITHUB_TOKEN}` },
        body: JSON.stringify({
           message: `Automated ingest: ${title}`,
           content: btoa(content) // base64 encoded markdown with frontmatter
        })
      });
    */

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Ingested ${title} successfully. Build triggered.`,
      project
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
  }
};
```

## 4. Frontend Render Route

Create `src/pages/drafts/[id].astro` to render the ingested artifacts dynamically.

```astro
---
// src/pages/drafts/[id].astro
import { getCollection, render } from 'astro:content';
// import Layout from '../../layouts/Layout.astro'; // Your layout file

export async function getStaticPaths() {
  const drafts = await getCollection('drafts');
  return drafts.map(entry => ({
    params: { id: entry.id },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await render(entry);
---

<html>
  <head>
    <title>{entry.data.title} | Mazze LeCzzare</title>
  </head>
  <body>
    <article class="prose lg:prose-xl mx-auto">
      <header>
        <h1>{entry.data.title}</h1>
        <div class="tags">
          {entry.data.tags.map((tag: string) => <span class="tag">{tag}</span>)}
        </div>
      </header>

      <!-- Content renders here -->
      <Content />

    </article>
  </body>
</html>
```

## Implementation Checklist
1. [ ] Install dependencies: `npx astro add cloudflare`
2. [ ] Add schema mapping in `src/content.config.ts` matching your Obsidian frontmatter
3. [ ] Set `INGEST_SECRET` and/or `GITHUB_TOKEN` in Cloudflare Pages environment variables
4. [ ] Point your automation (e.g., Apple Shortcut, curl script from terminal) to `https://mazzeleczzare.com/api/ingest`
