# Mazze Leczzare Blog
![Framework](https://img.shields.io/badge/Framework-Astro-orange)
![Hosting](https://img.shields.io/badge/Hosting-Cloudflare%20Pages-blue)
![Content](https://img.shields.io/badge/Content-Markdown%20%2B%20MDX-success)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

![Mazze Leczzare Blog Social Preview](.github/social-preview.png)

Personal editorial platform for essays, project notes, and public-facing narrative around privacy, cognition, and security-forward design.

## At a glance
- Fast, SEO-forward Astro site with clean content workflow.
- Markdown/MDX publishing with lightweight deployment on Cloudflare Pages.
- Designed for expressive long-form writing on web and mobile.

## Quick links
- [Deployment](#deployment)
- [Getting Started](#getting-started)
- [Project Structure](#-project-structure)

## GitHub social preview
Upload `.github/social-preview.png` in repository `Settings -> General -> Social preview` to use the branded card on link shares.

## Deployment

This blog is configured for static deployment to Cloudflare Pages:

1. Connect your GitHub repository to Cloudflare Pages
2. Use the following build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (default)

The site will be automatically deployed on every push to your main branch.

### Contact form delivery

The `/contact` form supports two delivery paths, in this order:

1. `CONTACT_WEBHOOK_URL` as a Cloudflare secret, with optional `CONTACT_WEBHOOK_AUTH_HEADER` as a secret.
2. `CONTACT_EMAIL` as a Worker-only `send_email` binding when this endpoint is deployed outside Pages.

Recommended setup:

- Keep `CONTACT_FROM_EMAIL` and `CONTACT_SUBJECT_PREFIX` in `wrangler.toml` under `[vars]`.
- Keep `CONTACT_WEBHOOK_URL` and `CONTACT_WEBHOOK_AUTH_HEADER` out of git and set them with `npx wrangler secret put`.
- Do not add `send_email` to this Pages `wrangler.toml`; use a separate Worker configuration if you need the email-binding fallback.

Example secret commands:

```bash
npx wrangler secret put CONTACT_WEBHOOK_URL
npx wrangler secret put CONTACT_WEBHOOK_AUTH_HEADER
```

## Getting Started

To create a similar blog project with Astro:

```bash
npm create astro@latest -- --template blog
```

Or clone this repository and install dependencies:

```bash
git clone <your-repo-url>
cd mazze-leczzare-blog
npm install
```

## 🚀 Project Structure

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                                      |
| :------------------------ | :---------------------------------------------------------- |
| `npm install`             | Installs dependencies                                       |
| `npm run dev`             | Starts local dev server at `localhost:4321`                |
| `npm run build`           | Builds production site to `./dist/`                        |
| `npm run preview`         | Previews your build locally                                 |
| `npm run check`           | Runs production build and TypeScript check                 |
| `npm run docs:check`      | Verifies docs/instruction consistency against repo reality |
| `npm run astro ...`       | Runs Astro CLI commands like `astro add`, `astro check`    |
| `npm run astro -- --help` | Gets help using the Astro CLI                               |

## 👀 Want to learn more?

Check out [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## Credit

This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
