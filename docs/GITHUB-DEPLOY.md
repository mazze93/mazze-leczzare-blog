# GitHub Deployment Instructions

## Method 1: Download and Extract (Easiest)

1. **Download the deployment package:**
   - Download `mazzeleczzare-deployment.tar.gz` from outputs

2. **Navigate to your repo:**
   ```bash
   cd /path/to/your/mazzeleczzare-repo
   ```

3. **Create backup branch:**
   ```bash
   git checkout -b backup/pre-hero-redesign
   git add -A
   git commit -m "backup: pre-hero redesign"
   git checkout main
   ```

4. **Extract deployment package:**
   ```bash
   tar -xzf /path/to/mazzeleczzare-deployment.tar.gz
   ```

5. **Review changes:**
   ```bash
   git status
   git diff
   ```

6. **Add font files:**
   - Create `public/fonts/` directories
   - Add your font files (see FONTS.md for guide)

7. **Install dependencies:**
   ```bash
   npm install
   ```

8. **Test locally:**
   ```bash
   npm run dev
   # Visit http://localhost:4321
   ```

9. **Commit and push:**
   ```bash
   git add -A
   git commit -m "feat: dual design system - breathing hero + editorial blog

   - Environmental breathing canvas hero (TypeScript)
   - Fashion-editorial homepage (Freight Display/Suisse Intl aesthetic)
   - Classical editorial blog (Cormorant Garamond/DM Mono)
   - Tailwind CSS dual color system
   - MDX blog with tags and subtitle support
   - Locally hosted fonts for performance"
   
   git push origin main
   ```

---

## Method 2: Manual File Copy

If you want more control over what changes:

### Core Files (Required)

```bash
# Config files
cp astro.config.mjs /your/repo/
cp tailwind.config.mjs /your/repo/
cp tsconfig.json /your/repo/
cp package.json /your/repo/  # or merge with existing

# Source files
cp -r src/components/HeroSection.astro /your/repo/src/components/
cp -r src/styles/* /your/repo/src/styles/
cp src/content/config.ts /your/repo/src/content/
cp src/pages/index.astro /your/repo/src/pages/
```

### Merge or Replace

If you have existing files:

**For `package.json`:**
- Add dependencies to your existing file
- Keep your existing scripts

**For `src/pages/index.astro`:**
- If you have an existing homepage, integrate `HeroSection` manually
- Add font preloads to `<head>`
- Add `homepage-layout` class to `<body>`

**For `tailwind.config.mjs`:**
- Merge the dual palette tokens with your existing config
- Keep your existing plugins

---

## Method 3: Cherry-Pick Components Only

If you just want the hero and don't want to change your existing setup:

```bash
# 1. Copy just the hero component
cp src/components/HeroSection.astro /your/repo/src/components/

# 2. Add these to your existing tailwind.config.mjs:
```

```javascript
theme: {
  extend: {
    colors: {
      'home': {
        'charcoal': '#0b0d12',
        'teal': '#2bd3c6',
        'magenta': '#c04bb7',
        'amber': '#f4a261',
        'white': '#f2f4f8',
      },
    },
  },
}
```

3. **Import in your homepage:**

```astro
---
import HeroSection from '../components/HeroSection.astro';
---

<HeroSection 
  title="From Erasure → Signal"
  subtitle="Your subtitle"
/>
```

---

## Deployment to GitHub Pages

### Option A: GitHub Actions (Automatic)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Then:
1. Push this workflow file
2. Go to repo Settings → Pages
3. Set Source to "GitHub Actions"
4. Push any change to main branch
5. Site automatically deploys

### Option B: Manual Deploy

```bash
# Build locally
npm run build

# Push dist/ folder to gh-pages branch
npm install -g gh-pages
gh-pages -d dist
```

---

## Deployment to Cloudflare Pages

### Via Dashboard (Easiest)

1. Go to https://dash.cloudflare.com
2. Pages → Create a project
3. Connect your GitHub repo
4. Settings:
   - Framework: Astro
   - Build command: `npm run build`
   - Build output: `dist`
   - Node version: `18`
5. Save and deploy

### Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Build
npm run build

# Deploy
wrangler pages publish dist --project-name=mazzeleczzare
```

---

## Deployment to Netlify

### Via Dashboard

1. Go to https://app.netlify.com
2. New site from Git
3. Connect your repo
4. Settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Deploy

### Via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

---

## Post-Deployment Checklist

After deployment, verify:

- [ ] Homepage loads with breathing hero animation
- [ ] Hero typography displays correctly (Freight/Suisse aesthetic)
- [ ] Mouse interaction works (nodes pull toward cursor)
- [ ] Blog uses different typography (Cormorant/DM Mono)
- [ ] Colors match design system
- [ ] Fonts load (check Network tab)
- [ ] Responsive on mobile
- [ ] Reduced motion works (disable hero canvas)
- [ ] All links work
- [ ] Performance score 90+ (Lighthouse)

---

## Troubleshooting

### Hero not showing
- Check browser console for errors
- Verify `HeroSection.astro` is copied correctly
- Check `global.css` imports Tailwind

### Fonts missing
- Verify font files in `public/fonts/`
- Check file paths match `fonts.css`
- See FONTS.md for acquisition guide
- Temporarily use Google Fonts CDN (see FONTS.md Option 3)

### Build fails
- Run `npm install` fresh
- Check Node version: `node -v` (should be 18+)
- Delete `node_modules` and reinstall
- Check `astro check` for TypeScript errors

### GitHub Pages not updating
- Check Actions tab for build status
- Verify gh-pages branch exists
- Check Pages settings for correct source
- Clear cache and hard refresh (Cmd/Ctrl + Shift + R)

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Deployment
git push origin main    # Triggers GitHub Actions (if setup)
wrangler pages publish  # Deploy to Cloudflare
netlify deploy --prod   # Deploy to Netlify
```

---

## Need Help?

1. Check README.md for architecture overview
2. Check FONTS.md for font installation
3. Check browser console for errors
4. Run `astro check` for diagnostics
5. Test build: `npm run build`

---

Your dual aesthetic site is ready to ship! 🚀

Fashion-Editorial Homepage → Classical-Timeless Blog
