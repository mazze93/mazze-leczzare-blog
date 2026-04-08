import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

/**
 * Blog content collection schema.
 *
 * Extended from the original to support:
 *   - tags         — array of topic tags (e.g. ['Cybersecurity', 'TLS'])
 *   - category     — primary category string (e.g. 'Essay')
 *   - subtitle     — optional deck / subtitle shown under the title
 *   - readingTime  — optional manual override (e.g. '~7 min')
 *   - heroImageOG  — optional Open Graph / social share image path
 *   - heroImageAlt — optional accessible alt text for the hero image
 *   - featured     — optional flag for curated/pinned posts
 *   - slug         — optional explicit URL slug override
 *
 * All new fields are optional so existing posts remain valid without changes.
 */
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    // — New fields —
    subtitle: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    readingTime: z.string().optional(),
    heroImageOG: z.string().optional(),
    heroImageAlt: z.string().optional(),
    featured: z.boolean().optional(),
    slug: z.string().optional(),
    draft: z.boolean().optional(),
  }),
});

export const collections = { blog };
