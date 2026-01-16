// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  adapter: cloudflare({
    // Enable local development access to Cloudflare runtime APIs and bindings
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [mdx(), sitemap()],
});
