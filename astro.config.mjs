// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: "https://mazzeleczzare.com",

  // Code blocks used to be a single dark Shiki theme (Astro's github-dark
  // default), so every <pre class="astro-code"> stayed a black slab in light
  // mode — six of them on the fortress essay alone, the largest light-mode
  // leak on the site. Dual themes emit BOTH palettes as --shiki-light-* /
  // --shiki-dark-* custom properties on each token span; defaultColor:false
  // means Shiki writes no colour of its own, so the CSS in global.css
  // ("Shiki dual-theme code blocks") is load-bearing — without it code blocks
  // render unstyled. Change one, check the other.
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
      wrap: false,
    },
  },
  trailingSlash: "always",
  output: "static",
  integrations: [
    mdx(),
    sitemap({
      // Astro only knows its own routes, so the sitemap needs help at both ends.
      //
      // filter: /admin/ and /login/ were being submitted to search engines while
      // public/robots.txt explicitly Disallows them — the sitemap was arguing
      // with the robots file. Auth-gated pages should be in neither.
      filter: (page) => !/\/(admin|login)\/?$/.test(page),

      // customPages: the standalone HTML under public/ is real, linked, published
      // work — /writing/ links straight to the Breakthrough artifact — but it
      // never passes through Astro's router, so the sitemap had no idea it
      // existed. Artifacts are listed too; they are indexable pages, not assets.
      //
      // Adding a page under public/? Add it here in the same commit, or it stays
      // invisible to search. check-docs-drift.sh §1 lists these same paths.
      customPages: [
        "https://mazzeleczzare.com/intentional-fragility/",
        "https://mazzeleczzare.com/writing/what-i-can-stand-by/",
        "https://mazzeleczzare.com/essays/the-breakthrough-artifact.html",
        "https://mazzeleczzare.com/artifacts/tessera-claude-anchor.html",
        "https://mazzeleczzare.com/artifacts/tree-of-knowledge.html",
        "https://mazzeleczzare.com/artifacts/publication-surface-v1.2.2.html",
      ],
    }),
    react(),
  ],
});
