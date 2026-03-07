import { useState, useEffect } from 'react';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  artworkSrc?: string;
}

export default function HeroSection({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  artworkSrc = '/hero-signal-grid.svg',
}: HeroSectionProps) {
  const [visible, setVisible] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const onMotionPreferenceChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', onMotionPreferenceChange);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', onMotionPreferenceChange);
    };
  }, []);

  return (
    <section
      className="hero"
      aria-label="Hero section"
      style={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: 'linear-gradient(160deg, #0f1219 0%, #1a1040 50%, #0d0d1a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '20%',
          left: '15%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(108,99,255,0.25) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '15%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(224,64,251,0.2) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: 'min(1120px, 100%)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
          gap: '2rem',
          alignItems: 'center',
          opacity: visible ? 1 : 0,
          transform: visible && !prefersReducedMotion ? 'translateY(0)' : 'translateY(16px)',
          transition: prefersReducedMotion ? 'none' : 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <p
            style={{
              margin: '0 0 1rem',
              color: 'rgba(255,255,255,0.65)',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            Essays, systems, and field notes
          </p>
          <h1
            style={{
              fontSize: 'clamp(2.75rem, 7vw, 5.6rem)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.02,
              margin: '0 0 1rem',
              letterSpacing: '-0.04em',
              opacity: visible ? 1 : 0,
              transform: visible && !prefersReducedMotion ? 'translateY(0)' : 'translateY(12px)',
              transition: prefersReducedMotion ? 'none' : 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontSize: 'clamp(1.02rem, 2.4vw, 1.35rem)',
              color: 'rgba(255,255,255,0.78)',
              maxWidth: '40rem',
              margin: '0 0 2rem',
              lineHeight: 1.6,
              opacity: visible ? 1 : 0,
              transform: visible && !prefersReducedMotion ? 'translateY(0)' : 'translateY(10px)',
              transition: prefersReducedMotion ? 'none' : 'opacity 0.7s ease 0.25s, transform 0.7s ease 0.25s',
            }}
          >
            {subtitle}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center' }}>
            <a
              href={ctaHref}
              style={{
                display: 'inline-block',
                padding: '0.9em 2.2em',
                background: 'linear-gradient(135deg, #6c63ff 0%, #e040fb 100%)',
                color: '#fff',
                borderRadius: '999px',
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: ctaHovered
                  ? '0 8px 32px rgba(108,99,255,0.6)'
                  : '0 4px 20px rgba(108,99,255,0.4)',
                opacity: visible ? 1 : 0,
                transform: ctaHovered ? 'translateY(-2px)' : visible ? 'translateY(0)' : 'translateY(8px)',
                transition: prefersReducedMotion
                  ? 'none'
                  : 'opacity 0.7s ease 0.4s, transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
            >
              {ctaLabel}
            </a>
            <a
              href="/manifesto"
              style={{
                color: 'rgba(255,255,255,0.92)',
                textDecoration: 'none',
                fontWeight: 600,
                letterSpacing: '0.01em',
              }}
            >
              Read the manifesto
            </a>
          </div>
        </div>
        <aside
          style={{
            borderRadius: '24px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(14px)',
            overflow: 'hidden',
            boxShadow: '0 18px 48px rgba(0,0,0,0.28)',
            opacity: visible ? 1 : 0,
            transform: visible && !prefersReducedMotion ? 'translateY(0)' : 'translateY(18px)',
            transition: prefersReducedMotion ? 'none' : 'opacity 0.7s ease 0.45s, transform 0.7s ease 0.45s',
          }}
        >
          <img
            src={artworkSrc}
            alt="Signal-grid artwork for Mazze Leczzare"
            style={{
              display: 'block',
              width: '100%',
              aspectRatio: '4 / 5',
              objectFit: 'cover',
              borderRadius: 0,
            }}
          />
          <div style={{ padding: '1.15rem 1.2rem 1.3rem', textAlign: 'left' }}>
            <p style={{ margin: '0 0 0.5rem', color: 'rgba(255,255,255,0.62)', fontSize: '0.76rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Working studio
            </p>
            <p style={{ margin: '0 0 0.5rem', color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
              Writing across science, brand, systems, and security.
            </p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, fontSize: '0.95rem' }}>
              Built as a static-first publishing space with Astro, TypeScript, and React islands where interaction actually earns its keep.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
