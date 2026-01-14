# Deployment Guide for mazzeleczzare.com

This guide explains how to deploy this blog to Cloudflare Pages with the domain mazzeleczzare.com.

## Prerequisites

1. A Cloudflare account
2. Domain mazzeleczzare.com added to Cloudflare
3. GitHub repository connected to Cloudflare Pages

## Cloudflare Pages Setup

### 1. Connect Repository to Cloudflare Pages

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your GitHub repository: `mazze93/mazze-leczzare-blog` (this repository)
4. Configure the build settings:

   **Build Configuration:**
   - **Framework preset**: Astro
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank or default)
   - **Node version**: 18 or higher (automatic)

5. Click **Save and Deploy**

### 2. Configure Custom Domain

1. After the first deployment, go to your Pages project
2. Navigate to **Custom domains** tab
3. Click **Set up a custom domain**
4. Enter `mazzeleczzare.com`
5. Cloudflare will automatically:
   - Create necessary DNS records
   - Provision SSL certificate
   - Enable HTTPS

### 3. Add www Subdomain (Optional but Recommended)

1. In the same **Custom domains** section
2. Click **Add a custom domain**
3. Enter `www.mazzeleczzare.com`
4. The `_redirects` file in this repo will handle redirecting www to non-www

## DNS Configuration

If your domain is already on Cloudflare (recommended), the Pages setup will automatically configure DNS. If not, you'll need to:

1. Add an A record or CNAME for `mazzeleczzare.com` pointing to your Pages project
2. Add a CNAME for `www.mazzeleczzare.com` pointing to your Pages project

**Cloudflare Pages typically uses:**
- CNAME: `<your-project>.pages.dev`

## Redirect Rules

This repository includes a `public/_redirects` file that handles:

- **www to non-www**: `https://www.mazzeleczzare.com/*` → `https://mazzeleczzare.com/:splat` (301)
- **HTTP to HTTPS**: Automatic via Cloudflare (also explicit in _redirects)

The `_redirects` file is automatically included in the build output and processed by Cloudflare Pages.

## Automatic Deployments

Once connected, Cloudflare Pages will automatically:

- Deploy every push to the `main` branch (production)
- Create preview deployments for pull requests
- Show deployment status in GitHub

## Verifying Deployment

After deployment, verify:

1. ✅ Site loads at `https://mazzeleczzare.com`
2. ✅ `https://www.mazzeleczzare.com` redirects to non-www
3. ✅ `http://mazzeleczzare.com` redirects to HTTPS
4. ✅ Sitemap accessible at `https://mazzeleczzare.com/sitemap-0.xml`
5. ✅ RSS feed accessible at `https://mazzeleczzare.com/rss.xml`

## Troubleshooting

### Site Not Loading

- Check that the build completed successfully in Cloudflare Pages dashboard
- Verify DNS records are correct and propagated (use `dig mazzeleczzare.com`)
- Check deployment logs for errors

### Redirects Not Working

- Ensure `public/_redirects` file exists and is included in build output
- Check redirect rules syntax in the file
- Cloudflare Pages processes redirects automatically from `_redirects` file

### SSL Certificate Issues

- Cloudflare automatically provisions SSL certificates
- If issues persist, check SSL/TLS settings in Cloudflare dashboard
- Ensure SSL/TLS encryption mode is set to "Full" or "Full (strict)"

### Custom Domain Not Working

- Verify domain is added to your Cloudflare account
- Check that DNS records are correctly configured
- DNS propagation can take up to 24-48 hours

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/platform/redirects/)
