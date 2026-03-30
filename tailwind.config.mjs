/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  corePlugins: {
    preflight: false, // global.css provides the base reset
  },
  theme: {
    extend: {
      fontFamily: {
        // Homepage — fashion-editorial modern
        'home-display': ['"Playfair Display"', 'Georgia', 'serif'],
        'home-sans':    ['"DM Sans"', 'system-ui', 'sans-serif'],
        // Blog — classical timeless (matches CSS vars)
        'blog-serif':   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        'blog-mono':    ['"DM Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        // Homepage palette — deep editorial navy
        home: {
          bg:           'var(--home-bg)',
          surface:      'var(--home-surface)',
          text:         'var(--home-text)',
          'text-dim':   'var(--home-text-dim)',
          'text-faint': 'var(--home-text-faint)',
          gold:         'var(--home-gold)',
          rule:         'var(--home-rule)',
          teal:         'var(--teal)',
        },
        // Blog palette — bridges CSS vars to Tailwind consumers
        blog: {
          bg:       'var(--bg)',
          text:     'var(--text)',
          'text-dim':   'var(--text-dim)',
          teal:     'var(--teal)',
          coral:    'var(--coral)',
        },
      },
      letterSpacing: {
        editorial:       '-0.04em',
        'tight-display': '-0.02em',
        label:           '0.12em',
        caps:            '0.18em',
      },
      lineHeight: {
        editorial: '1.00',
        'tight':   '1.10',
        display:   '1.05',
      },
    },
  },
  plugins: [],
};
