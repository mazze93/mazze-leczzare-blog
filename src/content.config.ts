import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "zod";

/**
 * Blog content collection schema.
 */
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: image().optional(),
    subtitle: z.string().optional(),
    category: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    readingTime: z.string().optional(),
    heroImageOG: z.string().optional(),
    heroImageAlt: z.string().optional(),
    featured: z.boolean().optional(),
    slug: z.string().optional(),
    draft: z.boolean().optional(),
    // ── content type classification ──
    contentType: z.enum(['artifact', 'dispatch', 'field-note']).default('field-note'),
    repoUrl: z.string().url().optional(),
    artifactNote: z.string().optional(),
    sessionTranscript: z.string().optional(),
    // ── constellation fields ──
    project: z.string().optional(),    // slug — joins/creates a node (singular for v1)
    committed: z.boolean().optional(), // true → node pinned to signal, immune to decay
  }),
});

/**
 * Signal content collection schema.
 *
 * Transmissions, verse, and fragments from the field ledger.
 * Distinct from blog: no heroImage required; adds transmission-
 * specific metadata (cycle, classification, status, origin).
 *
 * All fields beyond title/description/pubDate are optional
 * so sparse entries remain valid.
 */
const signal = defineCollection({
  loader: glob({ base: "./src/content/signal", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // Transmission metadata — maps directly to TransmissionFeed props
    transmissionId: z.string().optional(),   // e.g. "TRANSMISSION-0517-COPPER"
    cycle: z.string().optional(),             // e.g. "7.441.88"
    classification: z.string().optional(),    // e.g. "SIGNAL · ARCHITECTURE · UNRESOLVED"
    status: z.string().optional(),            // e.g. "UNRESOLVED" | "CLOSED" | "ONGOING"
    origin: z.string().optional(),            // e.g. "FIELD LEDGER: MAZZE / WEIGHT DELTA 7.441"
    // Standard content fields
    tags: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
    draft: z.boolean().optional(),
    slug: z.string().optional(),
    // ── constellation fields ──
    project: z.string().optional(),
    committed: z.boolean().optional(),
  }),
});

export const collections = { blog, signal };
