// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://mazzeleczzare.com",
  trailingSlash: "always",
  output: "static",
  integrations: [
    mdx(),
    sitemap(),
    react(),
  ],
});
