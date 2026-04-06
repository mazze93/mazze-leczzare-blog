import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Homepage/portfolio palette — fashion-editorial dark
        home: {
          charcoal: '#0d0d0d',
          white: '#f5f0e8',
          teal: '#2bd3c6',
          magenta: '#c04bb7',
          amber: '#f4a261',
        },
        // Blog section palette — classical timeless editorial
        blog: {
          charcoal: '#0a0e17',
          text: '#e8e0d0',
          'text-dim': '#a09880',
          'text-faint': '#605848',
          teal: '#3ab8a0',
          coral: '#e8705a',
          gold: '#c8a060',
          rule: '#2a2418',
        },
      },
      fontFamily: {
        // Homepage: Freight Display (premium) → system serif fallback
        display: ['New York', 'Georgia', 'serif'],
        // Homepage: Suisse Intl (premium) → system sans fallback
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // Blog: Cormorant Garamond (Google Fonts)
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        // Blog/code: DM Mono (Google Fonts)
        mono: ['DM Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        editorial: '0.02em',
        mono: '0.08em',
      },
      lineHeight: {
        editorial: '1.6',
        'tight-editorial': '1.15',
      },
    },
  },
  plugins: [typography],
};
